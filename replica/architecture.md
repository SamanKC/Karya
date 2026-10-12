# System Architecture: Todoist Pro Alternative

High-level architecture for the MVP and growth path.

---

## Overview

The application is a web-based task manager with a REST API backend and a React single-page application frontend. All UI operations go through the API (API-first design). The MVP targets a single deployment serving individual users; collaboration (Phase 3) adds multi-user data sharing.

```
+------------------+       HTTPS        +-------------------+       TCP        +----------+
|                  | -----------------> |                   | ---------------> |          |
|  React SPA       |   Bearer JWT       |  Express API      |   Prisma ORM    |  MySQL   |
|  (Vite + TS)     | <----------------- |  (Node.js + TS)   | <--------------- |  8+      |
|                  |       JSON         |                   |                  |          |
+------------------+                    +-------------------+                  +----------+
                                               |
                                               | refresh token (HTTP-only cookie)
                                               |
                                        +------+------+
                                        | Auth Layer  |
                                        | - Argon2id  |
                                        | - JWT RS256 |
                                        | - Token DB  |
                                        +-------------+
```

---

## Technology Stack

See decisions.md ADR-001 for rationale.

| Layer | Technology | Version (minimum) |
|-------|-----------|-------------------|
| Language | TypeScript | 5.4+ |
| Runtime | Node.js | 20 LTS |
| Backend framework | Express | 4.x |
| ORM | Prisma | 5.x |
| Database | MySQL | 8.0+ |
| Frontend framework | React | 18.x |
| Build tool | Vite | 5.x |
| Styling | Tailwind CSS | 3.x |
| Server state | TanStack Query | 5.x |
| Validation | zod | 3.x |
| Testing (unit) | Vitest | 1.x |
| Testing (E2E) | Playwright | 1.x |
| Password hashing | argon2 (node) | 0.40+ |
| Rate limiting | express-rate-limit | 7.x |
| Sanitisation | sanitize-html (server), DOMPurify (client) | latest stable |
| Security headers | helmet | 7.x |

---

## Project Structure

```
/
+-- packages/
|   +-- shared/              # Shared TypeScript types, constants, validation schemas
|   |   +-- src/
|   |   |   +-- types/       # Entity types (Task, Project, Label, etc.)
|   |   |   +-- validation/  # zod schemas used by both client and server
|   |   |   +-- constants/   # Priority mappings, limits, defaults
|   |   +-- package.json
|   |
|   +-- server/              # Express API
|   |   +-- src/
|   |   |   +-- routes/      # Route handlers grouped by resource
|   |   |   +-- middleware/  # Auth, validation, rate limiting, error handling
|   |   |   +-- services/   # Business logic (TaskService, ProjectService, etc.)
|   |   |   +-- prisma/     # Prisma schema, migrations, seed
|   |   |   +-- utils/      # Helpers (date resolution, ordering, sanitisation)
|   |   +-- package.json
|   |
|   +-- client/              # React SPA
|       +-- src/
|       |   +-- components/  # Reusable UI components
|       |   +-- features/    # Feature modules (tasks, projects, auth, sidebar, etc.)
|       |   +-- hooks/       # Custom React hooks
|       |   +-- api/         # API client functions (TanStack Query wrappers)
|       |   +-- layouts/     # Page layouts (authenticated, public)
|       |   +-- utils/       # Client-side helpers
|       +-- package.json
|
+-- package.json              # Workspace root (npm workspaces)
+-- tsconfig.base.json        # Shared TypeScript config
```

Monorepo with npm workspaces. The `shared` package is imported by both `server` and `client` at build time.

---

## Authentication Flow

See decisions.md ADR-007 for the full decision.

### Signup
1. User submits email + password
2. Server validates input (zod), checks email uniqueness
3. Password hashed with Argon2id, user record created with `email_verified = false`
4. Verification email sent with a signed token (JWT, 24-hour expiry)
5. Default Inbox project created for the user
6. Response: 201 with message to check email

### Sign In
1. User submits email + password
2. Server verifies password against Argon2id hash
3. If `email_verified = false`, return 403 with "verify email" message
4. Generate JWT access token (15-minute expiry) and refresh token (7-day, stored hashed in DB)
5. Response: access token in JSON body, refresh token in HTTP-only Secure SameSite=Strict cookie

### Token Refresh
1. Client sends POST to `/api/v1/auth/refresh` (refresh token sent automatically via cookie)
2. Server looks up refresh token hash in DB
3. If valid and not expired: issue new access token + new refresh token, invalidate old refresh token
4. If the token was already invalidated (reuse detected): invalidate ALL refresh tokens for that user

### Logout
1. Client sends POST to `/api/v1/auth/logout`
2. Server deletes the refresh token record from DB
3. Access token remains valid until 15-minute expiry (no blacklist)

---

## Request Lifecycle

