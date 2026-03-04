import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';

export async function setupWorkflowAndHooks(projectPath) {
    console.log(chalk.green('\n⛓️ [Step 6] Enforcing Workflow (Husky, lint-staged, Pre-build validation)...'));

    const pkgPath = path.join(projectPath, 'package.json');
    const pkg = fs.readJsonSync(pkgPath);
    pkg.devDependencies = pkg.devDependencies || {};

    Object.assign(pkg.devDependencies, {
        "husky": "^9.0.0",
        "lint-staged": "^15.0.0"
    });

    pkg.scripts = pkg.scripts || {};
    pkg.scripts.prepare = "husky || true";

    // Wire up the pre-build validator
    const originalBuild = pkg.scripts.build || "ng build";
    pkg.scripts.build = `node scripts/pre-build.js && ${originalBuild}`;

    fs.writeJsonSync(pkgPath, pkg, { spaces: 2 });

    // lint-staged settings
    const lintStagedrc = `{
  "*.{ts,html}": [
    "prettier --write",
    "eslint --max-warnings 0"
  ],
  "*.{css,scss,md,json}": [
    "prettier --write"
  ]
}
`;
    fs.writeFileSync(path.join(projectPath, '.lintstagedrc'), lintStagedrc);

    // Write scripts/pre-build.js
    fs.ensureDirSync(path.join(projectPath, 'scripts'));
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
    fs.writeFileSync(path.join(projectPath, 'scripts', 'pre-build.js'), preBuildScript);

    // Initial npm install
    console.log(chalk.green('\n📦 [Step 6.5] Installing dependencies and enforcing Git Hooks...'));
    try {
        execSync('npm install --legacy-peer-deps', { cwd: projectPath, stdio: 'inherit' });

        // Setup git and husky
        execSync('git init', { cwd: projectPath, stdio: 'ignore' });
        execSync('npx husky init', { cwd: projectPath, stdio: 'ignore' });

        const preCommitPath = path.join(projectPath, '.husky', 'pre-commit');
        // Require lint-staged and passing tests before commit
        fs.writeFileSync(preCommitPath, 'npx lint-staged\\nnpm run test\\n');

    } catch (e) {
        console.error(chalk.yellow('Dependency installation or git hooks failed. You may need to run "npm install" manually.'));
    }
}
