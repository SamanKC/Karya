# Karya - Deployment Guide

## Architecture

Karya is a monorepo with three packages:

- `packages/shared` - Shared types, schemas, constants
- `packages/server` - Express API server (Node.js 22, Prisma, MySQL)
- `packages/client` - React SPA (Vite, TanStack Query, Tailwind CSS)

In production, the Express server serves both the API and the built client as static files.

## Prerequisites

- Docker and Docker Compose
- OpenSSL (for generating JWT keys)

## Quick Start

### 1. Generate JWT keys

```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

### 2. Configure environment

```bash
cp .env.production.example .env
```

Edit `.env` and fill in:
- `MYSQL_ROOT_PASSWORD` and `MYSQL_PASSWORD` - strong random passwords
- `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` - paste the contents of private.pem and public.pem, replacing newlines with `\n`
- `CLIENT_URL` - your public domain (e.g. `https://karya.example.com`)

### 3. Deploy

```bash
docker compose -f docker-compose.prod.yml up -d
```

The entrypoint script will wait for MySQL, run Prisma migrations, then start the server.

### 4. Verify

```bash
curl http://localhost:3001/api/v1/health
```

You should see `{"status":"ok","db":"connected",...}`.

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `MYSQL_ROOT_PASSWORD` | Yes | - | MySQL root password |
| `MYSQL_USER` | No | `karya` | MySQL application user |
| `MYSQL_PASSWORD` | Yes | - | MySQL application password |
| `JWT_PRIVATE_KEY` | Yes | - | RS256 private key (PEM, newlines as `\n`) |
| `JWT_PUBLIC_KEY` | Yes | - | RS256 public key (PEM, newlines as `\n`) |
| `PORT` | No | `3001` | Server port |
| `CLIENT_URL` | Yes | - | Public URL for CORS and email links |
| `LOG_LEVEL` | No | `info` | Minimum log level: debug, info, warn, error |
| `DATABASE_URL` | No | auto | Prisma connection string (auto-set by docker-compose) |

## Health Check

`GET /api/v1/health` returns:
- `200` with `{"status":"ok","db":"connected"}` when healthy
- `503` with `{"status":"degraded","db":"disconnected"}` when the database is unreachable

The Docker container has a built-in healthcheck that polls this endpoint.

## Security Features

- RS256 JWT with short-lived access tokens (15 min) and rotating refresh tokens (7 days)
- Argon2id password hashing (64 MiB, 3 iterations)
- Rate limiting on all endpoints (100/min general, 10/15min login, 5/15min signup)
- Helmet security headers (CSP, HSTS, X-Frame-Options, etc.)
- HTTP-only Secure SameSite=Strict cookies for refresh tokens
- Request body size limits (1 MB)
- Per-user data isolation on all queries
- Input validation with zod on every endpoint
- HTML sanitization with sanitize-html

## Logging

In production, logs are JSON-formatted for machine parsing:

```json
{"level":"info","message":"Karya API server running on http://localhost:3001","timestamp":"2024-01-01T00:00:00.000Z"}
```

In development, logs are human-readable:

```
00:00:00.000 [INFO ] Karya API server running on http://localhost:3001
```

## Email Verification (MVP)

Email verification is currently stubbed. Verification links are logged to stdout. In production, filter logs for `"email verification token generated"` to find verification URLs for new signups.

To integrate a real email service, update `packages/server/src/services/auth.service.ts` and replace the `logger.info` calls in `signup()` and `resendVerification()` with your email provider.

## Graceful Shutdown

The server handles SIGTERM and SIGINT signals for clean container stops:
1. Stops accepting new connections
2. Drains in-flight requests (up to 10s timeout)
3. Disconnects from the database
4. Exits cleanly

## Maintenance

Expired refresh tokens are automatically cleaned up every 6 hours. No manual maintenance is needed for the token table.

## API Endpoints

All endpoints are prefixed with `/api/v1`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Health check |
| POST | `/auth/signup` | No | Create account |
| POST | `/auth/login` | No | Sign in |
| POST | `/auth/refresh` | Cookie | Refresh access token |
| POST | `/auth/logout` | Cookie | Sign out |
| POST | `/auth/verify-email` | No | Verify email token |
| POST | `/auth/resend-verification` | No | Resend verification |
| POST | `/auth/change-password` | Yes | Change password |
| GET | `/projects` | Yes | List projects |
| POST | `/projects` | Yes | Create project |
| GET | `/projects/:id` | Yes | Get project |
| PATCH | `/projects/:id` | Yes | Update project |
| DELETE | `/projects/:id` | Yes | Delete project |
| GET | `/projects/:id/sections` | Yes | List sections |
| POST | `/projects/:id/sections` | Yes | Create section |
| PATCH | `/sections/:id` | Yes | Update section |
| DELETE | `/sections/:id` | Yes | Delete section |
| GET | `/tasks` | Yes | List tasks (with filters) |
| POST | `/tasks` | Yes | Create task |
| GET | `/tasks/:id` | Yes | Get task |
| PATCH | `/tasks/:id` | Yes | Update task |
| DELETE | `/tasks/:id` | Yes | Delete task |
| POST | `/tasks/:id/close` | Yes | Complete task |
| POST | `/tasks/:id/reopen` | Yes | Reopen task |
| GET | `/labels` | Yes | List labels |
| POST | `/labels` | Yes | Create label |
| PATCH | `/labels/:id` | Yes | Update label |
| DELETE | `/labels/:id` | Yes | Delete label |
| GET | `/search` | Yes | Search tasks and projects |
| GET | `/users/me` | Yes | Get profile |
| PATCH | `/users/me` | Yes | Update profile |
| GET | `/users/me/export` | Yes | Export all data |

## Development

```bash
# Install dependencies
npm install

# Start dev servers (requires MySQL running locally)
npm run dev --workspace=packages/server
npm run dev --workspace=packages/client
```

The client dev server runs at `http://localhost:5173` and proxies API calls to `http://localhost:3001`.
