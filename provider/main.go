// package main

// import (
// 	"context"
// 	"encoding/json"
// 	"fmt"
// 	"hash/fnv"
// 	"io"
// 	"log"
// 	"net/http"
// 	"strconv"

// 	"github.com/docker/docker/api/types/container"
// 	"github.com/docker/docker/api/types/image"
// 	"github.com/docker/docker/client"
// 	"github.com/docker/go-connections/nat"
// 	"github.com/go-chi/chi/v5"
// 	"github.com/go-chi/chi/v5/middleware"
// )

// // Global Docker client and constants
// var cli *client.Client
// var codeServerImage = "codercom/code-server:latest"

// func main() {
// 	// 1. Initialize Docker Client
// 	var err error
// 	cli, err = client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
// 	if err != nil {
// 		log.Fatalf("Error initializing Docker client: %v", err)
// 	}
// 	defer cli.Close()

// 	// 2. Initialize Chi Router
// 	r := chi.NewRouter()
// 	r.Use(middleware.Logger)
// 	r.Use(middleware.Recoverer)

// 	// 3. API Routes
// 	r.Route("/codeserver/{username}", func(r chi.Router) {
// 		r.Post("/deploy", deployCodeServerHandler)
// 		r.Post("/redeploy", redeployCodeServerHandler)
// 	})

// 	port := 8080
// 	log.Printf("Starting robust server on :%d...", port)
// 	if err := http.ListenAndServe(fmt.Sprintf(":%d", port), r); err != nil {
// 		log.Fatal("Server failed: ", err)
// 	}
// }

// // --- Utility Functions ---

// // getContainerName returns a standardized name for a user's container.
// func getContainerName(username string) string {
// 	return fmt.Sprintf("codeserver-%s", username)
// }

// // getUniqueHostPort generates a unique host port based on the username.
// func getUniqueHostPort(username string) string {
// 	h := fnv.New32a()
// 	h.Write([]byte(username))
// 	// Allocate ports between 10000 and 10999
// 	basePort := 10000
// 	portRange := 1000
// 	port := basePort + int(h.Sum32())%portRange
// 	return strconv.Itoa(port)
// }

// // pullCodeServerImage pulls the required image.
// func pullCodeServerImage(ctx context.Context) error {
// 	log.Printf("Checking and pulling image: %s (if not present or outdated)", codeServerImage)
// 	reader, err := cli.ImagePull(ctx, codeServerImage, image.PullOptions{})
// 	if err != nil {
// 		return err
// 	}
// 	defer reader.Close()
// 	_, err = io.Copy(io.Discard, reader)
// 	if err != nil {
// 		return err
// 	}
// 	log.Printf("Image %s ensured successfully.", codeServerImage)
// 	return nil
// }

// // stopAndRemoveCodeServer forcefully removes the container for a clean start.
// func stopAndRemoveCodeServer(ctx context.Context, username string) error {
// 	containerName := getContainerName(username)
// 	log.Printf("Attempting to clean up (stop and remove) container: %s", containerName)

// 	timeoutSeconds := 5
// 	stopOptions := container.StopOptions{Timeout: &timeoutSeconds}

// 	if err := cli.ContainerStop(ctx, containerName, stopOptions); err != nil && !client.IsErrNotFound(err) {
// 		log.Printf("Warning: Failed to stop container %s gracefully, proceeding to remove: %v", containerName, err)
// 	}

// 	// removeOptions := types.{
// 	// 	RemoveVolumes: true,
// 	// 	Force:         true,
// 	// }
// 	// if err := cli.ContainerRemove(ctx, containerName, removeOptions); err != nil {
// 	// 	if !client.IsErrNotFound(err) {
// 	// 		return fmt.Errorf("failed to remove container %s: %w", containerName, err)
// 	// 	}
// 	// }
// 	log.Printf("Container %s successfully cleaned up.", containerName)
// 	return nil
// }

// // deployCodeServer pulls the image, creates, and starts a container.
// func deployCodeServer(ctx context.Context, username string) (string, error) {
// 	containerName := getContainerName(username)
// 	hostPort := getUniqueHostPort(username)
// 	log.Printf("Attempting deployment for user: %s (Host Port: %s)", username, hostPort)

