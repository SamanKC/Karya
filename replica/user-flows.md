# User Flows: Todoist Pro

Documents the key user workflows from trigger to outcome.

---

## 1. Create a Task (Quick Add)

**Trigger:** User presses Q or global shortcut
**Steps:**
1. Quick Add modal opens with cursor in text input
2. User types task content with natural language: "Call dentist tomorrow at 2pm p1 %health"
3. Parser detects and highlights: date ("tomorrow at 2pm"), priority ("p1"), label ("%health")
4. Chips appear below input for detected entities
5. User optionally adjusts project/section via picker
6. User presses Enter or clicks "Add task"
7. Modal closes; task appears in target project with all parsed attributes

**Alternate paths:**
- User clicks "Add task" button in a project/section: inline creation within that context
- Mobile: user drags Dynamic Add button to a calendar day to set date

**Evidence:** Help Center - Quick Add article [observed]
Source: https://todoist.com/help/todoist/features/use-task-quick-add-in-todoist-va4Lhpzz, accessed 2026-10-11

---

## 2. Create a Task with Recurring Date

**Trigger:** User creates or edits a task
**Steps:**
1. User types "every Monday at 9am" in the date field or Quick Add
2. Parser recognizes recurring pattern; date chip shows recurrence icon
3. Task saves with `due.is_recurring = true` and `due.string = "every Monday at 9am"`
4. Task appears on next Monday
5. On completion, next occurrence auto-schedules to following Monday (scheduled-based)

**Variation (completion-based):**
1. User types "every! 3 days"
2. On completion, next date = completion date + 3 days

**Evidence:** Help Center - recurring dates article [observed]
Source: https://todoist.com/help/todoist/features/introduction-to-recurring-dates-YUYVJJAV, accessed 2026-10-11

---

## 3. Organize Tasks into Projects and Sections

**Trigger:** User wants to group related tasks
**Steps:**
1. User clicks "+ Add Project" in sidebar
2. Enters project name, selects color, optionally sets parent project and view style (list/board)
3. Project appears in sidebar under Projects
4. User opens project, clicks "+ Add section"
5. Enters section name; section appears as divider
6. User creates tasks within sections, or drags existing tasks into sections
7. User optionally adds sub-projects by dragging a project under another (indent)

**Evidence:** Help Center - projects and sections articles [observed]
Source: https://todoist.com/help/todoist/features/introduction-to-projects-TLTjNftLM, accessed 2026-10-11

---

## 4. Complete a Task

**Trigger:** User clicks/taps the checkbox on a task
**Steps (one-time task):**
1. Task checkbox animates to filled state
2. Task fades from active list
3. Karma point awarded
4. Task moves to completed archive
5. Undo available briefly

**Steps (recurring task):**
1. Task checkbox animates
2. Current occurrence marked complete
3. Next occurrence auto-scheduled per recurrence rule
4. Task remains in active list with new date
5. Undo window is brief; after it expires, occurrence cannot be uncompleted

**Steps (parent with subtasks):**
1. Completing all subtasks does not auto-complete parent [inferred]
2. Completing parent does not auto-complete subtasks [inferred]
3. Uncompleting a subtask also uncompletes its parent [observed]

**Evidence:** Help Center - tasks article [observed]
Source: https://todoist.com/help/todoist/features/introduction-to-tasks-080OAXric, accessed 2026-10-11

---

## 5. Use Filters to Find Tasks

**Trigger:** User wants a custom view of tasks across projects
**Steps:**
1. User clicks "+" next to Filters & Labels in sidebar
2. Selects "Add filter"
3. Enters filter name and query, e.g., `(today | overdue) & p1`
4. Filter appears in sidebar under Filters & Labels
5. Clicking the filter shows matching tasks
6. User optionally favorites the filter for quick access

**Query capabilities:**
- Boolean: `&` (AND), `|` (OR), `!` (NOT)
- Entity refs: `#Project`, `##Project+subs`, `/Section`, `%Label`
- Date: `today`, `overdue`, `no date`, `date before: Jan 1`, `5 days`
- Priority: `p1` through `p4`
- People: `assigned to: me`, `assigned by: others`
- Search: `search: keyword`
- Wildcards: `%home*`
- Multi-query: comma separates independent lists

**Evidence:** Help Center - filters article [observed]
Source: https://todoist.com/help/todoist/features/introduction-to-filters-V98wIH, accessed 2026-10-11

---

## 6. Set a Reminder [Pro]

**Trigger:** User wants notification before a task is due
**Steps (custom time-based):**
1. User opens task detail view
2. Clicks "Reminders"
3. Selects "Date & time" tab
4. Picks date/time or enters relative time ("30 minutes before")
5. Reminder saved; notification fires at specified time

**Steps (Quick Add shortcut):**
1. In Quick Add, user types `!30m` or `!every 5pm`
2. Reminder parsed and attached to task

**Steps (automatic):**
1. User sets a due date with time on any task
2. Auto-reminder fires at configured lead time (from Reminders settings)

**Evidence:** Help Center - reminders article [observed]
Source: https://todoist.com/help/todoist/features/introduction-to-reminders-9PezfU, accessed 2026-10-11

---

## 7. Collaborate on a Shared Project

**Trigger:** User wants to work with others on a project
**Steps:**
1. User opens project, clicks "Share" or uses the share button
2. Enters collaborator's email
3. Collaborator receives invitation
4. Both users see the project; tasks can be assigned via assignee picker
5. Comments with @mentions notify collaborators
6. Activity log shows who did what

**Limits:** Up to 5 people per personal project [observed]

**Evidence:** Help Center - collaboration article, pricing page [observed]
Source: https://todoist.com/help/todoist/features/collaborate-with-friends-or-family-in-todoist-tzkGUy, accessed 2026-10-11

---

## 8. Switch Between Views

**Trigger:** User wants to see project tasks in a different layout
**Steps:**
1. User opens a project
2. Clicks "Display" menu
3. Under "Layout," selects List, Board, or Calendar
4. View re-renders with same tasks in new layout
5. Display preferences persist per project [inferred]

**Evidence:** Help Center - calendar, board, list layout articles [observed]
Source: https://todoist.com/help/todoist/features/use-the-calendar-layout-in-todoist-lPHRQTu0o, accessed 2026-10-11

---

## 9. Use the Calendar for Time-Blocking [Pro]

**Trigger:** User wants to plan their day by blocking time
**Steps:**
1. User opens Upcoming view or a project in Calendar layout
2. Selects Week or 3-day view
3. Press and holds on an empty time slot to create a task
4. Drags the task block to adjust start time and duration
5. Task saves with due datetime and duration
6. Existing tasks can be dragged to new times/days

**Evidence:** Help Center - calendar layout article [observed]
Source: https://todoist.com/help/todoist/features/use-the-calendar-layout-in-todoist-lPHRQTu0o, accessed 2026-10-11

---

## 10. Email to Task

**Trigger:** User receives an email they want to act on
**Steps:**
1. User forwards email to their unique Todoist email address
2. Todoist creates a task with email subject as task name
3. Email body appears in task comments [inferred]
4. Task lands in Inbox (or configured project)

**Evidence:** Help Center - "Forward emails to Todoist" [observed]
Source: https://todoist.com/help/todoist/features/forward-emails-to-todoist-JPJ1V339, accessed 2026-10-11
