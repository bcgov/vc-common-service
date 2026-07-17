# Developer Guide - VC Common Service

This guide covers local development setup, running the application, and managing database migrations.

## Prerequisites

- **Node.js**: v22.12.0 or higher
- **npm**: Latest stable version
- **Docker** and **Docker Compose**: For database and containerized development
- **PostgreSQL**: v18.4 (or use Docker)

## Environment Setup

### 1. Clone and Install Dependencies

```bash
# Install project dependencies
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update values as needed:

```bash
cp .env.example .env
```

**Key environment variables:**

```env
PORT=3000                          # Application port
NODE_ENV=development               # Environment (development/production)

# Database Configuration
DB_HOST=localhost                  # Database host (localhost or db for Docker)
DB_PORT=5432                       # PostgreSQL default port
DB_USERNAME=postgres               # Database user
DB_PASSWORD=postgres               # Database password
DB_NAME=vc_common_service          # Database name
DB_LOGGING=false                   # Enable/disable SQL query logging

# Database SSL (optional)
DB_SSL=false                       # Enable SSL connection
# DB_SSL_REJECT_UNAUTHORIZED=true
# DB_SSL_CA=/etc/postgres/certs/ca.crt
```

## Running the Application

### Option 1: Docker Compose (Recommended for Development)

Start all services (app, database, and migrations) with one command:

```bash
docker compose up
```

This will:
- Start PostgreSQL database
- Run database migrations automatically
- Start the application server on http://localhost:3000

**Useful commands:**
```bash
# Stop all services
docker compose down

# View logs
docker compose logs -f app

# Rebuild containers
docker compose up --build
```

### Option 2: Local Development (npm)

For faster development iterations, run locally with a separate database:

#### Start Database

```bash
# Using Docker for just the database
docker compose up db

# Or configure DB_HOST to an external PostgreSQL instance
```

#### Start Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run start:prod
```

The application will be available at http://localhost:3000

## Database Migrations

### Create a New Migration

```bash
npm run migration:create
```

This creates a new migration file in `libs/database/src/migrations/` following the naming convention: `XXXXXX_description.ts`

### Run Migrations (Up)

```bash
# After building the project
npm run build
npm run migrate:up
```

**In Docker**: Migrations run automatically when containers start. To re-run:
```bash
docker compose up migrate
```

### Rollback Last Migration (Down)

```bash
npm run build
npm run migrate:down
```

## Testing

### Run Unit Tests

```bash
# All tests
npm run test

# Watch mode
npm run test:watch

# With coverage
npm run test:cov
```

### Run E2E Tests

```bash
npm run test:e2e
```

Requires database to be running. Typically used in CI/CD pipelines.

## Code Quality

### Linting and Formatting

```bash
# Fix linting issues and format code
npm run lint

# Check linting without fixing (CI mode)
npm run lint:ci

# Format code with Prettier
npm run format
```

## Building

### Build for Production

```bash
npm run build
```

Output is generated in the `dist/` directory.

### Start Production Server

```bash
npm run start:prod
```

## Project Structure

```
├── apps/
│   └── vc-common-service/          # Main application
│       ├── src/
│       │   ├── main.ts             # Application entry point
│       │   ├── app.module.ts       # Root module
│       │   ├── app.controller.ts   # Root controller
│       │   ├── health/             # Health check endpoints
│       │   ├── shutdown/           # Graceful shutdown
│       │   ├── jobs/               # Job processing
│       │   ├── tenants/            # Tenant management
│       │   └── tenant-users/       # Tenant user management
│       └── test/                   # E2E tests
├── libs/
│   ├── common/                     # Common utilities
│   ├── database/                   # Database configuration & migrations
│   ├── auth/                       # Authentication/Authorization
│   └── pg-boss/                    # Job queue service
├── docker-compose.yml              # Docker setup
├── package.json                    # Dependencies & scripts
└── .env.example                    # Example environment variables
```

## Useful Development Endpoints

- Health Check: `GET http://localhost:3000/health/live`
- API Documentation: Check `docs/openapi.yaml`

## Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running and accessible at configured host/port
2. Verify credentials in `.env` file match database setup
3. Check database exists: `DB_NAME=vc_common_service`

### Port Already in Use

```bash
# Change port in .env
PORT=3001

# Or kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

### Docker Issues

```bash
# Clean up containers and volumes
docker compose down -v

# Rebuild everything
docker compose up --build
```

### Migration Failures

```bash
# Check current migration status
docker compose logs migrate

# Rollback to previous migration
npm run migrate:down

# Rebuild and try again
npm run build && npm run migrate:up
```

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Docker Documentation](https://docs.docker.com/)
- Project Architecture: See `docs/ARCHITECTURE.md`
