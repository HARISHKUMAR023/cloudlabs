package vpn

import "time"

type Peer struct {
    ID         string     `json:"id"`
    UserID     string     `json:"user_id"`
    DeviceName string     `json:"device_name"`
    PublicKey  string     `json:"public_key"`
    VPNIP      string     `json:"vpn_ip"`
    Status     string     `json:"status"`
    CreatedAt  time.Time  `json:"created_at"`
    RevokedAt  *time.Time `json:"revoked_at,omitempty"`
}

type CreatePeerRequest struct {
    DeviceName string `json:"device_name"`
    PublicKey  string `json:"public_key"`
}

type ServerInfo struct {
    InterfaceName     string `json:"interface_name"`
    ServerPublicKey   string `json:"server_public_key"`
    ServerEndpoint    string `json:"server_endpoint"`
    ClientAddressCIDR string `json:"client_address_cidr"`
    DNS               string `json:"dns,omitempty"`
}

type PeerStatus struct {
    Peer
    Connected     bool       `json:"connected"`
    LastHandshake *time.Time `json:"last_handshake,omitempty"`
}