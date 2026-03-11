import { confirm, input, select } from "@inquirer/prompts";
import chalk from "chalk";
import { program } from "commander";
import path from "path";
import fs from "fs-extra";

import { setupLinter } from "./steps/linter.js";
import { initializeAngularProject } from "./steps/ng-cli.js";
import { setupDirStructureAndAgents } from "./steps/structure.js";
import { setupTesting } from "./steps/testing.js";
import { setupWorkflowAndHooks } from "./steps/workflow.js";
import { setupZoneless } from "./steps/zoneless.js";
import { detectWorkspaceRoot } from "./utils/workspace.js";

program
	.name("create-ng-fortress")
	.description("AI-Native Strict Web Framework")
	.option("--migrate", "Migrate an existing Angular project to NG Fortress workflow")
	.argument("[project-name]", "Name of the project to create (or directory of existing app)")
	.parse(process.argv);

async function findAngularApps(dir) {
	const apps = [];
	const items = await fs.promises.readdir(dir, { withFileTypes: true });
	for (const item of items) {
		if (item.isDirectory() && item.name !== 'node_modules' && !item.name.startsWith('.')) {
			const fullPath = path.join(dir, item.name);
			if (fs.existsSync(path.join(fullPath, 'angular.json')) || fs.existsSync(path.join(fullPath, 'project.json'))) {
				apps.push(item.name);
			} else {
				// Search one level deeper for typical apps/libs structures
				const subItems = await fs.promises.readdir(fullPath, { withFileTypes: true });
				for (const subItem of subItems) {
					if (subItem.isDirectory()) {
						const subFullPath = path.join(fullPath, subItem.name);
						if (fs.existsSync(path.join(subFullPath, 'angular.json')) || fs.existsSync(path.join(subFullPath, 'project.json'))) {
							apps.push(path.join(item.name, subItem.name));
						}
					}
				}
			}
		}
	}
	return apps;
}

async function main() {
	console.log(chalk.blue.bold("\n🏰 NG Fortress Initialization Started\n"));

	const options = program.opts();
	const isMigrate = options.migrate;

	let projectName = program.args[0];
	const cwd = process.cwd();
	const workspaceInfo = detectWorkspaceRoot(cwd);
	const isMonorepo = workspaceInfo.isMonorepo;
	const workspaceRoot = isMonorepo ? workspaceInfo.workspaceRoot : cwd;

	let projectPath;

	if (isMigrate) {
		console.log(chalk.yellow("🔄 Migration Mode Detected"));

		if (projectName) {
			projectPath = path.resolve(cwd, projectName);
		} else {
			// If not provided, either we are inside an app, or in monorepo root
			if (fs.existsSync(path.join(cwd, 'angular.json')) || fs.existsSync(path.join(cwd, 'project.json'))) {
				projectPath = cwd;
				projectName = path.basename(projectPath);
			} else if (isMonorepo) {
				const apps = await findAngularApps(workspaceRoot);
				if (apps.length === 0) {
					console.error(chalk.red("No Angular applications found in this monorepo to migrate."));
					process.exit(1);
				}
				const selectedApp = await select({
					message: "Select the existing Angular application to migrate:",
					choices: apps.map(app => ({ name: app, value: app })),
				});
				projectName = path.basename(selectedApp);
				projectPath = path.join(workspaceRoot, selectedApp);
			} else {
				console.error(chalk.red("Unable to determine project to migrate. Please run inside an Angular project or specify the path."));
				process.exit(1);
			}
		}

		if (!fs.existsSync(path.join(projectPath, 'angular.json')) && !fs.existsSync(path.join(projectPath, 'project.json'))) {
			console.error(chalk.red(`The specified path does not contain a valid Angular application: ${projectPath}`));
			process.exit(1);
		}

	} else {
		// Normal creation flow
		if (!projectName) {
			projectName = await input({ message: "Enter project name:" });
		}
		projectPath = path.join(cwd, projectName);
	}

	const stylingChoice = await select({
		message: "Select the styling constraint strategy:",
		choices: [
			{
				name: "A: Utility-First (Tailwind CSS) - Recommended for AI",
				value: "tailwind",
				description: "AI-friendly class-based styling",
			},
			{
				name: "B: Component-Driven (No-CSS)",
				value: "no-css",
				description:
					"Complete ban on custom CSS. Use UI Libraries like Angular Material",
			},
			{
				name: "C: Strict Scoped CSS",
				value: "strict-css",
				description:
					"Standard Angular CSS properly restricted heavily via Stylelint",
			},
		],
	});

	const useSSR = await confirm({
		message: "Enable Server-Side Rendering (SSR)?",
		default: true,
	});

	if (isMonorepo && !isMigrate) {
		console.log(chalk.yellow(`\n📦 Monorepo detected at: ${workspaceRoot}`));
		console.log(chalk.yellow(`   App will be generated at: ${projectPath}\n`));
	} else if (isMigrate) {
		console.log(chalk.yellow(`\n📦 Migrating app at: ${projectPath}`));
	}

	try {
		if (!isMigrate) {
			await initializeAngularProject(
				projectName,
				projectPath,
				workspaceRoot,
				isMonorepo,
				useSSR,
			);
			await setupZoneless(projectPath);
		}

		await setupDirStructureAndAgents(
			projectPath,
			workspaceRoot,
			isMonorepo,
			useSSR,
		);
		await setupLinter(
			projectPath,
			stylingChoice,
			workspaceRoot,
			isMonorepo,
			useSSR,
		);
		await setupTesting(projectPath, workspaceRoot, isMonorepo);
		await setupWorkflowAndHooks(projectPath, workspaceRoot, isMonorepo);

		if (isMigrate) {
			console.log(
				chalk.blue.bold(
					`\n🎉 NG Fortress Workflow successfully applied to '${projectName}'! 🏰\n`,
				),
			);
		} else {
			console.log(
				chalk.blue.bold(
					`\n🎉 NG Fortress Project '${projectName}' successfully built! 🏰\n`,
				),
			);
			console.log(`  cd ${projectName}`);
			console.log(`  npm start\n`);
		}
		console.log(chalk.gray("Enter the Fortress. No compromises."));
	} catch (e) {
		console.error(chalk.red("\nFailed to build NG Fortress:"), e);
		process.exit(1);
	}
}

main().catch(console.error);
