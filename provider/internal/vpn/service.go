package vpn

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/netip"
	"strings"
	"time"

	"golang.zx2c4.com/wireguard/wgctrl"
	"golang.zx2c4.com/wireguard/wgctrl/wgtypes"
)

var (
	ErrInvalidPublicKey  = errors.New("invalid WireGuard public key")
	ErrInvalidDeviceName = errors.New("invalid device name")
	ErrPeerAlreadyExists = errors.New("WireGuard peer already exists")
)

type Config struct {
	InterfaceName  string
	ServerAddress  string
	ClientCIDR     string
	ServerEndpoint string
	DNS            string
	FirstHost      int
}

type Service struct {
	repo *Repository
	cfg  Config
}

func NewService(repo *Repository, cfg Config) *Service {
	if cfg.FirstHost < 2 {
		cfg.FirstHost = 10
	}
	return &Service{repo: repo, cfg: cfg}
}

func (s *Service) validateDeviceName(name string) (string, error) {
	name = strings.TrimSpace(name)

	if len(name) < 1 || len(name) > 80 {
		return "", ErrInvalidDeviceName
	}

	for _, r := range name {
		if r < 32 || r == 127 {
			return "", ErrInvalidDeviceName
		}
	}

	return name, nil
}

func parsePublicKey(raw string) (wgtypes.Key, error) {
	key, err := wgtypes.ParseKey(strings.TrimSpace(raw))
	if err != nil || key == (wgtypes.Key{}) {
		return wgtypes.Key{}, ErrInvalidPublicKey
	}
	return key, nil
}

func (s *Service) addRuntimePeer(publicKey, ip string) error {
	key, err := parsePublicKey(publicKey)
	if err != nil {
		return err
	}

	parsedIP := net.ParseIP(ip)
	if parsedIP == nil || parsedIP.To4() == nil {
		return fmt.Errorf("invalid peer IPv4 address: %s", ip)
	}

	allowedIP := net.IPNet{
		IP:   parsedIP.To4(),
		Mask: net.CIDRMask(32, 32),
	}

	client, err := wgctrl.New()
	if err != nil {
		return err
	}
	defer client.Close()

	return client.ConfigureDevice(s.cfg.InterfaceName, wgtypes.Config{
		Peers: []wgtypes.PeerConfig{
			{
				PublicKey:         key,
				ReplaceAllowedIPs: true,
				AllowedIPs:        []net.IPNet{allowedIP},
			},
		},
	})
}

func (s *Service) removeRuntimePeer(publicKey string) error {
	key, err := parsePublicKey(publicKey)
	if err != nil {
		return err
	}

	client, err := wgctrl.New()
	if err != nil {
		return err
	}
	defer client.Close()

	return client.ConfigureDevice(s.cfg.InterfaceName, wgtypes.Config{
		Peers: []wgtypes.PeerConfig{
			{
				PublicKey: key,
				Remove:    true,
			},
		},
	})
}

func (s *Service) CreatePeer(
	ctx context.Context,
	userID string,
	req CreatePeerRequest,
) (Peer, error) {
	name, err := s.validateDeviceName(req.DeviceName)
	if err != nil {
		return Peer{}, err
	}

	key, err := parsePublicKey(req.PublicKey)
	if err != nil {
		return Peer{}, err
	}

	// Read the existing interface first. Never replace its configuration.
	client, err := wgctrl.New()
	if err != nil {
		return Peer{}, err
	}

	device, err := client.Device(s.cfg.InterfaceName)
	client.Close()

	if err != nil {
		return Peer{}, err
	}

	reservedIPs := make(map[string]bool)

	for _, existing := range device.Peers {
		if existing.PublicKey == key {
			return Peer{}, ErrPeerAlreadyExists
		}

		// Protect all existing peer addresses, including unmanaged peers.
		for _, allowed := range existing.AllowedIPs {
			ip4 := allowed.IP.To4()
			ones, bits := allowed.Mask.Size()

			if ip4 == nil || bits != 32 || ones != 32 {
				return Peer{}, errors.New(
					"existing peer has a non-/32 route; audit wg0 before allocating student IPs",
				)
			}

			reservedIPs[ip4.String()] = true
		}
	}

	peer, err := s.repo.Create(
		ctx,
		userID,
		name,
		key.String(),
		s.cfg.ClientCIDR,
		s.cfg.ServerAddress,
		s.cfg.FirstHost,
	)
	if err != nil {
		return Peer{}, err
	}

	if reservedIPs[peer.VPNIP] {
		_ = s.repo.DeleteCreated(ctx, peer.ID)
		return Peer{}, errors.New("allocated VPN IP conflicts with an existing WireGuard peer; review the configured allocation range")
	}

	if err := s.addRuntimePeer(peer.PublicKey, peer.VPNIP); err != nil {
		_ = s.repo.DeleteCreated(ctx, peer.ID)
		return Peer{}, fmt.Errorf("could not add peer to WireGuard: %w", err)
	}

	return peer, nil
}

