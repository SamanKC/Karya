# Feature Checklist: Todoist Pro

Each feature is tagged with its evidence type:
- **[observed]** - Directly confirmed from official documentation
- **[inferred]** - Reasonably deduced from related documentation
- **[unknown]** - Not confirmed; needs investigation

---

## Task Management

| # | Feature | Tier | Evidence | Source |
|---|---------|------|----------|--------|
| T1 | Create task with title (content) | All | [observed] | REST API v2; Help: Tasks |
| T2 | Task description (markdown, links) | All | [observed] | REST API v2 |
| T3 | Due date (date only) | All | [observed] | REST API v2 |
| T4 | Due date with time | All | [observed] | REST API v2 (due.datetime) |
| T5 | Due date with timezone | All | [observed] | REST API v2 (due.timezone) |
| T6 | Fixed vs floating time | All | [observed] | Help: fixed/floating time article |
| T7 | Recurring dates (every) | All | [observed] | Help: Recurring dates |
| T8 | Completion-based recurrence (every!) | All | [observed] | Help: Recurring dates |
| T9 | Recurring date patterns (nth workday, holidays, intervals) | All | [observed] | Help: Recurring dates |
| T10 | Deadlines (separate from due date) | Pro | [observed] | REST API v2 (deadline object); Pricing |
| T11 | Task duration (minutes or days) | Pro | [observed] | REST API v2 (duration object); Pricing |
| T12 | Priority levels (p1-p4) | All | [observed] | REST API v2 (priority 1-4) |
| T13 | Labels (multiple per task) | All | [observed] | REST API v2 (labels[]) |
| T14 | Subtasks (parent-child) | All | [observed] | REST API v2 (parent_id) |
| T15 | Comments on tasks (text) | All | [observed] | REST API v2 (comments endpoint) |
| T16 | Comments with file attachments | All | [observed] | REST API v2 (attachment object) |
| T17 | Audio comments | All | [observed] | Help: audio comments article |
| T18 | Task assignment (in shared projects) | All | [observed] | REST API v2 (assignee_id) |
| T19 | Complete / uncomplete task | All | [observed] | REST API v2 (close/reopen endpoints) |
| T20 | Delete task | All | [observed] | REST API v2 (DELETE endpoint) |
| T21 | Duplicate task (copies active subtasks) | All | [observed] | Help: Tasks |
| T22 | Move task between projects/sections | All | [observed] | Help: Tasks |
| T23 | Bulk task operations (multi-select) | All | [observed] | Help: "Add or manage multiple tasks" |
| T24 | Uncompletable tasks (section headers) | All | [observed] | Help: "Create an uncompletable task" |
| T25 | Task text formatting (markdown) | All | [observed] | Help: "Format text in a Todoist task" |
| T26 | Copy link to task | All | [observed] | Help: Tasks |
| T27 | Print tasks | All | [observed] | Help: "Print your Todoist tasks" |
| T28 | Task completion sound | All | [observed] | Help: Tasks (settings toggle) |

## Quick Add & Natural Language

