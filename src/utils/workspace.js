import fs from "fs-extra";
import path from "path";

/**
 * Traverses up from the given directory to find the root of a workspace/monorepo.
 * It looks for indicators such as .git, pnpm-workspace.yaml, lerna.json,
 * or a package.json with a "workspaces" field.
 *
 * @param {string} startDir The directory to start searching from (e.g., projectPath)
 * @returns {{ isMonorepo: boolean, workspaceRoot: string }} Object containing monorepo status and the root path.
 */
export function detectWorkspaceRoot(startDir) {
	let currentDir = startDir;

	while (currentDir !== path.parse(currentDir).root) {
		// Check for Git root
		if (fs.existsSync(path.join(currentDir, ".git"))) {
			return { isMonorepo: true, workspaceRoot: currentDir };
		}

		// Check for common PNPM workspaces
		if (fs.existsSync(path.join(currentDir, "pnpm-workspace.yaml"))) {
			return { isMonorepo: true, workspaceRoot: currentDir };
		}

		// Check for Lerna
		if (fs.existsSync(path.join(currentDir, "lerna.json"))) {
			return { isMonorepo: true, workspaceRoot: currentDir };
		}

		// Check for NPM/Yarn workspaces
		const pkgPath = path.join(currentDir, "package.json");
		if (fs.existsSync(pkgPath)) {
			try {
				const pkg = fs.readJsonSync(pkgPath);
				if (pkg.workspaces) {
					return { isMonorepo: true, workspaceRoot: currentDir };
				}
			} catch {
				// Ignore parsing errors for package.json
			}
		}

		currentDir = path.dirname(currentDir);
	}

	// If we reach the root of the filesystem without finding anything,
	// assume it is NOT a monorepo and the start directory is the root.
	// However, if the startDir itself contains the indicators after generation,
	// it's a standalone project.
	return { isMonorepo: false, workspaceRoot: startDir };
}
