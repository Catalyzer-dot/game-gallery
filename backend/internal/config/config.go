package config

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"sync"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        int
	JWTSecret   string
	SteamAPIKey string
	FrontendURL string
	BaseURL     string
}

var (
	globalConfig *Config
	once         sync.Once
)

func LoadConfig() error {
	return godotenv.Load()
}

func Get() *Config {
	once.Do(func() {
		port := 8080
		if p := os.Getenv("PORT"); p != "" {
			if parsed, err := strconv.Atoi(p); err == nil {
				port = parsed
			}
		}

		globalConfig = &Config{
			Port:        port,
			JWTSecret:   getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
			SteamAPIKey: getEnv("STEAM_API_KEY", ""),
			FrontendURL: getEnv("FRONTEND_URL", "http://localhost:5173"),
			BaseURL:     getEnv("BASE_URL", "http://localhost:8080"),
		}
	})

	return globalConfig
}

func Validate() error {
	cfg := Get()

	if cfg.JWTSecret == "" || cfg.JWTSecret == "your-secret-key-change-in-production" {
		return fmt.Errorf("JWT_SECRET must be set to a secure value")
	}

	if cfg.SteamAPIKey == "" {
		return fmt.Errorf("STEAM_API_KEY must be set")
	}

	if cfg.FrontendURL == "" {
		return fmt.Errorf("FRONTEND_URL must be set")
	}

	if cfg.BaseURL == "" {
		return fmt.Errorf("BASE_URL must be set")
	}

	log.Printf("Config loaded: Port=%d, FrontendURL=%s, BaseURL=%s", cfg.Port, cfg.FrontendURL, cfg.BaseURL)
	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
