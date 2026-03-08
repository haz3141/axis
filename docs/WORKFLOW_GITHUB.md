# Workflow: GitHub + gh CLI

This repo follows lightweight GitHub Flow and is intended to stay suitable as a
public reusable template.

## Branching

- Default branch: `main`
- Short-lived branches:
  - `feat/<topic>`
  - `fix/<topic>`
  - `chore/<topic>`
  - `docs/<topic>`
  - `refactor/<topic>`

## PR Flow

1. Branch from `main`.
2. Make atomic commits.
3. Run local checks:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

4. Push and open PR.
5. Prefer **rebase merge** to preserve atomic commit history.
6. Use the PR template to summarize changes, checks run, and any related docs
   updates.

## Template Notes

- Keep GitHub process lightweight.
- Prefer documentation updates in the same change as workflow or tooling edits.
- Avoid adding heavy template process files unless they clearly reduce friction.
- Use the lightweight PR template instead of adding heavy review process files.

## gh CLI Commands

### Authenticate

```bash
gh auth status
gh auth login -h github.com
```

### Create repo from this directory

```bash
gh repo create compass --source=. --remote=origin --push --public
gh repo edit --template
```

### Use this template for a new repo

Create a new repository from the GitHub template UI, then clone it locally and
continue with the standard branch and PR flow.

### Branch, push, and open PR

```bash
git checkout -b feat/<topic>
git push -u origin feat/<topic>
gh pr create --base main --fill
```

### Keep branch up to date

```bash
git fetch origin
git rebase origin/main
```

If `gh` is unavailable, create the repo in GitHub UI, add `origin`, then push with standard git commands.
