package auth

import "context"

// UserIDFromContext returns the user ID set by JWTAuth middleware.
func UserIDFromContext(ctx context.Context) (string, bool) {
	id, ok := ctx.Value(userIDKey).(string)
	return id, ok
}
