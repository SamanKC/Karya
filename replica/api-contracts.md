# API Contracts: MVP (Phase 1)

REST API specification. All endpoints prefixed with `/api/v1`. Responses are JSON. Authentication via Bearer token in the Authorization header unless noted.

---

## Authentication

### POST /api/v1/auth/signup

Create a new account. No auth required.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "Saman KC",
  "timezone": "Australia/Sydney"
}
```

**Validation:**
- `email`: valid email, max 255 chars, lowercased and trimmed
- `password`: 8-128 characters
- `name`: 1-255 characters, trimmed
- `timezone`: valid IANA timezone string (optional, defaults to "UTC")

**Response (201):**
```json
{
  "message": "Account created. Check your email to verify."
}
```

**Errors:** 409 (email already registered), 400 (validation)

---

### POST /api/v1/auth/login

Sign in. No auth required. Rate limited: 10 attempts per 15 minutes per IP.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbG...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Saman KC",
    "timezone": "Australia/Sydney"
  }
}
```

Also sets `refreshToken` as HTTP-only Secure SameSite=Strict cookie.

**Errors:** 401 (invalid credentials), 403 (email not verified)

---

### POST /api/v1/auth/refresh

Exchange refresh token for new access token. No Bearer auth required (token in cookie).

**Response (200):**
```json
{
  "accessToken": "eyJhbG..."
}
```

Also sets new `refreshToken` cookie (rotation).

**Errors:** 401 (invalid/expired refresh token)

---

### POST /api/v1/auth/logout

Invalidate refresh token. Requires auth.

**Response (204):** No content.

---

### POST /api/v1/auth/verify-email

Verify email address. No auth required.

**Request:**
```json
{
  "token": "verification-jwt-token"
}
```

**Response (200):**
```json
{
  "message": "Email verified. You can now sign in."
}
```

---

### POST /api/v1/auth/resend-verification

Resend verification email. No auth required. Rate limited: 3 per hour per email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If this email is registered and unverified, a verification link has been sent."
}
```

---

### POST /api/v1/auth/change-password

Change password for authenticated user.

**Request:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newsecurepassword"
}
```

**Response (200):**
```json
{
  "message": "Password changed."
}
```

Invalidates all refresh tokens for the user (forces re-login on other devices).

---

## User

### GET /api/v1/users/me

Get current user profile.

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Saman KC",
  "timezone": "Australia/Sydney",
  "createdAt": "2026-10-12T00:00:00.000Z"
}
```

---

### PATCH /api/v1/users/me

Update user profile.

**Request (partial):**
```json
{
  "name": "New Name",
  "timezone": "America/New_York"
}
```

**Response (200):** Updated user object.

---

### GET /api/v1/users/me/export

Export all user data as JSON. Rate limited: 1 per hour.

**Response (200):** JSON file download containing projects, sections, tasks, labels.

---

## Projects

### GET /api/v1/projects

List all projects for the authenticated user.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Work",
    "color": "blue",
    "parentId": null,
    "order": 1000,
    "viewStyle": "list",
    "isFavorite": false,
    "isInbox": false,
    "createdAt": "2026-10-12T00:00:00.000Z",
    "updatedAt": "2026-10-12T00:00:00.000Z"
  }
]
```

---

### POST /api/v1/projects

Create a project.

**Request:**
```json
{
  "name": "New Project",
  "color": "red",
  "parentId": null,
  "viewStyle": "list",
  "isFavorite": false
}
```

Only `name` is required.

**Response (201):** Created project object.

---

### GET /api/v1/projects/:id

Get a single project.

**Response (200):** Project object.

**Errors:** 404 (not found or not owned by user)

---

### PATCH /api/v1/projects/:id

Update a project.

**Request (partial):** Any combination of `name`, `color`, `parentId`, `viewStyle`, `isFavorite`.

**Response (200):** Updated project object.

---

### DELETE /api/v1/projects/:id

Delete a project and all its sections and tasks. Cannot delete the Inbox.

**Response (204):** No content.

**Errors:** 400 (cannot delete inbox), 404

---

## Sections

### GET /api/v1/projects/:projectId/sections

List sections in a project, ordered by `order`.

**Response (200):** Array of section objects.

---

### POST /api/v1/projects/:projectId/sections

Create a section.

**Request:**
```json
{
  "name": "In Progress"
}
```

**Response (201):** Created section object.

---

### PATCH /api/v1/sections/:id

Update a section.

**Request (partial):** `name`, `order`, `isCollapsed`.

**Response (200):** Updated section object.

---

### DELETE /api/v1/sections/:id

Delete a section. Tasks in it move to unsectioned (section_id = null).

**Response (204):** No content.

---

## Tasks

### GET /api/v1/tasks

List tasks with filters.

**Query parameters:**
- `projectId` (optional): filter by project
- `sectionId` (optional): filter by section
- `parentId` (optional): filter by parent task (get subtasks)
- `completed` (optional, boolean): filter by completion status (default: false)
- `dueBefore` (optional, date string): tasks due before this date
- `dueAfter` (optional, date string): tasks due after this date
- `priority` (optional, 1-4): filter by priority
- `labelId` (optional): filter by label
- `search` (optional, string): full-text search on content

