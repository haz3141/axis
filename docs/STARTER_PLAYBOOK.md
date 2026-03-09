# Axis Playbook

Axis is the current app built on the Compass baseline. The starter constraints
still matter, but this repo now owns app-specific product flows and local data
storage.

## Agreed Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui primitives copied into `src/components/ui`
- `next-themes`
- `lucide-react`
- SQLite via `@libsql/client`
- Drizzle ORM + Drizzle Kit
- pnpm

## Product Boundaries

- Keep the app focused on the MVP foundation:
  - one-time tasks
  - recurring tasks / habits
  - shared household assignment
  - calendar planning
  - simple stats
  - quick natural-language capture
- Keep these deferred:
  - auth, invites, and permissions
  - goal tracking as a first-class entity
  - non-task calendar events
  - astrology or human-design behavior logic
  - heavy analytics, gamification, or deep social features
  - Storybook or broad tooling expansion

## Architecture Rules

- `src/components/ui`: vendored or low-level primitives.
- `src/components/system`: only for generic cross-cutting building blocks that
  clearly earn reuse.
- `src/components/patterns`: only for truly reusable composites.
- `src/features/*`: product and domain code. Axis should keep route logic,
  queries, actions, and view-specific components here.
- Prefer Server Components and Server Actions for reads/mutations. Use
  `"use client"` only where interactivity requires it.

## Data and Persistence

- Local data lives in `data/axis.sqlite`.
- Drizzle schema lives in `src/lib/db/schema.ts`.
- Committed migrations live in `drizzle/`.
- The standard `pnpm dev`, `pnpm build`, and `pnpm start` flows run
  `pnpm db:migrate` before launching.
- When the schema changes:
  1. update `src/lib/db/schema.ts`
  2. run `pnpm db:generate`
  3. run `pnpm db:migrate`
  4. re-run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`

## UI Guidance

- Keep screens neutral, clear, and wireframe-grade.
- Prefer semantic utilities such as `bg-background`, `text-foreground`,
  `text-muted-foreground`, and `border-border`.
- Avoid expanding the design system just because more primitives are available.
- Let reusable patterns emerge from repeated need instead of designing them up
  front.

## Main Routes

- `/`: today dashboard
- `/tasks`: inbox workspace plus completed and archived query-param views
- `/upcoming`: future-dated focus route
- `/tasks/[taskId]`: task detail and edit flow
- `/calendar`: month grid plus day agenda
- `/shared`: grouped assignment view
- `/profile`: profile and household data
- `/quick-add`: natural-language draft review flow, plus shell capture handoff target

## Checks

Run these before finishing work:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Commit Contract

- Use Conventional Commits (`type(scope): summary`).
- Keep commits atomic and reviewable.
- Update docs in the same task as meaningful workflow, tooling, or architecture
  changes.

See also:
- `docs/WORKFLOW_GITHUB.md`
- `docs/CONVENTIONAL_COMMITS.md`
