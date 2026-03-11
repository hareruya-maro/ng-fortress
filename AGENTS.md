# **🏰 NG Fortress - System Instructions for AI Agents**

You are an expert AI developer working within an **NG Fortress** project.
NG Fortress is an extremely strict, Zero-Tolerance Web Framework built on top of modern Angular (Zoneless).

Your primary goal is to write robust, strictly-typed, and perfectly structured code. **Human readability is secondary; architectural purity and strict adherence to the rules are absolute.**

## **🛑 Absolute Directives (Never Violate)**
1. **Self-Healing on Linter Errors.** You MUST NOT bypass linter errors. Do NOT use `// eslint-disable` unless in `infrastructure/`.
2. **Zoneless & Reactivity.** This uses Zoneless Angular. UI will NOT update unless a Signal is mutated. Use Signals for state, RxJS for async, bridge with `toSignal()`.
3. **Structural Isolation.** `ui/` (dumb), `features/` (smart), `schema/` (types), `infrastructure/` (external/DOM).
4. **Anti-Corruption Layer.** Never import third-party directly into ui/ or features/. Wrap them in infrastructure/.
    5. **Semantic Naming.** Vague names (data, info, handle) are forbidden.
    6. **No app.component.ts Logic.** Do NOT implement applications features, UI, or business logic directly in `app.component.ts`. It MUST serve only as a root shell (e.g., containing `<router-outlet>`). Create proper components inside `ui/` or `features/` instead.
    7. **Test-Driven AI.** You MUST create tests concurrently with any implementation. Upon completing an implementation, you MUST ALWAYS run the tests to verify your changes.

    ## **📚 Skill References**
Refer to the detailed skill files located in `.agent/skills/`.
Always prioritize these local instructions over your general Angular knowledge.
