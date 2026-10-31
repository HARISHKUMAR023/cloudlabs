package vpn

import (
	"context"
	"errors"
	"fmt"
	"net/netip"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrPeerNotFound = errors.New("VPN peer not found")
	ErrNoVPNIPs     = errors.New("no VPN IP addresses available")
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(
	ctx context.Context,
	userID, deviceName, publicKey, clientCIDR, serverIP string,
	firstHost int,
) (Peer, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Peer{}, err
	}
	defer tx.Rollback(ctx)

	// Serialize allocations so concurrent requests cannot receive
	// the same IP address.
	_, err = tx.Exec(ctx, `SELECT pg_advisory_xact_lock(746271)`)
	if err != nil {
		return Peer{}, err
	}

	prefix, err := netip.ParsePrefix(clientCIDR)
	if err != nil {
		return Peer{}, fmt.Errorf("invalid client CIDR: %w", err)
	}
	prefix = prefix.Masked()

	serverAddr, err := netip.ParseAddr(serverIP)
	if err != nil {
		return Peer{}, fmt.Errorf("invalid server IP: %w", err)
	}

	rows, err := tx.Query(ctx, `SELECT vpn_ip::text FROM vpn_peers`)
	if err != nil {
		return Peer{}, err
	}

	used := make(map[string]bool)
	for rows.Next() {
		var ip string
		if err := rows.Scan(&ip); err != nil {
			rows.Close()
			return Peer{}, err
		}
		used[ip] = true
	}
	rows.Close()

	if err := rows.Err(); err != nil {
		return Peer{}, err
	}

	candidate := prefix.Addr()
	for i := 0; i < firstHost; i++ {
		candidate = candidate.Next()
	}

	var allocated netip.Addr

	for prefix.Contains(candidate) {
		if candidate != serverAddr && !used[candidate.String()] {
			allocated = candidate
			break
		}
		candidate = candidate.Next()
	}

	if !allocated.IsValid() {
		return Peer{}, ErrNoVPNIPs
	}

	peer := Peer{
		ID:         uuid.NewString(),
		UserID:     userID,
		DeviceName: deviceName,
		PublicKey:  publicKey,
		VPNIP:      allocated.String(),
		Status:     "active",
	}

	err = tx.QueryRow(ctx, `
        INSERT INTO vpn_peers (
            id, user_id, device_name, public_key, vpn_ip, status
        )
        VALUES ($1, $2, $3, $4, $5::inet, 'active')
        RETURNING created_at
    `,
		peer.ID,
		peer.UserID,
		peer.DeviceName,
		peer.PublicKey,
		peer.VPNIP,
	).Scan(&peer.CreatedAt)

	if err != nil {
		return Peer{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Peer{}, err
	}

	return peer, nil
}

func (r *Repository) DeleteCreated(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `
        DELETE FROM vpn_peers
        WHERE id = $1 AND status = 'active'
    `, id)
	return err
}

func (r *Repository) ListByUser(
	ctx context.Context,
	userID string,
) ([]Peer, error) {
	rows, err := r.db.Query(ctx, `
        SELECT id::text, user_id::text, device_name,
               public_key, vpn_ip::text, status,
               created_at, revoked_at
        FROM vpn_peers
        WHERE user_id = $1
        ORDER BY created_at DESC
    `, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	peers := make([]Peer, 0)

	for rows.Next() {
		var p Peer
		if err := rows.Scan(
			&p.ID,
			&p.UserID,
			&p.DeviceName,
			&p.PublicKey,
			&p.VPNIP,
			&p.Status,
			&p.CreatedAt,
			&p.RevokedAt,
		); err != nil {
			return nil, err
		}
		peers = append(peers, p)
	}

	return peers, rows.Err()
}

func (r *Repository) GetByIDForUser(
	ctx context.Context,
	id, userID string,
) (Peer, error) {
	var p Peer

	err := r.db.QueryRow(ctx, `
        SELECT id::text, user_id::text, device_name,
               public_key, vpn_ip::text, status,
               created_at, revoked_at
        FROM vpn_peers
        WHERE id = $1 AND user_id = $2
    `, id, userID).Scan(
		&p.ID,
		&p.UserID,
		&p.DeviceName,
		&p.PublicKey,
		&p.VPNIP,
		&p.Status,
		&p.CreatedAt,
		&p.RevokedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return Peer{}, ErrPeerNotFound
	}

	return p, err
}

func (r *Repository) Active(ctx context.Context) ([]Peer, error) {
	rows, err := r.db.Query(ctx, `
        SELECT id::text, user_id::text, device_name,
               public_key, vpn_ip::text, status,
               created_at, revoked_at
        FROM vpn_peers
        WHERE status = 'active'
        ORDER BY created_at
    `)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	peers := make([]Peer, 0)

	for rows.Next() {
		var p Peer
		if err := rows.Scan(
			&p.ID,
			&p.UserID,
			&p.DeviceName,
			&p.PublicKey,
			&p.VPNIP,
			&p.Status,
			&p.CreatedAt,
			&p.RevokedAt,
		); err != nil {
			return nil, err
		}
		peers = append(peers, p)
	}

	return peers, rows.Err()
}

func (r *Repository) MarkRevoked(
	ctx context.Context,
	id, userID string,
) error {
	tag, err := r.db.Exec(ctx, `
        UPDATE vpn_peers
        SET status = 'revoked', revoked_at = NOW()
        WHERE id = $1 AND user_id = $2 AND status = 'active'
    `, id, userID)

	if err != nil {
		return err
	}

	if tag.RowsAffected() == 0 {
		return ErrPeerNotFound
	}

	return nil
}