// 	if err := pullCodeServerImage(ctx); err != nil {
// 		return "", fmt.Errorf("failed to pull image: %w", err)
// 	}

// 	containerPort := nat.Port("8080/tcp")

// 	// *** FIX APPLIED HERE: Removed "--password" from the Cmd slice ***
// 	config := &container.Config{
// 		Image:        codeServerImage,
// 		Cmd:          []string{"code-server", "--bind-addr", "0.0.0.0:8080", "--auth", "password"}, // The password will be read from the environment variable below
// 		ExposedPorts: nat.PortSet{containerPort: struct{}{}},
// 		Env: []string{
// 			"DOCKER_USER=" + username,
// 			"PASSWORD=" + username + "pass", // Code-Server will read this environment variable
// 		},
// 	}
// 	// ********************************************************************
// 	const defaultContainerPath = "/home/coder"
// 	hostConfig := &container.HostConfig{
// 		PortBindings: nat.PortMap{
// 			containerPort: []nat.PortBinding{
// 				{HostIP: "0.0.0.0", HostPort: hostPort},
// 			},
// 		},
// 		RestartPolicy: container.RestartPolicy{Name: "unless-stopped"},
// 	}

// 	resp, err := cli.ContainerCreate(ctx, config, hostConfig, nil, nil, containerName)
// 	if err != nil {
// 		return "", fmt.Errorf("failed to create container %s: %w", containerName, err)
// 	}

// 	if err := cli.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
// 		return "", fmt.Errorf("failed to start container %s: %w", containerName, err)
// 	}

// 	log.Printf("Container %s started successfully. Access on port %s", containerName, hostPort)
// 	return hostPort, nil
// }

// // --- API Handlers ---

// // deployCodeServerHandler handles POST /codeserver/{username}/deploy
// func deployCodeServerHandler(w http.ResponseWriter, r *http.Request) {
// 	username := chi.URLParam(r, "username")
// 	ctx := r.Context()

// 	// 1. Clean up any old container (essential now that we know the old one is stuck)
// 	if err := stopAndRemoveCodeServer(ctx, username); err != nil {
// 		log.Printf("Cleanup failed for %s (will try deploy anyway): %v", username, err)
// 	}

// 	// 2. Deploy the new container
// 	hostPort, err := deployCodeServer(ctx, username)
// 	if err != nil {
// 		w.WriteHeader(http.StatusInternalServerError)
// 		json.NewEncoder(w).Encode(map[string]string{"message": fmt.Sprintf("Failed to deploy codeserver for %s: %v", username, err)})
// 		return
// 	}

// 	w.WriteHeader(http.StatusOK)
// 	json.NewEncoder(w).Encode(map[string]string{
// 		"message":    fmt.Sprintf("Code-Server for %s deployed successfully.", username),
// 		"host_port":  hostPort,
// 		"access_url": fmt.Sprintf("http://localhost:%s", hostPort),
// 	})
// }

// // redeployCodeServerHandler handles POST /codeserver/{username}/redeploy
// func redeployCodeServerHandler(w http.ResponseWriter, r *http.Request) {
// 	username := chi.URLParam(r, "username")
// 	ctx := r.Context()

// 	// 1. Stop and Remove (Clean up old container)
// 	if err := stopAndRemoveCodeServer(ctx, username); err != nil {
// 		log.Printf("Warning during stop/remove for %s: %v. Attempting deploy.", username, err)
// 	}

// 	// 2. Deploy (Create and Start)
// 	hostPort, err := deployCodeServer(ctx, username)
// 	if err != nil {
// 		w.WriteHeader(http.StatusInternalServerError)
// 		json.NewEncoder(w).Encode(map[string]string{"message": fmt.Sprintf("Failed to redeploy codeserver for %s: %v", username, err)})
// 		return
// 	}

//		w.WriteHeader(http.StatusOK)
//		json.NewEncoder(w).Encode(map[string]string{
//			"message":    fmt.Sprintf("Code-Server for %s redeployed successfully.", username),
//			"host_port":  hostPort,
//			"access_url": fmt.Sprintf("http://localhost:%s", hostPort),
//		})
//	}
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

