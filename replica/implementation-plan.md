# Implementation Plan: Phase 1 (MVP)

Ordered build sequence with dependencies, estimated effort, and milestones. Each step produces working, testable output before the next begins.

---

## Prerequisites

Before writing application code:

1. All reconnaissance and architecture documents are finalized (this step).
2. Branding/naming decision made (Q17 in open-questions.md). A placeholder name can be used until resolved.
3. Development machine has: Node.js 20+, MySQL 8+, npm 10+.

---

## Step 1: Project Scaffolding

**Estimated effort:** 1 day

- Initialize npm workspace root with `packages/shared`, `packages/server`, `packages/client`.
- Configure `tsconfig.base.json` and per-package `tsconfig.json` files.
- Install core dependencies (Express, Prisma, React, Vite, Tailwind, zod, TanStack Query, Vitest, Playwright).
- Set up `.env.example` with required environment variables (DATABASE_URL, JWT keys, email service, port).
- Create Docker Compose file for local MySQL instance.
- Add basic npm scripts: `dev`, `build`, `test`, `lint` at root and per-package.
- Verify the workspace builds and the dev servers start (Express on :3001, Vite on :5173).

**Depends on:** Nothing.
**Produces:** Empty but runnable monorepo.

---

## Step 2: Shared Package

**Estimated effort:** 1 day

- Define TypeScript entity types: User, Project, Section, Task, Label, TaskLabel.
- Define API request/response types for each resource.
- Create zod validation schemas (reused by server and client): CreateTask, UpdateTask, CreateProject, etc.
- Define constants: priority mappings, color palette, limits (max subtask depth, content lengths).
- Define error code enum matching the error response format in api-contracts.md.

**Depends on:** Step 1.
**Produces:** `@app/shared` package importable by server and client.

---

## Step 3: Database Schema and Prisma Setup

**Estimated effort:** 1 day

- Write `schema.prisma` matching database-schema.md (7 tables, all indexes, all constraints).
- Run `prisma migrate dev` to generate the initial migration.
- Write `prisma/seed.ts`: test user (pre-verified), Inbox project, sample data.
- Verify: `prisma db push`, seed runs, Prisma Studio shows tables.

**Depends on:** Step 1 (workspace), Step 2 (types for seed data).
**Produces:** Working database with seed data.

---

## Step 4: Auth System

**Estimated effort:** 3 days

- Implement auth routes: signup, login, refresh, logout, verify-email, resend-verification, change-password.
- Argon2id password hashing (64 MiB memory, 3 iterations).
- JWT access token generation (RS256, 15-min expiry) and verification middleware.
- Refresh token generation, rotation, and reuse detection (per ADR-007).
- HTTP-only Secure SameSite=Strict cookie for refresh tokens.
- Rate limiting on login (10/15min per IP) and signup (5/15min per IP).
- Email verification token generation. For MVP, log the verification URL to console (swap for real email service before deployment).
- Helmet security headers middleware.
- Global error handling middleware.
- Write tests: signup flow, login flow, token refresh, token rotation, reuse detection, email verification.

**Depends on:** Step 3 (users and refresh_tokens tables).
**Produces:** Fully functional auth system. All subsequent routes are protected.

---

## Step 5: Project and Section CRUD

**Estimated effort:** 2 days

- Implement project routes: list, create, get, update, delete.
- Auto-create Inbox on signup (is_inbox = true, undeletable).
- Implement section routes: list by project, create, update, delete.
- Section deletion moves tasks to unsectioned (section_id = null).
- Project deletion cascades to sections and tasks.
- Per-user data isolation on all queries (WHERE user_id = ?).
- Integer ordering with gaps of 1000 (ADR-003).
- Favorites toggle (PATCH with is_favorite).
- Input validation with shared zod schemas.
- Write tests: CRUD operations, cascade deletes, ordering, ownership isolation.

**Depends on:** Step 4 (auth middleware).
**Produces:** Projects and sections API, ready for tasks.

---

## Step 6: Task CRUD and Completion

**Estimated effort:** 3 days

- Implement task routes: list (with filters), create, get, update, delete.
- Query filters: projectId, sectionId, parentId, completed, dueBefore, dueAfter, priority, labelId.
- Subtask support: parent_id with depth validation (max 4 levels).
- Task completion (POST /close) and reopening (POST /reopen) with completion service pipeline.
- Hook point for future recurring task handling (Phase 2).
- Due date/datetime/timezone field handling.
- Integer ordering within section/unsectioned scope.
- Cascade delete of subtasks when parent is deleted.
- Markdown sanitization on content and description (sanitize-html).
- Write tests: CRUD, filtering, subtask depth enforcement, completion/reopening, sanitization.

**Depends on:** Step 5 (projects and sections exist for task assignment).
**Produces:** Core task management API.

---

## Step 7: Labels and Task-Label Association

**Estimated effort:** 1.5 days

- Implement label routes: list, create, update, delete.
- Unique label names per user (409 on conflict).
- Task-label association: labelIds array on task create/update (full replace).
- Labels populated on task responses (join query).
- Cascade delete: removing a label removes all task_labels entries.
- Favorites toggle on labels.
- Write tests: CRUD, association, cascade, uniqueness.

**Depends on:** Step 6 (tasks exist for association).
**Produces:** Complete label system.

---

## Step 8: Today, Upcoming, and Search

**Estimated effort:** 2 days

