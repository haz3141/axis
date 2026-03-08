# Compass

Compass is a minimal reusable MVP starter template for future apps.
It is design-system-ready, but intentionally not a full design system.

It keeps the baseline intentionally small so new products can start with a
modern stack, consistent conventions, and clean documentation without taking on
extra product logic or tooling.

## Requirements

- Node.js 24.x
- pnpm 10.30.3 via `packageManager`

## Included

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui default-first setup
- `next-themes`
- `lucide-react`
- pnpm

## Philosophy

- Keep the starter small and reusable.
- Prefer modern defaults with minimal friction.
- Treat documentation as part of the starter.
- Avoid adding product-specific features to the baseline.

## Design System Scope

- Compass is design-system-ready: semantic theme tokens, a small primitive
  layer, and clear component boundaries are already in place.
- Compass is not yet a full design system: generic wrappers, reusable
  composites, and brand-layer customization stay deferred until reuse pressure
  is real.
- See the [Starter Playbook](docs/STARTER_PLAYBOOK.md) for token usage rules and
  component-layer guidance.

## Intentionally Out Of Scope

- Authentication, database, analytics, or app-specific flows
- Extra state libraries
- Storybook or heavy repo tooling
- Expanded starter UI beyond the minimal placeholder

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
pnpm check
pnpm lint
pnpm typecheck
pnpm build
pnpm start
```

## Docs

- [Starter Playbook](docs/STARTER_PLAYBOOK.md)
- [GitHub Workflow](docs/WORKFLOW_GITHUB.md)
- [Conventional Commits](docs/CONVENTIONAL_COMMITS.md)

## Template Use

This repository is intended to stay suitable as a lightweight public GitHub
template. Keep changes minimal, production-grade, and easy to understand for
the next app built from it.

It ships with an MIT [LICENSE](LICENSE) and a lightweight pull request
template so public-template hygiene stays clear without adding heavy process.
