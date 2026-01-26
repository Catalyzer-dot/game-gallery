package models

type SteamUser struct {
	SteamID    string `json:"steamId"`
	Username   string `json:"username"`
	Avatar     string `json:"avatar"`
	ProfileURL string `json:"profileUrl"`
}

type TokenClaims struct {
	SteamID    string `json:"steamId"`
	Username   string `json:"username"`
	Avatar     string `json:"avatar"`
	ProfileURL string `json:"profileUrl"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type SuccessResponse struct {
	Data  any    `json:"data,omitempty"`
	Token string `json:"token,omitempty"`
}
