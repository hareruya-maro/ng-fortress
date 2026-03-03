import { program } from 'commander';
import { input, select } from '@inquirer/prompts';
import chalk from 'chalk';
import path from 'path';

// Import steps
import { initializeAngularProject } from './steps/ng-cli.js';
import { setupZoneless } from './steps/zoneless.js';
import { setupDirStructureAndAgents } from './steps/structure.js';
import { setupLinter } from './steps/linter.js';
import { setupTesting } from './steps/testing.js';
import { setupWorkflowAndHooks } from './steps/workflow.js';

program
    .name('create-ng-fortress')
    .description('AI-Native Strict Web Framework')
    .argument('[project-name]', 'Name of the project to create')
    .parse(process.argv);

async function main() {
    console.log(chalk.blue.bold('\n🏰 NG Fortress Initialization Started\n'));

    let projectName = program.args[0];
    if (!projectName) {
        projectName = await input({ message: 'Enter project name:' });
    }

    const stylingChoice = await select({
        message: 'Select the styling constraint strategy:',
        choices: [
            {
                name: 'A: Utility-First (Tailwind CSS) - Recommended for AI',
                value: 'tailwind',
                description: 'AI-friendly class-based styling',
            },
            {
                name: 'B: Component-Driven (No-CSS)',
                value: 'no-css',
                description: 'Complete ban on custom CSS. Use UI Libraries like Angular Material',
            },
            {
                name: 'C: Strict Scoped CSS',
                value: 'strict-css',
                description: 'Standard Angular CSS properly restricted heavily via Stylelint',
            },
        ],
    });

    const projectPath = path.join(process.cwd(), projectName);

    try {
        await initializeAngularProject(projectName, projectPath);
        await setupZoneless(projectPath);
        await setupDirStructureAndAgents(projectPath);
        await setupLinter(projectPath, stylingChoice);
        await setupTesting(projectPath);
        await setupWorkflowAndHooks(projectPath);

        console.log(chalk.blue.bold(`\n🎉 NG Fortress Project '${projectName}' successfully built! 🏰\n`));
        console.log(`  cd ${projectName}`);
        console.log(`  npm start\n`);
        console.log(chalk.gray('Enter the Fortress. No compromises.'));
    } catch (e) {
        console.error(chalk.red('\nFailed to build NG Fortress:'), e);
        process.exit(1);
    }
}

main().catch(console.error);