func (s *Service) ListPeers(
	ctx context.Context,
	userID string,
) ([]PeerStatus, error) {
	peers, err := s.repo.ListByUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	handshakes := make(map[string]time.Time)

	client, err := wgctrl.New()
	if err == nil {
		device, deviceErr := client.Device(s.cfg.InterfaceName)
		client.Close()

		if deviceErr == nil {
			for _, p := range device.Peers {
				if !p.LastHandshakeTime.IsZero() {
					handshakes[p.PublicKey.String()] = p.LastHandshakeTime
				}
			}
		}
	}

	result := make([]PeerStatus, 0, len(peers))

	for _, p := range peers {
		item := PeerStatus{Peer: p}

		if t, ok := handshakes[p.PublicKey]; ok && p.Status == "active" {
			item.LastHandshake = &t
			item.Connected = time.Since(t) < 3*time.Minute
		}

		result = append(result, item)
	}

	return result, nil
}

func (s *Service) GetPeer(
	ctx context.Context,
	id, userID string,
) (Peer, error) {
	return s.repo.GetByIDForUser(ctx, id, userID)
}

func (s *Service) RevokePeer(
	ctx context.Context,
	id, userID string,
) error {
	peer, err := s.repo.GetByIDForUser(ctx, id, userID)
	if err != nil {
		return err
	}

	if peer.Status == "revoked" {
		return nil
	}

	// Remove runtime access before marking the record revoked.
	if err := s.removeRuntimePeer(peer.PublicKey); err != nil {
		return fmt.Errorf("could not remove WireGuard peer: %w", err)
	}

	if err := s.repo.MarkRevoked(ctx, id, userID); err != nil {
		// Best-effort restoration if the database update fails.
		_ = s.addRuntimePeer(peer.PublicKey, peer.VPNIP)
		return err
	}

	return nil
}

func (s *Service) ServerInfo(ctx context.Context) (ServerInfo, error) {
	_ = ctx

	client, err := wgctrl.New()
	if err != nil {
		return ServerInfo{}, err
	}
	defer client.Close()

	device, err := client.Device(s.cfg.InterfaceName)
	if err != nil {
		return ServerInfo{}, err
	}

	prefix, err := netip.ParsePrefix(s.cfg.ClientCIDR)
	if err != nil {
		return ServerInfo{}, err
	}

	return ServerInfo{
		InterfaceName:     device.Name,
		ServerPublicKey:   device.PublicKey.String(),
		ServerEndpoint:    s.cfg.ServerEndpoint,
		ClientAddressCIDR: prefix.String(),
		DNS:               s.cfg.DNS,
	}, nil
}

// RestoreActivePeers restores only peers recorded by Code Kadai.
// It does not replace the wg0 device configuration.
func (s *Service) RestoreActivePeers(ctx context.Context) error {
	peers, err := s.repo.Active(ctx)
	if err != nil {
		return err
	}

	for _, peer := range peers {
		if err := s.addRuntimePeer(peer.PublicKey, peer.VPNIP); err != nil {
			return fmt.Errorf("restore peer %s: %w", peer.ID, err)
		}
	}

	return nil
}

func ValidateConfig(cfg Config) error {
	if strings.TrimSpace(cfg.InterfaceName) == "" {
		return errors.New("WG_INTERFACE is required")
	}

	prefix, err := netip.ParsePrefix(cfg.ClientCIDR)
	if err != nil || !prefix.Addr().Is4() {
		return errors.New("WG_CLIENT_CIDR must be a valid IPv4 CIDR")
	}

	serverIP, err := netip.ParseAddr(cfg.ServerAddress)
	if err != nil || !serverIP.Is4() || !prefix.Contains(serverIP) {
		return errors.New("WG_SERVER_ADDRESS must be inside WG_CLIENT_CIDR")
	}

	if strings.TrimSpace(cfg.ServerEndpoint) == "" {
		return errors.New("WG_SERVER_ENDPOINT is required")
	}

	return nil
}

func incrementIP(ip net.IP) net.IP {
	result := append(net.IP(nil), ip...)
	for i := len(result) - 1; i >= 0; i-- {
		result[i]++
		if result[i] != 0 {
			break
		}
	}
	return result
}

func lastIP(network net.IPNet) net.IP {
	ip := append(net.IP(nil), network.IP...)
	mask := network.Mask
	for i := range ip {
		ip[i] |= ^mask[i]
	}
	return ip
}
