#!/usr/bin/env bun
// NODE.JS/BUN/DENO ONLY
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";

const SRC = import.meta.dir;
const ROOT = join(SRC, "..");
const BUILD_DIR = join(SRC, "build");
const skipLinux = process.argv.includes("--skip-linux") || process.env.SKIP_LINUX === "true";

console.log("🔨 Building Go CLI helpers...");

async function copyBinary(srcFile: string, destFilename: string) {
	const destDir = join(ROOT, "bin");
	if (!existsSync(destDir)) {
		mkdirSync(destDir, { recursive: true });
	}
	const destFile = join(destDir, destFilename);
	await $`cp ${srcFile} ${destFile}`;
	console.log(`   ✅ Copied to: ${destFile}`);
}

/** Binary-name slugs ("win", "mac") are not Go's GOOS values ("windows", "darwin"). */
const goosBySlug: Record<string, string> = { win: "windows", mac: "darwin", linux: "linux" };
const goarchBySlug: Record<string, string> = { x64: "amd64", arm64: "arm64" };

async function buildTarget(name: string, tag: string, osSlug: string, archSlug: string, ext: string) {
	const binaryName = `${name}-${osSlug}_${archSlug}${ext}`;
	const buildPath = `build/${binaryName}`;
	const tagFlags = tag ? ["-tags", tag] : [];
	const env = { ...process.env, GOOS: goosBySlug[osSlug], GOARCH: goarchBySlug[archSlug] };

	try {
		await $`go build ${tagFlags} -ldflags "-s -w" -o ${buildPath}`.cwd(SRC).env(env);
		const source = join(BUILD_DIR, binaryName);
		if (existsSync(source)) {
			await copyBinary(source, binaryName);
		} else {
			console.error(`     ${binaryName} build output not found!`);
		}
	} catch (err) {
		console.error(`     Failed to compile ${binaryName}:`, err);
	}
}

if (!existsSync(BUILD_DIR)) {
	mkdirSync(BUILD_DIR, { recursive: true });
}

// Build utilities binary (sqlite + zip, includes libc)
console.log("  Building utilities binaries...");
buildTarget("utilities", "", "win", "x64", ".exe");

if (!skipLinux) {
	buildTarget("utilities", "", "linux", "x64", "");
}
buildTarget("utilities", "", "mac", "x64", "");

// Build zip_utils binary (zip only, stdlib only — no libc, no console panic)
console.log("  Building zip_utils binaries (no libc)...");
buildTarget("zip_utils", "zip_utils", "win", "x64", ".exe");

if (!skipLinux) {
	buildTarget("zip_utils", "zip_utils", "linux", "x64", "");
}
buildTarget("zip_utils", "zip_utils", "mac", "x64", "");

console.log("  Go CLI helper build process complete.");
