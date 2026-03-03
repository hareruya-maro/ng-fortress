# 🏰 create-ng-fortress

**An AI-Native, Zero-Tolerance Strict Web Framework CLI for Angular.**

`create-ng-fortress` is a CLI tool designed to scaffold extremely strict, architecturally pure Angular projects optimized for AI agents and strict human workflows. It bypasses conventional looseness and enforcing structural boundaries, immutable state management, and 100% strict typing rules out-of-the-box.

---

## 🚀 Quick Start

Create a new NG Fortress application using `npx`:

```bash
npx create-ng-fortress my-app
```

You will be prompted to select a styling constraint strategy (e.g., Tailwind CSS, Strict Scoped CSS). 

---

## 🛡️ Core Features

- **Zoneless By Default**: Completely removes `zone.js`. All reactivity is formally governed by Angular Signals (`signal`, `computed`, `effect`).
- **Rigid Physical Boundaries**: Code must reside explicitly within:
  - `ui/`: Pure presentation components.
  - `features/`: Smart logic components.
  - `infrastructure/`: Adapters, DOM interaction, and APIs.
  - `schema/`: Types and interfaces.
- **Strict Linting (Zero Tolerance)**: Utilizes Flat Config ESLint and `eslint-plugin-boundaries` to prevent architectural pollution (e.g., importing from `infrastructure` into `ui`).
- **Build-Time Verification**: Enforces absolute asset size limits, file extension rules, and directory structures before the bundle compiles.
- **Integrated Agent Contexts**: Automatically generates an `AGENTS.md` and `skills/` directory, ensuring AI coding assistants explicitly understand the architecture's constraints.
- **Coverage Enforcement**: Pre-configured Vitest + Playwright suite that forcefully rejects commits if code coverage drops below 80%.

---

## 🤖 Why "AI-Native"?

Standard frameworks afford too much freedom—which causes AIs to hallucinate varying architectural styles across different files. **NG Fortress removes choice.** By strictly enforcing one way to govern state, one way to organize files, and one way to name properties, AI agents write consistent, bulletproof code every single time.

## 🤝 Contributing & License

Contributions, issues, and feature requests are welcome! 
Released under the MIT License.
