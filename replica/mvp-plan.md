# MVP Plan: Todoist Pro Alternative

Phased roadmap for building an independent task management application inspired by Todoist Pro.
All branding, design, and code will be original.

---

## Guiding Principles

1. Ship a usable core before adding advanced features
2. Prioritize features that differentiate a Pro-tier product from basic to-do apps
3. Build the data model to accommodate future features without rework
4. API-first design: every UI operation goes through the API
5. Use evidence-based feature priorities (observed usage patterns from Todoist docs)

---

## Phase 1: Foundation (MVP Core)

**Goal:** A working task manager with projects, due dates, and basic views.

### Backend
- [ ] User authentication (email/password, Argon2id hashing, JWT access + refresh tokens)
- [ ] Email verification (send verification link on signup, verify before full access)
- [ ] Project CRUD (create, read, update, delete)
- [ ] Section CRUD within projects
- [ ] Task CRUD with fields: content, description, due_date, due_datetime, due_timezone, priority (1-4), is_completed
- [ ] Subtask support (parent_id nesting, max depth 4 levels including parent)
- [ ] Task completion and reopening (pipeline pattern with hook for future recurrence)
- [ ] Inbox as default project per user
- [ ] Label CRUD and task-label association (many-to-many join table)
- [ ] Favorites: toggle is_favorite on projects, labels, and filters
- [ ] Basic search (full-text search across task content and project names)
- [ ] REST API with Bearer token auth
- [ ] Rate limiting (100 requests per minute per user)
- [ ] Server-side input validation and Markdown sanitisation (DOMPurify on output)
- [ ] Per-user data isolation (all queries scoped to authenticated user)
- [ ] Database schema: users, projects, sections, tasks, labels, task_labels

