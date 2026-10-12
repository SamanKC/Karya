# Data Model: Todoist Pro Alternative

Derived from the Todoist REST API v2 and Sync API documentation.
This is a reference model for our independent implementation, not a copy of Todoist's schema.

---

## Entity Relationship Overview

```
User 1--* Project
User 1--* Label (personal)
User 1--* Filter
Project 1--* Section
Project 1--* Task (via project_id)
Project 0..1--* Project (sub-projects via parent_id)
Section 1--* Task (via section_id)
Task 0..1--* Task (subtasks via parent_id)
Task *--* Label (many-to-many via task_labels join table)
Task 1--* Comment
Task 1--* Reminder
Project 1--* Comment (project comments)
Project *--* User (collaborators)
```

---

## Core Entities

### User

| Field | Type | Notes |
|-------|------|-------|
| id | string (UUID) | Primary key |
| email | string | Unique, used for auth |
| name | string | Display name |
| timezone | string | IANA timezone (e.g., "America/New_York") |
| locale | string | Language preference (IETF tag) |
| plan | enum | beginner, pro, business |
| karma_score | integer | Productivity score |
| created_at | datetime | Account creation |

**Evidence:** Sync API returns user object; REST API collaborator has id, name, email [observed]
Source: https://developer.todoist.com/rest/v2, accessed 2026-10-11

---

### Project

| Field | Type | Notes |
|-------|------|-------|
| id | string | Primary key |
| name | string | Required |
| description | string | Optional [inferred from Sync API] |
| color | string | Color name/code |
| parent_id | string or null | Sub-project nesting |
| order | integer | Position among siblings (read-only in REST) |
| view_style | enum | "list" or "board" |
| is_shared | boolean | Read-only; true if collaborators exist |
| is_favorite | boolean | Pinned to favorites |
| is_inbox_project | boolean | Read-only; the default inbox |
| is_archived | boolean | Soft-delete state |
| comment_count | integer | Read-only count |
| folder_id | string or null | Business: team folder [observed in Sync API] |
| created_at | datetime | |
| updated_at | datetime | |

**Evidence:** REST API v2 project object [observed]
Source: https://developer.todoist.com/rest/v2, accessed 2026-10-11

---

### Section

| Field | Type | Notes |
|-------|------|-------|
| id | string | Primary key |
| project_id | string | FK to Project |
| name | string | Required |
| order | integer | Position within project |
| is_collapsed | boolean | UI state [observed in Sync API] |
| is_archived | boolean | [observed in Sync API] |
| created_at | datetime | |
| updated_at | datetime | |

**Evidence:** REST API v2 section object + Sync API fields [observed]
Source: https://developer.todoist.com/rest/v2, accessed 2026-10-11

---

### Task

| Field | Type | Notes |
|-------|------|-------|
| id | string | Primary key |
| content | string | Task title; supports markdown and links |
| description | string | Extended notes; supports markdown and links |
| project_id | string | FK to Project (read-only in REST responses) |
| section_id | string or null | FK to Section |
| parent_id | string or null | FK to Task (subtask relationship; read-only in REST) |
| order | integer | Position among siblings (read-only in REST) |
| priority | integer | 1 (normal) to 4 (urgent). Note: API inverts UI labels |
| due | Due object or null | See below |
| deadline | Deadline object or null | Hard deadline [Pro] |
| duration | Duration object or null | Estimated time [Pro] |
| assignee_id | string or null | FK to User (shared projects only) |
| assigner_id | string or null | Who assigned (read-only) |
| creator_id | string | Who created (read-only) |
| is_completed | boolean | Completion state |
| comment_count | integer | Read-only |
| created_at | datetime | |
| updated_at | datetime | |
| completed_at | datetime or null | When the task was completed |
| url | string | Deep link to task in Todoist (read-only) |

**Label association:** Tasks are linked to Labels through a `task_labels` join table (task_id, label_id), not via an embedded string array. This provides relational integrity, efficient querying, and clean rename/delete cascades.

**Subtask depth:** Nesting is limited to 4 levels (including the parent). Deeper nesting creates UI rendering problems and recursive query complexity. Enforced at the API layer on create/move operations.

**Completed tasks:** Completed tasks remain in the tasks table with `is_completed = true` and a `completed_at` timestamp. No separate CompletedTask archive table. Use filtered indexes (WHERE is_completed = false) to keep active-task queries fast. Consider a retention policy for completed tasks older than a configurable period (default: indefinite).

**Evidence:** REST API v2 task object [observed]
Source: https://developer.todoist.com/rest/v2, accessed 2026-10-11

---

### Due (value object, embedded in Task)

| Field | Type | Notes |
|-------|------|-------|
| string | string | Human-readable, e.g., "every Monday at 9am" |
| date | string | YYYY-MM-DD |
| datetime | string or null | RFC3339 UTC; present only for timed tasks |
| timezone | string or null | Present only for timed tasks |
| is_recurring | boolean | |
| lang | string | Language code for natural language parsing |

**Evidence:** REST API v2 due object [observed]
Source: https://developer.todoist.com/rest/v2, accessed 2026-10-11

---

### Deadline (value object, embedded in Task) [Pro]

| Field | Type | Notes |
|-------|------|-------|
| date | string | YYYY-MM-DD |

**Evidence:** REST API v2 deadline object [observed]
Source: https://developer.todoist.com/rest/v2, accessed 2026-10-11

---

### Duration (value object, embedded in Task) [Pro]

| Field | Type | Notes |
|-------|------|-------|
| amount | integer | Positive integer |
| unit | enum | "minute" or "day" |

**Evidence:** REST API v2 duration object [observed]
Source: https://developer.todoist.com/rest/v2, accessed 2026-10-11

---