**Response (200):**
```json
[
  {
    "id": "uuid",
    "projectId": "uuid",
    "sectionId": "uuid",
    "parentId": null,
    "content": "Buy groceries",
    "description": "Milk, bread, eggs",
    "priority": 1,
    "dueDate": "2026-10-12",
    "dueDatetime": null,
    "dueTimezone": null,
    "isCompleted": false,
    "completedAt": null,
    "order": 1000,
    "creatorId": "uuid",
    "labels": [
      { "id": "uuid", "name": "errands", "color": "green" }
    ],
    "createdAt": "2026-10-12T00:00:00.000Z",
    "updatedAt": "2026-10-12T00:00:00.000Z"
  }
]
```

Note: `labels` is populated from the join table for convenience. The API returns label objects, not IDs.

---

### GET /api/v1/tasks/today

Tasks due today or overdue for the authenticated user.

**Query parameters:**
- `timezone` (required): IANA timezone string for resolving "today"

**Response (200):** Array of task objects (same shape as GET /tasks), ordered by due date ascending then priority descending.

---

### GET /api/v1/tasks/upcoming

Tasks due in the next 14 days (default), grouped by date.

**Query parameters:**
- `timezone` (required): IANA timezone string
- `days` (optional, default 14): number of days ahead

**Response (200):**
```json
{
  "dates": [
    {
      "date": "2026-10-12",
      "tasks": [ /* task objects */ ]
    },
    {
      "date": "2026-10-13",
      "tasks": [ /* task objects */ ]
    }
  ],
  "overdue": [ /* task objects with due date before today */ ]
}
```

---

### POST /api/v1/tasks

Create a task.

**Request:**
```json
{
  "content": "Buy groceries",
  "description": "Milk, bread, eggs",
  "projectId": "uuid",
  "sectionId": "uuid",
  "parentId": null,
  "priority": 1,
  "dueDate": "2026-10-12",
  "dueDatetime": null,
  "dueTimezone": null,
  "labelIds": ["uuid1", "uuid2"]
}
```

Only `content` is required. Defaults: `projectId` = user's Inbox, `priority` = 1.

**Validation:**
- `content`: 1-2000 characters, sanitised
- `description`: max 16000 characters, sanitised
- `priority`: integer 1-4
- `parentId`: if set, the parent task must be in the same project and nesting depth must not exceed 4
- `labelIds`: array of label IDs owned by the user

**Response (201):** Created task object (includes populated labels).

---

### GET /api/v1/tasks/:id

Get a single task with its labels.

**Response (200):** Task object.

---

### PATCH /api/v1/tasks/:id

Update a task.

**Request (partial):** Any combination of `content`, `description`, `projectId`, `sectionId`, `parentId`, `priority`, `dueDate`, `dueDatetime`, `dueTimezone`, `labelIds`, `order`.

When `labelIds` is provided, it replaces all existing label associations (full replace, not merge).

**Response (200):** Updated task object.

---

### DELETE /api/v1/tasks/:id

Delete a task and all its subtasks.

**Response (204):** No content.

---

### POST /api/v1/tasks/:id/close

Complete a task.

**Response (200):** Updated task object with `isCompleted: true` and `completedAt` set.

Idempotent: completing an already-completed task returns 200 with no change.

---

### POST /api/v1/tasks/:id/reopen

Reopen a completed task.

**Response (200):** Updated task object with `isCompleted: false` and `completedAt: null`.

---

## Labels

### GET /api/v1/labels

List all labels for the authenticated user, ordered by `order`.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "errands",
    "color": "green",
    "order": 1000,
    "isFavorite": false,
    "createdAt": "2026-10-12T00:00:00.000Z"
  }
]
```

---

### POST /api/v1/labels

Create a label.

**Request:**
```json
{
  "name": "errands",
  "color": "green",
  "isFavorite": false
}
```

Only `name` is required.

**Response (201):** Created label object.

**Errors:** 409 (label name already exists for this user)

---

### PATCH /api/v1/labels/:id

Update a label.

**Request (partial):** `name`, `color`, `order`, `isFavorite`.

**Response (200):** Updated label object.

---

### DELETE /api/v1/labels/:id

Delete a label. Removes it from all tasks (cascade on task_labels).

**Response (204):** No content.

---

## Search

### GET /api/v1/search

Search across tasks and projects.

**Query parameters:**
- `q` (required, min 2 characters): search query
- `type` (optional): "tasks", "projects", or "all" (default: "all")

**Response (200):**
```json
{
  "tasks": [
    { /* task objects matching query */ }
  ],
  "projects": [
    { /* project objects matching query */ }
  ]
}
```

Uses MySQL FULLTEXT search on `tasks.content`, `tasks.description`, and `projects.name`. Results scoped to authenticated user.

---

## Common Patterns

### Error Response Format

All error responses use this structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Content is required",
    "details": [
      { "field": "content", "message": "Required" }
    ]
  }
}
```

### Pagination

MVP does not paginate. All endpoints return complete result sets. If list sizes become a performance concern, cursor-based pagination will be added in a future phase without breaking existing clients (new optional `cursor` and `limit` query params, with a `nextCursor` in the response).

### Response Casing

All JSON keys use camelCase in responses. The server converts from the database's snake_case internally.

### Timestamps

All timestamps are ISO 8601 strings in UTC (e.g., "2026-10-12T00:00:00.000Z"). The `dueDate` field is a date-only string (YYYY-MM-DD).

### Resource Ownership

Every endpoint that reads or modifies a resource verifies that the resource belongs to the authenticated user. A resource belonging to another user returns 404 (not 403) to prevent information leakage about other users' resource IDs.
