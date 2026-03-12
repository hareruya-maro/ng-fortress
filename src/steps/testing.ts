import path from "node:path";
import chalk from "chalk";
import fs from "fs-extra";

export async function setupTesting(
	projectPath: string,
	workspaceRoot: string,
	isMonorepo: boolean,
) {
	console.log(
		chalk.green(
			"\n🧪 [Step 5] Configuring Testing Tooling (Vitest & Playwright)...",
		),
	);

	const pkgPath = path.join(workspaceRoot, "package.json");
	const pkg = fs.readJsonSync(pkgPath);
	pkg.devDependencies = pkg.devDependencies || {};

	const testDeps = {
		vitest: "^4.0.0",
		"@vitest/coverage-v8": "^4.0.0",
		"@playwright/test": "^1.40.0",
		jsdom: "^24.0.0",
		"@analogjs/vite-plugin-angular": "^1.10.0",
		"@angular/platform-browser-dynamic": "^21.0.0",
		"zone.js": "~0.15.0",
	};

	Object.assign(pkg.devDependencies, testDeps);

	pkg.scripts = pkg.scripts || {};
	if (!isMonorepo) {
		pkg.scripts.test =
			"vitest run --coverage && node scripts/check-coverage.js";
		pkg.scripts["test:watch"] = "vitest";
		pkg.scripts.e2e = "playwright test";
	}

	fs.writeJsonSync(pkgPath, pkg, { spaces: 2 });

	if (isMonorepo) {
		const projPkgPath = path.join(projectPath, "package.json");
		if (fs.existsSync(projPkgPath)) {
			const projPkg = fs.readJsonSync(projPkgPath);
			projPkg.devDependencies = projPkg.devDependencies || {};
			Object.assign(projPkg.devDependencies, testDeps);
			projPkg.scripts = projPkg.scripts || {};
			projPkg.scripts.test =
				"vitest run --coverage && node scripts/check-coverage.js";
			projPkg.scripts["test:watch"] = "vitest";
			projPkg.scripts.e2e = "playwright test";
			fs.writeJsonSync(projPkgPath, projPkg, { spaces: 2 });
		}
	}

	const vitestConfig = `import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  }
});
`;
	fs.writeFileSync(path.join(projectPath, "vitest.config.ts"), vitestConfig);

	const playwrightConfig = `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
});
`;
	fs.writeFileSync(
		path.join(projectPath, "playwright.config.ts"),
		playwrightConfig,
	);

	fs.ensureDirSync(path.join(projectPath, "e2e"));

	const sampleE2e = `import { test, expect } from '@playwright/test';

test('app should load without errors', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('app-root')).toBeVisible();
});
`;
	fs.writeFileSync(path.join(projectPath, "e2e", "app.spec.ts"), sampleE2e);

	const testSetupContent = `import '@analogjs/vite-plugin-angular/setup-vitest';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting(), {
  teardown: { destroyAfterEach: true }
});
`;
	fs.writeFileSync(
		path.join(projectPath, "src", "test-setup.ts"),
		testSetupContent,
	);

	const tsconfigSpecPath = path.join(projectPath, "tsconfig.spec.json");
	if (fs.existsSync(tsconfigSpecPath)) {
		let tsconfigSpec = fs.readFileSync(tsconfigSpecPath, "utf8");
		if (!tsconfigSpec.includes('"src/test-setup.ts"')) {
			tsconfigSpec = tsconfigSpec.replace(
				/"include":\s*\[/,
				'"files": ["src/test-setup.ts"],\n  "include": [',
			);
		}
		if (!tsconfigSpec.includes('"vitest"')) {
			tsconfigSpec = tsconfigSpec.replace(
				/"types":\s*\[/,
				'"types": [\n      "vitest/globals",\n      "vitest",',
			);
		}
		fs.writeFileSync(tsconfigSpecPath, tsconfigSpec);
	}

	// Create check-coverage.js script for warnings if coverage < 90%
	fs.ensureDirSync(path.join(projectPath, "scripts"));
	const checkCoverageScript = `import fs from 'fs';
  import path from 'path';

  const summaryPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

  if (fs.existsSync(summaryPath)) {
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    const total = summary.total;
    let warning = false;

    console.log('\\n📊 NG Fortress Coverage Check');
    for (const key of ['lines', 'statements', 'functions', 'branches']) {
      if (total[key] && total[key].pct < 90) {
        console.warn(\`⚠️  Warning: \${key} coverage is \${total[key].pct}%. (Target: >=90%)\`);
            warning = true;
        }
    }
    
    if (!warning) {
        console.log('✅ All coverage targets are >= 90%. Excellent.');
    } else {
        console.log('💡 Note: Build passed (>=80%), but please improve tests to reach 90% threshold.\\n');
    }
} else {
    console.warn('⚠️  Warning: coverage-summary.json not found. Run tests with coverage enabled.');
}
`;
	fs.writeFileSync(
		path.join(projectPath, "scripts", "check-coverage.js"),
		checkCoverageScript,
	);
}
