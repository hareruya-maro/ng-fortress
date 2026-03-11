import path from "node:path";
import chalk from "chalk";
import fs from "fs-extra";

export async function setupDirStructureAndAgents(
	projectPath: string,
	workspaceRoot: string,
	_isMonorepo: boolean,
	useSSR: boolean,
	isMigrate = false,
) {
	console.log(
		chalk.green("\n🛡️ [Step 3] Enforcing NG Fortress Structural Isolation..."),
	);

	if (isMigrate) {
		console.log(
			chalk.yellow(
				"   Skipping destructive component generation for existing application.",
			),
		);
	}

	// 1. Create rigid directory structure
	const appDir = path.join(projectPath, "src/app");
	fs.ensureDirSync(path.join(appDir, "ui"));
	fs.ensureDirSync(path.join(appDir, "features"));
	fs.ensureDirSync(path.join(appDir, "infrastructure/browser"));
	if (useSSR) {
		fs.ensureDirSync(path.join(appDir, "infrastructure/server"));
	}
	fs.ensureDirSync(path.join(appDir, "infrastructure/universal"));
	fs.ensureDirSync(path.join(appDir, "schema"));
	fs.ensureDirSync(path.join(appDir, "schema/tokens"));

	// 2. Remove default app component and create a strict standalone one
	const appComponentFiles = [
		"app.component.ts",
		"app.component.html",
		"app.component.css",
		"app.component.scss",
		"app.component.spec.ts",
		"app.ts",
		"app.html",
		"app.css",
		"app.scss",
		"app.spec.ts",
	];
	if (!isMigrate) {
		appComponentFiles.forEach((file) => {
			const filePath = path.join(appDir, file);
			if (fs.existsSync(filePath)) {
				fs.removeSync(filePath);
			}
		});
	}

	if (!isMigrate) {
		const strictAppComponentContent = `import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: \`<router-outlet></router-outlet>\`
})
export class AppComponent {
  title = 'NG Fortress';
}
`;
		fs.writeFileSync(
			path.join(appDir, "app.component.ts"),
			strictAppComponentContent,
		);

		const strictAppSpecContent = `import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(\`should have as title 'NG Fortress'\`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('NG Fortress');
  });
});
`;
		fs.writeFileSync(
			path.join(appDir, "app.component.spec.ts"),
			strictAppSpecContent,
		);

		// 2.5 Fix main.ts bootstrap reference
		const mainTsPath = path.join(projectPath, "src/main.ts");
		if (fs.existsSync(mainTsPath)) {
			let mainContent = fs.readFileSync(mainTsPath, "utf8");
			mainContent = mainContent.replace(
				/import\s*{\s*App\s*}\s*from\s*['"]\.\/app\/app['"];?/,
				"import { AppComponent } from './app/app.component';\n",
			);
			mainContent = mainContent.replace(
				/bootstrapApplication\(App/,
				"bootstrapApplication(AppComponent",
			);
			fs.writeFileSync(mainTsPath, mainContent);
		}
	}

	// 3. Create Agent instructions
	console.log(
		chalk.green(
			"🤖 [Step 3.5] Generating AI Agent Contexts (AGENTS.md & skills)...",
		),
	);

	const agentsMdContent = `# **🏰 NG Fortress - System Instructions for AI Agents**

You are an expert AI developer working within an **NG Fortress** project.
NG Fortress is an extremely strict, Zero-Tolerance Web Framework built on top of modern Angular (Zoneless).

Your primary goal is to write robust, strictly-typed, and perfectly structured code. **Human readability is secondary; architectural purity and strict adherence to the rules are absolute.**

## **🛑 Absolute Directives (Never Violate)**
1. **Self-Healing on Linter Errors.** You MUST NOT bypass linter errors. Do NOT use \`// eslint-disable\` unless in \`infrastructure/\`.
2. **Zoneless & Reactivity.** This uses Zoneless Angular. UI will NOT update unless a Signal is mutated. Use Signals for state, RxJS for async, bridge with \`toSignal()\`.
3. **Structural Isolation.** \`ui/\` (dumb), \`features/\` (smart), \`schema/\` (types), \`infrastructure/\` (external/DOM).
4. **Anti-Corruption Layer.** Never import third-party directly into ui/ or features/. Wrap them in infrastructure/.
5. **Semantic Naming.** Vague names (data, info, handle) are forbidden.
6. **No app.component.ts Logic.** Do NOT implement applications features, UI, or business logic directly in \`app.component.ts\`. It MUST serve only as a root shell (e.g., containing \`<router-outlet>\`). Create proper components inside \`ui/\` or \`features/\` instead.
7. **Test-Driven AI.** You MUST create tests concurrently with any implementation. Upon completing an implementation, you MUST ALWAYS run the tests to verify your changes.

## **📚 Skill References**
Refer to the detailed skill files located in \`.agent/skills/\`.
Always prioritize these local instructions over your general Angular knowledge.
`;
	// Use workspaceRoot for agents config so AI works globally in monorepo
	fs.writeFileSync(path.join(workspaceRoot, "AGENTS.md"), agentsMdContent);

	const agentSkillsDir = path.join(workspaceRoot, ".agent", "skills");
	fs.ensureDirSync(agentSkillsDir);

	fs.writeFileSync(
		path.join(agentSkillsDir, "01-architecture.md"),
		`# Architecture Rules
- Application code must be strictly inside \`src/app/ui/\`, \`src/app/features/\`, \`src/app/infrastructure/\` (browser, ${useSSR ? "server, " : ""}universal), or \`src/app/schema/\`.
- Dependency flow: \`ui/\` -> \`features/\` -> \`infrastructure/universal\` & \`schema/\`. Reverse flow is forbidden.
- \`features/\` MUST NOT import directly from ${useSSR ? "`infrastructure/browser` or `infrastructure/server`" : "`infrastructure/browser`"}. Use Schema Tokens for injection.
`,
	);

	fs.writeFileSync(
		path.join(agentSkillsDir, "02-component-creation.md"),
		`# Component Creation Skill

1. **Mandatory Metadata:** Every component MUST have \`standalone: true\` and \`changeDetection: ChangeDetectionStrategy.OnPush\`.
2. **Inputs/Outputs:** \`@Input()\` and \`@Output()\` decorators are FORBIDDEN. Use Signal \`input()\` and \`output()\`.
3. **UI Components (\`ui/\`):** Dumb. Only simple formatting. No services.
4. **Feature Components (\`features/\`):** Smart. Max 20 lines per method. Inject services.
5. **Separate HTML Templates:** The HTML template MUST be created in a separate \`.html\` file (using \`templateUrl\`), NOT inline as a string in the \`@Component\` decorator.
`,
	);

	fs.writeFileSync(
		path.join(agentSkillsDir, "03-state-and-rxjs.md"),
		`# State and RxJS
- UI state = Signals (\`signal\`, \`computed\`). No \`let\` variables for state.
- Async streams = RxJS Observables.
- Bridge = \`toSignal()\`.
- FORBIDDEN: \`async\` pipe in HTML templates. Use signal calls (e.g., \`{{ data() }}\`).
`,
	);

	fs.writeFileSync(
		path.join(agentSkillsDir, "04-infrastructure.md"),
		`# Infrastructure Layer
- Layer is split into \`browser/\` (DOM, window)${useSSR ? ", `server/` (Node.js API)," : ""} and \`universal/\` (e.g. HttpClient).
${useSSR ? "- `browser/` and `server/` must never import each other.\n" : ""}- External libraries MUST be wrapped in a service here.
- Do NOT expose external types. Map them to \`schema/\` types.
- Convert callbacks/Promises to RxJS Observables.
- Stateless: No application state inside this layer.
- IF/Switch limit: Keep logic extremely simple. Cyclomatic complexity strictly limited.
`,
	);

	fs.writeFileSync(
		path.join(agentSkillsDir, "05-workflow-and-git.md"),
		`# Workflow & Git Commits
- Commit ONLY when tests pass AND zero Linter errors.
- Atomic Commits.
- Conventional Commits notation (\`feat:\`, \`fix:\`, etc).
- Run Prettier. Pre-commit hooks will block bad code.
`,
	);

	fs.writeFileSync(
		path.join(agentSkillsDir, "06-testing.md"),
		`# Testing Rules
- You MUST create tests concurrently with the implementation.
- You MUST explicitly execute the tests and ensure they pass whenever an implementation is completed.
- Implementation is NOT complete until tests are written and passing.
`,
	);

	if (useSSR) {
		fs.writeFileSync(
			path.join(agentSkillsDir, "07-ssr-rules.md"),
			`# SSR Rules (Server-Side Rendering)
1. NO Global Access: NEVER use \`window\`, \`document\`, \`localStorage\`, \`navigator\` directly in components or features.
2. Injection Tokens: For browser/server-specific features, define an \`InjectionToken\` and interface in \`schema/tokens/\`. Implement in \`infrastructure/browser/\` and \`infrastructure/server/\`, then provide them in \`app.config.ts\` / \`app.config.server.ts\`.
3. Safe Lifecycle hooks: DOM manipulation MUST be placed inside \`afterNextRender()\` or \`afterRender()\`.
4. Hydration Mismatch: DO NOT use \`Math.random()\` or \`new Date()\` directly in templates.
`,
		);
	}
}
