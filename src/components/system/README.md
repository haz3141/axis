# System Components

Use this directory for generic, cross-cutting building blocks that sit above
`ui` primitives and below `patterns`.

- Put code here when it improves reuse without adding product meaning.
- Favor composition, native props, and semantic token classes.
- Do not put vendored shadcn/ui primitives here; those stay in
  `src/components/ui`.
- Do not put page-specific composites or feature logic here; those belong in
  features or, if broadly reusable later, `src/components/patterns`.
- Keep this layer small. Add components only when reuse pressure is real.
