import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);

console.log("🏁 Running global CLI helpers build...");

// Build Utilities (Go — handles both zip and SQLite)
console.log("\n--- 1. Building Utilities Go CLI Helper ---");
const utilsRes = spawnSync("bun", [join(__dirname, "src-utils", "build.ts"), ...args], { stdio: "inherit" });
if (utilsRes.status !== 0) {
	console.error("❌ Utilities Go CLI Helper build failed");
	process.exit(utilsRes.status || 1);
}

console.log("\n🎉 Go CLI Helper built successfully!");

// Run Neutralino Build
console.log("\n--- 2. Running Neutralino Build ---");
const neuRes = spawnSync("neu", ["build", "--embed-resources"], { stdio: "inherit", shell: true });
if (neuRes.status !== 0) {
	console.error("❌ Neutralino Build failed");
	process.exit(neuRes.status || 1);
}

// Post-build organization
const distPath = join(__dirname, "dist");
const myappPath = join(distPath, "myapp");

if (fs.existsSync(myappPath)) {
	console.log("\n--- 3. Organizing Build Binaries ---");

	const prodPath = join(distPath, "prod");
	const windowsDist = join(prodPath, "windows");
	const linuxDist = join(prodPath, "linux");
	const macDist = join(prodPath, "mac");

	// Helper to recursively delete a directory
	function removeDir(dirPath) {
		if (fs.existsSync(dirPath)) {
			fs.rmSync(dirPath, { recursive: true, force: true });
		}
	}

	// Helper to ensure a directory exists
	function ensureDir(dirPath) {
		if (!fs.existsSync(dirPath)) {
			fs.mkdirSync(dirPath, { recursive: true });
		}
	}

	// Clean previous distributions
	removeDir(windowsDist);
	removeDir(linuxDist);
	removeDir(macDist);
	ensureDir(windowsDist);
	ensureDir(linuxDist);
	ensureDir(macDist);

	const items = fs.readdirSync(myappPath);
	for (const item of items) {
		const itemPath = join(myappPath, item);
		const stat = fs.statSync(itemPath);

		if (stat.isFile()) {
			if (item.includes("mac") || item.includes("universal")) {
				console.log(`  Moving macOS binary: ${item}`);
				fs.renameSync(itemPath, join(macDist, item));
			} else if (item.includes("win")) {
				console.log(`  Moving Windows binary: ${item}`);
				fs.renameSync(itemPath, join(windowsDist, item));
			} else if (item.includes("linux")) {
				console.log(`  Moving Linux binary: ${item}`);
				fs.renameSync(itemPath, join(linuxDist, item));
			} else {
				if (item.endsWith(".log")) {
					fs.unlinkSync(itemPath);
				}
			}
		}
	}

	// Copy CLI helpers directly along the main executables
	console.log("\n--- 4. Copying CLI helpers along the executables ---");
	const binPath = join(__dirname, "bin");

	// Copy Windows CLI helper
	const winCliHelper = join(binPath, "utilities-win_x64.exe");
	if (fs.existsSync(winCliHelper)) {
		fs.copyFileSync(winCliHelper, join(windowsDist, "utilities-win_x64.exe"));
		console.log("   ✅ Copied Windows CLI helper to dist/prod/windows/");
	} else {
		console.warn("   ⚠️ Windows CLI helper not found in bin/");
	}

	// Copy Linux CLI helper
	const linuxCliHelper = join(binPath, "utilities-linux_x64");
	if (fs.existsSync(linuxCliHelper)) {
		fs.copyFileSync(linuxCliHelper, join(linuxDist, "utilities-linux_x64"));
		console.log("   ✅ Copied Linux CLI helper to dist/prod/linux/");
	} else {
		console.warn("   ⚠️ Linux CLI helper not found in bin/");
	}

	// Copy macOS CLI helper
	const macCliHelper = join(binPath, "utilities-mac_x64");
	if (fs.existsSync(macCliHelper)) {
		fs.copyFileSync(macCliHelper, join(macDist, "utilities-mac_x64"));
		console.log("   ✅ Copied macOS CLI helper to dist/prod/mac/");
	} else {
		console.warn("   ⚠️ macOS CLI helper not found in bin/");
	}

	// Delete temporary / source directory myapp if empty
	removeDir(myappPath);
	console.log("\n🎉 Build organization completed successfully!");
}
