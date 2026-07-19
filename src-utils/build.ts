#!/usr/bin/env bun
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { $ } from 'bun';

const SRC = import.meta.dir;
const ROOT = join(SRC, '..');
const BUILD_DIR = join(SRC, 'build');
const skipLinux = process.argv.includes('--skip-linux') || process.env.SKIP_LINUX === 'true';

console.log('🔨 Building Go CLI helpers...');

async function copyBinary(srcFile: string, destFilename: string) {
	const destDir = join(ROOT, 'bin');
	if (!existsSync(destDir)) {
		mkdirSync(destDir, { recursive: true });
	}
	const destFile = join(destDir, destFilename);
	await $`cp ${srcFile} ${destFile}`;
	console.log(`   ✅ Copied to: ${destFile}`);
}

async function buildTarget(name: string, tag: string, goos: string, goarch: string, ext: string) {
	const binaryName = `${name}-${goos}_${goarch}${ext}`;
	const buildPath = `build/${binaryName}`;
	const buildTarget = tag ? `-tags ${tag}` : '';
	const env = { ...process.env, GOOS: goos, GOARCH: goarch };

	try {
		await $`go build ${buildTarget} -ldflags "-s -w" -o ${buildPath}`.cwd(SRC).env(env);
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
console.log('  Building utilities binaries...');
buildTarget('utilities', '', 'win', 'x64', '.exe');

if (!skipLinux) {
	buildTarget('utilities', '', 'linux', 'x64', '');
}
buildTarget('utilities', '', 'darwin', 'x64', '');

// Build zip_utils binary (zip only, stdlib only — no libc, no console panic)
console.log('  Building zip_utils binaries (no libc)...');
buildTarget('zip_utils', 'zip_utils', 'win', 'x64', '.exe');

if (!skipLinux) {
	buildTarget('zip_utils', 'zip_utils', 'linux', 'x64', '');
}
buildTarget('zip_utils', 'zip_utils', 'darwin', 'x64', '');

console.log('  Go CLI helper build process complete.');
