# Cloud Lab

A self-hosted cloud development platform that provides browser-accessible Ubuntu development environments with VS Code, powered by Docker.

![Cloud Lab](docs/screenshot.png)

## Overview

Cloud Lab enables colleges, training institutes, and edtech platforms to provide ready-to-use development environments for learners. Users can develop, run, and manage projects in isolated Linux environments without configuring their local machines.

## Features

- **Development Environments:** Ubuntu-based development environments with browser-accessible VS Code.
- **Authentication:** User registration, login, and JWT-based authentication.
- **Containerization:** Docker-powered development environments.
- **Persistent Storage:** Support for retaining user projects and files.
- **Database Services:** Planned support for managed database instances.

## Tech Stack

| Component | Technology |
|---|---|
| Backend | Go |
| Frontend | Next.js |
| API Gateway | Apache APISIX |
| Containerization | Docker |
| Database | PostgreSQL |
| Cache and Queue | Redis |
| Development Environment | Ubuntu, code-server |

## Architecture

```text
                    Client
                      |
                      v
                Next.js Frontend
                      |
                      v
                Apache APISIX
                      |
                      v
                  Go Backend
                      |
          +-----------+-----------+
          |           |           |
          v           v           v
      PostgreSQL    Redis      Docker
                                  |
                                  v
                         Ubuntu + VS Code
```

## Getting Started

### Prerequisites

- Git
- Docker Engine
- Docker Compose
- Go
- Node.js and npm (for frontend development)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/cloud-lab.git
cd cloud-lab
```

### 2. Configure Environment Variables

Create the environment file required by the backend:

```bash
cd provider
cp .env.example .env
```

Update `.env` with your local configuration:

```env
DATABASE_URL=postgres://admin:your-password@localhost:5432/cloudlabs
JWT_SECRET=your-generated-secret
```

Generate a secure JWT secret:

```bash
openssl rand -base64 32
```

Never commit `.env` files or production credentials to version control.

### 3. Start Infrastructure

From the directory containing `docker-compose.yml`, run:

```bash
docker compose up -d
```

Check service status:

```bash
docker compose ps
```

### 4. Set Up the Database

Apply the project's database migrations before starting the backend.

For a SQL schema file:

```bash
docker exec -i cloudlabs-postgres \
  psql -U admin -d cloudlabs < path/to/schema.sql
```

Replace the container name and SQL file path with the values used in your environment. If the project uses versioned migrations, follow the configured migration workflow instead.

### 5. Start the Backend

From the `provider` directory:

```bash
go mod download
go run ./cmd/api
```

### 6. Verify the API

```bash
curl -i http://localhost:8000/health
```

A successful response returns HTTP `200 OK`.

## API Documentation

API documentation will be published using Swagger / OpenAPI.

**Swagger UI:** [API Documentation](https://your-swagger-url.example.com)

The documentation will cover authentication, request and response schemas, status codes, and available endpoints.

## Development

Format Go code:

```bash
gofmt -w cmd/api internal
```

Run Go tests:

```bash
go test ./...
```

Check the working tree:

```bash
git status
```

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement your changes and add tests.
4. Run formatting and tests.
5. Submit a pull request with a clear description of your changes.

Please keep changes focused, follow existing code conventions, and never commit secrets or credentials.

## License

This project is intended to be released under the [MIT License](LICENSE).

See the `LICENSE` file for the complete license terms.
