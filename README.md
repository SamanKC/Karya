# Karya

**Plan less. Accomplish more.**

Karya is an independently built task management application inspired by modern productivity tools. It features a clean, responsive UI with projects, labels, priorities, subtasks, and keyboard-driven workflows.

## Features

- **Task management** -- create, edit, complete, and delete tasks with priorities (P1--P4), due dates, and descriptions
- **Projects and sections** -- organize tasks into projects with collapsible sections
- **Labels** -- color-coded labels with multi-select tagging
- **Subtasks** -- nested tasks up to 4 levels deep
- **Inbox, Today, and Upcoming views** -- see what matters now
- **Quick Add** -- press `Q` anywhere to open a modal for fast task entry
- **Search** -- full-text search across tasks and projects
- **Favorites** -- pin frequently used projects and labels to the sidebar
- **Keyboard shortcuts** -- `Q` for Quick Add, `Esc` to close panels
- **Responsive layout** -- works on desktop and mobile with a collapsible sidebar
- **Client-side undo** -- 5-second undo toast after deleting a task
- **Data export** -- download all your data as JSON from settings
- **Secure auth** -- Argon2id password hashing, RS256 JWT tokens, HTTP-only refresh cookies

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, Tailwind CSS 3, TanStack Query 5 |
| Backend | Node.js 22, Express 4, Prisma 5, MySQL 8 |
| Shared | TypeScript 5.6, zod 3 |
| Auth | Argon2id, RS256 JWT (access + rotating refresh tokens) |
| Testing | Vitest, React Testing Library |

## Project Structure

```
karya/
├── packages/
│   ├── shared/          # Types, schemas, constants, error codes
│   ├── server/          # Express REST API + Prisma ORM
│   └── client/          # React SPA
├── docker-compose.prod.yml
├── Dockerfile
├── DEPLOY.md
└── replica/             # Design docs and ADRs
```

## Getting Started

### Prerequisites

- Node.js 22+
- MySQL 8+
- OpenSSL (for generating JWT keys)

### 1. Clone and install

```bash
git clone <your-repo-url> karya
cd karya
npm install
```

### 2. Set up the database

Create a MySQL database and user:

```sql
CREATE DATABASE karya CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'karya'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON karya.* TO 'karya'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Generate JWT keys

```bash
mkdir -p keys
openssl genrsa -out keys/dev-private.pem 2048
openssl rsa -in keys/dev-private.pem -pubout -out keys/dev-public.pem
```

### 4. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your database credentials and paste the JWT key contents (replace newlines with `\n`):

```env
DATABASE_URL="mysql://karya:your_password@localhost:3306/karya"
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
PORT=3001
NODE_ENV="development"
CLIENT_URL="http://localhost:5173"
```

### 5. Run database migrations

```bash
cd packages/server
npx prisma migrate dev
npx prisma db seed    # optional: seeds sample data
cd ../..
```

### 6. Start development servers

In two terminal windows:

```bash
# Terminal 1: API server (localhost:3001)
npm run dev:server

# Terminal 2: React client (localhost:5173)
npm run dev:client
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Production Deployment (Docker)

The Docker setup bundles the client build into the Express server, so everything runs on a single port.

```bash
# 1. Generate JWT keys
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# 2. Configure
cp .env.production.example .env
# Edit .env: set passwords, JWT keys, and CLIENT_URL

# 3. Deploy
docker compose -f docker-compose.prod.yml up -d

# 4. Verify
curl http://localhost:3001/api/v1/health
```

See [DEPLOY.md](./DEPLOY.md) for the full deployment guide, environment variable reference, and security details.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all workspaces in dev mode |
| `npm run dev:server` | Start API server only |
| `npm run dev:client` | Start React dev server only |
| `npm run build` | Build all packages for production |
| `npm run test` | Run all tests |
| `npm run lint` | Type-check all packages |

Server-specific (run from `packages/server`):

| Command | Description |
|---------|-------------|
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio (database GUI) |

## API

All endpoints are under `/api/v1`. Authentication uses Bearer tokens in the `Authorization` header.

| Area | Endpoints |
|------|-----------|
| Auth | signup, login, logout, refresh, verify-email, change-password |
| Tasks | CRUD, complete/reopen, filtered queries (project, label, priority, due date) |
| Projects | CRUD with sections |
| Labels | CRUD with color support |
| Search | Full-text across tasks and projects |
| User | Profile, settings, data export |
| Health | `GET /api/v1/health` |

Full endpoint table in [DEPLOY.md](./DEPLOY.md#api-endpoints).

## Security

- Argon2id hashing (64 MiB memory, 3 iterations)
- RS256 JWT access tokens (15 min) stored in memory, never localStorage
- Rotating refresh tokens (7 day) in HTTP-only Secure SameSite=Strict cookies
- Rate limiting (100/min general, 10/15min login, 5/15min signup)
- Helmet headers (CSP, HSTS, X-Frame-Options)
- zod validation on every endpoint
- HTML sanitization with sanitize-html and DOMPurify
- Per-user data isolation on all queries
- 1 MB request body limit

## Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch -w packages/server
npm run test:watch -w packages/client
```

60 tests across 8 test files covering schemas, error handling, logging, and UI components.

## Architecture Decisions

Design decisions are documented in [`replica/decisions.md`](./replica/decisions.md) with 12 ADRs covering:

- ADR-001: Tech stack selection
- ADR-002: Priority value mapping
- ADR-003: Task ordering algorithm
- ADR-004: Subtask depth limit
- ADR-005: Delete strategy (hard delete + client undo)
- ADR-007: Authentication flow
- ADR-008: Security baseline

## License

This is a personal project. All rights reserved.
