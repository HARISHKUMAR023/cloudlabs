package auth

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrEmailExists         = errors.New("email already registered")
	ErrUserNotFound        = errors.New("user not found")
	ErrInvalidRefreshToken = errors.New("invalid refresh token")
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// Create user in Db
func (r *Repository) Create(
	ctx context.Context,
	user User,
) (User, error) {
	query := `
		INSERT INTO users (id, email, password_hash)
		VALUES ($1, $2, $3)
		RETURNING created_at
	`

	err := r.db.QueryRow(
		ctx,
		query,
		user.ID,
		user.Email,
		user.PasswordHash,
	).Scan(&user.CreatedAt)

	if err != nil {
		var pgErr *pgconn.PgError

		if errors.As(err, &pgErr) &&
			pgErr.Code == "23505" &&
			pgErr.ConstraintName == "users_email_key" {
			return User{}, ErrEmailExists
		}

		return User{}, err
	}

	return user, nil
}

// get user by Emailid
func (r *Repository) GetByEmail(
	ctx context.Context,
	email string,
) (User, error) {
	var user User

	query := `
		SELECT id, email, password_hash, created_at
		FROM users
		WHERE email = $1
	`

	err := r.db.QueryRow(ctx, query, email).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.CreatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, ErrUserNotFound
	}
	if err != nil {
		return User{}, err
	}

	return user, nil
}

// get user by userid
func (r *Repository) GetByID(
	ctx context.Context,
	id string,
) (User, error) {
	var user User

	query := `
		SELECT id, email, created_at
		FROM users
		WHERE id = $1
	`

	err := r.db.QueryRow(ctx, query, id).Scan(
		&user.ID,
		&user.Email,
		&user.CreatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, ErrUserNotFound
	}
	if err != nil {
		return User{}, err
	}

	return user, nil
}

func (r *Repository) CreateRefreshSession(
	ctx context.Context,
	userID, tokenHash string,
	expiresAt time.Time,
) error {
	_, err := r.db.Exec(ctx, `
        INSERT INTO refresh_sessions
            (id, user_id, token_hash, expires_at)
        VALUES ($1, $2, $3, $4)
    `, uuid.NewString(), userID, tokenHash, expiresAt)

	return err
}

func (r *Repository) RotateRefreshSession(
	ctx context.Context,
	oldHash, newHash string,
	newExpiresAt time.Time,
) (string, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var userID string
	var expiresAt time.Time
	var revoked bool

	err = tx.QueryRow(ctx, `
        SELECT user_id::text, expires_at, revoked_at IS NOT NULL
        FROM refresh_sessions
        WHERE token_hash = $1
        FOR UPDATE
    `, oldHash).Scan(&userID, &expiresAt, &revoked)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", ErrInvalidRefreshToken
		}
		return "", err
	}

	if revoked || !expiresAt.After(time.Now()) {
		return "", ErrInvalidRefreshToken
	}

	_, err = tx.Exec(ctx, `
        UPDATE refresh_sessions
        SET revoked_at = NOW()
        WHERE token_hash = $1
    `, oldHash)
	if err != nil {
		return "", err
	}

	_, err = tx.Exec(ctx, `
        INSERT INTO refresh_sessions
            (id, user_id, token_hash, expires_at)
        VALUES ($1, $2, $3, $4)
    `, uuid.NewString(), userID, newHash, newExpiresAt)
	if err != nil {
		return "", err
	}

	if err := tx.Commit(ctx); err != nil {
		return "", err
	}

	return userID, nil
}

func (r *Repository) RevokeRefreshSession(
	ctx context.Context,
	tokenHash string,
) error {
	_, err := r.db.Exec(ctx, `
        UPDATE refresh_sessions
        SET revoked_at = NOW()
        WHERE token_hash = $1
          AND revoked_at IS NULL
    `, tokenHash)

	return err
}
