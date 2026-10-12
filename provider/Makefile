.PHONY: swagger run

swagger:
	swag init -g main.go -d cmd/api,internal/auth -o docs --parseInternal

run: swagger
	go run ./cmd/api