### Label

| Field | Type | Notes |
|-------|------|-------|
| id | string | Primary key |
| name | string | Unique per user |
| color | string | Color name/code |
| order | integer | Display order |
| is_favorite | boolean | |

**Note:** Shared labels are name-only strings without a dedicated object. They exist on tasks in shared projects and are managed via rename/remove batch endpoints.

**Evidence:** REST API v2 label object + shared label endpoints [observed]
Source: https://developer.todoist.com/rest/v2, accessed 2026-10-11

---

### Comment

| Field | Type | Notes |
|-------|------|-------|
| id | string | Primary key |
| task_id | string or null | FK to Task (null for project comments) |
| project_id | string or null | FK to Project (null for task comments) |
| content | string | Comment text |
| attachment | Attachment or null | File attachment |
| posted_at | datetime | RFC3339 UTC |

**Evidence:** REST API v2 comment object [observed]
Source: https://developer.todoist.com/rest/v2, accessed 2026-10-11

---

### Attachment (value object, embedded in Comment)

| Field | Type | Notes |
|-------|------|-------|
| file_name | string | |
| file_type | string | MIME type |
| file_url | string | Download URL |
| resource_type | string | Type identifier |

**Evidence:** REST API v2 attachment object [observed]
Source: https://developer.todoist.com/rest/v2, accessed 2026-10-11

---

### Filter

| Field | Type | Notes |
|-------|------|-------|
| id | string | Primary key |
| name | string | Display name |
| query | string | Filter query string |
| color | string | [inferred] |
| order | integer | [inferred] |
| is_favorite | boolean | [inferred] |

**Evidence:** Sync API mentions filters resource; REST API does not expose filters endpoint [observed/inferred]
Source: https://developer.todoist.com/api/v1, accessed 2026-10-11

---

### Reminder

| Field | Type | Notes |
|-------|------|-------|
| id | string | Primary key |
| item_id | string | FK to Task |
| notify_uid | string | FK to User (who gets notified) |
| type | enum | "relative", "absolute", "location" |
| due | Due object or null | For time-based reminders |
| minute_offset | integer or null | Minutes before task due time (relative type) |
| loc_lat | float or null | Location latitude |
| loc_long | float or null | Location longitude |
| loc_trigger | string or null | "on_enter" or "on_leave" [inferred] |
| radius | integer or null | Geofence radius in meters [inferred] |
| is_deleted | boolean | Soft delete |

**Evidence:** Sync API reminder object [observed]
Source: https://developer.todoist.com/api/v1, accessed 2026-10-11

---

## Proposed Additional Entities (for our implementation)

These are not directly observed in Todoist's API but are needed for a complete implementation:

### TaskLabel (join table)

| Field | Type | Notes |
|-------|------|-------|
| task_id | string | FK to Task, composite PK |
| label_id | string | FK to Label, composite PK |

**Note:** Replaces the `labels: string[]` pattern from Todoist's REST API with a proper relational join. Todoist's API returns label names on tasks; our implementation uses IDs for integrity.

### ActivityLog

| Field | Type | Notes |
|-------|------|-------|
| id | string | Primary key |
| user_id | string | FK to User who performed action |
| entity_type | string | "task", "project", "section", etc. |
| entity_id | string | FK to affected entity |
| action | string | "created", "completed", "updated", "deleted", etc. |
| details | json | Changed fields |
| occurred_at | datetime | |

**Evidence:** Todoist has activity history with per-project and per-person filtering [inferred]

---

## Priority Mapping Note

Todoist's API uses an inverted priority scale:
- API `priority: 4` = UI "Priority 1" (urgent, red)
- API `priority: 3` = UI "Priority 2" (orange)
- API `priority: 2` = UI "Priority 3" (blue)
- API `priority: 1` = UI "Priority 4" / normal (no color)

**Decision (ADR-002):** Our implementation uses higher numbers = higher priority in both API and storage. Priority 4 = urgent (p1 in UI, red), Priority 1 = normal (p4 in UI, no color). The UI maps API values to display labels: API 4 displays as "p1", API 3 as "p2", API 2 as "p3", API 1 as "p4". This matches Todoist's API convention and avoids a confusing inversion layer.

**Evidence:** REST API v2 documentation notes priority 1 as default/normal and 4 as urgent [observed]
Source: https://developer.todoist.com/rest/v2, accessed 2026-10-11

---

## Implementation Notes

### Task Ordering (ADR-003)

Tasks use integer-based ordering with gaps (multiples of 1000). New tasks inserted between two existing tasks get the midpoint value. When gaps are exhausted (adjacent integers), a background rebalance renumbers all tasks in that scope (section or project) back to multiples of 1000. This is simple to implement, easy to debug, and sufficient for the expected task counts per project (typically under 500).

### Timezone Resolution

The Today and Upcoming views resolve "today" using the authenticated user's `timezone` field (IANA format). The server converts all comparisons: a task with `due_date = 2026-10-12` is "due today" for a user in `Australia/Sydney` starting at 2026-10-12T00:00:00+11:00. Tasks with `due_datetime` (specific time) are compared against the user's current local time. Tasks with only `due_date` (no time) are treated as due at the start of that day in the user's timezone.

### Completion Service Design

The task completion endpoint follows a pipeline pattern:
1. Validate the task exists and belongs to the user
2. Set `is_completed = true` and `completed_at = now()`
3. (Future: check `is_recurring` and delegate to recurrence handler instead of completing)
4. Return the updated task

Step 3 is a hook point. In the MVP, `is_recurring` is always false (no recurring fields in schema). When recurring tasks are added later, the completion handler checks `is_recurring` and branches: recurring tasks reset their due date and stay active instead of completing. This avoids rewriting the completion flow.
