# Axis Execution Plan

Last updated: 2026-03-09
Branch: `feat/capture-focus-pass1`

## Goals

- Strengthen the core Axis loop: Capture -> Organize -> Focus -> Complete -> Review.
- In this run, complete repo discovery, PASS 0, and PASS 1, then stop at a validated checkpoint.
- Preserve current routes, task primitives, and recurrence semantics unless discovery proves a change is necessary.

## VERIFIED FROM REPO DISCOVERY

### Environment Baseline

- Framework: Next.js 16.1.6 App Router with React 19 and TypeScript.
- Package manager: `pnpm@10.30.3`.
- Expected Node version: `24.x` from `.nvmrc` / `.node-version`.
- Local runtime in this workspace: Node `v25.7.0`.
- Database: local SQLite via `@libsql/client`, file-backed at `data/axis.sqlite`.
- ORM / migrations: Drizzle ORM with committed migrations in `drizzle/`.
- Canonical scripts in `package.json`: `dev`, `build`, `start`, `db:generate`, `db:migrate`, `lint`, `check`, `typecheck`.
- Migration behavior: `pnpm dev`, `pnpm build`, and `pnpm start` all run `pnpm db:migrate` first.

### Capability Detection

- Git commits: available.
- Git worktrees: available via `git worktree`; current worktree is the main repo checkout only.
- Child-agent capability: available from the tool surface.
- MCP servers configured: `codex_apps`, `openaiDeveloperDocs`, `stitch`.
- OpenAI developer docs MCP: already configured and enabled; no setup needed.
- MCP resource listings are empty, but server endpoints are configured.
- Internet/network access: available.
- Skills: available from the root repo instructions; no additional skill was required for this pass.

### UI Shell / Routes

- Root shell is `src/app/(app)/layout.tsx`, which wraps app routes in `AppShell`.
- `AppShell` is a client component with sidebar navigation in `src/features/navigation/app-shell.tsx`.
- Current app routes:
  - `/` in `src/app/(app)/page.tsx`
  - `/tasks` in `src/app/(app)/tasks/page.tsx`
  - `/tasks/[taskId]` in `src/app/(app)/tasks/[taskId]/page.tsx`
  - `/calendar` in `src/app/(app)/calendar/page.tsx`
  - `/shared` in `src/app/(app)/shared/page.tsx`
  - `/profile` in `src/app/(app)/profile/page.tsx`
  - `/quick-add` in `src/app/(app)/quick-add/page.tsx`
- `/` is already the Today homepage.

### Task Domain Model

- Task table fields: title, notes, status, dueDate, priority, category, assigneeMemberId, completedAt, timestamps.
- Task statuses are `active`, `completed`, `archived`.
- Recurrence is stored in `recurrence_rules`, one row per task, with `frequency`, `interval`, `daysOfWeek`, `dayOfMonth`, and `endsOn`.
- Recurring completion history is stored in `task_occurrence_logs` keyed by `(taskId, scheduledFor)`.
- There is no projects/tags model yet; `category` is the only organization field.

### Persistence Layer

- Drizzle schema is in `src/lib/db/schema.ts`.
- DB client is in `src/lib/db/client.ts`.
- Default profile bootstrapping lives in `src/features/profile/data.ts` via `ensureProfile()`.
- Reads and derivations live in `src/features/tasks/data.ts`.
- Mutations live in `src/features/tasks/actions.ts`.

### Parser / Recurrence / Calendar

- Quick-add parser is deterministic and local in `src/features/quick-add/parse.ts`.
- It currently splits by newline / semicolon / bullets and extracts:
  - chrono-resolved dates
  - limited recurrence phrases
  - assignee matches against the household roster
  - categories from hashtags or known labels
  - basic priority keywords
- Current recurrence parsing supports:
  - daily / every day
  - every other day
  - every weekday
  - repeated `every <weekday>` matches
  - monthly / every month / every month on the Nth
- The parser already blocks ambiguous assignee/category matches and emits `Recurring phrases need a clear anchor date.` when recurrence lacks a date.
- Task form parsing in `src/features/tasks/lib/form.ts` also enforces that recurring tasks require a due date.
- Recurrence projection is helper-based in `src/features/tasks/lib/recurrence.ts` and uses the task due date as the anchor date.
- Calendar route uses query params today: `/calendar?month=YYYY-MM&day=YYYY-MM-DD`.

