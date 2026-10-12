# Architecture Decision Records

All significant architectural decisions for the Todoist Pro alternative project.

---

## ADR-001: Technology Stack

**Decision:** TypeScript full-stack with Node.js + Express, React + Vite, Tailwind CSS, Prisma, MySQL 8+, Vitest, Playwright.

**Rationale:**
- TypeScript provides full-stack type safety. Shared type definitions between client and server reduce contract drift.
- Express is the most mature Node.js framework with the largest middleware ecosystem. It handles the REST API patterns this project needs without the overhead of a full-stack framework like Next.js (which adds SSR complexity we don't need for an SPA task manager).
- MySQL 8+ over PostgreSQL: the user specified MySQL as the preferred database. MySQL 8 supports CTEs (needed for subtask queries), full-text search (needed for MVP search), and JSON columns. Prisma has first-class MySQL support.
- Prisma over raw SQL or Knex: schema-first workflow generates TypeScript types automatically, migration management is built in, and the query API is type-safe. Trade-off: less control over complex queries, but Prisma supports raw SQL as an escape hatch.
- React + Vite over Next.js: this is a single-page application with JWT auth. No server-side rendering is needed. Vite provides fast HMR and optimized builds without the complexity of Next.js routing, middleware, and deployment model.
- Tailwind CSS: utility-first approach with responsive breakpoints built in. Avoids CSS-in-JS runtime costs and produces small, consistent styling.
- TanStack Query for server state: handles caching, background refetching, optimistic updates, and loading/error states. Reduces boilerplate compared to manual fetch + useState.
- Vitest + Playwright: Vitest is Vite-native and fast for unit/integration tests. Playwright covers cross-browser E2E testing.

**Alternatives considered:**
- Python + FastAPI: strong typing with Pydantic, but introduces a second language. TypeScript full-stack is simpler for a solo/small-team project.
- PostgreSQL: excellent database, but MySQL was the stated preference. Both support the required features.
- Next.js: SSR is unnecessary for an authenticated SPA. Adds deployment complexity (Node.js server or Vercel).
- Drizzle ORM: lighter weight than Prisma but less mature migration tooling.

**Consequences:**
- All developers need TypeScript proficiency.
- Prisma migrations must be reviewed carefully (it generates SQL).
- Express does not have built-in validation; zod fills this gap.

**Status:** Accepted

---

## ADR-002: Priority Direction

**Decision:** Higher numbers = higher priority in both API and database storage. Priority 4 = urgent (displayed as "p1" in UI, red). Priority 1 = normal (displayed as "p4" in UI, no color).

**Rationale:**
- Matches Todoist's API convention, making the data model familiar to developers who know the ecosystem.
- Sorting by priority descending (ORDER BY priority DESC) naturally puts urgent tasks first.
- The UI layer maps values to display labels: `{4: "p1", 3: "p2", 2: "p3", 1: "p4"}`.

**Alternatives considered:**
- Invert so p1=1, p4=4 (matching UI labels): breaks the sort convention and creates confusion when developers compare to Todoist's documented API.
- Use string enum ("urgent", "high", "medium", "low"): less efficient for sorting and indexing.

**Consequences:**
- The mapping between API values and UI labels must be documented in the API contracts and consistently applied in the frontend.
- Filter queries using `p1`, `p2`, `p3`, `p4` must translate to the correct integer values.

**Status:** Accepted

---

## ADR-003: Task Ordering Algorithm

**Decision:** Integer-based ordering with gaps. New tasks are assigned order values in multiples of 1000. Inserting between two tasks uses the midpoint. When gaps are exhausted (adjacent integers), rebalance all tasks in that scope (section or unsectioned tasks within a project) back to multiples of 1000.

**Rationale:**
- Simple to implement and debug. The order column is a plain integer.
- Midpoint insertion is a single arithmetic operation, no string manipulation.
- Rebalancing is rare (requires ~10 consecutive insertions between the same two tasks) and is a single UPDATE statement.
- Sufficient for the expected scale (under 500 tasks per project).

**Alternatives considered:**
- Fractional indexing (LexoRank): more insertion capacity without rebalancing, but string-based ordering is harder to debug, sort, and index. Overkill for expected scale.
- Linked list (prev_id/next_id): requires traversal for ordered queries, complex reordering logic.

**Consequences:**
- Rebalancing is a write-amplification event (updates all tasks in scope). Acceptable at expected scale.
- Collaborative reordering (Phase 3) may need optimistic locking on the order field.

**Status:** Accepted

---

## ADR-004: Subtask Depth Limit

**Decision:** Maximum 4 levels of nesting, including the parent task. A root task is level 1; its subtask is level 2; a sub-subtask is level 3; one more level at 4. The API rejects create/move operations that would exceed this depth.

**Rationale:**
- Deep nesting creates UI problems: each level requires ~20px of indentation, and 4 levels already consumes 60-80px. Beyond that, task content is unreadably compressed on mobile.
- MySQL CTEs for recursive subtask queries are bounded by the depth limit, keeping performance predictable.
- 4 levels covers typical use cases: Project > Task > Subtask > Checklist item.

**Alternatives considered:**
- No limit: unbounded recursion risk, UI rendering problems, performance concerns.
- 2 levels (task + subtask only): too restrictive for users who break work into task > subtask > checklist steps.
- 5 levels: marginal benefit over 4, more UI compression.

**Consequences:**
- The depth check requires a parent chain traversal on task create/move. With max depth 4, this is at most 3 lookups.
- Users attempting deeper nesting receive a clear error message suggesting they use a sub-project instead.

**Status:** Accepted

---

## ADR-005: Delete Strategy

**Decision:** Hard delete for MVP. Entities (tasks, projects, sections, labels) are permanently removed from the database on delete. Client-side undo via a toast notification that can re-create the entity within a brief window (~5 seconds).

**Rationale:**
- Simplifies the data model: no `is_deleted` flags, no need to filter deleted records from every query, no unique constraint complications.
- Client-side undo captures the entity state before the DELETE request and can POST it back to re-create. The brief window matches Todoist's observed pattern.
- Completed tasks are not deleted; they remain with `is_completed = true`.

**Alternatives considered:**
- Soft delete (`deleted_at` timestamp): adds complexity to every query (WHERE deleted_at IS NULL), complicates unique constraints, grows storage. Useful for audit trails, but not needed in MVP.
- Trash/recycle bin: a separate UI and API surface. Deferred as a possible Phase 5 feature.

**Consequences:**
- Deleted data is unrecoverable beyond the client-side undo window. Database backups are the safety net.
- Cascade deletes must be handled: deleting a project deletes its sections and tasks; deleting a section moves its tasks to unsectioned.

**Status:** Accepted

---

## ADR-006: Recurring Date Storage

**Decision:** Store both the natural language string (`due_string`) and computed fields (`due_date`, `due_datetime`, `is_recurring`). The string preserves the user's original input for editing and display. The computed fields drive scheduling and queries.

**Rationale:**
- Matches Todoist's observed pattern: `due.string` + `due.date` + `due.is_recurring`.
- The natural language string is needed to re-display what the user typed ("every Monday at 9am") and to recompute the next occurrence after completion.
- Structured RRULE would be more machine-friendly but harder for users to edit and doesn't cover all natural language patterns.

**Alternatives considered:**
- RRULE only: standard format, but loses the original user input and doesn't cover "every! 3 days" (completion-based) or "every 2nd workday."
- Natural language string only: requires re-parsing on every completion. Fragile if parser behavior changes.

**Consequences:**
- These fields (`due_string`, `is_recurring`) are added to the tasks table in the Phase 2 migration, not Phase 1.
- The Phase 2 completion handler re-parses `due_string` to compute the next occurrence.

**Status:** Accepted (implementation deferred to Phase 2)

---

## ADR-007: Authentication and Token Lifecycle

**Decision:**
- Password hashing: Argon2id with recommended parameters (memory: 64 MiB, iterations: 3, parallelism: 1).
- Access tokens: JWT, 15-minute expiry, signed with RS256. Contains user ID and email. Sent as Bearer token in Authorization header.
- Refresh tokens: opaque random string, 7-day expiry, stored in the database (hashed). Returned in HTTP-only, Secure, SameSite=Strict cookie.
- Token rotation: each refresh request issues a new refresh token and invalidates the old one. If a revoked refresh token is used, all refresh tokens for that user are invalidated (compromise detection).
- Logout: deletes the refresh token from the database. The access token remains valid until its 15-minute expiry (acceptable trade-off vs. a token blacklist).
- Email verification: required before full account access. Unverified accounts can only access the verification-pending page. Verification link sent on signup, resendable.
- CSRF: not needed for API endpoints (Bearer token auth, no cookies used for API auth). The refresh token cookie is SameSite=Strict, which prevents CSRF on the token refresh endpoint.

**Rationale:**
- Argon2id is the current OWASP recommendation for password hashing, resistant to both side-channel and GPU attacks.
- Short-lived JWTs limit the window of exposure if an access token is leaked. The refresh token in an HTTP-only cookie is not accessible to JavaScript (XSS protection).
- Token rotation with reuse detection catches token theft scenarios.
- Email verification prevents fake accounts and is required for collaboration features (email invitations).

**Alternatives considered:**
- bcrypt: well-tested but Argon2id is the newer recommendation with memory-hardness.
- Session-based auth: simpler but requires server-side session storage and doesn't fit the stateless API model.
- Longer-lived access tokens (1 hour): reduces refresh traffic but increases exposure window.
- Token blacklist for logout: adds a database lookup on every request. 15-minute expiry is an acceptable trade-off.

**Consequences:**
- The `refresh_tokens` table must be added to the schema (user_id, token_hash, expires_at, created_at).
- RS256 requires an RSA key pair; keys are loaded from environment variables or a secrets manager.
- The frontend must implement transparent token refresh (intercept 401, refresh, retry).

**Status:** Accepted

---

## ADR-008: Security Baseline

**Decision:** The MVP implements these security measures from day one:

1. **Rate limiting:** 100 requests per minute per authenticated user (express-rate-limit). Login/signup endpoints: 10 attempts per 15 minutes per IP.
2. **Input validation:** All request bodies validated with zod schemas before processing. Type coercion disabled.
3. **Markdown sanitisation:** Task content and descriptions are sanitised server-side on write (sanitize-html, allowlist of safe tags) and client-side on render (DOMPurify). Double protection against stored XSS.
4. **Per-user data isolation:** Every database query includes a `user_id` or `creator_id` filter matching the authenticated user. Middleware extracts user ID from JWT and attaches it to the request context. No endpoint returns data belonging to another user unless explicitly shared (Phase 3).
5. **HTTPS only:** All traffic over TLS. HTTP redirects to HTTPS. HSTS header set.
6. **Security headers:** Helmet.js middleware sets Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Referrer-Policy.
7. **Password requirements:** Minimum 8 characters. No maximum below 128. No composition rules (NIST 800-63B guidance).

**Status:** Accepted

---

## ADR-009: Backup and Export Strategy

**Decision:**
- **Database backups:** Automated daily backups of the MySQL database, retained for 30 days. Use the managed database provider's built-in backup feature (e.g., AWS RDS automated backups, or mysqldump on a cron job for self-hosted).
- **User data export:** An API endpoint (`GET /api/v1/users/me/export`) returns all user data as a JSON file. Includes projects, sections, tasks (with labels), and labels. Available from Phase 1.
- **Point-in-time recovery:** Depends on the hosting provider. Managed MySQL services typically support this; self-hosted requires binary log retention.

**Consequences:**
- The export endpoint must be rate-limited more aggressively (1 request per hour per user) to prevent abuse.
- Export format should be documented so users can import data elsewhere.

**Status:** Accepted

---

## ADR-010: Favorites in MVP

**Decision:** Favorites ship in Phase 1 (MVP). Users can toggle `is_favorite` on projects and labels. Favorited items appear in a dedicated "Favorites" section at the top of the sidebar, above the Projects list.

**Rationale:**
- The navigation design (navigation.md) shows a Favorites section in the sidebar. Shipping the sidebar without it creates an incomplete navigation structure.
- Implementation cost is low: a boolean field on projects and labels, a sidebar query filtered by `is_favorite = true`, and a toggle endpoint.

**Consequences:**
- The sidebar component renders a Favorites section when any favorited items exist.
- Filter favorites are deferred to Phase 4 (when filters are implemented).

**Status:** Accepted

---

## ADR-011: Search in MVP

**Decision:** Basic full-text search ships in Phase 1. Uses MySQL's built-in FULLTEXT index on `tasks.content` and `projects.name`. A single search endpoint returns matching tasks and projects.

**Rationale:**
- Search is a core navigation feature. Users with more than a handful of tasks need it to find anything.
- MySQL FULLTEXT indexes are simple to set up and adequate for the expected data volume.
- No additional infrastructure (Meilisearch, Elasticsearch) needed for MVP.

**Alternatives considered:**
- Defer to Phase 5: forces users to browse manually, degrading the experience.
- External search engine: unnecessary complexity for MVP scale.

**Consequences:**
- FULLTEXT indexes must be created on the tasks and projects tables.
- Search results are scoped to the authenticated user's data.
- Advanced search (filter syntax, field-specific queries) is deferred to Phase 4.

**Status:** Accepted

---

## ADR-012: Project Archiving Phase

**Decision:** Project archiving is deferred to Phase 2. Phase 1 supports project deletion only.

**Rationale:**
- The reconnaissance documents listed archiving in both Phase 1 and Phase 5, creating a contradiction. Archiving is more useful than deletion for preserving completed project history, but it adds UI complexity (archived projects list, restore flow) that isn't essential for the initial launch.
- Phase 2 adds the `is_archived` column to the projects table and the archive/unarchive endpoints.

**Status:** Accepted
