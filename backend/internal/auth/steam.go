package auth

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"game-gallery-backend/internal/config"
	"game-gallery-backend/internal/models"
)

const steamAPIURL = "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/"
const steamVerifyURL = "https://steamcommunity.com/openid/login"

var httpClient = &http.Client{
	Timeout: 10 * time.Second,
}

// BuildSteamLoginURL 构建Steam登录URL
func BuildSteamLoginURL(baseURL string) string {
	params := url.Values{
		"openid.ns":         {"http://specs.openid.net/auth/2.0"},
		"openid.mode":       {"checkid_setup"},
		"openid.return_to":  {baseURL + "/api/auth/steam/callback"},
		"openid.realm":      {baseURL},
		"openid.identity":   {"http://specs.openid.net/auth/2.0/identifier_select"},
		"openid.claimed_id": {"http://specs.openid.net/auth/2.0/identifier_select"},
	}

	return fmt.Sprintf("https://steamcommunity.com/openid/login?%s", params.Encode())
}

// VerifySteamResponse 验证Steam OpenID响应
func VerifySteamResponse(queryParams map[string]string) (bool, error) {
	// 检查模式
	if queryParams["openid.mode"] != "id_res" {
		return false, fmt.Errorf("invalid OpenID mode")
	}

	// 构建验证请求
	verifyParams := url.Values{
		"openid.assoc_handle": {queryParams["openid.assoc_handle"]},
		"openid.signed":       {queryParams["openid.signed"]},
		"openid.sig":          {queryParams["openid.sig"]},
		"openid.ns":           {queryParams["openid.ns"]},
		"openid.mode":         {"check_authentication"},
	}

	// 添加所有已签名的字段
	signed := strings.Split(queryParams["openid.signed"], ",")
	for _, field := range signed {
		key := "openid." + field
		if value, ok := queryParams[key]; ok {
			verifyParams.Set(key, value)
		}
	}

	// 向Steam验证
	resp, err := httpClient.PostForm(steamVerifyURL, verifyParams)
	if err != nil {
		log.Printf("Steam verification error: %v", err)
		return false, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return false, err
	}

	return strings.Contains(string(body), "is_valid:true"), nil
}

// ExtractSteamID 从OpenID响应中提取Steam ID
func ExtractSteamID(claimedID string) (string, error) {
	// 格式: https://steamcommunity.com/openid/id/[SteamID]
	parts := strings.Split(claimedID, "/")
	if len(parts) > 0 {
		steamID := parts[len(parts)-1]
		if steamID != "" {
			return steamID, nil
		}
	}
	return "", fmt.Errorf("invalid Steam ID format")
}

// GetSteamUserInfo 从Steam API获取用户信息
func GetSteamUserInfo(steamID string) (*models.SteamUser, error) {
	cfg := config.Get()

	if cfg.SteamAPIKey == "" {
		return nil, fmt.Errorf("STEAM_API_KEY not configured")
	}

	params := url.Values{
		"key":      {cfg.SteamAPIKey},
		"steamids": {steamID},
	}

	url := fmt.Sprintf("%s?%s", steamAPIURL, params.Encode())

	resp, err := httpClient.Get(url)
	if err != nil {
		log.Printf("Steam API error: %v", err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("steam API returned %d", resp.StatusCode)
	}

	var data struct {
		Response struct {
			Players []struct {
				Steamid      string `json:"steamid"`
				Personaname  string `json:"personaname"`
				Profileurl   string `json:"profileurl"`
				Avatar       string `json:"avatar"`
				Avatarfull   string `json:"avatarfull"`
			} `json:"players"`
		} `json:"response"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	if len(data.Response.Players) == 0 {
		return nil, fmt.Errorf("steam user not found")
	}

	player := data.Response.Players[0]
	return &models.SteamUser{
		SteamID:    steamID,
		Username:   player.Personaname,
		Avatar:     player.Avatarfull,
		ProfileURL: player.Profileurl,
	}, nil
}

// GenerateJWT 生成JWT token
func GenerateJWT(user *models.SteamUser) (string, error) {
	cfg := config.Get()

	claims := jwt.MapClaims{
		"steamId":    user.SteamID,
		"username":   user.Username,
		"avatar":     user.Avatar,
		"profileUrl": user.ProfileURL,
		"exp":        time.Now().Add(7 * 24 * time.Hour).Unix(),
		"iat":        time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.JWTSecret))
}
