# Axis

Axis is a personal and household organization MVP built from the Compass
template baseline. It focuses on practical planning flows instead of polished
branding: task capture, recurring routines, shared household assignment,
calendar scheduling, and simple progress summaries.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui primitives
- `next-themes`
- SQLite via `@libsql/client`
- Drizzle ORM + Drizzle Kit
- pnpm

## MVP Features

- Dashboard / Today view with due, overdue, upcoming, and recurring summaries
- Task inbox with create, edit, complete, archive, and delete flows
- Recurring task support with projected occurrences instead of duplicated future rows
- Calendar month view with daily agenda
- Shared / assigned view grouped by household member
- Profile and household roster management
- Natural-language quick add that parses multiple items into reviewable drafts

## Data Model

Axis stores data locally in `data/axis.sqlite`.

Core tables:

- `profiles`
- `household_members`
- `tasks`
- `recurrence_rules`
- `task_occurrence_logs`

Committed migrations live in `drizzle/`. The standard `pnpm dev`, `pnpm build`,
and `pnpm start` flows run `pnpm db:migrate` before launching, and schema
changes should still go through `pnpm db:generate` followed by `pnpm db:migrate`.

## Routes

- `/` today dashboard
- `/tasks` inbox and manual task entry
- `/tasks/[taskId]` task detail / edit flow
- `/calendar` calendar planning view
- `/shared` assigned task view
- `/profile` profile and household roster
- `/quick-add` natural-language capture flow

## Requirements

- Node.js 24.x
- pnpm 10.30.3 via `packageManager`

## Quick Start

```bash
corepack enable
pnpm install
pnpm dev
```

Open `http://localhost:3000` after the dev server starts.

## Common Commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm start
pnpm db:generate
pnpm db:migrate
```

## Developer Notes

- Keep the UI wireframe-grade and MVP-scoped.
- Prefer Server Components; use `"use client"` only for interactive form or
  parser flows.
- Keep shared abstractions minimal. Product logic belongs under
  `src/features/*`.
- Keep parser, recurrence, and form helpers covered by the lightweight unit
  suite before changing focus or capture flows.
- Use semantic tokens from `src/app/globals.css` instead of ad hoc palette
  choices.

## Docs

- [Playbook](docs/STARTER_PLAYBOOK.md)
- [GitHub Workflow](docs/WORKFLOW_GITHUB.md)
- [Conventional Commits](docs/CONVENTIONAL_COMMITS.md)
