# Database Schema: MVP (Phase 1)

MySQL 8+ schema for the initial release. Managed by Prisma migrations.

---

## Schema Overview

```
users
  |-- 1:* --> projects (user_id)
  |-- 1:* --> labels (user_id)
  |-- 1:* --> refresh_tokens (user_id)
  
projects
  |-- 0..1:* --> projects (parent_id, sub-projects)
  |-- 1:* --> sections (project_id)
  |-- 1:* --> tasks (project_id)

sections
  |-- 1:* --> tasks (section_id)

tasks
  |-- 0..1:* --> tasks (parent_id, subtasks, max depth 4)
  |-- *:* --> labels (via task_labels)

labels
  |-- *:* --> tasks (via task_labels)
```

---

## Table Definitions

### users

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | CHAR(36) | PK | UUID v4 |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Lowercase, trimmed |
| password_hash | VARCHAR(255) | NOT NULL | Argon2id hash |
| name | VARCHAR(255) | NOT NULL | Display name |
| timezone | VARCHAR(100) | NOT NULL, DEFAULT 'UTC' | IANA timezone string |
| email_verified | BOOLEAN | NOT NULL, DEFAULT FALSE | Must be true for full access |
| created_at | DATETIME(3) | NOT NULL, DEFAULT CURRENT_TIMESTAMP(3) | |
| updated_at | DATETIME(3) | NOT NULL, ON UPDATE CURRENT_TIMESTAMP(3) | |

**Indexes:**
- `PRIMARY KEY (id)`
- `UNIQUE INDEX idx_users_email (email)`

---

### projects

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | CHAR(36) | PK | UUID v4 |
| user_id | CHAR(36) | FK -> users.id, NOT NULL | Owner |
| name | VARCHAR(255) | NOT NULL | |
| color | VARCHAR(50) | NOT NULL, DEFAULT 'charcoal' | Color name from predefined palette |
| parent_id | CHAR(36) or NULL | FK -> projects.id | Sub-project nesting |
| order | INT | NOT NULL, DEFAULT 0 | Position among siblings (gaps of 1000) |
| view_style | ENUM('list', 'board') | NOT NULL, DEFAULT 'list' | Default layout |
| is_favorite | BOOLEAN | NOT NULL, DEFAULT FALSE | Shown in Favorites sidebar section |
| is_inbox | BOOLEAN | NOT NULL, DEFAULT FALSE | One per user, auto-created on signup |
| created_at | DATETIME(3) | NOT NULL, DEFAULT CURRENT_TIMESTAMP(3) | |
| updated_at | DATETIME(3) | NOT NULL, ON UPDATE CURRENT_TIMESTAMP(3) | |

**Indexes:**
- `PRIMARY KEY (id)`
- `INDEX idx_projects_user (user_id)`
- `INDEX idx_projects_user_favorite (user_id, is_favorite)` -- sidebar favorites query
- `INDEX idx_projects_parent (parent_id)` -- sub-project lookups
- `FULLTEXT INDEX idx_projects_search (name)` -- search endpoint

