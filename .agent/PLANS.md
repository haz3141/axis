# Axis Execution Plan

Last updated: 2026-03-09
Branch: `feat/capture-focus-pass1`

## Goals

- Strengthen the Axis core loop: Capture -> Organize -> Focus -> Complete -> Review.
- Keep the app shippable at each checkpoint.
- Preserve existing routes and domain primitives unless the repo proves a change is required.
- Complete PASS 0 through PASS 5 before considering any stretch work.

## VERIFIED FROM REPO DISCOVERY

### Environment Baseline

- Framework: Next.js 16.1.6 App Router with React 19 and TypeScript.
- Package manager: `pnpm@10.30.3`.
- Expected Node version: `24.x` from `.nvmrc` and `.node-version`.
- Local shell used during execution: Node `v25.7.0`.
- Database: local SQLite via `@libsql/client`, file-backed at `data/axis.sqlite`.
- ORM and migrations: Drizzle ORM with committed migrations in `drizzle/`.
- Canonical scripts: `dev`, `build`, `start`, `db:generate`, `db:migrate`, `lint`, `typecheck`, `test`, `test:unit`, `check`.
- `pnpm dev`, `pnpm build`, and `pnpm start` all run `pnpm db:migrate` first.

### Capability Detection

- Git commits: available.
- Git worktrees: available.
- Child-agent capability: available.
- MCP servers configured: `codex_apps`, `openaiDeveloperDocs`, `stitch`.
- OpenAI developer docs MCP: already configured.
- Internet/network access: available.
- Skills: available from repo-level instructions, but none were required to complete this run.

### UI Shell / Routes

- Shell layout: `src/app/(app)/layout.tsx` with `AppShell`.
- Primary routes:
  - `/` Today dashboard
  - `/tasks` Inbox workspace and closed-task browsing via `?view=...`
  - `/tasks/[taskId]` execution-first task detail
  - `/upcoming` future-dated focus route
  - `/calendar` planning calendar
  - `/shared` assignment view
  - `/profile` household/profile setup
  - `/quick-add` full-page reviewable quick-add flow
- Shell-level quick capture is available from any app route.

### Task Domain Model

- `tasks` stores title, notes, status, due date, priority, legacy `category`, optional `projectId`, optional `assigneeMemberId`, and completion timestamps.
- `projects`, `tags`, and `task_tags` now provide the lightweight organization model.
- `recurrence_rules` stores recurrence shape separately from the base task row.
- `task_occurrence_logs` stores recurring completion history keyed by `(taskId, scheduledFor)`.
- `task_action_undos` stores redirect-safe undo payloads for task actions.

### Persistence Layer

- Schema authority: `src/lib/db/schema.ts`.
- DB client: `src/lib/db/client.ts`.
- Task reads and derivations: `src/features/tasks/data.ts`.
- Task mutations: `src/features/tasks/actions.ts`.
- Default profile bootstrapping: `src/features/profile/data.ts`.

### Parser / Recurrence / Calendar

- Quick-add parsing remains deterministic and local in `src/features/quick-add/parse.ts`.
- Quick capture uses the same parser as `/quick-add`.
- Recurrence remains projection-based and anchored to `tasks.dueDate`.
- Risky recurrence edits now require an explicit history decision instead of silently reinterpreting old occurrence logs.
- Calendar selection uses query params and now normalizes invalid day values into the visible grid.
- Calendar grid navigation is keyboardable with arrow keys, Home/End, and Page Up/Page Down.

### Search / Filter Status

- `/tasks` and `/upcoming` now use local query-param filters for:
  - `view`
  - `q`
  - `project`
  - `tag`
  - `priority`
  - `assignee`
- Filtering is local, case-insensitive, and category-compatible during the rollout window.

### Test / CI Status

