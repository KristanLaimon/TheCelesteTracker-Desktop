#!/usr/bin/env bun
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { $ } from 'bun';

const SRC = import.meta.dir;
const ROOT = join(SRC, '..');
const BUILD_DIR = join(SRC, 'build');
const skipLinux = process.argv.includes('--skip-linux') || process.env.SKIP_LINUX === 'true';

console.log('🔨 Building utilities Go extension...');

async function copyBinary(srcFile: string, destFilename: string) {
	const paths = [join(ROOT, 'extensions', 'utilities'), join(ROOT, 'bin', 'extensions', 'utilities')];
	for (const p of paths) {
		if (!existsSync(p)) {
			mkdirSync(p, { recursive: true });
		}
		const destFile = join(p, destFilename);
		await $`cp ${srcFile} ${destFile}`;
		console.log(`   ✅ Copied to: ${destFile}`);
	}
}

if (!existsSync(BUILD_DIR)) {
	mkdirSync(BUILD_DIR, { recursive: true });
}

// Build Windows binary
console.log('  Building Windows Go binary...');
try {
	await $`go build -ldflags "-s -w" -o build/utilities-win_x64.exe main.go`.cwd(SRC);
	const winSource = join(BUILD_DIR, 'utilities-win_x64.exe');
	if (existsSync(winSource)) {
		await copyBinary(winSource, 'utilities-win_x64.exe');
	} else {
		console.error('     Windows Go build output not found!');
	}
} catch (err) {
	console.error('     Failed to compile Windows Go binary:', err);
}

if (skipLinux) {
	console.log('  Skipping Linux Go binary build (--skip-linux flag was specified).');
} else {
	// Build Linux binary
	console.log('  Building Linux Go binary...');
	try {
		// Go cross-compilation environment variables
		const env = { ...process.env, GOOS: 'linux', GOARCH: 'amd64' };
		await $`go build -ldflags "-s -w" -o build/utilities-linux_x64 main.go`.cwd(SRC).env(env);
		const linuxSource = join(BUILD_DIR, 'utilities-linux_x64');
		if (existsSync(linuxSource)) {
			await copyBinary(linuxSource, 'utilities-linux_x64');
		} else {
			console.error('     Linux Go build output not found!');
		}
	} catch (err) {
		console.error('     Failed to compile Linux Go binary:', err);
	}
}

// Build macOS binary
console.log('  Building macOS Go binary...');
try {
	const env = { ...process.env, GOOS: 'darwin', GOARCH: 'amd64' };
	await $`go build -ldflags "-s -w" -o build/utilities-mac_x64 main.go`.cwd(SRC).env(env);
	const macSource = join(BUILD_DIR, 'utilities-mac_x64');
	if (existsSync(macSource)) {
		await copyBinary(macSource, 'utilities-mac_x64');
	} else {
		console.error('     macOS Go build output not found!');
	}
} catch (err) {
	console.error('     Failed to compile macOS Go binary:', err);
}

console.log('  Utilities Go extension build process complete.');
