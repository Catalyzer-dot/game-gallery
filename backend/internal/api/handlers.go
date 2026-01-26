package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"sync"

	"game-gallery-backend/internal/auth"
	"game-gallery-backend/internal/config"
	"game-gallery-backend/internal/models"
	"game-gallery-backend/internal/services"
)

func HealthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func SteamLoginHandler(w http.ResponseWriter, r *http.Request) {
	cfg := config.Get()
	steamLoginURL := auth.BuildSteamLoginURL(cfg.BaseURL)
	http.Redirect(w, r, steamLoginURL, http.StatusFound)
}

func SteamCallbackHandler(w http.ResponseWriter, r *http.Request) {
	cfg := config.Get()

	queryParams := make(map[string]string)
	for key, values := range r.URL.Query() {
		if len(values) > 0 {
			queryParams[key] = values[0]
		}
	}

	valid, err := auth.VerifySteamResponse(queryParams)
	if err != nil || !valid {
		log.Printf("Steam verification failed: %v", err)
		redirectWithError(w, r, "verification_failed")
		return
	}

	claimedID := queryParams["openid.claimed_id"]
	if claimedID == "" {
		log.Printf("Missing claimed_id in response")
		redirectWithError(w, r, "invalid_response")
		return
	}

	steamID, err := auth.ExtractSteamID(claimedID)
	if err != nil {
		log.Printf("Failed to extract Steam ID: %v", err)
		redirectWithError(w, r, "invalid_steam_id")
		return
	}

	user, err := auth.GetSteamUserInfo(steamID)
	if err != nil {
		log.Printf("Failed to get Steam user info: %v", err)
		redirectWithError(w, r, "user_info_failed")
		return
	}

	token, err := auth.GenerateJWT(user)
	if err != nil {
		log.Printf("Failed to generate JWT: %v", err)
		redirectWithError(w, r, "token_generation_failed")
		return
	}

	setAuthCookie(w, token)

	redirectURL := cfg.FrontendURL + "?steam_token=" + token
	http.Redirect(w, r, redirectURL, http.StatusFound)
}

func redirectWithError(w http.ResponseWriter, r *http.Request, errorCode string) {
	cfg := config.Get()
	http.Redirect(w, r, cfg.FrontendURL+"?steam_error="+errorCode, http.StatusFound)
}

func setAuthCookie(w http.ResponseWriter, token string) {
	cookie := &http.Cookie{
		Name:     "steam_token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   7 * 24 * 60 * 60,
	}
	http.SetCookie(w, cookie)
}

// GameSearchHandler 搜索游戏
func GameSearchHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	query := r.URL.Query().Get("q")
	if query == "" {
		json.NewEncoder(w).Encode([]models.GameSearchResult{})
		return
	}

	// 获取限制参数（默认 10）
	limit := 10
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 && parsed <= 50 {
			limit = parsed
		}
	}

	// 是否包含玩家数（默认 false，因为会增加延迟）
	includePlayers := r.URL.Query().Get("include_players") == "true"

	steamService := services.GetSteamService()
	apps, err := steamService.Search(query, limit)
	if err != nil {
		log.Printf("Search error: %v", err)
		http.Error(w, fmt.Sprintf("Search failed: %v", err), http.StatusInternalServerError)
		return
	}

	// 转换为搜索结果格式
	results := make([]models.GameSearchResult, 0, len(apps))

	// 如果需要玩家数，并发获取
	if includePlayers && len(apps) > 0 {
		var wg sync.WaitGroup
		playerCounts := make(map[int]*int)
		var mu sync.Mutex

		for _, app := range apps {
			wg.Add(1)
			go func(appID int) {
				defer wg.Done()
				if count, err := steamService.GetCurrentPlayers(appID); err == nil {
					mu.Lock()
					playerCounts[appID] = &count
					mu.Unlock()
				}
			}(app.AppID)
		}

		wg.Wait()

		// 构建结果（带玩家数）
		for _, app := range apps {
			result := models.GameSearchResult{
				ID:             app.AppID,
				Name:           app.Name,
				SteamURL:       fmt.Sprintf("https://store.steampowered.com/app/%d", app.AppID),
				CoverImage:     fmt.Sprintf("https://cdn.cloudflare.steamstatic.com/steam/apps/%d/capsule_sm_120.jpg", app.AppID),
				CurrentPlayers: playerCounts[app.AppID],
				Tags:           []string{},
			}
			results = append(results, result)
		}
	} else {
		// 构建结果（不带玩家数）
		for _, app := range apps {
			result := models.GameSearchResult{
				ID:         app.AppID,
				Name:       app.Name,
				SteamURL:   fmt.Sprintf("https://store.steampowered.com/app/%d", app.AppID),
				CoverImage: fmt.Sprintf("https://cdn.cloudflare.steamstatic.com/steam/apps/%d/capsule_sm_120.jpg", app.AppID),
				Tags:       []string{},
			}
			results = append(results, result)
		}
	}

	json.NewEncoder(w).Encode(results)
}

// GameCacheStatsHandler 返回缓存统计信息
func GameCacheStatsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	steamService := services.GetSteamService()
	stats := steamService.GetCacheStats()

	json.NewEncoder(w).Encode(stats)
}
