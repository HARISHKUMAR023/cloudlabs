package main

import (
	"context"
	"encoding/json"
	"fmt"
	"hash/fnv"
	"io"
	"log"
	"net/http"
	"strconv"

	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
	"github.com/docker/go-connections/nat"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

// Global Docker client and constants
var cli *client.Client
var codeServerImage = "codercom/code-server:latest"

// DeploymentPayload defines the structure for the request body for deploy/update.
type DeploymentPayload struct {
	ImageTag string `json:"image_tag"`
}

func main() {
	// 1. Initialize Docker Client
	var err error
	cli, err = client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		log.Fatalf("Error initializing Docker client: %v", err)
	}
	defer cli.Close()

	// 2. Initialize Chi Router
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	// 3. API Routes
	// POST /deploy handles initial deploy and updates/redeploy (with cleanup)
	r.Post("/codeserver/{username}/deploy", deployCodeServerHandler)

	// POST /stop now handles both stopping and removing (cleanup)
	r.Post("/codeserver/{username}/stop", cleanupCodeServerHandler)

	port := 8080
	log.Printf("Starting robust server on :%d...", port)
	if err := http.ListenAndServe(fmt.Sprintf(":%d", port), r); err != nil {
		log.Fatal("Server failed: ", err)
	}
}

// ---------------------------------------------------------------------
// --- Utility Functions ---
// ---------------------------------------------------------------------

func getContainerName(username string) string {
	return fmt.Sprintf("codeserver-%s", username)
}

func getUniqueHostPort(username string) string {
	h := fnv.New32a()
	h.Write([]byte(username))
	basePort := 10000
	portRange := 1000
	port := basePort + int(h.Sum32())%portRange
	return strconv.Itoa(port)
}

func pullCodeServerImage(ctx context.Context, imageTag string) error {
	log.Printf("Checking and pulling image: %s (if not present or outdated)", imageTag)
	reader, err := cli.ImagePull(ctx, imageTag, image.PullOptions{})
	if err != nil {
		return err
	}
	defer reader.Close()
	_, err = io.Copy(io.Discard, reader)
	if err != nil {
		return err
	}
	log.Printf("Image %s ensured successfully.", imageTag)
	return nil
}

// stopAndRemoveCodeServer uses ContainerRemove(Force: true) for full cleanup.
func stopAndRemoveCodeServer(ctx context.Context, username string) error {
	containerName := getContainerName(username)
	log.Printf("Attempting to clean up (stop and remove) container: %s", containerName)

	removeOptions := container.RemoveOptions{
		RemoveVolumes: true,
		Force:         true, // Force stops the container if running, then removes it
	}

	if err := cli.ContainerRemove(ctx, containerName, removeOptions); err != nil {
		if client.IsErrNotFound(err) {
			log.Printf("Container %s was not found (already removed).", containerName)
			return nil
		}
		return fmt.Errorf("failed to remove container %s: %w", containerName, err)
	}

	log.Printf("Container %s successfully cleaned up.", containerName)
	return nil
}

// ---------------------------------------------------------------------
// --- Deployment Function ---
// ---------------------------------------------------------------------

// deployCodeServer creates and starts the code-server container.
func deployCodeServer(ctx context.Context, username string, targetImageTag string) (string, error) {
	containerName := getContainerName(username)
	hostPort := getUniqueHostPort(username)

	log.Printf("Attempting deployment for user: %s (Host Port: %s) with image: %s", username, hostPort, targetImageTag)

	// 1. Ensure the image is available (PULL)
	if err := pullCodeServerImage(ctx, targetImageTag); err != nil {
		return "", fmt.Errorf("failed to pull image: %w", err)
	}

	// 2. Configuration
	containerPort := nat.Port("8080/tcp")

	config := &container.Config{
		Image:        targetImageTag,
		User:         "0:0", // Run as root (UID 0) to allow access to '/'
		Cmd:          []string{"code-server", "--bind-addr", "0.0.0.0:8080", "--auth", "password"},
		ExposedPorts: nat.PortSet{containerPort: struct{}{}},
		Env: []string{
			"DOCKER_USER=" + username,
			"PASSWORD=" + username + "pass",
		},
	}

	// 3. Host Configuration
	hostConfig := &container.HostConfig{
		PortBindings: nat.PortMap{
			containerPort: []nat.PortBinding{
				{HostIP: "0.0.0.0", HostPort: hostPort},
			},
		},
		RestartPolicy: container.RestartPolicy{Name: "unless-stopped"},
	}

	// 4. Create the container
	resp, err := cli.ContainerCreate(ctx, config, hostConfig, nil, nil, containerName)
	if err != nil {
		return "", fmt.Errorf("failed to create container %s: %w", containerName, err)
	}

	// 5. Start the container
	if err := cli.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		return "", fmt.Errorf("failed to start container %s: %w", containerName, err)
	}

	log.Printf("Container %s started successfully. Access on port %s", containerName, hostPort)
	return hostPort, nil
}

// ---------------------------------------------------------------------
// --- API Handlers ---
// ---------------------------------------------------------------------

// deployCodeServerHandler handles POST /codeserver/{username}/deploy
func deployCodeServerHandler(w http.ResponseWriter, r *http.Request) {
	username := chi.URLParam(r, "username")
	ctx := r.Context()

	targetImageTag := codeServerImage

	var payload DeploymentPayload
	if r.ContentLength > 0 && r.Header.Get("Content-Type") == "application/json" {
		if err := json.NewDecoder(r.Body).Decode(&payload); err == nil && payload.ImageTag != "" {
			targetImageTag = payload.ImageTag
		}
	}

	// 1. Clean up any old container (Uses stopAndRemoveCodeServer)
	if err := stopAndRemoveCodeServer(ctx, username); err != nil {
		// Log cleanup error but proceed with deploy if possible
		log.Printf("Cleanup failed for %s (will try deploy anyway): %v", username, err)
	}

	// 2. Deploy the new container
	hostPort, err := deployCodeServer(ctx, username, targetImageTag)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"message": fmt.Sprintf("Failed to deploy codeserver for %s: %v", username, err)})
		return
	}

	// 3. Return Success
	generatedPassword := username + "pass"
	// Set default path to root as requested
	const defaultContainerPath = "/"

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message":    fmt.Sprintf("Code-Server for %s deployed successfully with image %s.", username, targetImageTag),
		"host_port":  hostPort,
		"access_url": fmt.Sprintf("http://localhost:%s/?folder=%s", hostPort, defaultContainerPath),
		"password":   generatedPassword,
		"image_used": targetImageTag,
	})
}

// cleanupCodeServerHandler handles POST /codeserver/{username}/stop
// This handler performs a full 'stop and remove' cleanup.
func cleanupCodeServerHandler(w http.ResponseWriter, r *http.Request) {
	username := chi.URLParam(r, "username")
	ctx := r.Context()
	containerName := getContainerName(username)

	log.Printf("Received request to stop/remove container: %s for user: %s", containerName, username)

	// Use the utility function which performs a forced removal (stop+remove)
	if err := stopAndRemoveCodeServer(ctx, username); err != nil {

		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"message": fmt.Sprintf("Failed to stop and remove container %s: %v", containerName, err),
		})
		return
	}

	// If no error, it means the container was either removed or not found (which is successful cleanup)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message":  fmt.Sprintf("Container %s successfully stopped and removed (cleaned up).", containerName),
		"username": username,
	})
}
