package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	httpSwagger "github.com/swaggo/http-swagger/v2"

	_ "provider/docs"
	"provider/internal/auth"
	"provider/internal/platform/postgres"
	"provider/internal/vpn"
)

// @title Code Kadai API
// @version 1.0
// @description Authentication and VPN management API for Code Kadai.
// @BasePath /
// @schemes http
//
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Enter your JWT token as: Bearer <token>

func main() {
	// Load environment variables from .env in the working directory.
	if err := godotenv.Load(".env"); err != nil {
		log.Printf("No .env file loaded: %v", err)
	}

	databaseURL := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	jwtSecret := os.Getenv("JWT_SECRET")

	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	if len(jwtSecret) < 32 {
		log.Fatal("JWT_SECRET must contain at least 32 characters")
	}

	// Connect to PostgreSQL.
	ctx, cancel := context.WithTimeout(
		context.Background(),
		15*time.Second,
	)
	defer cancel()

	db, err := postgres.Connect(ctx, databaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	defer db.Close()

	// Initialize the existing authentication service.
	authRepo := auth.NewRepository(db)
	authService := auth.NewService(authRepo, jwtSecret)
	authHandler := auth.NewHandler(authService)

	// Initialize VPN management.
	// This configures the existing WireGuard interface; it does not
	// replace wg0.conf or restart the interface.
	vpnConfig := vpn.Config{
		InterfaceName:  strings.TrimSpace(os.Getenv("WG_INTERFACE")),
		ServerAddress:  strings.TrimSpace(os.Getenv("WG_SERVER_ADDRESS")),
		ClientCIDR:     strings.TrimSpace(os.Getenv("WG_CLIENT_CIDR")),
		ServerEndpoint: strings.TrimSpace(os.Getenv("WG_SERVER_ENDPOINT")),
		DNS:            strings.TrimSpace(os.Getenv("WG_DNS")),
		FirstHost:      10,
	}

	if err := vpn.ValidateConfig(vpnConfig); err != nil {
		log.Fatalf("Invalid VPN configuration: %v", err)
	}

	vpnRepo := vpn.NewRepository(db)
	vpnService := vpn.NewService(vpnRepo, vpnConfig)

	vpnHandler := vpn.NewHandler(
		vpnService,
		func(r *http.Request) (string, bool) {
			return auth.UserIDFromContext(r.Context())
		},
	)

	// Initialize the HTTP router.
	router := chi.NewRouter()

	// Configure CORS.
	// Set FRONTEND_ORIGIN to the exact origin used by your browser.
	frontendOrigin := strings.TrimSpace(os.Getenv("FRONTEND_ORIGIN"))
	if frontendOrigin == "" {
		frontendOrigin = "*"

	}

	router.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{
			frontendOrigin,
		},
		AllowedMethods: []string{
			"GET",
			"POST",
			"PUT",
			"PATCH",
			"DELETE",
			"OPTIONS",
		},
		AllowedHeaders: []string{
			"Accept",
			"Authorization",
			"Content-Type",
		},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Basic health check.
	router.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	// Swagger documentation.
	router.Get(
		"/swagger/*",
		httpSwagger.Handler(
			httpSwagger.URL("/swagger/doc.json"),
		),
	)

	// API routes.
	router.Route("/api/v1", func(r chi.Router) {
		// Public authentication endpoints.
		r.Post("/auth/register", authHandler.Register)
		r.Post("/auth/login", authHandler.Login)
		r.Post("/auth/refresh", authHandler.Refresh)
		r.Post("/auth/logout", authHandler.Logout)

		// Protected endpoints.
		r.Group(func(protected chi.Router) {
			protected.Use(authHandler.JWTAuth)

			// Current authenticated user.
			protected.Get("/users/me", authHandler.Me)

			// VPN management endpoints.
			protected.Route("/vpn", func(v chi.Router) {
				v.Get("/server", vpnHandler.ServerInfo)
				v.Post("/peers", vpnHandler.CreatePeer)
				v.Get("/peers", vpnHandler.ListPeers)
				v.Get("/peers/{id}", vpnHandler.GetPeer)
				v.Delete("/peers/{id}", vpnHandler.RevokePeer)
			})
		})
	})

	// Start the HTTP server.
	port := strings.TrimSpace(os.Getenv("PORT"))
	if port == "" {
		port = "8000"
	}

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	log.Printf("Code Kadai API listening on :%s", port)

	if err := server.ListenAndServe(); err != nil &&
		err != http.ErrServerClosed {
		log.Fatalf("API server failed: %v", err)
	}
}
