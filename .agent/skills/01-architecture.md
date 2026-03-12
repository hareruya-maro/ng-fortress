# Architecture Rules
- Application code must be strictly inside `src/app/ui/`, `src/app/features/`, `src/app/infrastructure/` (browser, server, universal), or `src/app/schema/`.
- Dependency flow: `ui/` -> `features/` -> `infrastructure/universal` & `schema/`. Reverse flow is forbidden.
- `features/` MUST NOT import directly from `infrastructure/browser` or `infrastructure/server`. Use Schema Tokens for injection.
