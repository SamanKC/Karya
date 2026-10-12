# Open Questions: Todoist Pro Alternative

Issues, gaps, and decisions that need resolution before or during implementation.

---

## Resolved Questions

### Q1: Recurring date storage
**Question:** How should recurring date rules be stored?
**Decision (ADR-006):** Store both the original natural language string (`due_string`, e.g., "every Monday") and computed fields (`due_date`, `due_datetime`, `is_recurring`). The string preserves the user's intent for editing; the computed fields drive scheduling. Deferred to Phase 2 -- these fields are not in the Phase 1 schema.
**Status:** Resolved

### Q2: Subtask depth limit
**Question:** Is there a depth limit for subtasks?
**Decision (ADR-004):** Maximum 4 levels including the parent task. Enforced at the API layer on create and move operations. Deeper nesting creates UI indentation problems and recursive query complexity.
**Status:** Resolved

### Q3: Task ordering system
**Question:** What ordering algorithm should we use?
**Decision (ADR-003):** Integer-based ordering with gaps (multiples of 1000). Insert between two tasks at the midpoint. Rebalance all tasks in scope when gaps are exhausted. Simple, debuggable, and sufficient for expected task counts per project.
**Status:** Resolved

### Q4: Soft delete vs hard delete
**Question:** Soft-delete or hard-delete?
**Decision (ADR-005):** Hard delete for MVP. Tasks, projects, sections, and labels are permanently removed on delete. Completed tasks remain in the tasks table with `is_completed = true` and `completed_at` timestamp. Undo is handled client-side with a brief toast window that can re-create the entity. Soft delete can be added later if undo requirements grow.
**Status:** Resolved

### Q5: Priority inversion mapping
**Question:** Which priority convention to adopt?
**Decision (ADR-002):** Higher numbers = higher priority in both API and storage. Priority 4 = urgent (p1 in UI, red). Priority 1 = normal (p4 in UI). The UI maps API values to display labels.
**Status:** Resolved

### Q11: Technology stack
**Question:** Which specific technologies?
**Decision (ADR-001):** TypeScript full-stack. Node.js + Express backend, React + Vite frontend, Tailwind CSS, Prisma ORM, MySQL 8+, JWT auth with Argon2id, Vitest + Playwright for testing. See decisions.md for full rationale.
**Status:** Resolved

### Q13: Natural language date parser
**Question:** Build custom or use a library?
**Decision:** Use chrono-node for English NLP date parsing in Phase 2. Extend with custom patterns for recurring dates.
**Status:** Resolved (Phase 2)

### Q15: Authentication method
**Question:** Session-based or JWT?
**Decision (ADR-007):** JWT access tokens (15-minute expiry) + rotating refresh tokens (7-day expiry, stored in DB). Argon2id for password hashing. Email verification required. Social login (Google, Apple) deferred to Phase 5.
**Status:** Resolved

### Q16: Web-only or multi-platform?
**Question:** Should MVP target web only?
**Decision:** Web-first MVP (responsive). Mobile app deferred to Phase 5.
**Status:** Resolved

### Q19: Todoist features to intentionally omit
**Question:** Which features are permanently out of scope?
**Decision:** The following are excluded entirely (not deferred):
- Location-based reminders (R5) -- requires mobile GPS, geofencing
- Audio comments (T17) -- requires recording/playback infrastructure
- AI features (A1-A4) -- separate product decision
- Voice/wearable integrations (X5, X6, X12, X13) -- platform-specific
- Home screen widgets (X11) -- platform-specific
- Team workspaces and roles (C5, C6) -- Business tier, out of scope
- Project folders (P14) -- Business tier only
- Multi-window desktop (X10) -- desktop app feature
**Status:** Resolved

### Q20: API versioning strategy
**Question:** How to version the API?
**Decision:** URL-based versioning (`/api/v1/`) from day one. All endpoints prefixed.
**Status:** Resolved

---

## Open Questions

### Q6: Filter query language completeness
**Question:** The filter DSL is a significant implementation effort. Which subset is essential for the first filter release?
**Impact:** Development timeline, user expectations.
**Plan:** Filters are Phase 4. Start with basic filters (project, priority, date, label) and add boolean logic and advanced keywords incrementally.
**Status:** Open (Phase 4 decision)

