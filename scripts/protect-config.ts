// scripts/protect-config.ts
import fs from "node:fs";

const PROTECTED = ["eslint.config.js", "biome.json", "lefthook.yml"];

// もしこのプロジェクトが ng-fortress CLI 自身の開発リポジトリであれば、設定ファイルの変更を許可する
const pkgContext = fs.existsSync("package.json")
	? fs.readFileSync("package.json", "utf8")
	: "";
let isCliRepo = false;

if (pkgContext) {
	try {
		const pkgJson = JSON.parse(pkgContext) as { name?: string };
		isCliRepo = pkgJson.name === "create-ng-fortress";
	} catch {
		// ignore JSON parse errors and treat as non-CLI repo
	}
}
if (isCliRepo) {
	console.log(
		"ℹ️ Running inside create-ng-fortress repository. Allowing config file modifications.",
	);
	process.exit(0);
}

const stagedFiles = process.argv.slice(2);

for (const file of stagedFiles) {
	for (const p of PROTECTED) {
		if (file.includes(p)) {
			console.error(
				`[BLOCKED] 🚨 ${file} is a protected config file. ` +
					`Please fix your code, do NOT change the linter config to suppress errors.`,
			);
			process.exit(1);
		}
	}
}
process.exit(0);
