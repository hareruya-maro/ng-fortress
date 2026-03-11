import path from "node:path";
import chalk from "chalk";
import fs from "fs-extra";

export async function setupZoneless(projectPath: string) {
	console.log(chalk.green("\n⚡ [Step 2] Applying Zoneless Configuration..."));

	// 1. Modify app.config.ts to use provideExperimentalZonelessChangeDetection
	const appConfigPath = path.join(projectPath, "src/app/app.config.ts");
	if (fs.existsSync(appConfigPath)) {
		let content = fs.readFileSync(appConfigPath, "utf8");

		// Remove provideZoneChangeDetection import and setup
		content = content.replace(/provideZoneChangeDetection\s*(?:,\s*)?/g, "");
		content = content.replace(
			/import\s*{\s*([^}]*?)\s*}\s*from\s*'@angular\/core';/,
			(_match: string, group1: string) => {
				const imports = group1
					.split(",")
					.map((s: string) => s.trim())
					.filter((s: string) => s !== "provideZoneChangeDetection");
				if (!imports.includes("provideZonelessChangeDetection")) {
					imports.push("provideZonelessChangeDetection");
				}
				return `import { ${imports.join(", ")} } from '@angular/core';`;
			},
		);

		// Add provideZonelessChangeDetection()
		content = content.replace(
			/providers:\s*\[/,
			"providers: [\n    provideZonelessChangeDetection(),",
		);

		fs.writeFileSync(appConfigPath, content);
	}

	// 2. Remove zone.js from angular.json polyfills
	const angularJsonPath = path.join(projectPath, "angular.json");
	if (fs.existsSync(angularJsonPath)) {
		const angularJson = fs.readJsonSync(angularJsonPath);
		const projectName = Object.keys(angularJson.projects)[0];
		const project = angularJson.projects[projectName];

		if (project.architect?.build?.options) {
			let polyfills = project.architect.build.options.polyfills || [];
			if (Array.isArray(polyfills)) {
				polyfills = polyfills.filter((p) => p !== "zone.js");
				project.architect.build.options.polyfills = polyfills;
			}
		}

		fs.writeJsonSync(angularJsonPath, angularJson, { spaces: 2 });
	}
}
