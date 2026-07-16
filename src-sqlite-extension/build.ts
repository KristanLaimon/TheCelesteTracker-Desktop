#!/usr/bin/env bun
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { $ } from 'bun';

const SRC = import.meta.dir;
const ROOT = join(SRC, '..');
const BUILD_DIR = join(SRC, 'build');
const skipLinux = process.argv.includes('--skip-linux') || process.env.SKIP_LINUX === 'true';

console.log('🔨 Building SQLite extension...');

async function copyBinary(srcFile: string, destFilename: string) {
	const paths = [join(ROOT, 'extensions', 'sqlite'), join(ROOT, 'bin', 'extensions', 'sqlite')];
	for (const p of paths) {
		if (!existsSync(p)) {
			mkdirSync(p, { recursive: true });
		}
		const destFile = join(p, destFilename);
		await $`cp ${srcFile} ${destFile}`;
		console.log(`   ✅ Copied to: ${destFile}`);
	}
}

// ----------------------------------------------------
// BUILD FOR HOST SYSTEM
// ----------------------------------------------------
const platform = process.platform;
console.log(`💻 Host platform detected: ${platform}`);

if (platform === 'win32') {
	// --- Build Windows (MSVC / CMake) ---
	console.log('  Building Windows binary...');
	if (!existsSync(join(BUILD_DIR, 'CMakeCache.txt'))) {
		console.log('   ⚙️  Configuring CMake for Windows...');
		await $`cmake -S . -B build`.cwd(SRC);
	}
	console.log('      Compiling Windows binary...');
	await $`cmake --build build --config Release`.cwd(SRC);

	const winSource = join(BUILD_DIR, 'Release', 'ext_bin.exe');
	if (existsSync(winSource)) {
		await copyBinary(winSource, 'sqlite-win_x64.exe');
	} else {
		console.error('     Windows build output not found!');
	}

	if (skipLinux) {
		console.log('  Skipping Linux binary build (--skip-linux flag was specified).');
	} else {
		// --- Build Linux via WSL (if available) ---
		console.log('  Checking for WSL to build Linux binary...');
		let hasWsl = false;
		try {
			const result = await $`wsl gcc --version`.text();
			if (result.includes('gcc')) {
				hasWsl = true;
			}
		} catch (_e) {
			// WSL or gcc not installed
		}

		if (hasWsl) {
			console.log('     WSL with GCC detected. Compiling Linux binary...');
			try {
				await $`wsl gcc -O3 -std=c99 -Wall -Wextra -D_GNU_SOURCE main.c dependencies/cjson/cJSON.c dependencies/sqlite3/sqlite3.c dependencies/mongoose/mongoose.c -Idependencies/cjson -Idependencies/sqlite3 -Idependencies/mongoose -lpthread -ldl -lm -o build/ext_bin_linux`.cwd(
					SRC,
				);
				const linuxSource = join(BUILD_DIR, 'ext_bin_linux');
				if (existsSync(linuxSource)) {
					await copyBinary(linuxSource, 'sqlite-linux_x64');
				} else {
					console.error('     Linux build output from WSL not found!');
				}
			} catch (err) {
				console.error('     Failed to compile Linux binary in WSL:', err);
			}
		} else {
			console.log('     WSL with GCC not available. Skipping Linux build.');
		}
	}
} else if (platform === 'linux') {
	// --- Build Linux natively ---
	console.log('Building Linux binary natively...');
	if (!existsSync(join(BUILD_DIR, 'CMakeCache.txt'))) {
		console.log('      Configuring CMake for Linux...');
		await $`cmake -S . -B build`.cwd(SRC);
	}
	console.log('      Compiling Linux binary...');
	await $`cmake --build build --config Release`.cwd(SRC);

	const linuxSource = join(BUILD_DIR, 'ext_bin');
	if (existsSync(linuxSource)) {
		await copyBinary(linuxSource, 'sqlite-linux_x64');
	} else {
		console.error('     Linux build output not found!');
	}
} else if (platform === 'darwin') {
	// --- Build macOS natively ---
	console.log('Building macOS binary natively...');
	if (!existsSync(join(BUILD_DIR, 'CMakeCache.txt'))) {
		console.log('      Configuring CMake for macOS...');
		await $`cmake -S . -B build`.cwd(SRC);
	}
	console.log('      Compiling macOS binary...');
	await $`cmake --build build --config Release`.cwd(SRC);

	const macSource = join(BUILD_DIR, 'ext_bin');
	if (existsSync(macSource)) {
		await copyBinary(macSource, 'sqlite-mac_x64');
	} else {
		console.error('     macOS build output not found!');
	}
} else {
	console.error(`  Unsupported platform: ${platform}`);
}

console.log('  SQLite extension build process complete.');
