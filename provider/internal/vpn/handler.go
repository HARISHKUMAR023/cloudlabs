package vpn

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type UserIDFromContext func(*http.Request) (string, bool)

type Handler struct {
	service *Service
	userID  UserIDFromContext
}

func NewHandler(
	service *Service,
	userID UserIDFromContext,
) *Handler {
	return &Handler{
		service: service,
		userID:  userID,
	}
}

func (h *Handler) currentUserID(
	w http.ResponseWriter,
	r *http.Request,
) (string, bool) {
	id, ok := h.userID(r)

	if !ok || id == "" {
		writeError(w, http.StatusUnauthorized, "Authentication required")
		return "", false
	}

	if _, err := uuid.Parse(id); err != nil {
		writeError(w, http.StatusUnauthorized, "Invalid user identity")
		return "", false
	}

	return id, true
}

func decodeJSON(
	w http.ResponseWriter,
	r *http.Request,
	target any,
) error {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(target); err != nil {
		return err
	}

	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		return errors.New("request must contain one JSON object")
	}

	return nil
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{
		"error": message,
	})
}

func (h *Handler) ServerInfo(
	w http.ResponseWriter,
	r *http.Request,
) {
	if _, ok := h.currentUserID(w, r); !ok {
		return
	}

	info, err := h.service.ServerInfo(r.Context())
	if err != nil {
		writeError(
			w,
			http.StatusServiceUnavailable,
			"WireGuard interface is unavailable",
		)
		return
	}

	writeJSON(w, http.StatusOK, info)
}

func (h *Handler) CreatePeer(
	w http.ResponseWriter,
	r *http.Request,
) {
	userID, ok := h.currentUserID(w, r)
	if !ok {
		return
	}

	var req CreatePeerRequest

	if err := decodeJSON(w, r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid JSON body")
		return
	}

	if req.DeviceName == "" || req.PublicKey == "" {
		writeError(
			w,
			http.StatusBadRequest,
			"device_name and public_key are required",
		)
		return
	}

	peer, err := h.service.CreatePeer(
		r.Context(),
		userID,
		req,
	)

	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidPublicKey):
			writeError(w, http.StatusBadRequest, "Invalid public key")
		case errors.Is(err, ErrInvalidDeviceName):
			writeError(w, http.StatusBadRequest, "Invalid device name")
		case errors.Is(err, ErrPeerAlreadyExists):
			writeError(w, http.StatusConflict, "Peer already exists")
		case errors.Is(err, ErrNoVPNIPs):
			writeError(
				w,
				http.StatusInsufficientStorage,
				"No VPN IP addresses available",
			)
		default:
			writeError(
				w,
				http.StatusInternalServerError,
				"Could not create VPN peer",
			)
		}
		return
	}

	writeJSON(w, http.StatusCreated, peer)
}

func (h *Handler) ListPeers(
	w http.ResponseWriter,
	r *http.Request,
) {
	userID, ok := h.currentUserID(w, r)
	if !ok {
		return
	}

	peers, err := h.service.ListPeers(r.Context(), userID)
	if err != nil {
		writeError(
			w,
			http.StatusInternalServerError,
			"Could not list VPN peers",
		)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"items": peers,
	})
}

func (h *Handler) GetPeer(
	w http.ResponseWriter,
	r *http.Request,
) {
	userID, ok := h.currentUserID(w, r)
	if !ok {
		return
	}

	peer, err := h.service.GetPeer(
		r.Context(),
		chi.URLParam(r, "id"),
		userID,
	)

	if errors.Is(err, ErrPeerNotFound) {
		writeError(w, http.StatusNotFound, "VPN peer not found")
		return
	}

	if err != nil {
		writeError(
			w,
			http.StatusInternalServerError,
			"Could not get VPN peer",
		)
		return
	}

	writeJSON(w, http.StatusOK, peer)
}

func (h *Handler) RevokePeer(
	w http.ResponseWriter,
	r *http.Request,
) {
	userID, ok := h.currentUserID(w, r)
	if !ok {
		return
	}

	err := h.service.RevokePeer(
		r.Context(),
		chi.URLParam(r, "id"),
		userID,
	)

	if errors.Is(err, ErrPeerNotFound) {
		writeError(
			w,
			http.StatusNotFound,
			"VPN peer not found or already revoked",
		)
		return
	}

	if err != nil {
		writeError(
			w,
			http.StatusInternalServerError,
			"Could not revoke VPN peer",
		)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"message": "VPN peer revoked",
	})
}
