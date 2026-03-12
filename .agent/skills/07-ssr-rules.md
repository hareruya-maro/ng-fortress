# SSR Rules (Server-Side Rendering)
1. NO Global Access: NEVER use `window`, `document`, `localStorage`, `navigator` directly in components or features.
2. Injection Tokens: For browser/server-specific features, define an `InjectionToken` and interface in `schema/tokens/`. Implement in `infrastructure/browser/` and `infrastructure/server/`, then provide them in `app.config.ts` / `app.config.server.ts`.
3. Safe Lifecycle hooks: DOM manipulation MUST be placed inside `afterNextRender()` or `afterRender()`.
4. Hydration Mismatch: DO NOT use `Math.random()` or `new Date()` directly in templates.
