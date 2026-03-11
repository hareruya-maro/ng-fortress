import chalk from "chalk";
import { execSync } from "child_process";

export async function initializeAngularProject(
	projectName,
	projectPath,
	workspaceRoot,
	isMonorepo,
	useSSR,
) {
	console.log(
		chalk.green(`\n🚀 [Step 1] Creating Angular Project: ${projectName}...`),
	);
	const ssrFlag = useSSR ? " --ssr" : "";
	try {
		if (isMonorepo) {
			// In a monorepo, we might need a slightly different setup, but --directory handles pathing
			// Ensure we skip git since the workspace already manages it
			execSync(
				`npx @angular/cli@latest new ${projectName} --directory ${projectName} --standalone --routing --style=css${ssrFlag} --skip-install --skip-tests --skip-git --defaults`,
				{ stdio: "inherit" },
			);
		} else {
			// Standard new repo creation
			execSync(
				`npx @angular/cli@latest new ${projectName} --standalone --routing --style=css${ssrFlag} --skip-install --skip-tests --defaults`,
				{ stdio: "inherit" },
			);
		}
	} catch {
		throw new Error("Failed to create Angular project.");
	}
}