// Note: In this consolidated approach, codeServerImage serves as the default.
var codeServerImage = "codercom/code-server:latest"

// DeploymentPayload defines the structure for the request body for deploy/update.
type DeploymentPayload struct {
	// ImageTag allows the user to specify a specific image (e.g., "codercom/code-server:4.11.1")
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

	// 3. API Route for Deployment/Update (Consolidated)
	// This single POST endpoint handles both initial deploy and updates/redeploy.
	r.Post("/codeserver/{username}/deploy", deployCodeServerHandler)

	// The /redeploy route is no longer strictly necessary but kept for backward clarity if needed
	// r.Post("/codeserver/{username}/redeploy", deployCodeServerHandler) // Can reuse the same handler

	port := 8080
	log.Printf("Starting robust server on :%d...", port)
	if err := http.ListenAndServe(fmt.Sprintf(":%d", port), r); err != nil {
		log.Fatal("Server failed: ", err)
	}
}

// --- Utility Functions (Unchanged) ---

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

// pullCodeServerImage now accepts the imageTag to pull
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

// stopAndRemoveCodeServer forcefully removes the container for a clean start.
func stopAndRemoveCodeServer(ctx context.Context, username string) error {
	containerName := getContainerName(username)
	log.Printf("Attempting to clean up (stop and remove) container: %s", containerName)

	timeoutSeconds := 5
	stopOptions := container.StopOptions{Timeout: &timeoutSeconds}

	if err := cli.ContainerStop(ctx, containerName, stopOptions); err != nil && !client.IsErrNotFound(err) {
		log.Printf("Warning: Failed to stop container %s gracefully, proceeding to remove: %v", containerName, err)
	}

	// removeOptions := types.ContainerRemoveOptions{
	// 	RemoveVolumes: true,
	// 	Force:         true,
	// }
	// if err := cli.ContainerRemove(ctx, containerName, removeOptions); err != nil {
	// 	if !client.IsErrNotFound(err) {
	// 		return fmt.Errorf("failed to remove container %s: %w", containerName, err)
	// 	}
	// }
	log.Printf("Container %s successfully cleaned up.", containerName)
	return nil
}

// --- UPDATED Deployment Function ---

// deployCodeServer now takes the targetImageTag as an argument.
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
		Image:        targetImageTag, // Use the provided tag
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

// --- UPDATED API Handler (Consolidated Deploy/Update) ---

// deployCodeServerHandler handles POST /codeserver/{username}/deploy
func deployCodeServerHandler(w http.ResponseWriter, r *http.Request) {
	username := chi.URLParam(r, "username")
	ctx := r.Context()

	// Default image tag is the global variable
	targetImageTag := codeServerImage

	// Attempt to decode a JSON body for optional update tag
	var payload DeploymentPayload
	if r.ContentLength > 0 && r.Header.Get("Content-Type") == "application/json" {
		if err := json.NewDecoder(r.Body).Decode(&payload); err == nil && payload.ImageTag != "" {
			targetImageTag = payload.ImageTag // Use the provided tag for update/deploy
		}
	}

	// 1. Clean up any old container (This makes the endpoint idempotent and capable of updates)
	if err := stopAndRemoveCodeServer(ctx, username); err != nil {
		log.Printf("Cleanup failed for %s (will try deploy anyway): %v", username, err)
	}

	// 2. Deploy the new container, passing the determined image tag
	hostPort, err := deployCodeServer(ctx, username, targetImageTag)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"message": fmt.Sprintf("Failed to deploy codeserver for %s: %v", username, err)})
		return
	}

	// 3. Return Success
	generatedPassword := username + "pass"
	const defaultContainerPath = "/home/coder"

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message":    fmt.Sprintf("Code-Server for %s deployed successfully with image %s.", username, targetImageTag),
		"host_port":  hostPort,
		"access_url": fmt.Sprintf("http://localhost:%s/?folder=%s", hostPort, defaultContainerPath),
		"password":   generatedPassword,
		"image_used": targetImageTag,
	})
}