```
Client Request
    |
    v
[HTTPS / TLS]
    |
    v
[Helmet security headers]
    |
    v
[Rate limiter] -- 429 if exceeded
    |
    v
[JSON body parser]
    |
    v
[Auth middleware] -- extract JWT, verify, attach user to req
    |
    v
[Route handler]
    |
    v
[Zod validation] -- 400 if invalid
    |
    v
[Service layer] -- business logic, user-scoped queries
    |
    v
[Prisma / MySQL]
    |
    v
[Response serialisation] -- sanitise markdown fields
    |
    v
Client Response
```

All database queries in the service layer include the authenticated user's ID in their WHERE clause, ensuring data isolation (ADR-008).

---

## Data Flow: Task Completion

Designed with a hook point for future recurring task support (Phase 2).

```
POST /api/v1/tasks/:id/close
    |
    v
1. Validate task exists and belongs to user
    |
    v
2. Check is_completed (idempotent: already completed = 200 OK)
    |
    v
3. [FUTURE HOOK] Check is_recurring
    |     |
    |     +-- true (Phase 2): compute next due date, update task, return
    |
    v
4. Set is_completed = true, completed_at = now()
    |
    v
5. Return updated task
```

Reopening a task (`POST /api/v1/tasks/:id/reopen`) sets `is_completed = false` and `completed_at = null`.

---

## Timezone Resolution

The Today and Upcoming views resolve "today" and date ranges using the user's configured timezone.

- **User timezone:** Stored in `users.timezone` as an IANA string (e.g., "Australia/Sydney").
- **Date-only tasks** (`due_date` set, `due_datetime` null): The task is due on that calendar date in the user's timezone. "Due today" means `due_date == today in user's timezone`.
- **Date+time tasks** (`due_datetime` set): The task is due at that UTC timestamp. "Due today" means the timestamp falls within today's date boundaries in the user's timezone.
- **Server-side resolution:** The API accepts a `timezone` query parameter on the Today and Upcoming endpoints. The client sends the user's timezone (from their profile or browser). The server computes date boundaries and filters accordingly.

---

## Error Handling

Standard JSON error response format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": [
      { "field": "content", "message": "Required" }
    ]
  }
}
```

HTTP status codes:
- 400: validation error, malformed request
- 401: missing or invalid access token
- 403: email not verified, insufficient permissions
- 404: resource not found (or belongs to another user)
- 409: conflict (duplicate email, etc.)
- 429: rate limit exceeded
- 500: unexpected server error (logged, not exposed to client)

---

## Security Summary

See decisions.md ADR-007 and ADR-008 for full details.

| Concern | Approach |
|---------|----------|
| Password storage | Argon2id (64 MiB memory, 3 iterations) |
| Auth tokens | JWT access (15 min) + rotating refresh (7 days) |
| Token theft detection | Refresh token reuse invalidates all user sessions |
| XSS prevention | sanitize-html on write, DOMPurify on render |
| Data isolation | All queries scoped to authenticated user |
| Rate limiting | 100 req/min per user, 10 login attempts/15 min per IP |
| Transport | HTTPS only, HSTS |
| Headers | Helmet.js (CSP, X-Frame-Options, etc.) |
| Input validation | zod schemas on all endpoints |
| CSRF | Not applicable (Bearer token auth, SameSite=Strict cookie) |

---

## Deployment Architecture (MVP)

```
+------------------+
|  Reverse Proxy   |   nginx or cloud load balancer
|  (HTTPS term.)   |
+--------+---------+
         |
+--------+---------+
|  Node.js Server  |   Express API (single instance for MVP)
|  (Docker)        |
+--------+---------+
         |
+--------+---------+
|  MySQL 8+        |   Managed instance or Docker container
|  (Persistent)    |
+--------+---------+
```

- **Containerised:** Docker Compose for local development; single Docker image for deployment.
- **Database:** Managed MySQL (AWS RDS, PlanetScale, or similar) recommended for automated backups. Self-hosted MySQL with daily mysqldump as a fallback.
- **Static assets:** The React build output is served by the Node.js server (or a CDN in front of it).
- **Environment variables:** Database URL, JWT keys, email service credentials, rate limit config.

---

## Future Architecture Considerations

These are not MVP requirements but inform design decisions:

- **Phase 2 (recurring dates):** The completion service hook point and `due_string`/`is_recurring` schema migration are designed for this.
- **Phase 3 (collaboration):** Will require WebSocket or SSE for real-time updates, a `project_collaborators` table, and invitation/acceptance flows. The per-user data isolation middleware will need an "or collaborator" path.
- **Phase 4 (reminders):** Will require a job scheduler (node-cron, BullMQ, or similar) and a notification delivery service (email via SendGrid/SES, push via web push API).
- **Phase 5 (mobile):** The API-first design means the mobile app can use the same API. No backend changes needed.
