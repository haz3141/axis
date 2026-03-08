# Pattern Components

Use this directory for reusable composites built from `ui` primitives and
`system` components.

- Put code here when the same composition recurs across features or apps and is
  still free of business logic.
- Keep patterns generic and template-friendly.
- Do not put low-level primitives or thin wrappers here; those belong in
  `src/components/ui` or `src/components/system`.
- Do not put product screens, one-off page sections, or feature logic here.
- Keep this layer empty until reuse pressure clearly justifies a pattern.