- Unit test harness: `tsx --test src/**/*.test.ts`.
- CI runs `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- Core logic coverage now includes parser, recurrence helpers, task form parsing, organization/filter helpers, notice helpers, and recurrence-edit helpers.

## ASSUMPTIONS TO PRESERVE UNLESS CONTRADICTED

- Inbox means unscheduled active tasks, not a separate inbox flag.
- The app remains single-profile and local-first in storage.
- Auth, invites, and external calendar integrations stay out of scope.
- Legacy `category` remains a temporary compatibility bridge, not the long-term authoring model.
- Search and filtering stay local-first unless repo scale proves otherwise.
- Stretch work is deferred until the core task loop remains stable after PASS 0 through PASS 5.

## Architecture Notes

### UI Shell

- `AppShell` owns global navigation, skip-link access, and shell-level quick capture.
- Capture stays split between:
  - shell modal for fast single-draft capture
  - `/quick-add` for batch or ambiguous review

### Task Data Flow

- `TaskForm` remains the canonical full edit/create surface.
- `parseTaskFormData` validates and normalizes form posts before persistence.
- `saveTaskInput` remains the primary persistence entrypoint for authored tasks.
- Lightweight notices and undo remain URL and DB backed, not client-state backed.

### Organization Model

- One optional project plus many tags is the current organization model.
- Legacy `category` is still read for compatibility and backfill safety.
- Normal task authoring now writes project and tag data without continuing to write `category`.

### Recurrence Semantics

- Due date remains the recurrence anchor.
- Occurrence logs are authoritative historical records.
- If a recurrence edit would reinterpret old logs, the user must choose:
  - keep history by archiving the old task and forking a new active task
  - reset history on the current task

### Calendar Semantics

- Calendar is a planning surface, not a second task subsystem.
- Month-grid counts show open work.
- Completed recurring occurrences remain visible in the selected-day agenda as secondary context.

## Pass Status

### PASS 0 - Repo Operating System

- Completed.
- Delivered:
  - stronger `AGENTS.md`
  - living `.agent/PLANS.md`
  - unit test harness
  - CI unit-test integration

### PASS 1 - Capture + Focus

- Completed.
- Delivered:
  - shell quick capture
  - `q` shortcut outside editable controls
  - `/upcoming`
  - `/tasks` inbox-first routing
  - parser expansions for explicit every-N intervals and multi-weekday phrases

### PASS 2 - Task Execution Loop

- Completed.
- Delivered:
  - execution-first task detail
  - redirect-backed notices
  - undo for complete, archive, reopen, restore, and delete
  - quicker task actions from focus surfaces

### PASS 3 - Organization

- Completed.
- Delivered:
  - `projects`, `tags`, `task_tags`, and `tasks.projectId`
  - category-to-tag backfill migration
  - organization-aware task form and quick-add wiring
  - query-param search and filters on `/tasks` and `/upcoming`
  - read compatibility with legacy `category`

### PASS 4 - Recurrence + Calendar

- Completed.
- Delivered:
  - clearer recurrence presets and anchor-date explanation
  - recurrence preview dates in the task form
  - explicit recurrence-history decision flow
  - calendar selected-day normalization
  - keyboardable calendar month grid
  - clearer planning semantics for calendar counts and agenda state

### PASS 5 - Quality + Polish

- Completed.
- Delivered:
  - shell skip link
  - safer mobile spacing around the fixed quick-capture CTA
  - icon-button labels and improved keyboard semantics
  - fieldset/legend semantics for recurrence controls
  - inline form-error surfacing for invalid recurrence edits
  - doc sync and final validation sweep

### PASS 6 - Stretch

- Deferred.
- Reason: the core loop passes are now complete, but stretch scope still needs an explicit product choice.

## Delegation / Worktree Notes

- PASS 0 through PASS 5 were executed in the main worktree because schema, task data, parser, routes, and form components overlapped heavily.
- Explorer agents were used for bounded repo review and planning support.
- One QA review sidecar was attempted near the end of PASS 5, but it failed because of an external usage-limit boundary rather than a repo/runtime issue.

## Progress

- [x] Repo discovery completed.
- [x] Capability detection completed.
- [x] PASS 0 completed and validated.
- [x] PASS 1 completed and validated.
- [x] PASS 2 completed and validated.
- [x] PASS 3 completed and validated.
- [x] PASS 4 completed and validated.
- [x] PASS 5 completed and validated.
- [ ] PASS 6 intentionally deferred.

## Decision Log

- 2026-03-09: Kept the remaining passes in the main worktree because the shared write surface crossed schema, data selectors, task form logic, task routes, and calendar behavior.
- 2026-03-09: Reused the projection-based recurrence model and due-date anchor semantics instead of inventing a second recurrence subsystem.
- 2026-03-09: Chose one optional project plus many tags as the lightweight organization model, while preserving legacy `category` reads during rollout.
- 2026-03-09: Backfilled legacy categories to tags only, never to projects.
- 2026-03-09: Kept search/filter local and query-param driven for `/tasks` and `/upcoming`.
- 2026-03-09: Required explicit user choice when recurrence edits would reinterpret historical occurrence logs.
- 2026-03-09: Kept calendar as an internal planning surface and changed month-grid counts to represent open work.
- 2026-03-09: Used redirect-backed notices for recurring occurrence toggles instead of adding a second client-only feedback system.

## Surprises / Discoveries

- Local execution ran on Node `25.7.0`, while the repo and CI target Node `24.x`.
- PASS 3 was already partially scaffolded in the worktree when this continuation started, so the main work became validation, integration, and tightening the migration/runtime edges.
- The legacy category backfill needed stronger whitespace normalization to match runtime tag normalization.
- Risky recurrence-edit UX was already partly scaffolded in the form, but it needed server enforcement and recovery-friendly error routing.

## Validation Evidence

- PASS 0:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test:unit`
  - `pnpm build`