**Constraints:**
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`
- `FOREIGN KEY (parent_id) REFERENCES projects(id) ON DELETE SET NULL`

---

### sections

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | CHAR(36) | PK | UUID v4 |
| project_id | CHAR(36) | FK -> projects.id, NOT NULL | |
| name | VARCHAR(255) | NOT NULL | |
| order | INT | NOT NULL, DEFAULT 0 | Position within project (gaps of 1000) |
| is_collapsed | BOOLEAN | NOT NULL, DEFAULT FALSE | UI state |
| created_at | DATETIME(3) | NOT NULL, DEFAULT CURRENT_TIMESTAMP(3) | |
| updated_at | DATETIME(3) | NOT NULL, ON UPDATE CURRENT_TIMESTAMP(3) | |

**Indexes:**
- `PRIMARY KEY (id)`
- `INDEX idx_sections_project (project_id)`

**Constraints:**
- `FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE`

---

### tasks

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | CHAR(36) | PK | UUID v4 |
| project_id | CHAR(36) | FK -> projects.id, NOT NULL | |
| section_id | CHAR(36) or NULL | FK -> sections.id | NULL = unsectioned |
| parent_id | CHAR(36) or NULL | FK -> tasks.id | Subtask nesting, max depth 4 |
| content | VARCHAR(2000) | NOT NULL | Task title, sanitised |
| description | TEXT or NULL | | Extended notes, sanitised, markdown |
| priority | TINYINT | NOT NULL, DEFAULT 1 | 1=normal(p4), 2=medium(p3), 3=high(p2), 4=urgent(p1) |
| due_date | DATE or NULL | | Date-only due date (YYYY-MM-DD) |
| due_datetime | DATETIME or NULL | | Specific time (UTC) |
| due_timezone | VARCHAR(100) or NULL | | IANA timezone for timed tasks |
| is_completed | BOOLEAN | NOT NULL, DEFAULT FALSE | |
| completed_at | DATETIME(3) or NULL | | Set when completed, cleared on reopen |
| order | INT | NOT NULL, DEFAULT 0 | Position among siblings (gaps of 1000) |
| creator_id | CHAR(36) | FK -> users.id, NOT NULL | Who created |
| created_at | DATETIME(3) | NOT NULL, DEFAULT CURRENT_TIMESTAMP(3) | |
| updated_at | DATETIME(3) | NOT NULL, ON UPDATE CURRENT_TIMESTAMP(3) | |

**Indexes:**
- `PRIMARY KEY (id)`
- `INDEX idx_tasks_project (project_id)`
- `INDEX idx_tasks_section (section_id)`
- `INDEX idx_tasks_parent (parent_id)` -- subtask lookups
- `INDEX idx_tasks_creator (creator_id)`
- `INDEX idx_tasks_active (project_id, is_completed)` -- active task queries
- `INDEX idx_tasks_due_date (due_date, is_completed)` -- Today/Upcoming views
- `INDEX idx_tasks_due_datetime (due_datetime, is_completed)` -- timed task queries
- `FULLTEXT INDEX idx_tasks_search (content, description)` -- basic text search

**Constraints:**
- `FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE`
- `FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL`
- `FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE`
- `FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE`

**Notes:**
- `ON DELETE CASCADE` for parent_id: deleting a parent task deletes its subtasks.
- `ON DELETE SET NULL` for section_id: deleting a section moves tasks to unsectioned.
- The `idx_tasks_active` index covers the most common query pattern: "show me active tasks in this project."
- The `idx_tasks_due_date` index covers Today and Upcoming views.

---

### labels

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | CHAR(36) | PK | UUID v4 |
| user_id | CHAR(36) | FK -> users.id, NOT NULL | Owner |
| name | VARCHAR(255) | NOT NULL | |
| color | VARCHAR(50) | NOT NULL, DEFAULT 'charcoal' | |
| order | INT | NOT NULL, DEFAULT 0 | Display order (gaps of 1000) |
| is_favorite | BOOLEAN | NOT NULL, DEFAULT FALSE | |
| created_at | DATETIME(3) | NOT NULL, DEFAULT CURRENT_TIMESTAMP(3) | |

**Indexes:**
- `PRIMARY KEY (id)`
- `INDEX idx_labels_user (user_id)`
- `UNIQUE INDEX idx_labels_user_name (user_id, name)` -- label names unique per user

**Constraints:**
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`

---

### task_labels

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| task_id | CHAR(36) | FK -> tasks.id, NOT NULL | |
| label_id | CHAR(36) | FK -> labels.id, NOT NULL | |

**Indexes:**
- `PRIMARY KEY (task_id, label_id)` -- composite PK
- `INDEX idx_task_labels_label (label_id)` -- reverse lookup: "tasks with this label"

**Constraints:**
- `FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE`
- `FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE`

---

### refresh_tokens

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | CHAR(36) | PK | UUID v4 |
| user_id | CHAR(36) | FK -> users.id, NOT NULL | |
| token_hash | VARCHAR(255) | NOT NULL | SHA-256 hash of the opaque token |
| expires_at | DATETIME | NOT NULL | 7-day expiry |
| created_at | DATETIME(3) | NOT NULL, DEFAULT CURRENT_TIMESTAMP(3) | |

**Indexes:**
- `PRIMARY KEY (id)`
- `INDEX idx_refresh_tokens_user (user_id)` -- logout-all, compromise detection
- `UNIQUE INDEX idx_refresh_tokens_hash (token_hash)` -- token lookup

**Constraints:**
- `FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`

---

## Phase 2 Schema Additions

These columns and tables will be added via Prisma migrations when Phase 2 begins. Listed here for forward-planning.

```sql
-- Add recurring date support to tasks
ALTER TABLE tasks ADD COLUMN due_string VARCHAR(500) NULL;
ALTER TABLE tasks ADD COLUMN is_recurring BOOLEAN NOT NULL DEFAULT FALSE;

-- Add project archiving
ALTER TABLE projects ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;
```

---

## Phase 3 Schema Additions (collaboration)

```sql
-- Project collaborators
CREATE TABLE project_collaborators (
  project_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  role ENUM('member', 'admin') NOT NULL DEFAULT 'member',
  invited_at DATETIME(3) NOT NULL,
  accepted_at DATETIME(3) NULL,
  PRIMARY KEY (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Task comments
CREATE TABLE comments (
  id CHAR(36) PRIMARY KEY,
  task_id CHAR(36) NULL,
  project_id CHAR(36) NULL,
  user_id CHAR(36) NOT NULL,
  content TEXT NOT NULL,
  posted_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add assignee to tasks
ALTER TABLE tasks ADD COLUMN assignee_id CHAR(36) NULL;
ALTER TABLE tasks ADD FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL;
```

---

## Migration Strategy

- All migrations managed by Prisma Migrate.
- Each migration is a versioned SQL file in `packages/server/prisma/migrations/`.
- Migrations are applied in order on deployment.
- Destructive migrations (dropping columns, changing types) require a two-step deployment: first add the new column, deploy, migrate data, then drop the old column.
- Production migrations should be tested against a staging database first.

---

## Seed Data

The seed script (`prisma/seed.ts`) creates:
1. A test user (email: test@example.com, pre-verified) for development.
2. The test user's Inbox project (is_inbox = true).
3. Sample projects, sections, tasks, and labels for manual testing.
