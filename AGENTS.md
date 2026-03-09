# AGENTS.md

This file defines Codex operating rules for this repository.

## Core Rules

- Keep diffs minimal, production-grade, and reviewable.
- Prefer extending existing task, recurrence, parser, and route primitives over introducing parallel subsystems.
- Preserve the current route contract unless a change is explicitly required:
  - `/` Today
  - `/tasks` Inbox workspace and task browsing
  - `/tasks/[taskId]` task detail / execution surface
  - `/calendar` planning calendar
  - `/shared` assignment view
  - `/profile` profile / household setup
  - `/quick-add` reviewed natural-language capture
- Prefer Server Components; add `"use client"` only when interactivity actually requires it.
- Do not introduce extra dependencies unless the benefit is clear and the change is in scope.
- Use pnpm only for package operations.
- Use `pnpm dlx` instead of `npx` for one-off package commands.
- Update the relevant docs in the same task as any repo, tooling, workflow, or architecture change.
- When the user requests audit-only or approval-gated work, stay non-mutating until they approve implementation.
- Always use the OpenAI developer documentation MCP server if you need to work with the OpenAI API, ChatGPT Apps SDK, Codex, or related docs without me having to explicitly ask.

## Canonical Commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
pnpm db:generate
pnpm db:migrate
```

Environment expectations:

- Package manager: `pnpm`
- Expected Node version: `24.x` from `.nvmrc` / `.node-version`
- Local database file: `data/axis.sqlite`

## Folder And Domain Map

- `src/app`: Next.js App Router entrypoints and route segments.
- `src/app/(app)`: authenticated-style shell routes for the main product.
- `src/features/navigation`: app shell and route-level navigation.
- `src/features/quick-add`: natural-language parsing and quick-add UI.
- `src/features/tasks`: task domain actions, reads, form helpers, recurrence logic, and task UI.
- `src/features/profile`: default profile and household roster data/actions.
- `src/lib/db`: Drizzle schema and database client.
- `drizzle/`: committed SQL migrations and migration metadata.
- `docs/`: workflow and repo-level docs.
- `.agent/PLANS.md`: living execution plan for any complex or multi-pass task.

## Task / Recurrence / Parser / Calendar / Search Notes

- Task records live in `src/lib/db/schema.ts` under `tasks`.
- Recurrence rules are stored separately in `recurrence_rules`; completion history for recurring occurrences lives in `task_occurrence_logs`.
- Recurring behavior is projection-based. Do not silently reinterpret old occurrence logs when anchors or rule shapes change.
- The due date is the recurrence anchor date. Preserve the rule that recurring tasks need a clear anchor date unless the user explicitly requests a model change.
- Task form parsing lives in `src/features/tasks/lib/form.ts`.
- Natural-language quick-add parsing lives in `src/features/quick-add/parse.ts`. Keep it deterministic and non-LLM.
- Calendar logic lives in `src/features/tasks/data.ts` plus `src/features/tasks/lib/dates.ts` and `src/features/tasks/lib/recurrence.ts`.
- Search and filters should remain simple and local-first unless the repo clearly needs something heavier. Prefer query-param-driven state on route pages over hidden client-only filtering.

## Accessibility And UX Expectations

- All dialogs, icon buttons, and keyboard shortcuts must be accessible by keyboard alone.
- Do not bind global shortcuts when focus is inside editable controls.
- Ensure visible focus states remain intact.
- Use semantic labels and button text for task actions, recurrence controls, and capture affordances.
- Mobile actions should stay reachable without obscuring primary content.

## Migration Rules

- Schema authority lives in `src/lib/db/schema.ts`.
- Committed migrations live in `drizzle/`; do not hand-edit generated metadata unless the migration workflow requires it.
- For schema changes:
  1. Update `src/lib/db/schema.ts`.
  2. Run `pnpm db:generate`.
  3. Run `pnpm db:migrate`.
  4. Re-run validation (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`).
- Preserve rollout compatibility when evolving task organization or recurrence data. Avoid destructive migrations in the same pass as UI adoption unless explicitly required.

## Prefer Existing Primitives

- Reuse `TaskForm`, `parseTaskFormData`, task server actions, and task data selectors before creating new task-entry flows.
- Reuse the existing quick-add parser for shell capture and full-page capture.
- Reuse existing badge/button/card/dialog primitives from `src/components/ui`.
- Keep heavy logic server-side where practical and keep feature-specific code under `src/features/*`.

## Planning And ExecPlan

- Any complex, multi-file, multi-pass, or architecture-affecting task requires a living ExecPlan in `.agent/PLANS.md` before implementation.
- Separate `VERIFIED FROM REPO DISCOVERY` from `ASSUMPTIONS TO PRESERVE UNLESS CONTRADICTED`.
- Update `.agent/PLANS.md` as facts change, decisions are made, validation runs complete, or scope is narrowed.

## Validation Rules

- Minimum required checks before finishing any meaningful task:
  - `pnpm lint`
  - `pnpm typecheck`
- For repo, workflow, data-model, parser, recurrence, or route changes also run:
  - `pnpm test`
  - `pnpm build`
- Do not ignore failures silently. Either fix them in scope or document the blocker precisely in `.agent/PLANS.md` and the final handoff.

## Child Agents And Worktrees

- Use child agents or isolated worktrees only when the scope is cleanly separable and file ownership can stay mostly disjoint.
- Prefer at most:
  - 2 implementation child agents
  - 1 QA/reviewer child agent
- One coherent child-agent deliverable should map to one coherent commit.
- Record delegation boundaries, worktree names, validation ownership, and merge checkpoints in `.agent/PLANS.md`.
- If a task is cross-cutting enough that worktree isolation would add risk, document the fallback and keep execution in the main worktree.

## Git + Branching

- Use short-lived branches from `main`:
  - `feat/<topic>`
  - `fix/<topic>`
  - `chore/<topic>`
  - `docs/<topic>`
  - `refactor/<topic>`
- Keep history clean and focused; prefer rebase-based integration.
- Avoid mixing unrelated fixes into the same commit.

## Commits

- Use atomic commits: one logical change per commit.
- Use Conventional Commits format: `type(scope): summary`.
- Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`.
- Preferred scopes in this repo: `repo`, `ui`, `ci`, `docs`, `codex`.

## Required Completion Report

When Codex finishes a task, include:

1. Files changed.
2. Commands run.
3. Results for lint/typecheck/build/test as applicable.