- Implement GET /tasks/today: timezone-aware date resolution per architecture.md.
- Implement GET /tasks/upcoming: grouped by date, overdue section, configurable day range.
- Implement GET /search: FULLTEXT search on tasks.content and projects.name, scoped to user.
- Implement GET /users/me and PATCH /users/me (profile, timezone).
- Implement GET /users/me/export (JSON data export, rate limited 1/hour).
- Write tests: timezone edge cases (date boundary, DST), search relevance, export completeness.

**Depends on:** Step 7 (labels included in task responses for today/upcoming).
**Produces:** All backend API endpoints complete.

---

## Step 9: Frontend Foundation

**Estimated effort:** 3 days

- Set up React Router with route structure: /login, /signup, /verify-email, /inbox, /today, /upcoming, /project/:id, /search, /settings.
- Build auth pages: signup (with verification notice), login, email verification.
- Implement auth state management: access token in memory, refresh via cookie, auto-refresh on 401.
- Create API client layer with TanStack Query: query keys, mutation hooks, error handling.
- Build app shell: sidebar + main content area layout.
- Responsive breakpoints: collapsible sidebar on mobile, hamburger menu.
- Tailwind config: color palette, spacing scale, typography.
- DOMPurify setup for rendering markdown descriptions.

**Depends on:** Step 8 (API is complete).
**Produces:** Authenticated app shell with routing.

---

## Step 10: Sidebar and Navigation

**Estimated effort:** 2 days

- Sidebar component: Inbox link, Today (with overdue count badge), Upcoming.
- Favorites section: favorited projects and labels, only shown when favorites exist.
- Projects list: tree of projects (sub-projects indented), with create button.
- Labels section: list of labels, collapsible.
- Active route highlighting.
- Mobile: slide-out drawer with overlay.

**Depends on:** Step 9 (app shell, API client).
**Produces:** Full navigation. User can move between views.

---

## Step 11: Project View and Task Interaction

**Estimated effort:** 4 days

- Project view: list of sections with tasks, unsectioned tasks at top.
- Task row component: checkbox (with completion animation), content, due date chip (color-coded for overdue), priority flag, label pills.
- Inline task creation: input field per section, "Add task" button, keyboard shortcut Enter to submit.
- Task detail panel (slide-over or modal): edit all fields (content, description, due date picker, priority selector, label multi-select, project/section move).
- Section headers with create/edit/delete.
- Optimistic updates via TanStack Query for completion toggle, task creation.
- Drag-and-drop reordering is deferred to Phase 2. Manual order is set by the server.

**Depends on:** Step 10 (navigation to project view).
**Produces:** Core task management UI. The app is usable.

---

## Step 12: Today, Upcoming, Search, and Settings Views

**Estimated effort:** 3 days

- Today view: overdue section + today section, using task row component from Step 11.
- Upcoming view: scrollable date groups (14 days ahead), overdue section at top.
- Search view: search input with debounced query, results split into tasks and projects.
- Settings page: edit name, timezone (dropdown of IANA zones), change password form.
- Empty states for all views (no tasks today, no search results, etc.).

**Depends on:** Step 11 (task row component reused across views).
**Produces:** All MVP views functional.

---

## Step 13: Polish and Testing

**Estimated effort:** 3 days

- Loading states and skeleton screens.
- Error boundaries and toast notifications (including undo-delete toast).
- Form validation feedback (inline errors from zod).
- Keyboard accessibility audit (focus management, tab order).
- Responsive layout testing across breakpoints.
- Write E2E tests with Playwright: signup flow, create project, create task, complete task, today view, search.
- Write integration tests for critical paths: auth refresh, task completion, subtask depth.
- Fix bugs discovered during testing.

**Depends on:** Step 12 (all views exist).
**Produces:** Polished, tested MVP.

---

## Step 14: Deployment Preparation

**Estimated effort:** 2 days

- Dockerfile for the server (multi-stage build: install, build, run).
- Vite production build of the client, served by Express or nginx.
- Docker Compose for production (app + MySQL).
- Environment variable documentation.
- Database migration script for production (prisma migrate deploy).
- Seed script adjusted for production (no test user).
- HTTPS/TLS setup (nginx reverse proxy or cloud load balancer).
- Automated daily database backups (per ADR-009).
- Verify: full deployment cycle on a staging environment.

**Depends on:** Step 13 (app is tested).
**Produces:** Deployable MVP.

---

## Milestones

| Milestone | Steps | What's True |
|-----------|-------|-------------|
| M1: Backend API complete | 1-8 | Every endpoint in api-contracts.md works and is tested |
| M2: App is usable | 9-11 | A user can sign up, create tasks, and manage projects in a browser |
| M3: MVP feature-complete | 12 | All views (Today, Upcoming, Search, Settings) work |
| M4: Ship-ready | 13-14 | Tested, polished, deployable |

---

## Total Estimated Effort

~26.5 developer-days for Phase 1.

This is an estimate for a single experienced full-stack developer working on both frontend and backend. Parallel work (two developers splitting frontend/backend after Step 8) could compress the calendar to roughly 3 weeks.

---

## Decisions Required Before Starting

1. **Q17 (Branding):** Product name. Can start with a placeholder, but affects routes, page titles, and email templates. Must be resolved before deployment.
2. **Q18 (Hosting):** Cloud provider and deployment target. Needed by Step 14 but inform Docker/nginx choices earlier.
3. **RSA key pair:** Generate RS256 keys for JWT signing. Store in environment variables or a secrets manager.
4. **Email service:** Select a transactional email provider (SendGrid, SES, Resend) for verification emails. Console logging is the fallback for local development.
