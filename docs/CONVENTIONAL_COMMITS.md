# Conventional Commits

Use this commit format:

```text
type(scope): summary
```

## Allowed Types

- `feat`
- `fix`
- `chore`
- `docs`
- `refactor`
- `test`
- `ci`

## Repo Scopes

- `repo`
- `ui`
- `ci`
- `docs`
- `codex`

## Examples

- `chore(repo): bootstrap next.js app`
- `chore(ui): init shadcn and add base components`
- `docs(repo): add starter playbook and workflow docs`
- `ci(repo): add github actions workflow`
- `chore(codex): add AGENTS.md and codex rules`

## Notes

- Keep commits atomic: one logical change per commit.
- Write imperative summaries.
- Do not add commitlint/husky by default in this starter; keep onboarding friction low.