- PASS 1:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test:unit`
  - `pnpm build`
  - runtime smoke for `/`, `/tasks`, `/upcoming`, and `/quick-add?input=...`
- PASS 2:
  - `pnpm db:generate`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test:unit`
  - `pnpm build`
  - runtime smoke for `/`, `/tasks`, `/upcoming`, `/quick-add?input=...`, `/shared?...`, `/calendar?...`, and `/tasks/[taskId]?notice=...`
- PASS 3 through PASS 5:
  - `pnpm typecheck`
  - `pnpm test:unit`
  - `pnpm db:migrate`
  - `pnpm lint`
  - `pnpm build`
  - runtime smoke from `pnpm start --hostname 127.0.0.1 --port 3020` for:
    - `/`
    - `/tasks?view=inbox&error=recurrence-anchor-required`
    - `/upcoming?view=recurring&tag=home`
    - `/calendar?month=2026-03&day=2099-12-31`
    - `/tasks/1aa11d30-7529-47ef-ac05-1423a80c7b83?error=recurrence-history-choice-required`
- All validation commands passed locally.
- Every command emitted the expected engine warning because the repo targets Node `24.x` while the current shell was Node `25.7.0`.

## Risks

- Final confidence should still come from Node 24 CI because local validation ran on Node 25.
- Browser-driven manual QA is still lighter than ideal; runtime smoke plus code review covered the final pass, but not every keyboard interaction was exercised in a real browser session.
- Legacy `category` remains in the schema as a compatibility bridge and should be removed only in a later dedicated cleanup pass after rollout confidence is high.

## Remaining Queue

- PASS 6 stretch selection:
  - offline/local-first strategy refinements
  - integrations
  - review/insight flows
  - differentiated workflows
- Follow-up cleanup:
  - remove legacy `category` after the rollout window closes
  - decide whether occurrence toggles need full undo parity with other task actions

## Final Checkpoint Summary

- The core Axis loop is now implemented across PASS 0 through PASS 5.
- Capture is fast and available globally.
- Focus views are separated into Today, Inbox, Upcoming, Calendar, and Shared without stretching the product scope.
- Organization is lightweight and explicit with one project plus many tags.
- Recurrence is more understandable and more trustworthy because risky edits cannot silently reinterpret history.
- The repo is validated, documented, and left ready for either a stretch-scope choice or a dedicated cleanup pass.
