# Reconnaissance Report: Todoist Pro Alternative

## Project Overview

**Reference application:** Todoist (https://todoist.com)
**Target tier:** Pro-equivalent feature set
**Date conducted:** 2026-10-11
**Methodology:** Public source analysis only (official website, Help Center, developer documentation, pricing pages)

## Sources Consulted

| Source | URL | Accessed | Type |
|--------|-----|----------|------|
| Pricing & Plans | https://todoist.com/pricing | 2026-10-11 | Official |
| Features Overview | https://todoist.com/features | 2026-10-11 | Official |
| Help Center Index | https://todoist.com/help/todoist/features | 2026-10-11 | Official |
| REST API v2 Reference | https://developer.todoist.com/rest/v2 | 2026-10-11 | Official |
| Sync API v1 Reference | https://developer.todoist.com/api/v1 | 2026-10-11 | Official |
| Help: Filters | https://todoist.com/help/todoist/features/introduction-to-filters-V98wIH | 2026-10-11 | Official |
| Help: Recurring Dates | https://todoist.com/help/todoist/features/introduction-to-recurring-dates-YUYVJJAV | 2026-10-11 | Official |
| Help: Reminders | https://todoist.com/help/todoist/features/introduction-to-reminders-9PezfU | 2026-10-11 | Official |
| Help: Tasks | https://todoist.com/help/todoist/features/introduction-to-tasks-080OAXric | 2026-10-11 | Official |
| Help: Sidebar | https://todoist.com/help/todoist/features/customize-the-sidebar-and-navigation-menu-in-todoist-S9JLTYqZV | 2026-10-11 | Official |
| Help: Calendar Layout | https://todoist.com/help/todoist/features/use-the-calendar-layout-in-todoist-lPHRQTu0o | 2026-10-11 | Official |
| Help: Labels | https://todoist.com/help/todoist/features/introduction-to-labels-dSo2eE | 2026-10-11 | Official |
| Help: Integrations | https://todoist.com/help/todoist/integrations | 2026-10-11 | Official |

## Plan Tiers (observed)

| Feature | Beginner (Free) | Pro | Business |
|---------|-----------------|-----|----------|
| Personal projects | 5 | 300 | 300/member |
| Custom filters | 3 | 150 | 150/member |
| File uploads | 5 MB | 100 MB | 100 MB |
| Activity history | 1 week | Full | Full |
| Themes | 4 | 8 | 8 |
| Ramble (AI voice) | Limited | Unlimited | Unlimited |
| Calendar layout | No | Yes | Yes |
| Task duration | No | Yes | Yes |
| Custom reminders | No (single auto) | Yes (multiple) | Yes (multiple) |
| Deadlines | No | Yes | Yes |
| Task Assist (AI) | No | Yes | Yes |
| Team projects | No | No | Up to 500 |
| Team members | No | No | Up to 1,000 |

Source: https://todoist.com/pricing, accessed 2026-10-11 [observed]

## High-Level Feature Summary

### Core Task Management (observed)
- Task creation with content, description (markdown), due dates, priorities (1-4), labels, project/section assignment
- Subtasks (parent-child nesting)
- Comments with file attachments and audio
- Task durations (amount + unit: minute or day) [Pro]
- Deadlines separate from due dates [Pro]
- Recurring dates with natural language parsing ("every Monday", "every! 3 days")
- Quick Add with `Q` shortcut, natural language date/time/label/priority parsing
- Bulk task management (multi-select, edit, move)
- Task completion with Karma points, undo window for recurring tasks

### Project & Section Organization (observed)
- Projects as top-level containers; sub-projects via parent_id nesting
- Sections within projects for grouping
- Inbox as default unsorted project
- Favorites for quick access to projects, labels, filters
- Templates (prebuilt and custom)

### Views (observed)
- **List layout:** Default task list view
- **Board layout:** Kanban-style columns by section
- **Calendar layout:** Week, 3-day, Month views (Pro+); drag-and-drop rescheduling; time-blocking
- **Today view:** Tasks due today
- **Upcoming view:** Schedule planning with drag-and-drop
- Sorting: by date, priority, label, project, alphabetical; grouping options
- Task coloring by priority, label, or project in calendar views

### Filters & Labels (observed)
- Filter query language with operators (`&`, `|`, `!`), prefixes (`#` project, `##` sub-projects, `/` section, `%` label)
- Keywords: priority (p1-p4), date ranges, overdue, no date, recurring, subtask, search, assigned to/by, shared
- Wildcards (`*`), grouping with parentheses
- Labels: personal (colored) and shared (gray); creation via `%` prefix
- No maximum label count documented

### Reminders (observed)
- Automatic reminders on timed tasks (configurable lead time)
- Custom time-based reminders [Pro]
- Location-based reminders [separate guide]
- Recurring reminders (e.g., "ev Tuesday 7:00")
- `!` shortcut in Quick Add for reminders
- Assignable reminders in shared projects

### Collaboration (observed)
- Shared projects with collaborators (up to 5 per personal project)
- Task assignment (assignee_id)
- Comments on tasks and projects
- Team workspaces with roles and permissions [Business]

### Productivity Tracking (observed)
- Karma points system
- Productivity view with completion charts
- Activity/reporting history (1 week free, full on Pro+)
- Completed tasks archive
- Vacation mode (pauses Karma penalties)

### Integrations (observed)
- 90+ third-party integrations across categories: email, automation (Zapier, IFTTT, Make), time tracking, communication (Slack, Teams), calendars, browsers, notes
- Calendar feed export
- Email forwarding to create tasks
- Browser extensions (Chrome, Safari, Firefox)
- REST API v2 and Sync API for developers
- UI Extensions framework
- OAuth2 authentication for third-party apps

### AI Features (observed)
- Ramble: voice-to-task AI (limited on Beginner, unlimited on Pro+)
- Task Assist: AI-assisted task creation [Pro]
- Filter Assist, Email Assist mentioned on pricing page

## API Summary

### REST API v2 (observed)
- Base URL: `https://api.todoist.com/rest/v2`
- Auth: Bearer token
- Rate limit: 1,000 requests per user per 15-minute window
- Resources: Projects, Sections, Tasks, Comments, Labels, Shared Labels
- Task fields: id, content, description, comment_count, is_completed, labels[], priority (1-4), due (object), deadline (object), duration (object), project_id, section_id, parent_id, order, assignee_id, creator_id, created_at, url

### Sync API (observed)
- Batch command processing with sync_token for incremental reads
- Additional resources: Reminders, Filters, Notes, Activity
- Reminder types: relative, absolute, location

Source: https://developer.todoist.com/rest/v2, accessed 2026-10-11 [observed]

## Key Observations for Implementation

1. **Dual date system:** Tasks have both `due` (scheduling) and `deadline` (hard deadline) objects. These serve different purposes and both should be modeled.
2. **Priority inversion:** API priority 4 = highest urgency (p1 in UI), priority 1 = normal (p4 in UI). Our implementation should use a consistent mapping.
3. **Filter query language:** A full filter DSL with boolean logic, date math, and entity references. This is a significant implementation effort.
4. **Natural language parsing:** Dates, times, labels, priorities, and reminders are all parsed from free-text input. This requires a dedicated parser or NLP integration.
5. **Recurring date complexity:** Two modes (scheduled-based `every` vs completion-based `every!`), support for nth workday, date ranges, holidays, and interval math.
6. **View flexibility:** Three layout modes (list, board, calendar) for the same data, plus Today/Upcoming aggregate views.
7. **No pagination on REST API:** List endpoints return full arrays. This simplifies the API but may be a concern at scale.
