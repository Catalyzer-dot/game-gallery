package main

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"game-gallery-backend/internal/api"
	"game-gallery-backend/internal/config"
	"game-gallery-backend/internal/services"
)

func main() {
	if err := config.LoadConfig(); err != nil {
		log.Printf("Warning: Failed to load .env file: %v", err)
	}

	if err := config.Validate(); err != nil {
		log.Fatalf("Configuration error: %v", err)
	}

	cfg := config.Get()

	// 初始化 Steam 服务（加载游戏列表缓存）
	log.Println("Initializing Steam service...")
	services.GetSteamService()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", api.HealthHandler)
	mux.HandleFunc("GET /api/auth/steam", api.SteamLoginHandler)
	mux.HandleFunc("GET /api/auth/steam/callback", api.SteamCallbackHandler)
	mux.HandleFunc("GET /api/games/search", api.GameSearchHandler)
	mux.HandleFunc("GET /api/games/cache-stats", api.GameCacheStatsHandler)

	handler := recoveryMiddleware(loggingMiddleware(corsMiddleware(mux)))

	addr := fmt.Sprintf(":%d", cfg.Port)
	log.Printf("Server starting on http://0.0.0.0:%d", cfg.Port)

	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cfg := config.Get()
		origin := r.Header.Get("Origin")

		if origin == cfg.FrontendURL {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s from %s - %v", r.Method, r.RequestURI, r.RemoteAddr, time.Since(start))
	})
}

func recoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("Panic recovered: %v", err)
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}
