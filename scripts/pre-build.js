import fs from "fs";
import path from "path";

console.log("🛡️  NG Fortress Pre-build Validation Started");

// 1. Check Directory Violations
const appDir = path.join(process.cwd(), "src/app");
if (fs.existsSync(appDir)) {
	const allowed = [
		"ui",
		"features",
		"infrastructure",
		"schema",
		"app.component.ts",
		"app.component.spec.ts",
		"app.config.ts",
		"app.routes.ts",
		"app.config.server.ts",
		"app.routes.server.ts",
	];
	const items = fs.readdirSync(appDir);
	items.forEach((item) => {
		if (!allowed.includes(item)) {
			console.error(
				`❌ Error: Unauthorized file or directory '${item}' found in src/app/`,
			);
			process.exit(1);
		}
	});
}

// 2. Asset Constraints Checks
const assetsDir = path.join(process.cwd(), "src/assets");
if (fs.existsSync(assetsDir)) {
	const allowedExtensions = [".png", ".jpg", ".jpeg", ".svg", ".webp"];
	const maxSizeBytes = 500 * 1024; // 500KB

	function checkDir(dir) {
		const files = fs.readdirSync(dir);
		files.forEach((file) => {
			const fullPath = path.join(dir, file);
			const stat = fs.statSync(fullPath);
			if (stat.isDirectory()) {
				checkDir(fullPath);
			} else {
				const ext = path.extname(file).toLowerCase();
				if (!allowedExtensions.includes(ext)) {
					console.error(
						`❌ Error: Invalid asset format '${ext}' in ${fullPath}`,
					);
					process.exit(1);
				}
				if (stat.size > maxSizeBytes) {
					console.error(
						`❌ Error: Asset ${fullPath} exceeds maximum size of 500KB`,
					);
					process.exit(1);
				}
			}
		});
	}
	checkDir(assetsDir);
}

console.log("✅ Pre-build Validation Passed");
