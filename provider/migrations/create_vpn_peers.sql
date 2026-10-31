CREATE TABLE IF NOT EXISTS vpn_peers (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(80) NOT NULL,
    public_key TEXT NOT NULL UNIQUE,
    vpn_ip INET NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_vpn_peers_user_id
    ON vpn_peers(user_id);

CREATE INDEX IF NOT EXISTS idx_vpn_peers_status
    ON vpn_peers(status);