### Q7: Automatic reminders behavior
**Question:** What's the default lead time for auto-reminders? What notification channels are used?
**Impact:** Reminder system architecture, notification infrastructure.
**Status:** [unknown] -- deferred to Phase 4 planning.

### Q8: Calendar view data granularity
**Question:** How are tasks without times displayed in calendar week view?
**Impact:** Calendar UI design.
**Status:** [unknown] -- deferred to Phase 4 planning.

### Q9: Completed task behavior with subtasks
**Question:** When a parent task is completed, should subtasks be auto-completed?
**Impact:** Completion logic.
**Current plan:** For MVP, completing a parent does not auto-complete subtasks, and completing all subtasks does not auto-complete the parent. Uncompleting a subtask uncompletes its parent (observed in Todoist). This can be refined based on user feedback.
**Status:** Open (may revisit post-MVP)

### Q10: Shared label lifecycle
**Question:** Should shared labels be modeled differently from personal labels?
**Impact:** Data model design, label management UI.
**Status:** Deferred to Phase 3 (collaboration). MVP uses personal labels only.

### Q12: Real-time sync approach
**Question:** How should concurrent edits be handled?
**Impact:** Architecture, offline support, collaboration features.
**Status:** Deferred to Phase 3 (collaboration). MVP is single-user; standard request/response is sufficient.

### Q14: File storage for attachments
**Question:** Where to store comment attachments?
**Impact:** Infrastructure requirements, cost, scalability.
**Status:** Deferred to Phase 3 (collaboration).

### Q17: Branding and naming
**Question:** What is the product name, visual identity, and brand positioning?
**Impact:** UI design, domain registration, all frontend work.
**Status:** **Open -- must be resolved before frontend implementation begins.** Development can start with a placeholder name, but final branding affects routes, page titles, and email templates.

### Q18: Hosting and deployment
**Question:** Cloud provider, containerization, CI/CD pipeline?
**Impact:** Infrastructure cost, deployment speed, scalability.
**Status:** Open -- resolve before first deployment. Docker + a managed MySQL instance is the likely baseline.

---

## New Questions (from cross-document review)

### Q21: Notification infrastructure
**Question:** What system delivers reminder notifications and collaboration alerts? Push notifications, email, in-app, or all three?
**Impact:** Requires a job scheduler (cron or queue), email sending service, and possibly a push notification provider.
**Status:** Deferred to Phase 3/4 planning. Not needed for MVP.

### Q22: Backup and export strategy
**Question:** How are user data backups handled? What export formats are supported?
**Impact:** Data integrity, user trust, regulatory compliance.
**Plan:** Database-level: automated daily backups of the MySQL database. User-level: JSON export of all user data via an API endpoint (Phase 2 or 3). CSV export of tasks is a nice-to-have.
**Status:** Open -- database backups should be configured at deployment time.

### Q23: Completed task retention
**Question:** Should completed tasks be retained indefinitely, or should there be an archival/cleanup policy?
**Impact:** Database size, query performance, storage costs.
**Plan:** Indefinite retention for MVP. Use a filtered index on `is_completed = false` to keep active queries fast. Revisit if the tasks table exceeds performance thresholds.
**Status:** Open (monitor post-launch)

---

## Evidence Gaps

The following areas were not fully covered by our research and may need additional investigation:

| Area | What's Missing | Source to Check |
|------|---------------|-----------------|
| Webhooks | Event types, payload format, delivery guarantees | developer.todoist.com (webhooks section) |
| Activity log | Exact event types, retention policy | Sync API activity resource |
| Completed tasks API | Endpoint for querying completed tasks | Sync API completed items |
| Backup/export | CSV export format, backup schedule | Help Center backup articles |
| Keyboard shortcuts | Full shortcut list | Help Center shortcuts article |
| Search | Search syntax, indexed fields, ranking | Help Center search article |
| Insights | What Insights shows vs Productivity view | Help Center Insights article |
| Themes | Available colors/themes beyond count | Help Center or app inspection |
| Pagination | Whether REST API truly has no pagination | API at scale testing |