### Current Focus/Search/Filter Status

- `/tasks` is currently a mixed page: manual entry form plus active/completed/archived sections in one route.
- `/` currently shows:
  - stats cards
  - due today list
  - overdue list
  - upcoming-week list
- No dedicated `/upcoming` route exists yet.
- No search UI exists yet.
- No generic task filter/query-param primitives exist yet outside the calendar route.
- No global keyboard shortcuts or shell-level quick-add affordance exists yet.

### Current Test / CI Status

- No unit-test harness exists yet.
- No test files were found in the repo.
- CI currently runs `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, and `pnpm build`.

### Recent Relevant History

- `ac18bf9` `fix(db): avoid build-time sqlite writes`
- `4a464eb` `fix(db): harden recurrence writes`
- `71f0e22` `fix(quick-add): clean parsed titles and block ambiguous creates`
- `f8c4427` `fix(tasks): make recurring next due completion-aware`
- `c529deb` `feat(ui): add mvp planning flows`

## ASSUMPTIONS TO PRESERVE UNLESS CONTRADICTED

- Inbox means unscheduled active tasks, not a separate inbox flag.
- The app remains single-profile and local-first in storage.
- Auth, invites, and external calendar integrations stay out of scope.
- Projects + tags remains the intended organization model for a later pass.
- Current category values should backfill to tags only in PASS 3, not projects.
- Browser automation is deferred unless there is a strong reason to add it.
- Execution should extend current task and recurrence primitives rather than introduce a new subsystem.

## Architecture Notes

### UI Shell / Route Contract

- The main app uses one shell and server-rendered route pages.
- Navigation is currently sidebar-based and client-side only in the shell.
- Quick add is currently a separate full-page route; PASS 1 should keep that route and add a shell-level entry point rather than replacing it.

### Task Derivations

- `src/features/tasks/data.ts` currently owns both DB reads and focus-derivation logic.
- Display tasks already compute `nextDue`, which is useful for a dedicated Upcoming view.
- Dashboard agenda items already project recurring occurrences without materializing future task rows.

### Recurrence Semantics

- The repo already follows the required projection-based recurrence model.
- Occurrence logs are explicit completion records and must not be silently reinterpreted if recurrence semantics change in later passes.

### Search / Filter Baseline

- The repo does not yet have a shared task-filter layer.
- PASS 1 should keep filtering minimal and route-local. PASS 3 can introduce broader query-param filters.

## Architecture Map

### UI Shell / Routes

- Shell: `src/features/navigation/app-shell.tsx`
- Layout: `src/app/(app)/layout.tsx`
- Today: `src/app/(app)/page.tsx`
- Tasks: `src/app/(app)/tasks/page.tsx`
- Task detail: `src/app/(app)/tasks/[taskId]/page.tsx`
- Calendar: `src/app/(app)/calendar/page.tsx`
- Shared: `src/app/(app)/shared/page.tsx`
- Profile: `src/app/(app)/profile/page.tsx`
- Quick add: `src/app/(app)/quick-add/page.tsx`

### Task Domain Model

- Types: `src/features/tasks/types.ts`
- Form parsing: `src/features/tasks/lib/form.ts`
- Recurrence helpers: `src/features/tasks/lib/recurrence.ts`
- Date helpers: `src/features/tasks/lib/dates.ts`
- Data queries / view derivation: `src/features/tasks/data.ts`
- Mutations: `src/features/tasks/actions.ts`

### Persistence Layer

- DB client: `src/lib/db/client.ts`
- Schema: `src/lib/db/schema.ts`
- Migrations: `drizzle/*.sql`

### Parser / Recurrence Logic

- Parser: `src/features/quick-add/parse.ts`
- Quick-add workspace UI: `src/features/quick-add/quick-add-workspace.tsx`
- Parser currently supports deterministic titles, dates, assignees, categories, priorities, and limited recurrence phrases.

### Calendar Implementation Status

- Calendar month grid and day agenda are implemented.
- Query-param navigation exists.
- Keyboard navigation is not implemented yet.

### Search / Filter Primitive Status

- Calendar has query-param navigation.
- Task search/filter primitives are not yet implemented.

## Gap Analysis Against Requested Plan

- PASS 0 gap:
  - `AGENTS.md` was too thin for this repo and lacked execution/scaffolding rules.
  - `.agent/PLANS.md` did not exist.
  - No unit-test harness existed.
  - CI had no unit-test step.
- PASS 1 gap:
  - No global quick-add launcher or keyboard shortcut.
  - No sticky mobile capture affordance.
  - `/quick-add` had no prefill handoff.
  - No inline single-draft quick capture flow.
  - Parser lacks explicit every-N week/month patterns and richer multi-weekday phrases.
  - No `/upcoming` route.
  - `/tasks` is not yet an inbox-focused workspace and still mixes completed/archived browsing into side cards.
  - Priority is stored but underused in focus sorting and badges.
  - Empty/loading states are minimal.

## Pass Plan

### PASS 0 - Repo Operating System

- Expand `AGENTS.md`.
- Create `.agent/PLANS.md`.
- Record verified discovery and capability detection.
- Add the smallest viable unit-test harness for pure logic.
- Add PASS 0 unit tests for:
  - quick-add parsing
  - recurrence helpers
  - task form parsing
- Wire the unit suite into CI once green.

### PASS 1 - Capture + Focus

- Add shell-level quick capture reachable from any app route.
- Add desktop and mobile capture affordances.
- Add `q` shortcut, editable-control guard, `Escape` close, and `Cmd/Ctrl+Enter` submit.
- Reuse the existing parser:
  - create inline only for one clear draft
  - otherwise hand off to `/quick-add` with prefilled input
- Keep recurrence anchor-date behavior intact.
- Add deterministic parser expansions for:
  - explicit every N days/weeks/months
  - multi-weekday phrases
  - clearer recurrence ambiguity messages
- Add `/upcoming`.
- Turn `/tasks` into the Inbox workspace for unscheduled active tasks.
- Move completed/archived browsing to `/tasks?view=...`.
- Surface priority badges / sorting in focus views.
- Add PASS 1 tests for capture routing and focus selectors.

### Deferred Queue After This Run

- PASS 2: task execution surface and undo/flash flows
- PASS 3: projects, tags, search, filters, migration bridge
- PASS 4: recurrence editing improvements and history-choice UX
- PASS 5: accessibility, mobile polish, performance, QA pass
- PASS 6: stretch only after PASS 0-5 stabilize

## Delegation / Worktree Plan

- Child agents and worktrees are available but not ideal for PASS 0 or this PASS 1 slice because the scope crosses shell, parser, routes, task data derivations, tests, and docs.
- Fallback decision: execute PASS 0 and PASS 1 in the main worktree to avoid merge risk and keep commits coherent.
- Revisit a QA child agent after implementation if the diff stays bounded and tool output collection remains reliable.

## Repo State After PASS 1

- Shell capture:
  - Global quick capture launcher is available from the shell on desktop and mobile.
  - `q` opens capture when focus is not inside an editable control.
  - `Escape` closes the dialog and `Cmd/Ctrl+Enter` submits.
- Quick-add flow:
  - Single clear captures create inline.
  - Multiline or ambiguous captures hand off to `/quick-add?input=...`.
  - `/quick-add` now accepts prefilled input and auto-parses it for review.
- Focus routes:
  - `/` remains Today.
  - `/tasks` is now an inbox-focused workspace for unscheduled active tasks.
  - Completed and archived browsing moved to `/tasks?view=completed|archived`.
  - `/upcoming` now exists as a dedicated future-dated focus route.
- Parser and selectors:
  - Deterministic recurrence parsing now supports explicit every-N day/week/month intervals and multi-weekday phrases.
  - Priority-aware focus selectors live in `src/features/tasks/lib/focus.ts`.
  - Today, Upcoming, and Inbox now surface priority badges and focus-aware sorting.
- Loading / empty states:
  - App-shell loading UI exists for focus routes.
  - Today, Inbox, Completed, Archived, and Upcoming now have explicit empty states with next actions.

## Progress

- [x] Repo discovery completed.
- [x] Capability detection completed.
- [x] Baseline lint/typecheck/build health checked.
- [x] PASS 0 scaffolding complete.
- [x] PASS 0 test harness complete.
- [x] PASS 0 validation complete.
- [x] PASS 1 implementation complete.
- [x] PASS 1 validation complete.

## Decision Log

- 2026-03-09: Treat repo discovery as ground truth. Do not assume a separate inbox flag or existing search system.
- 2026-03-09: Keep execution in the primary worktree because PASS 1 crosses route shell, quick-add, parser, selectors, and docs.
- 2026-03-09: Use the existing projection-based recurrence model and due-date anchor semantics as a hard constraint for PASS 1.
- 2026-03-09: Use `tsx --test` plus Node's built-in test runner for unit coverage.
  - Reason: minimal tooling expansion while preserving TypeScript tests and path-alias support.
- 2026-03-09: Guard quick-add anchor dates against chrono matches embedded inside recurrence phrases so `every weekday` does not fabricate a due date.
- 2026-03-09: Reuse the existing shell capture decision helper and server action that appeared during implementation instead of introducing a second global quick-capture pathway.

## Surprises / Discoveries

- Local runtime is Node 25.7.0 while the repo and CI target Node 24.x.
- There is no unit-test harness despite parser/recurrence logic being pure enough to test easily.
- `/tasks` currently mixes manual entry, active tasks, completed tasks, and archived tasks into one page, so PASS 1 needs a data-shape cleanup as well as UI changes.
- `chrono-node` will match recurrence-only text like `weekday`, so the parser needed an explicit guard to preserve the repo's clear-anchor recurrence rule.

## Validation Evidence

- Baseline before PASS 0:
  - `pnpm lint`: passed on local Node 25.7.0.
  - `pnpm typecheck`: passed on local Node 25.7.0.
  - `pnpm build`: passed on local Node 25.7.0 after `pnpm db:migrate`.
- PASS 0 after adding the unit harness:
  - `pnpm lint`: passed on local Node 25.7.0.
  - `pnpm typecheck`: passed on local Node 25.7.0.
  - `pnpm test:unit`: passed on local Node 25.7.0.
  - `pnpm build`: passed on local Node 25.7.0 after `pnpm db:migrate`.
- PASS 1 after capture/focus work:
  - `pnpm lint`: passed on local Node 25.7.0.
  - `pnpm typecheck`: passed on local Node 25.7.0.
  - `pnpm test:unit`: passed on local Node 25.7.0.
  - `pnpm build`: passed on local Node 25.7.0 after `pnpm db:migrate`.
  - Runtime smoke fetches: `GET /`, `GET /tasks`, `GET /upcoming`, and `GET /quick-add?input=...` all returned HTTP 200 from `pnpm start` on `127.0.0.1:3100`.
- Every command emitted the expected engine warning because the repo targets Node 24.x while the current shell is Node 25.7.0.

## Risks

- Node 25 local execution may mask issues not seen on Node 24 CI, especially around toolchain flags.
- Global quick capture touches shared shell code; keyboard behavior must avoid interfering with text inputs.
- Route focus changes risk hiding tasks if selectors are wrong; add unit coverage before shipping.

## Remaining Queue

- PASS 2: refactor `/tasks/[taskId]` into a stronger execution surface with quick actions first.
- PASS 2: add lightweight redirect-backed notices or another minimal undo/flash pattern for complete, archive, reopen, and delete.
- PASS 2: add quick edit entry points from lists and tighten destructive-action safety.
- PASS 2: explain recurring-task detail semantics more clearly on the task detail page.

## Final Checkpoint Summary

- PASS 0 complete:
  - Expanded repo operating instructions in `AGENTS.md`.
  - Added `.agent/PLANS.md`.
  - Added the lightweight unit harness and CI test step.
- PASS 1 complete:
  - Added shell-level quick capture with keyboard affordances.
  - Added `/upcoming`.
  - Reworked `/tasks` into an inbox-first workspace with query-param closed views.
  - Expanded deterministic recurrence parsing and prefilled `/quick-add` review.
