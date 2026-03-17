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

### Migrating Existing Applications

You can also apply NG Fortress's strict linters, pre-commit hooks, and CI/CD workflow testing tools to an *existing* Angular application without destroying its source components:

```bash
npx create-ng-fortress --migrate
```

If you are inside a monorepo, it will automatically find all Angular apps in your workspace and let you select which one to migrate.

---

## 🛡️ Core Features

- **Zoneless By Default**: Completely removes `zone.js`. All reactivity is formally governed by Angular Signals (`signal`, `computed`, `effect`).
- **Rigid Physical Boundaries**: Code must reside explicitly within:
  - `ui/`: Pure presentation components (Dumb). No services injected.
  - `features/`: Smart logic components. Max 20 lines per method.
  - `infrastructure/`: 
    - `browser/`: DOM, window, and browser-specific APIs.
    - `server/`: Node.js specific APIs (for SSR).
    - `universal/`: Clean, platform-agnostic logic (e.g., HttpClient).
  - `schema/`: Types, interfaces, and **Injection Tokens** (in `tokens/`) for abstracting infrastructure.
- **Strict Linting (Zero Tolerance)**: Utilizes Flat Config ESLint and `eslint-plugin-boundaries` to enforce:
  - **No eval()**: Ban `eval()` and `new Function()` to prevent AI agent vulnerabilities.
  - **No Globals**: Direct access to `window`, `document`, `localStorage`, etc., is forbidden. Use Injection Tokens.
  - **Semantic Naming**: Ban vague names like `data`, `info`, `res`, `handle`, `item`.
  - **Dependency Flow**: Prevents architectural pollution (e.g., importing `infrastructure/browser` into `features`).
- **Component Strictness**:
  - `standalone: true` and `ChangeDetectionStrategy.OnPush` are mandatory.
  - Use Signal-based `input()` and `output()` (Standard `@Input`/@Output decorators are forbidden).
  - `app.component.ts` is strictly a routing shell (No logic, max 30 lines).
- **Styling Strategy**: Choose from Utility-First (Tailwind), No-CSS (UI Libraries), or Strict Scoped CSS (BEM via Stylelint).
- **Build-Time Verification**: Enforces absolute asset size limits, file extension rules, and directory structures before the bundle compiles.
- **Integrated Agent Contexts**: Automatically generates an `AGENTS.md` and `skills/` directory, ensuring AI coding assistants explicitly understand the architecture's constraints.
- **Coverage Enforcement**: Pre-configured Vitest + Playwright suite that forcefully rejects commits if code coverage drops below 80%.

---

## 🤖 Why "AI-Native"?

Standard frameworks afford too much freedom—which causes AIs to hallucinate varying architectural styles across different files. **NG Fortress removes choice.** By strictly enforcing one way to govern state, one way to organize files, and one way to name properties, AI agents write consistent, bulletproof code every single time.

## ⚙️ Development Setup

### Node.js バージョン管理ツールを使っている場合

[mise](https://mise.jdx.dev/) や [volta](https://volta.sh/) 等のバージョン管理ツールを使っている場合、Git hook（lefthook）の実行時に `npx` / `node` が見つからないことがあります。プロジェクトルートに `.lefthookrc` を作成して PATH を通してください：

```bash
# .lefthookrc (mise の場合)
export PATH="$HOME/.local/share/mise/shims:$PATH"
```

> **Note**: `.lefthookrc` は `.gitignore` に含まれているため、各開発者がローカルで作成する必要があります。

---

## 🤝 Contributing & License

Contributions, issues, and feature requests are welcome! 
Released under the MIT License.
