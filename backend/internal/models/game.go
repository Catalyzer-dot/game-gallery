package models

// SteamApp 表示 Steam 应用（游戏、DLC等）
type SteamApp struct {
	AppID int    `json:"appid"`
	Name  string `json:"name"`
}

// SteamAppListResponse 表示 IStoreService/GetAppList API 的响应
type SteamAppListResponse struct {
	Response struct {
		Apps            []SteamApp `json:"apps"`
		HaveMoreResults bool       `json:"have_more_results"`
		LastAppID       int        `json:"last_appid"`
	} `json:"response"`
}

// GameSearchResult 表示游戏搜索结果
type GameSearchResult struct {
	ID               int    `json:"id"`
	Name             string `json:"name"`
	SteamURL         string `json:"steamUrl"`
	CoverImage       string `json:"coverImage"`
	CurrentPlayers   *int   `json:"currentPlayers,omitempty"`
	Tags             []string `json:"tags"`
}

// CurrentPlayersResponse 表示 GetNumberOfCurrentPlayers API 的响应
type CurrentPlayersResponse struct {
	Response struct {
		PlayerCount int `json:"player_count"`
		Result      int `json:"result"`
	} `json:"response"`
}
