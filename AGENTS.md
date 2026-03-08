# AGENTS.md

This file defines Codex operating rules for this repository.

## Core Rules

- Keep diffs minimal and production-grade.
- Do not introduce extra dependencies unless explicitly required.
- Prefer Server Components; add `"use client"` only when required.
- Do not add app-specific screens or product logic in the starter baseline.
- Use pnpm only for package operations.
- Use `pnpm dlx` instead of `npx` for one-off package commands.
- Update the relevant docs in the same task as any repo, tooling, or workflow change.
- When the user requests audit-only or approval-gated work, stay non-mutating
  until they approve implementation.

## Git + Branching

- Use short-lived branches from `main`:
  - `feat/<topic>`
  - `fix/<topic>`
  - `chore/<topic>`
  - `docs/<topic>`
  - `refactor/<topic>`
- Keep history clean and focused; prefer rebase-based integration.

## Commits

- Use atomic commits (one logical unit per commit).
- Use Conventional Commits format: `type(scope): summary`.
- Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`.
- Preferred scopes in this repo: `repo`, `ui`, `ci`, `docs`, `codex`.

## Required Checks Before Finishing

Run both commands and ensure they pass:

```bash
pnpm lint
pnpm typecheck
```

## Required Completion Report

When Codex finishes a task, include:

1. Files changed.
2. Commands run.
3. Results for lint/typecheck/build (when build is requested).
