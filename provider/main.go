package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
	"github.com/docker/go-connections/nat"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

// ---------------------- Structs ----------------------

type StartResponse struct {
	ContainerID string `json:"containerId"`
	Status      string `json:"status"`
	URL         string `json:"url"`
	Password    string `json:"password"`
}

type StopRequest struct {
	ContainerID string `json:"containerId"`
}

type GenericResponse struct {
	Status string `json:"status"`
	Msg    string `json:"msg,omitempty"`
}

// ---------------------- Helpers ----------------------

// Generate random password
func generateRandomPassword(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	rand.Seed(time.Now().UnixNano())
	pass := make([]byte, length)
	for i := range pass {
		pass[i] = charset[rand.Intn(len(charset))]
	}
	return string(pass)
}

// ---------------------- Handlers ----------------------

// Start a new Ubuntu + VS Code Web container
func startMachineHandler(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	const defaultImage = "ubuntu-vscode-web:latest"
	const containerPortStr = "8080/tcp"

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		http.Error(w, "Docker client error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Generate random password for this container
	password := generateRandomPassword(8)

	// Expose port 8080 inside container, host port auto-assigned
	containerPort, _ := nat.NewPort("tcp", "8080")
	portBindings := nat.PortMap{
		containerPort: []nat.PortBinding{
			{HostIP: "0.0.0.0", HostPort: ""},
		},
	}

	// Generate unique container name
	containerName := fmt.Sprintf("user-container-%d", time.Now().UnixNano())

	// Create container
	resp, err := cli.ContainerCreate(ctx,
		&container.Config{
			Image: defaultImage,
			Env:   []string{fmt.Sprintf("PASSWORD=%s", password)},
			ExposedPorts: nat.PortSet{
				containerPort: struct{}{},
			},
		},
		&container.HostConfig{
			PortBindings: portBindings,
		},
		&network.NetworkingConfig{},
		nil,
		containerName,
	)
	if err != nil {
		http.Error(w, "Error creating container: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Start container
	if err := cli.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		http.Error(w, "Error starting container: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Inspect to get assigned host port
	inspect, err := cli.ContainerInspect(ctx, resp.ID)
	if err != nil {
		http.Error(w, "Error inspecting container: "+err.Error(), http.StatusInternalServerError)
		return
	}

	assignedPort := inspect.NetworkSettings.Ports[containerPort][0].HostPort
	accessURL := fmt.Sprintf("http://localhost:%s", assignedPort)

	// Respond
	response := StartResponse{
		ContainerID: resp.ID,
		Status:      "running",
		URL:         accessURL,
		Password:    password,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Stop a container by ID
func stopMachineHandler(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	var req StopRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		http.Error(w, "Docker client error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if err := cli.ContainerStop(ctx, req.ContainerID, container.StopOptions{}); err != nil {
		http.Error(w, "Error stopping container: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := GenericResponse{
		Status: "stopped",
		Msg:    fmt.Sprintf("Container %s stopped", req.ContainerID),
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// ---------------------- Main ----------------------

func main() {
	r := chi.NewRouter()
	r.Use(middleware.Logger)

	r.Post("/machine/linux/start", startMachineHandler)
	r.Post("/machine/linux/stop", stopMachineHandler)

	fmt.Println("🚀 Cloud Lab API running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