| # | Feature | Tier | Evidence | Source |
|---|---------|------|----------|--------|
| Q1 | Quick Add modal (Q shortcut) | All | [observed] | Help: Quick Add |
| Q2 | Natural language date parsing | All | [observed] | Help: Quick Add; Recurring dates |
| Q3 | Label detection (% prefix) | All | [observed] | Help: Labels |
| Q4 | Priority detection (p1-p4) | All | [observed] | Help: Filters (filter syntax) |
| Q5 | Project/section detection (#, /) | All | [observed] | Help: Filters (prefix syntax) |
| Q6 | Reminder shortcut (! prefix) | Pro | [observed] | Help: Reminders |
| Q7 | Smart date recognition toggle | All | [observed] | Help: "Turn smart date recognition on or off" |
| Q8 | Global Quick Add shortcut (from other apps) | All | [observed] | Help: Quick Add |
| Q9 | Multi-language date parsing | All | [observed] | REST API v2 (due_lang parameter) |
| Q10 | Customizable Quick Add defaults | All | [observed] | Help: "Customize Quick Add" |

## Projects & Sections

| # | Feature | Tier | Evidence | Source |
|---|---------|------|----------|--------|
| P1 | Create / edit / delete project | All | [observed] | REST API v2 |
| P2 | Project color | All | [observed] | REST API v2 (color field) |
| P3 | Sub-projects (nesting via parent_id) | All | [observed] | REST API v2; Help: sub-projects |
| P4 | Project view style (list or board default) | All | [observed] | REST API v2 (view_style) |
| P5 | Archive / unarchive project | All | [observed] | REST API v2 |
| P6 | Favorite projects | All | [observed] | REST API v2 (is_favorite) |
| P7 | Inbox as default project | All | [observed] | REST API v2 (is_inbox_project) |
| P8 | Sections within projects | All | [observed] | REST API v2 |
| P9 | Collapsible sections | All | [observed] | Sync API (is_collapsed) |
| P10 | Section reordering | All | [observed] | Sync API (reorder command) |
| P11 | Project templates | All | [observed] | Help: templates |
| P12 | Share project (up to 5 collaborators) | All | [observed] | Pricing page |
| P13 | Project comment count | All | [observed] | REST API v2 (comment_count) |
| P14 | Project folders | Business | [observed] | Sync API (folder_id) |

## Views

| # | Feature | Tier | Evidence | Source |
|---|---------|------|----------|--------|
| V1 | List layout | All | [observed] | Help: list layout |
| V2 | Board layout (Kanban) | All | [observed] | Help: board layout |
| V3 | Calendar layout (Week, 3-day, Month) | Pro | [observed] | Help: calendar layout |
| V4 | Today view | All | [observed] | Features page |
| V5 | Upcoming view | All | [observed] | Features page |
| V6 | Sort tasks (date, priority, name, assignee) | All | [observed] | Help: "Sort or group tasks" |
| V7 | Group tasks (date, priority, label, section) | All | [observed] | Help: "Sort or group tasks" |
| V8 | Task coloring (priority, label, project) | Pro | [observed] | Help: calendar layout |
| V9 | Completed tasks toggle | All | [observed] | Help: "View completed tasks" |
| V10 | Drag-and-drop reordering (list) | All | [observed] | Help: Tasks |
| V11 | Drag-and-drop rescheduling (calendar) | Pro | [observed] | Help: calendar layout |
| V12 | Time-blocking in calendar | Pro | [observed] | Help: calendar layout |

## Filters & Labels

| # | Feature | Tier | Evidence | Source |
|---|---------|------|----------|--------|
| F1 | Create / edit / delete filter | All (3 free, 150 Pro) | [observed] | Pricing; REST API |
| F2 | Filter query language (boolean, prefixes) | All | [observed] | Help: Filters |
| F3 | Date-based filter keywords | All | [observed] | Help: Filters |
| F4 | Priority-based filters | All | [observed] | Help: Filters |
| F5 | Label-based filters (% prefix) | All | [observed] | Help: Filters |
| F6 | Assignment-based filters | All | [observed] | Help: Filters |
| F7 | Search within filters | All | [observed] | Help: Filters |
| F8 | Wildcard support (*) | All | [observed] | Help: Filters |
| F9 | Multi-query filters (comma-separated) | All | [observed] | Help: Filters |
| F10 | Favorite filters | All | [observed] | Help: Favorites article |
| F11 | Personal labels (colored) | All | [observed] | Help: Labels |
| F12 | Shared labels (gray, from collaborators) | All | [observed] | Help: Labels |
| F13 | Label colors | All | [observed] | Help: Labels |
| F14 | Shared label rename/remove (batch) | All | [observed] | REST API v2 |

## Reminders

| # | Feature | Tier | Evidence | Source |
|---|---------|------|----------|--------|
| R1 | Automatic reminders (on timed tasks) | All | [observed] | Help: Reminders |
| R2 | Custom time-based reminders | Pro | [observed] | Help: Reminders |
| R3 | Multiple reminders per task | Pro | [observed] | Help: Reminders |
| R4 | Recurring reminders | Pro | [observed] | Help: Reminders |
| R5 | Location-based reminders | Pro | [observed] | Help: Reminders |
| R6 | Reminder shortcut (! in Quick Add) | Pro | [observed] | Help: Reminders |
| R7 | Assign reminder to collaborator | All | [observed] | Help: Reminders |
| R8 | Snooze reminders | All (iOS/Android only) | [observed] | Help: Reminders |

## Collaboration

| # | Feature | Tier | Evidence | Source |
|---|---------|------|----------|--------|
| C1 | Share project with collaborators | All | [observed] | Pricing; REST API |
| C2 | Assign tasks to collaborators | All | [observed] | REST API v2 (assignee_id) |
| C3 | Task and project comments | All | [observed] | REST API v2 |
| C4 | Collaborator list per project | All | [observed] | REST API v2 (/collaborators) |
| C5 | Team workspaces | Business | [observed] | Pricing page |
| C6 | Team roles and permissions | Business | [observed] | Pricing page |

## Productivity & Gamification

| # | Feature | Tier | Evidence | Source |
|---|---------|------|----------|--------|
| G1 | Karma points | All | [observed] | Help: Karma |
| G2 | Daily/weekly goals | All | [inferred] | Help: Productivity view title |
| G3 | Productivity charts | All | [observed] | Features page |
| G4 | Activity history | 1wk free / Full Pro | [observed] | Pricing page |
| G5 | Completed tasks archive | All | [observed] | Help: "View completed tasks" |
| G6 | Vacation mode | All | [observed] | Help: vacation mode |
| G7 | Reporting view | All | [observed] | Help: "View Reporting" |
| G8 | Insights feature | All | [unknown] | Help: "Introduction to Insights" title only |

## Platform & Access

| # | Feature | Tier | Evidence | Source |
|---|---------|------|----------|--------|
| X1 | Web app | All | [observed] | Features page |
| X2 | Desktop app (macOS, Windows) | All | [observed] | Features page; Help Center |
| X3 | iOS app | All | [observed] | Help Center (iOS articles) |
| X4 | Android app | All | [observed] | Help Center (Android articles) |
| X5 | Apple Watch app | All | [observed] | Help: Apple Watch |
| X6 | Wear OS app | All | [observed] | Help: Wear OS |
| X7 | Browser extensions (Chrome, Safari, Firefox) | All | [observed] | Help: browser extensions |
| X8 | Email forwarding to create tasks | All | [observed] | Help: "Forward emails to Todoist" |
| X9 | Offline mode | All | [observed] | Help: "Use Todoist while offline" |
| X10 | Multi-window (desktop) | All | [observed] | Help: multi-windows article |
| X11 | Home screen widgets (iOS, Android) | All | [observed] | Help: widget articles |
| X12 | Siri integration | All | [observed] | Help: Siri article |
| X13 | iOS Shortcuts | All | [observed] | Help: Shortcuts article |
| X14 | Keyboard shortcuts | All | [observed] | Help: keyboard shortcuts |

## AI Features

| # | Feature | Tier | Evidence | Source |
|---|---------|------|----------|--------|
| A1 | Ramble (voice-to-task AI) | Limited free / Unlimited Pro | [observed] | Pricing page |
| A2 | Task Assist (AI task creation) | Pro | [observed] | Pricing page |
| A3 | Filter Assist | Pro | [observed] | Pricing page (mentioned) |
| A4 | Email Assist | Pro | [observed] | Pricing page (mentioned) |
