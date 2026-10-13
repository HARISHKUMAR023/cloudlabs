package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"net/mail"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

const tokenTTL = 15 * time.Minute

var (
	ErrInvalidInput       = errors.New("invalid input")
	ErrInvalidCredentials = errors.New("invalid email or password")
)

type Claims struct {
	Email string `json:"email"`
	jwt.RegisteredClaims
}

type Service struct {
	repo      *Repository
	jwtSecret []byte
}

func NewService(repo *Repository, jwtSecret string) *Service {
	return &Service{
		repo:      repo,
		jwtSecret: []byte(jwtSecret),
	}
}

func validEmail(email string) bool {
	if len(email) > 254 {
		return false
	}

	addr, err := mail.ParseAddress(email)
	return err == nil && addr.Address == email
}

func (s *Service) Register(
	ctx context.Context,
	req RegisterRequest,
) (UserResponse, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))

	if !validEmail(email) {
		return UserResponse{}, ErrInvalidInput
	}

	if len(req.Password) < 8 || len(req.Password) > 72 {
		return UserResponse{}, ErrInvalidInput
	}

	hash, err := bcrypt.GenerateFromPassword(
		[]byte(req.Password),
		bcrypt.DefaultCost,
	)
	if err != nil {
		return UserResponse{}, err
	}

	user := User{
		ID:           uuid.NewString(),
		Email:        email,
		PasswordHash: string(hash),
	}

	saved, err := s.repo.Create(ctx, user)
	if err != nil {
		return UserResponse{}, err
	}

	return UserResponse{
		ID:        saved.ID,
		Email:     saved.Email,
		CreatedAt: saved.CreatedAt,
	}, nil
}

func (s *Service) Login(
	ctx context.Context,
	req LoginRequest,
) (TokenResponse, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))

	if email == "" || len(req.Password) == 0 || len(req.Password) > 72 {
		return TokenResponse{}, ErrInvalidCredentials
	}

	user, err := s.repo.GetByEmail(ctx, email)
	if errors.Is(err, ErrUserNotFound) {
		return TokenResponse{}, ErrInvalidCredentials
	}
	if err != nil {
		return TokenResponse{}, err
	}

	if err := bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash), []byte(req.Password),
	); err != nil {
		return TokenResponse{}, ErrInvalidCredentials
	}

	accessToken, err := s.createAccessToken(user)
	if err != nil {
		return TokenResponse{}, err
	}

	refreshToken, err := generateRefreshToken()
	if err != nil {
		return TokenResponse{}, err
	}

	err = s.repo.CreateRefreshSession(
		ctx,
		user.ID,
		hashRefreshToken(refreshToken),
		time.Now().Add(refreshTokenTTL),
	)
	if err != nil {
		return TokenResponse{}, err
	}

	return TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int64(tokenTTL.Seconds()),
	}, nil
}

func (s *Service) ValidateToken(rawToken string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(
		rawToken,
		claims,
		func(token *jwt.Token) (any, error) {
			if token.Method != jwt.SigningMethodHS256 {
				return nil, errors.New("unexpected signing method")
			}
			return s.jwtSecret, nil
		},
		jwt.WithIssuer("codekadai-auth"),
		jwt.WithAudience("codekadai-api"),
		jwt.WithExpirationRequired(),
		jwt.WithValidMethods([]string{"HS256"}),
	)

	if err != nil || token == nil || !token.Valid ||
		claims.Subject == "" || claims.Email == "" {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

func (s *Service) GetUser(
	ctx context.Context,
	id string,
) (UserResponse, error) {
	user, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return UserResponse{}, err
	}

	return UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		CreatedAt: user.CreatedAt,
	}, nil
}

const refreshTokenTTL = 30 * 24 * time.Hour

func generateRefreshToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(b), nil
}

func hashRefreshToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func (s *Service) createAccessToken(user User) (string, error) {
	now := time.Now()

	claims := Claims{
		Email: user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.ID,
			Issuer:    "codekadai-auth",
			Audience:  jwt.ClaimStrings{"codekadai-api"},
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(tokenTTL)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}



func (s *Service) Refresh(
    ctx context.Context,
    rawRefreshToken string,
) (TokenResponse, error) {
    if rawRefreshToken == "" || len(rawRefreshToken) > 256 {
        return TokenResponse{}, ErrInvalidRefreshToken
    }

    newRefreshToken, err := generateRefreshToken()
    if err != nil {
        return TokenResponse{}, err
    }

    userID, err := s.repo.RotateRefreshSession(
        ctx,
        hashRefreshToken(rawRefreshToken),
        hashRefreshToken(newRefreshToken),
        time.Now().Add(refreshTokenTTL),
    )
    if err != nil {
        return TokenResponse{}, err
    }

    user, err := s.repo.GetByID(ctx, userID)
    if err != nil {
        return TokenResponse{}, err
    }

    accessToken, err := s.createAccessToken(user)
    if err != nil {
        return TokenResponse{}, err
    }

    return TokenResponse{
        AccessToken:  accessToken,
        RefreshToken: newRefreshToken,
        TokenType:    "Bearer",
        ExpiresIn:    int64(tokenTTL.Seconds()),
    }, nil
}

func (s *Service) Logout(
    ctx context.Context,
    rawRefreshToken string,
) error {
    if rawRefreshToken == "" || len(rawRefreshToken) > 256 {
        return ErrInvalidRefreshToken
    }

    return s.repo.RevokeRefreshSession(
        ctx,
        hashRefreshToken(rawRefreshToken),
    )
}

