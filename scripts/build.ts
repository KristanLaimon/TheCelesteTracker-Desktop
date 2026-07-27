#!/usr/bin/env bun
// NODE.JS/BUN/DENO ONLY
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

const args = process.argv.slice(2);

console.log("🏁 Running modular dependencies build...");

// 1. Build Dependencies (Go — CelesteMapsBinParser, CelesteModsParser, Sqlite)
console.log("\n--- 1. Building Modular Go Dependencies ---");
const depsRes = spawnSync("bun", [join(ROOT, "dependencies", "build.ts"), ...args], { stdio: "inherit" });
if (depsRes.status !== 0) {
	console.error("❌ Modular dependencies build failed");
	process.exit(depsRes.status || 1);
}

console.log("\n🎉 Go dependencies built successfully!");

// 2. Run Neutralino Build
console.log("\n--- 2. Running Neutralino Build ---");
const neuRes = spawnSync("neu", ["build", "--embed-resources"], { stdio: "inherit", shell: true });
if (neuRes.status !== 0) {
	console.error("❌ Neutralino Build failed");
	process.exit(neuRes.status || 1);
}

// 3. Post-build organization
const distPath = join(ROOT, "dist");
const myappPath = join(distPath, "myapp");

if (fs.existsSync(myappPath)) {
	console.log("\n--- 3. Organizing Build Binaries ---");

	const prodPath = join(distPath, "prod");
	const windowsDist = join(prodPath, "windows");
	const linuxDist = join(prodPath, "linux");
	const macDist = join(prodPath, "mac");

	function removeDir(dirPath: string) {
		if (fs.existsSync(dirPath)) {
			fs.rmSync(dirPath, { recursive: true, force: true });
		}
	}

	function ensureDir(dirPath: string) {
		if (!fs.existsSync(dirPath)) {
			fs.mkdirSync(dirPath, { recursive: true });
		}
	}

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

	// 4. Copy CLI dependencies directly to dist/prod/<os>/dependencies/
	console.log("\n--- 4. Copying CLI dependencies to dist/prod/<os>/dependencies/ ---");
	const depsBuildPath = join(ROOT, "dependencies", "build");

	const targetMap: Record<string, string> = {
		win: windowsDist,
		linux: linuxDist,
		mac: macDist,
	};

	const binaryNames = ["CelesteMapsBinParser", "CelesteModsParser", "Sqlite"];

	for (const [osSlug, distDir] of Object.entries(targetMap)) {
		const osDepsDir = join(distDir, "dependencies");
		ensureDir(osDepsDir);

		const ext = osSlug === "win" ? ".exe" : "";
		for (const name of binaryNames) {
			const binaryFilename = `${name}-${osSlug}_x64${ext}`;
			const srcFile = join(depsBuildPath, binaryFilename);
			if (fs.existsSync(srcFile)) {
				fs.copyFileSync(srcFile, join(osDepsDir, binaryFilename));
				console.log(`   ✅ Copied ${binaryFilename} to dist/prod/${osSlug}/dependencies/`);
			} else {
				console.warn(`   ⚠️ ${binaryFilename} not found in dependencies/build/`);
			}
		}
	}

	removeDir(myappPath);
	console.log("\n🎉 Build organization completed successfully!");
}