### Frontend
- [ ] Authentication screens (sign up with email verification, sign in, password reset)
- [ ] Sidebar navigation (Inbox, Today, Upcoming, Favorites, Projects list, Labels)
- [ ] Project view with list layout
- [ ] Task rows: checkbox, content, due date chip, priority flag, labels
- [ ] Inline task creation (add task input per section)
- [ ] Task detail panel (edit content, description, due date, priority, labels, project/section)
- [ ] Today view (tasks due today + overdue, resolved in user's timezone)
- [ ] Upcoming view (tasks by date, multi-day scroll)
- [ ] Complete / uncomplete task with animation
- [ ] Project create/edit/delete
- [ ] Section create/edit/delete within projects
- [ ] Favorite/unfavorite projects and labels
- [ ] Basic search interface (search tasks and projects by text)
- [ ] Basic user settings (name, timezone, password change)
- [ ] Responsive layout (desktop and mobile-width breakpoints)

### Data Model (Phase 1 scope)
- users: id, email, password_hash, name, timezone, email_verified, created_at, updated_at
- projects: id, user_id, name, color, parent_id, order, view_style, is_favorite, is_inbox, created_at, updated_at
- sections: id, project_id, name, order, is_collapsed, created_at, updated_at
- tasks: id, project_id, section_id, parent_id, content, description, priority, due_date, due_datetime, due_timezone, is_completed, completed_at, order, creator_id, created_at, updated_at
- labels: id, user_id, name, color, order, is_favorite, created_at
- task_labels: task_id, label_id

Note: `due_string` and `is_recurring` are deferred to Phase 2 (recurring dates). `is_archived` on projects is deferred to Phase 2. See database-schema.md for full schema with indexes and constraints.

---

## Phase 2: Productivity Features

**Goal:** Add the features that make this a Pro-tier product.

### Quick Add & Natural Language
- [ ] Quick Add modal (keyboard shortcut Q)
- [ ] Natural language date parsing ("tomorrow", "next Monday", "Jan 15")
- [ ] Smart detection of labels (%label), priorities (p1-p4), projects (#project)
- [ ] Smart date recognition toggle

### Recurring Dates
- [ ] Recurring date parser ("every day", "every Monday", "every 3 days")
- [ ] Scheduled-based recurrence (every) vs completion-based (every!)
- [ ] Interval support (every N days/weeks/months/years)
- [ ] Specific day-of-week and date patterns
- [ ] Auto-advance on completion (schedule next occurrence)
- [ ] Overdue skip logic (jump to future dates)

### Views
- [ ] Board layout (Kanban with sections as columns)
- [ ] Drag-and-drop reordering in list view
- [ ] Drag-and-drop between sections in board view
- [ ] Sort options (date, priority, name, manual)
- [ ] Group options (date, priority, label, section, project)
- [ ] Display preferences saved per project

### Deadlines & Duration
- [ ] Deadline field (separate from due date)
- [ ] Duration field (amount + unit: minutes or days)
- [ ] Deadline chip display in task rows and calendar

---

## Phase 3: Collaboration & Communication

**Goal:** Multi-user features for shared work.

- [ ] Share project with collaborators (invite by email)
- [ ] Task assignment (assignee picker in shared projects)
- [ ] Comments on tasks (text content)
- [ ] Comments with file attachments (upload + storage)
- [ ] Collaborator list per project
- [ ] Activity feed per project (who did what, when)
- [ ] Notifications for assignment, comment, completion events

---

## Phase 4: Advanced Productivity

**Goal:** Power-user features that complete the Pro experience.

### Filters
- [ ] Filter CRUD (name + query)
- [ ] Filter query parser (boolean: &, |, !; parentheses)
- [ ] Filter prefixes: # (project), / (section), % (label)
- [ ] Date keywords: today, tomorrow, overdue, no date, date ranges
- [ ] Priority keywords: p1-p4
- [ ] Assignment keywords: assigned to, assigned by
- [ ] Search keyword
- [ ] Wildcard support (*)
- [ ] Multi-query (comma-separated)
- [ ] Favorite filters

### Reminders
- [ ] Automatic reminders on timed tasks (configurable lead time)
- [ ] Custom time-based reminders
- [ ] Multiple reminders per task
- [ ] Reminder notification delivery (push, email)
- [ ] Reminder shortcut in Quick Add (! prefix)

### Calendar View
- [ ] Calendar layout (week, 3-day, month)
- [ ] Drag-and-drop rescheduling on calendar
- [ ] Time-blocking (drag to create task with time + duration)
- [ ] Task coloring (by priority, label, or project)
- [ ] "No date" drawer for undated tasks

### Productivity Tracking
- [ ] Completed tasks archive
- [ ] Activity history (filterable by project, person, date range)
- [ ] Completion stats (daily/weekly charts)
- [ ] Streak tracking / gamification system

---

## Phase 5: Platform & Polish

**Goal:** Multi-platform reach and refinements.

- [ ] Keyboard shortcuts (comprehensive set)
- [ ] Templates (save project as template, apply template)
- [ ] Bulk task operations (multi-select, batch edit/move/delete)
- [ ] Offline support (local-first with sync)
- [ ] Dark mode / theme system
- [ ] OAuth2 provider (for third-party integrations)
- [ ] Webhook events
- [ ] Calendar feed export (iCal)
- [ ] Email forwarding (inbound email-to-task)
- [ ] Browser extension (Chrome)
- [ ] Mobile app (React Native or Flutter)

Note: Search, Favorites, and Project archiving were moved to earlier phases. See decisions.md for rationale.

---

## Technology Stack (ADR-001)

Finalized stack. See decisions.md ADR-001 for rationale and alternatives considered.

| Layer | Choice | Notes |
|-------|--------|-------|
| Language | TypeScript | Full-stack type safety, shared types between client and server |
| Backend | Node.js + Express | Mature ecosystem, large middleware library, team familiarity |
| Database | MySQL 8+ | Relational model fits well; full-text search for MVP search |
| ORM | Prisma | Type-safe queries, migration management, schema-first workflow |
| Auth | JWT (access) + refresh tokens, Argon2id | Short-lived access tokens (15 min), rotating refresh tokens (7 days) |
| Frontend | React 18 + Vite | Fast dev server, optimized builds, component model suits views |
| Styling | Tailwind CSS | Utility-first, responsive, consistent design tokens |
| State | TanStack Query (React Query) | Server-state caching, optimistic updates, background refetch |
| Testing | Vitest (unit/integration) + Playwright (E2E) | Fast test runner compatible with Vite, cross-browser E2E |
| Date parsing | chrono-node (Phase 2) | English NLP date parsing, extensible for other languages |
| Rate limiting | express-rate-limit | Simple token-bucket per user, configurable windows |
| Validation | zod | Runtime schema validation, TypeScript type inference |
| Sanitisation | DOMPurify (client) + sanitize-html (server) | Prevent stored XSS in markdown fields |

---

## Success Criteria for MVP (Phase 1)

A user should be able to:
1. Create an account with email verification, sign in, and change their password
2. See an Inbox with tasks
3. Create tasks with titles, descriptions, due dates, and priorities
4. Organize tasks into projects and sections
5. Add labels to tasks
6. Create subtasks (up to 4 levels deep)
7. Complete and uncomplete tasks
8. View Today (due today + overdue, timezone-aware) and Upcoming (by date) views
9. Navigate between views via a sidebar with Favorites
10. Search tasks and projects by text
11. Favorite/unfavorite projects and labels for quick sidebar access
12. Adjust basic settings (name, timezone)
13. All operations persist across sessions
14. The application works on desktop and mobile screen sizes
