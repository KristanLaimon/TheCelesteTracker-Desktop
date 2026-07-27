#!/usr/bin/env bun
// NODE.JS/BUN/DENO ONLY
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";

const DEPENDENCIES_DIR = import.meta.dir;
const BUILD_DIR = join(DEPENDENCIES_DIR, "build");
const skipLinux = process.argv.includes("--skip-linux") || process.env.SKIP_LINUX === "true";

console.log("🔨 Building modular Go dependency projects...");

if (!existsSync(BUILD_DIR)) {
	mkdirSync(BUILD_DIR, { recursive: true });
}

const goosBySlug: Record<string, string> = { win: "windows", mac: "darwin", linux: "linux" };
const goarchBySlug: Record<string, string> = { x64: "amd64", arm64: "arm64" };

async function buildTarget(projectDirName: string, binaryBaseName: string, osSlug: string, archSlug: string, ext: string) {
	const projectPath = join(DEPENDENCIES_DIR, projectDirName);
	const binaryName = `${binaryBaseName}-${osSlug}_${archSlug}${ext}`;
	const buildOutputPath = join(BUILD_DIR, binaryName);
	const env = { ...process.env, GOOS: goosBySlug[osSlug], GOARCH: goarchBySlug[archSlug] };

	try {
		await $`go build -ldflags "-s -w" -o ${buildOutputPath}`.cwd(projectPath).env(env);
		if (existsSync(buildOutputPath)) {
			console.log(`   ✅ Built ${binaryName} -> ${buildOutputPath}`);
			const isHostWin = process.platform === "win32" && osSlug === "win";
			const isHostLinux = process.platform === "linux" && osSlug === "linux";
			const isHostMac = process.platform === "darwin" && osSlug === "mac";
			if (isHostWin || isHostLinux || isHostMac) {
				const devPath = join(DEPENDENCIES_DIR, binaryName);
				copyFileSync(buildOutputPath, devPath);
				console.log(`      📁 Placed dev binary: ${devPath}`);
			}
		} else {
			console.error(`     ❌ ${binaryName} output not found at ${buildOutputPath}`);
		}
	} catch (err) {
		console.error(`     ❌ Failed to compile ${binaryName}:`, err);
	}
}

const projects = [
	{ folder: "Go_CelesteMapsBinParser", name: "CelesteMapsBinParser" },
	{ folder: "Go_CelesteModsParser", name: "CelesteModsParser" },
	{ folder: "Go_Sqlite", name: "Sqlite" },
];

for (const proj of projects) {
	console.log(`\n📦 Compiling ${proj.name}...`);
	await buildTarget(proj.folder, proj.name, "win", "x64", ".exe");
	if (!skipLinux) {
		await buildTarget(proj.folder, proj.name, "linux", "x64", "");
	}
	await buildTarget(proj.folder, proj.name, "mac", "x64", "");
}

console.log("\n✅ All modular dependencies built successfully!");
