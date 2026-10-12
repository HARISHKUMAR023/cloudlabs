
.PHONY: swagger run

swagger:
	swag init -g cmd/api/main.go -o docs

run: swagger
	go run ./cmd/api
