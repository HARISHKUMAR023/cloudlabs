// @title Cloud Lab API
// @version 1.0
// @description API documentation for the Cloud Lab platform.
// @BasePath /
// @schemes http
//
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Enter your JWT token as: Bearer <token>

package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/joho/godotenv"

	_ "provider/docs"
	"provider/internal/auth"
	"provider/internal/platform/postgres"
	"github.com/go-chi/cors"

	httpSwagger "github.com/swaggo/http-swagger/v2"
)

func main() {
	// Load .env from the project root.
	// This path assumes you run the application from cmd/api.
	if err := godotenv.Load(".env"); err != nil {
		log.Printf("Warning: could not load .env file: %v", err)
	}
	// Read environment variables.
	databaseURL := os.Getenv("DATABASE_URL")
	jwtSecret := os.Getenv("JWT_SECRET")

	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	if len(jwtSecret) < 32 {
		log.Fatal("JWT_SECRET must be at least 32 characters")
	}

	// Connect to PostgreSQL with a 10-second timeout.
	ctx, cancel := context.WithTimeout(
		context.Background(),
		10*time.Second,
	)
	defer cancel()

	db, err := postgres.Connect(ctx, databaseURL)
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	defer db.Close()

	// Initialize authentication dependencies.
	repo := auth.NewRepository(db)
	service := auth.NewService(repo, jwtSecret)
	handler := auth.NewHandler(service)

	// Configure routes.
	router := chi.NewRouter()

	router.Use(cors.Handler(cors.Options{
    AllowedOrigins: []string{
        "http://localhost:8000",
		"*",
    },
    AllowedMethods: []string{
        "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS",
    },
    AllowedHeaders: []string{
        "Accept", "Authorization", "Content-Type",
    },
    AllowCredentials: false,
    MaxAge: 300,
}))

	router.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("OK"))
	})
	router.Get("/swagger/*", httpSwagger.Handler(
		httpSwagger.URL("/swagger/doc.json"),
	))
	router.Route("/api/v1", func(r chi.Router) {
		r.Post("/auth/register", handler.Register)
		r.Post("/auth/login", handler.Login)
		r.Post("/auth/refresh", handler.Refresh)
		r.Post("/auth/logout", handler.Logout)

		r.Group(func(r chi.Router) {
			r.Use(handler.JWTAuth)
			r.Get("/users/me", handler.Me)
		})

	})

	// Start HTTP server.
	server := &http.Server{
		Addr:              ":8000",
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	log.Println("Code Kadai Auth API listening on :8000")

	if err := server.ListenAndServe(); err != nil &&
		err != http.ErrServerClosed {
		log.Fatalf("HTTP server failed: %v", err)
	}
}
