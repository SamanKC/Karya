# Navigation Map: Todoist Pro

Documents the navigation structure, entry points, and transitions between screens.

---

## Primary Navigation (Sidebar)

The sidebar is the main navigation element on web and desktop. On mobile, it appears as a drawer or bottom tab bar.

```
Sidebar
├── Search (Cmd/Ctrl+K)
├── [Avatar] -> Settings, Account
├── Inbox
├── Today
├── Upcoming
├── Filters & Labels
│   ├── [Filter 1] -> Filter View
│   ├── [Filter 2] -> Filter View
│   ├── [Label 1] -> Label View
│   └── + Add Filter / + Add Label
├── Favorites (pinned items)
│   ├── [Favorited Project] -> Project View
│   ├── [Favorited Filter] -> Filter View
│   └── [Favorited Label] -> Label View
├── Projects
│   ├── [Project A] -> Project View
│   │   ├── [Sub-project A1] -> Project View
│   │   └── [Sub-project A2] -> Project View
│   ├── [Project B] -> Project View
│   └── + Add Project
└── [Team Section - Business only]
    ├── Team Projects
    └── Team Settings
```

**Evidence:** Help Center - sidebar customization article [observed]
Source: https://todoist.com/help/todoist/features/customize-the-sidebar-and-navigation-menu-in-todoist-S9JLTYqZV, accessed 2026-10-11

---

## Mobile Navigation

### Bottom Tab Bar (iOS / Android)
- Configurable tabs; views added to the tab bar are removed from the Browse menu
- Default tabs likely include: Today, Inbox, Browse [inferred]
- Browse screen provides access to all sidebar items

### Navigation Bar Customization
- Users can reorder tab bar items
- Platform-specific: iOS uses "Navigation" in settings, Android uses "Navigation menu"

**Evidence:** Help Center - "Customize the Todoist navigation bar" [observed]
Source: https://todoist.com/help/todoist/features/customize-the-todoist-navigation-bar-L4qpkI0xj, accessed 2026-10-11

---

## Screen Transitions

### From Any Screen
| Action | Destination |
|--------|-------------|
| Click sidebar item | That view (Inbox, Today, Upcoming, Project, Filter, Label) |
| Press Q (or global shortcut) | Quick Add Modal (overlay) |
| Cmd/Ctrl+K | Search overlay |
| Click task row | Task Detail View (slide-in panel or modal) |
| Click avatar | Settings |

### From Inbox / Project / Filter / Label Views
| Action | Destination |
|--------|-------------|
| Click "Add task" | Inline task creation (same screen) |
| Switch layout (Display menu) | Same project in List / Board / Calendar layout |
| Click section header | Expand/collapse section (same screen) |
| Drag task (calendar) | Reschedule (same screen, date changes) |

### From Today View
| Action | Destination |
|--------|-------------|
| Click overdue section | Expand overdue tasks (same screen) |
| Click task's project name | Project View [inferred] |

### From Upcoming View
| Action | Destination |
|--------|-------------|
| Click day header | Day's tasks expanded (same screen) |
| Drag task to different day | Reschedule (same screen) |
| Open "No date" panel | Undated tasks drawer (same screen) |

### From Task Detail View
| Action | Destination |
|--------|-------------|
| Click project name | Project View |
| Click parent task | Parent Task Detail View |
| Click subtask | Subtask Detail View |
| Close panel | Return to previous view |

### From Quick Add Modal
| Action | Destination |
|--------|-------------|
| Submit task | Modal closes; task appears in target project |
| Cancel / Escape | Modal closes; return to previous view |

---

## Global Entry Points

| Entry Point | Platform | Description |
|-------------|----------|-------------|
| Quick Add shortcut | All | Global keyboard shortcut opens Quick Add from any app |
| Browser extension | Chrome, Safari, Firefox | Add task from current webpage |
| Email forwarding | All | Forward email to unique Todoist address to create task |
| Share sheet | iOS, Android | Share content from other apps as tasks |
| Widget | iOS, Android | Home screen widget showing Today/Upcoming tasks |
| Apple Watch / Wear OS | Wearables | View and add tasks |
| Siri / voice | iOS | "Hey Siri, add task to Todoist" |
| Dynamic Add button | iOS, Android | Context-aware floating action button |

**Evidence:** Features page and Help Center articles for iOS, Android, browser extensions [observed]
Source: https://todoist.com/features, accessed 2026-10-11

---

## Command Palette (Search)

Accessed via Cmd/Ctrl+K. Functions as both search and quick navigation.
- Search tasks, projects, labels, filters by name
- Access hidden sidebar views
- Quick actions [inferred]

**Evidence:** Help Center sidebar article mentions Cmd+K/Ctrl+K for finding hidden views [observed]
Source: https://todoist.com/help/todoist/features/customize-the-sidebar-and-navigation-menu-in-todoist-S9JLTYqZV, accessed 2026-10-11

---

## Keyboard Shortcuts (observed)

Todoist supports extensive keyboard shortcuts documented in a dedicated Help Center article.

**Evidence:** Help Center - "Use keyboard shortcuts in Todoist" [observed title]
Source: https://todoist.com/help/todoist/features/use-keyboard-shortcuts-in-todoist-Wyovn2, accessed 2026-10-11
