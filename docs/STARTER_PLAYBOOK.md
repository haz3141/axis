# Starter Playbook

This repository is a reusable MVP starter built on Next.js App Router,
TypeScript, Tailwind CSS, and shadcn/ui. It is intentionally minimal so new
products can start from a clean baseline instead of a framework pile.

## Agreed Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui (default init + core primitives)
- `next-themes` for dark/light theme handling
- `lucide-react` for icons
- pnpm for package management

## Toolchain Baseline

- Node.js 24.x via `.nvmrc` and `.node-version`
- pnpm 10.30.3 via `package.json#packageManager`

## Starter Principles

- Keep the dependency surface intentionally small.
- Prefer modern defaults and low-friction setup.
- Preserve reusability over app-specific convenience.
- Update docs whenever setup or workflow changes.

## Engineering Rules

- Keep diffs minimal and production-grade.
- Prefer Server Components; use `"use client"` only where needed.
- Avoid adding extra dependencies unless required.
- No auth, database, analytics, or app-specific screens in the starter.
- Use pnpm only for package operations.

## Design System Foundation

- Compass is design-system-ready, not yet a full design system.
- The current foundation is:
  - semantic theme tokens in `src/app/globals.css`
  - shadcn/ui configuration in `components.json`
  - low-level primitives in `src/components/ui`
  - reserved `src/components/system` and `src/components/patterns` layers for
    future reuse
- Compass should stay minimal and generic. Do not expand the design system just
  because more components are available.

## Component Layer Boundaries

- `src/components/ui`: vendored or low-level primitives. Keep these close to the
  upstream shadcn/ui shape and use them as the base layer.
- `src/components/system`: generic cross-cutting building blocks that improve
  reuse without adding product meaning.
- `src/components/patterns`: reusable composites built from primitives and
  system components.
- Feature-specific or product-specific UI should stay out of these shared
  layers.

## Token Usage Rules

- Prefer semantic utilities such as `bg-background`, `text-foreground`,
  `text-muted-foreground`, `border-border`, and component variants that already
  map to the shared token set.
- Avoid raw palette utility classes in starter and system code when a semantic
  token already exists.
- Keep light/dark theming driven by CSS variables. Avoid introducing
  app-specific brand tokens in the starter baseline.
- When in doubt, choose the smallest semantic rule that keeps future app work
  flexible.

## Deferred By Default

- Stage 2 wrappers or system components such as layout helpers, field shells, or
  page-level building blocks
- Reusable app patterns, navigation shells, dashboards, or feature flows
- Brand customization, showcase UI polish, or large component-library
  expansion
- Extra tooling such as Storybook, analytics, database setup, or process-heavy
  governance

## Day-1 Commands

```bash
corepack enable
pnpm install
pnpm dev
pnpm check
pnpm lint
pnpm typecheck
pnpm build
```

## Commit and CI Contract

- Use Conventional Commits (`type(scope): summary`).
- Keep commits atomic (one logical change per commit).
- CI must pass `lint`, `typecheck`, and `build` on PRs and pushes to `main`.
- Keep GitHub hygiene lightweight and practical.

See also:
- `docs/WORKFLOW_GITHUB.md`
- `docs/CONVENTIONAL_COMMITS.md`
