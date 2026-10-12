# Integrations Inventory: Todoist Pro

Documents the integration ecosystem and API capabilities relevant to building our alternative.

---

## API Capabilities

### REST API v2 (observed)

| Resource | Endpoints | Key Operations |
|----------|-----------|----------------|
| Projects | 7 endpoints | CRUD, archive/unarchive, list collaborators |
| Sections | 5 endpoints | CRUD |
| Tasks | 7 endpoints | CRUD, close (complete), reopen |
| Comments | 5 endpoints | CRUD on task and project comments |
| Labels (personal) | 5 endpoints | CRUD |
| Shared Labels | 3 endpoints | List names, batch rename, batch remove |

- **Auth:** Bearer token (personal token or OAuth2)
- **Rate limit:** 1,000 requests per user per 15-minute window
- **Idempotency:** X-Request-Id header on POST
- **Body limit:** 1 MiB per request
- **Timeout:** 15 seconds per request

Source: https://developer.todoist.com/rest/v2, accessed 2026-10-11

### Sync API (observed)

- Batch command processing (multiple operations per request)
- Incremental sync via `sync_token` (full sync with `*`)
- Additional resources not in REST: Reminders, Filters, Activity, Notes, User settings
- Reminder types: relative, absolute, location
- Commands use UUID for idempotency and temp_id for resolving new resource IDs within a batch

Source: https://developer.todoist.com/api/v1, accessed 2026-10-11

### OAuth2 (observed)

- Authorization endpoint: `https://app.todoist.com/oauth/authorize`
- Token endpoint: `https://api.todoist.com/oauth/access_token`
- Scopes: `task:add`, `data:read`, `data:read_write`, `data:delete`, `project:delete`, `backups:read`
- RFC 7009-compliant token revocation

Source: https://developer.todoist.com/api/v1, accessed 2026-10-11

### UI Extensions (observed)

- Framework for building extensions that appear within Todoist's UI
- Help Center has developer articles: "What are UI extensions?", "Build your first Todoist UI extension", "Todoist Cards Reference"
- Separate from the REST/Sync APIs

Source: https://todoist.com/help/todoist/integrations, accessed 2026-10-11

---

## Integration Categories (from Help Center)

### Email Integrations (observed)
| Integration | Type |
|-------------|------|
| Gmail | Add-on |
| Outlook Mail | Add-on |
| Apple Mail | Plugin |
| Spark | Plugin |
| Mailbutler | Plugin |
| Email forwarding | Built-in (unique email address per user) |

### Calendar Integrations (observed)
| Integration | Type |
|-------------|------|
| Calendar feed (iCal export) | Built-in |
| Fantastical | Third-party |
| Google Calendar | [inferred from pricing page "calendar integrations"] |
| Outlook Calendar | [inferred] |

### Automation Platforms (observed)
| Integration | Type |
|-------------|------|
| Zapier | Automation |
| IFTTT | Automation |
| Make (Integromat) | Automation |
| n8n | Automation |
| Integrately | Automation |
| Zoho Flow | Automation |
| Pleexy | Sync |
| TaskClone | Sync |

### Communication (observed)
| Integration | Type |
|-------------|------|
| Slack | Two-way integration |
| Microsoft Teams | Two-way integration |
| Jira | Sync |
| Twist | Two-way |
| Zendesk | Integration |

### Time Tracking (observed)
| Integration | Type |
|-------------|------|
| Toggl Track | Timer |
| Clockify | Timer |
| Everhour | Timer |
| Timely | Timer |
| Time Doctor | Timer |
| TMetric | Timer |
| TimeCamp | Timer |
| TrackingTime | Timer |

### Notes & Planning (observed)
| Integration | Type |
|-------------|------|
| Notion | Two-way |
| OneNote | Integration |
| Google Sheets (export extension) | Export |
| Trello (Power-Up) | Integration |
| Sunsama | Sync |
| Ganttify | Visualization |

### Browser Extensions (observed)
| Platform | Purpose |
|----------|---------|
| Chrome | Add tasks from web pages |
| Safari | Add tasks from web pages |
| Firefox | Add tasks from web pages |

### Voice & Wearables (observed)
| Platform | Purpose |
|----------|---------|
| Siri | Voice commands for task creation |
| Apple Watch | View and add tasks |
| Wear OS | View and add tasks |

### Productivity Extensions (observed)
| Extension | Purpose |
|-----------|---------|
| Habit Tracker | Track habits as recurring tasks |
| Task Helper | Bulk task operations |
| Conversation Starters | Meeting prep from project tasks |
| Export to Google Sheets | Data export |

---

## Integration Patterns for Our Implementation

Based on Todoist's integration ecosystem, our alternative should plan for these integration approaches:

### Phase 1 - Core API (MVP)
- REST API with JWT Bearer token auth for all CRUD operations
- No third-party OAuth2 provider or webhook support in MVP (deferred to Phase 5)
- API versioned from day one: `/api/v1/` URL prefix

### Phase 2 - Built-in Integrations
- Email forwarding (inbound email-to-task)
- Calendar feed export (iCal/ICS format)
- Browser extension (Chrome at minimum)

### Phase 3 - Automation Platform Support
- Zapier/Make integration (requires trigger/action definitions)
- Webhook events for external automation
- API documentation for third-party developers

### Considerations
- Todoist's 90+ integrations are largely third-party built on their API, not first-party code
- The REST API covers the core data model; the Sync API adds reminders, filters, and batch operations
- Our API design should be compatible with automation platform requirements (webhooks, polling endpoints, pagination)
- UI Extensions framework suggests an extensibility model we may want to consider post-MVP

---

## What We Will NOT Replicate

Per project constraints (independent implementation, original branding):
- We will not use Todoist's API or connect to their services
- We will build our own API from scratch, informed by the patterns observed
- Integration with third-party services will use those services' own public APIs
- Browser extensions and platform apps will be our own implementations
