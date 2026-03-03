import { execSync } from 'child_process';
import chalk from 'chalk';

export async function initializeAngularProject(projectName, projectPath) {
    console.log(chalk.green(`\n🚀 [Step 1] Creating Angular Project: ${projectName}...`));
    try {
        // Skip tests as we'll set up vitest manually, skip install as we'll install everything at the end
        execSync(`npx @angular/cli@latest new ${projectName} --standalone --routing --style=css --skip-install --skip-tests --defaults`, { stdio: 'inherit' });
    } catch (error) {
        throw new Error('Failed to create Angular project.');
    }
}
