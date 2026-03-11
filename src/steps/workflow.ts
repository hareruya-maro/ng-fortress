import { execSync } from "node:child_process";
import path from "node:path";
import chalk from "chalk";
import fs from "fs-extra";

export async function setupWorkflowAndHooks(
	projectPath: string,
	workspaceRoot: string,
	isMonorepo: boolean,
) {
	console.log(
		chalk.green(
			"\n⛓️ [Step 6] Enforcing Workflow (Husky, lint-staged, Pre-build validation)...",
		),
	);

	const pkgPath = path.join(workspaceRoot, "package.json");
	const pkg = fs.readJsonSync(pkgPath);
	pkg.devDependencies = pkg.devDependencies || {};

	const commonDevDeps = {
		"@biomejs/biome": "^2.4.6",
		oxlint: "^1.52.0",
		"eslint-plugin-local-rules": "^3.0.2",
	};

	const projPkgPath = isMonorepo
		? path.join(projectPath, "package.json")
		: pkgPath;
	const projPkg = fs.readJsonSync(projPkgPath);

	if (isMonorepo) {
		// Install lefthook & taplo globally in monorepo
		Object.assign(pkg.devDependencies, {
			lefthook: "^2.1.3",
			"@taplo/cli": "^0.7.0",
		});
		// Install linters to specific project
		projPkg.devDependencies = projPkg.devDependencies || {};
		Object.assign(projPkg.devDependencies, commonDevDeps);
	} else {
		Object.assign(pkg.devDependencies, {
			lefthook: "^2.1.3",
			"@taplo/cli": "^0.7.0",
			...commonDevDeps,
		});
	}

	pkg.scripts = pkg.scripts || {};
	pkg.scripts.prepare = "lefthook install";

	if (!isMonorepo) {
		pkg.scripts.lint = "oxlint && eslint .";
	} else {
		projPkg.scripts = projPkg.scripts || {};
		projPkg.scripts.lint = "oxlint && eslint .";
	}

	// Wire up the pre-build validator for the specific project
	const originalBuild = projPkg.scripts?.build || "ng build";

	// In a monorepo, config DestDir is projectPath to keep it isolated
	const configDestDir = isMonorepo ? projectPath : workspaceRoot;

	const scriptsRelativePath = "scripts/pre-build.js";
	const preBuildCmd = `node ${scriptsRelativePath} && ${originalBuild}`;

	projPkg.scripts = projPkg.scripts || {};
	projPkg.scripts.build = preBuildCmd;
	fs.writeJsonSync(projPkgPath, projPkg, { spaces: 2 });

	if (isMonorepo) {
		fs.writeJsonSync(pkgPath, pkg, { spaces: 2 }); // Save root pkg if monorepo
	}

	// Write Lefthook config dynamically
	const lefthookPath = path.join(workspaceRoot, "lefthook.yml");
	const appName = path.basename(projectPath);
	const relDir = isMonorepo
		? path.relative(workspaceRoot, projectPath).replace(/\\/g, "/")
		: ".";

	function getLefthookCommands(
		appName: string,
		relDir: string,
		isMonorepo: boolean,
	) {
		if (isMonorepo) {
			return `    protect-configs-${appName}:
      glob: "${relDir}/**/*.{json,js,yml,cjs,mjs}"
      run: node ${relDir}/scripts/protect-config.js {staged_files}
    biome-${appName}:
      glob: "${relDir}/**/*.{js,ts,jsx,tsx,json,css,html}"
      run: npx biome check --config-path=${relDir} --write {staged_files}
    oxlint-${appName}:
      glob: "${relDir}/**/*.{js,ts,jsx,tsx}"
      run: npx oxlint {staged_files}`;
		} else {
			return `    protect-configs:
      run: node scripts/protect-config.js {staged_files}
    biome:
      glob: "*.{js,ts,jsx,tsx,json,css,html}"
      run: npx biome check --write {staged_files}
    oxlint:
      glob: "*.{js,ts,jsx,tsx}"
      run: npx oxlint {staged_files}`;
		}
	}

	function appendLefthook(
		content: string,
		appName: string,
		relDir: string,
		isMonorepo: boolean,
	) {
		const generatedCommands = getLefthookCommands(appName, relDir, isMonorepo);
		const lines = content.split("\n");
		let inPreCommit = false;
		let commandsIndex = -1;

		for (let i = 0; i < lines.length; i++) {
			if (lines[i].startsWith("pre-commit:")) {
				inPreCommit = true;
			} else if (inPreCommit && lines[i].match(/^ {2}commands:/)) {
				commandsIndex = i;
				break;
			} else if (
				inPreCommit &&
				!lines[i].startsWith(" ") &&
				lines[i].trim() !== ""
			) {
				inPreCommit = false;
			}
		}

		if (commandsIndex !== -1) {
			lines.splice(commandsIndex + 1, 0, generatedCommands);
			return lines.join("\n");
		} else {
			if (content.includes("pre-commit:")) {
				return content.replace(
					"pre-commit:",
					`pre-commit:\n  commands:\n${generatedCommands}`,
				);
			} else {
				let finalStr = content.trim();
				if (finalStr) finalStr += "\n\n";
				return (
					finalStr +
					`pre-commit:\n  parallel: true\n  commands:\n` +
					generatedCommands +
					"\n"
				);
			}
		}
	}

	let lefthookrc = "";
	if (fs.existsSync(lefthookPath)) {
		const existing = fs.readFileSync(lefthookPath, "utf-8");
		lefthookrc = appendLefthook(existing, appName, relDir, isMonorepo);
	} else {
		lefthookrc = appendLefthook("", appName, relDir, isMonorepo);
	}
	fs.writeFileSync(lefthookPath, lefthookrc);

	// Write Biome config into configDestDir (isolated)
	const biomerc = `{
	"$schema": "https://biomejs.dev/schemas/2.4.6/schema.json",
	"vcs": {
		"enabled": true,
		"clientKind": "git",
		"useIgnoreFile": true
	},
	"formatter": {
		"enabled": true,
		"indentStyle": "tab"
	},
	"linter": {
		"enabled": true,
		"rules": {
			"recommended": true
		}
	},
	"javascript": {
		"formatter": {
			"quoteStyle": "double"
		}
	},
	"assist": {
		"enabled": true,
		"actions": {
			"source": {
				"organizeImports": "on"
			}
		}
	}
}`;
	fs.writeFileSync(path.join(configDestDir, "biome.json"), biomerc);

	// Write Custom ESLint Local Rule into configDestDir
	const eslintLocalRules = `// eslint-local-rules.cjs
module.exports = {
  'no-agent-eval': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallow eval() and new Function() strictly to prevent Agent vulnerabilities',
      },
      messages: {
        noEval: 'ERROR: eval() や new Function() の使用は禁止されています。 WHY: AIエージェントが任意コード実行の脆弱性を埋め込むリスクを防ぐためです。 FIX: 評価やパースが必要な場合は、JSON.parse() などの安全な代替手段を使用してください。 EXAMPLE: // Bad: eval(data); // Good: JSON.parse(data);'
      }
    },
    create(context) {
      return {
        CallExpression(node) {
          if (node.callee.type === 'Identifier' && node.callee.name === 'eval') {
            context.report({
              node,
              messageId: 'noEval'
            });
          }
        },
        NewExpression(node) {
          if (node.callee.type === 'Identifier' && node.callee.name === 'Function') {
            context.report({
              node,
              messageId: 'noEval'
            });
          }
        }
      };
    }
  }
};
`;
	fs.writeFileSync(
		path.join(configDestDir, "eslint-local-rules.cjs"),
		eslintLocalRules,
	);

	// Write scripts/protect-config.js to configDestDir
	fs.ensureDirSync(path.join(configDestDir, "scripts"));
	const protectConfigScript = `// scripts/protect-config.js
const PROTECTED = [
	".eslintrc.json",
	"eslint.config.js",
	"eslint.config.mjs",
	"biome.json",
	"lefthook.yml",
];

const stagedFiles = process.argv.slice(2);

for (const file of stagedFiles) {
	for (const p of PROTECTED) {
		if (file.includes(p)) {
			console.error(
				\`[BLOCKED] 🚨 \${file} is a protected config file. \` +
					\`Please fix your code, do NOT change the linter config to suppress errors.\`,
			);
			process.exit(1);
		}
	}
}
process.exit(0);
`;
	fs.writeFileSync(
		path.join(configDestDir, "scripts", "protect-config.js"),
		protectConfigScript,
	);

	// Write scripts/pre-build.js to configDestDir
	fs.ensureDirSync(path.join(configDestDir, "scripts"));
	const preBuildScript = `import fs from 'fs';
import path from 'path';

console.log('🛡️  NG Fortress Pre-build Validation Started');

// 1. Check Directory Violations
const appDir = path.join(process.cwd(), 'src/app');
if (fs.existsSync(appDir)) {
    const allowed = ['ui', 'features', 'infrastructure', 'schema', 'app.component.ts', 'app.component.spec.ts', 'app.config.ts', 'app.routes.ts', 'app.config.server.ts', 'app.routes.server.ts'];
    const items = fs.readdirSync(appDir);
    items.forEach(item => {
        if (!allowed.includes(item)) {
            console.error(\`❌ Error: Unauthorized file or directory '\${item}' found in src/app/\`);
            process.exit(1);
        }
    });
}

// 2. Asset Constraints Checks
const assetsDir = path.join(process.cwd(), 'src/assets');
if (fs.existsSync(assetsDir)) {
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
    const maxSizeBytes = 500 * 1024; // 500KB

    function checkDir(dir) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                checkDir(fullPath);
            } else {
                const ext = path.extname(file).toLowerCase();
                if (!allowedExtensions.includes(ext)) {
                    console.error(\`❌ Error: Invalid asset format '\${ext}' in \${fullPath}\`);
                    process.exit(1);
                }
                if (stat.size > maxSizeBytes) {
                    console.error(\`❌ Error: Asset \${fullPath} exceeds maximum size of 500KB\`);
                    process.exit(1);
                }
            }
        });
    }
    checkDir(assetsDir);
}

console.log('✅ Pre-build Validation Passed');
`;
	fs.writeFileSync(
		path.join(configDestDir, "scripts", "pre-build.js"),
		preBuildScript,
	);

	// Initial npm install
	console.log(
		chalk.green(
			"\n📦 [Step 6.5] Installing dependencies and enforcing Git Hooks...",
		),
	);
	try {
		execSync("npm install --legacy-peer-deps", {
			cwd: workspaceRoot,
			stdio: "inherit",
		});

		if (isMonorepo) {
			// Also install in projectPath to get the newly added eslint local rules etc.
			execSync("npm install --legacy-peer-deps", {
				cwd: projectPath,
				stdio: "inherit",
			});
		}

		// Setup git and hooks
		if (!fs.existsSync(path.join(workspaceRoot, ".git"))) {
			execSync("git init", { cwd: workspaceRoot, stdio: "ignore" });
		}

		// Install lefthook
		execSync("npx lefthook install", { cwd: workspaceRoot, stdio: "ignore" });
	} catch {
		console.error(
			chalk.yellow(
				'Dependency installation or git hooks failed. You may need to run "npm install" manually.',
			),
		);
	}
}
