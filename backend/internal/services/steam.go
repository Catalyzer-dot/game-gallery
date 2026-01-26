package services

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"game-gallery-backend/internal/models"
	"golang.org/x/net/proxy"
)

const (
	steamSearchAPIURL      = "https://store.steampowered.com/api/storesearch/"
	steamCurrentPlayersURL = "https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/"
	searchCacheDuration    = 10 * time.Minute // 搜索结果缓存 10 分钟
)

// searchCacheEntry 搜索结果缓存条目
type searchCacheEntry struct {
	results   []models.SteamApp
	timestamp time.Time
}

// SteamService 管理 Steam API 调用和缓存
type SteamService struct {
	searchCache map[string]*searchCacheEntry
	mu          sync.RWMutex
	httpClient  *http.Client
}

var (
	instance *SteamService
	once     sync.Once
)

// GetSteamService 获取 Steam 服务单例
func GetSteamService() *SteamService {
	once.Do(func() {
		instance = &SteamService{
			searchCache: make(map[string]*searchCacheEntry),
			httpClient:  createHTTPClient(),
		}
		log.Println("Steam service initialized with search cache")
		// 启动定期清理过期缓存
		go instance.startCacheCleanup()
	})
	return instance
}

// createHTTPClient 创建支持代理的 HTTP 客户端
func createHTTPClient() *http.Client {
	transport := &http.Transport{}

	// 尝试从环境变量获取代理配置
	proxyURL := os.Getenv("HTTP_PROXY")
	if proxyURL == "" {
		proxyURL = os.Getenv("HTTPS_PROXY")
	}
	socksProxy := os.Getenv("SOCKS_PROXY")

	// 配置 SOCKS5 代理（优先级更高）
	if socksProxy != "" {
		log.Printf("Configuring SOCKS5 proxy: %s", socksProxy)
		dialer, err := proxy.SOCKS5("tcp", socksProxy, nil, proxy.Direct)
		if err != nil {
			log.Printf("Warning: Failed to setup SOCKS5 proxy: %v", err)
		} else {
			transport.Dial = dialer.Dial
		}
	} else if proxyURL != "" {
		// 配置 HTTP 代理
		log.Printf("Configuring HTTP proxy: %s", proxyURL)
		parsedURL, err := url.Parse(proxyURL)
		if err != nil {
			log.Printf("Warning: Invalid proxy URL: %v", err)
		} else {
			transport.Proxy = http.ProxyURL(parsedURL)
		}
	} else {
		log.Println("No proxy configured, using direct connection")
	}

	return &http.Client{
		Transport: transport,
		Timeout:   30 * time.Second,
	}
}

// searchSteamStore 直接搜索 Steam Store API（后端代理，避免 CORS）
func (s *SteamService) searchSteamStore(query string, limit int) ([]models.SteamApp, error) {
	url := fmt.Sprintf("%s?term=%s&l=schinese&cc=CN", steamSearchAPIURL, query)

	resp, err := s.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to search Steam store: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("steam store API returned status %d", resp.StatusCode)
	}

	var data struct {
		Items []struct {
			ID        int    `json:"id"`
			Type      string `json:"type"`
			Name      string `json:"name"`
			TinyImage string `json:"tiny_image"`
		} `json:"items"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	// 只返回游戏类型（过滤 DLC、工具等）
	apps := []models.SteamApp{}
	for _, item := range data.Items {
		if item.Type == "app" && len(apps) < limit {
			apps = append(apps, models.SteamApp{
				AppID: item.ID,
				Name:  item.Name,
			})
		}
	}

	return apps, nil
}

// startCacheCleanup 定期清理过期的搜索缓存
func (s *SteamService) startCacheCleanup() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		s.mu.Lock()
		now := time.Now()
		for key, entry := range s.searchCache {
			if now.Sub(entry.timestamp) > searchCacheDuration {
				delete(s.searchCache, key)
			}
		}
		s.mu.Unlock()
	}
}

// Search 搜索游戏（带缓存）
func (s *SteamService) Search(query string, limit int) ([]models.SteamApp, error) {
	if query == "" {
		return []models.SteamApp{}, nil
	}

	query = strings.TrimSpace(query)
	cacheKey := fmt.Sprintf("%s:%d", query, limit)

	// 检查缓存
	s.mu.RLock()
	if cached, exists := s.searchCache[cacheKey]; exists {
		if time.Since(cached.timestamp) < searchCacheDuration {
			s.mu.RUnlock()
			log.Printf("Cache hit for query: %s", query)
			return cached.results, nil
		}
	}
	s.mu.RUnlock()

	// 缓存未命中或已过期，调用 Steam Store API
	log.Printf("Cache miss for query: %s, fetching from Steam...", query)
	apps, err := s.searchSteamStore(query, limit)
	if err != nil {
		return nil, err
	}

	// 更新缓存
	s.mu.Lock()
	s.searchCache[cacheKey] = &searchCacheEntry{
		results:   apps,
		timestamp: time.Now(),
	}
	s.mu.Unlock()

	return apps, nil
}

// GetCurrentPlayers 获取游戏的当前在线玩家数
func (s *SteamService) GetCurrentPlayers(appID int) (int, error) {
	url := fmt.Sprintf("%s?appid=%d", steamCurrentPlayersURL, appID)

	resp, err := s.httpClient.Get(url)
	if err != nil {
		return 0, fmt.Errorf("failed to fetch current players: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("steam API returned status %d", resp.StatusCode)
	}

	var data models.CurrentPlayersResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return 0, fmt.Errorf("failed to decode response: %w", err)
	}

	if data.Response.Result != 1 {
		return 0, fmt.Errorf("steam API returned result code %d", data.Response.Result)
	}

	return data.Response.PlayerCount, nil
}

// GetCacheStats 获取缓存统计信息
func (s *SteamService) GetCacheStats() map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return map[string]interface{}{
		"cached_searches": len(s.searchCache),
		"cache_duration":  searchCacheDuration.String(),
	}
}
