#!/usr/bin/env bun
import { $ } from "bun";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SRC = import.meta.dir;
const ROOT = join(SRC, "..");
const BUILD_DIR = join(SRC, "build");
const EXT_OUT = join(ROOT, "extensions", "sqlite");

console.log("🔨 Building SQLite extension...");

// Ensure extensions output directory exists
if (!existsSync(EXT_OUT)) {
	mkdirSync(EXT_OUT, { recursive: true });
}

// ----------------------------------------------------
// BUILD FOR HOST SYSTEM
// ----------------------------------------------------
const platform = process.platform;
console.log(`💻 Host platform detected: ${platform}`);

if (platform === "win32") {
	// --- Build Windows (MSVC / CMake) ---
	console.log("👉 Building Windows binary...");
	if (!existsSync(join(BUILD_DIR, "CMakeCache.txt"))) {
		console.log("   ⚙️  Configuring CMake for Windows...");
		await $`cmake -S . -B build`.cwd(SRC);
	}
	console.log("   🏗️  Compiling Windows binary...");
	await $`cmake --build build --config Release`.cwd(SRC);

	const winSource = join(BUILD_DIR, "Release", "ext_bin.exe");
	const winDest = join(EXT_OUT, "sqlite-win_x64.exe");
	if (existsSync(winSource)) {
		await $`cp ${winSource} ${winDest}`;
		console.log(`   ✅ Windows binary copied to extensions/sqlite/sqlite-win_x64.exe`);
	} else {
		console.error("   ❌ Windows build output not found!");
	}

	// --- Build Linux via WSL (if available) ---
	console.log("👉 Checking for WSL to build Linux binary...");
	let hasWsl = false;
	try {
		const result = await $`wsl gcc --version`.text();
		if (result.includes("gcc")) {
			hasWsl = true;
		}
	} catch (e) {
		// WSL or gcc not installed
	}

	if (hasWsl) {
		console.log("   🐳 WSL with GCC detected. Compiling Linux binary...");
		try {
			await $`wsl gcc -O3 -std=c99 -Wall -Wextra -D_GNU_SOURCE main.c dependencies/cjson/cJSON.c dependencies/sqlite3/sqlite3.c dependencies/mongoose/mongoose.c -Idependencies/cjson -Idependencies/sqlite3 -Idependencies/mongoose -lpthread -ldl -lm -o build/ext_bin_linux`.cwd(SRC);
			const linuxSource = join(BUILD_DIR, "ext_bin_linux");
			const linuxDest = join(EXT_OUT, "sqlite-linux_x64");
			if (existsSync(linuxSource)) {
				await $`cp ${linuxSource} ${linuxDest}`;
				console.log(`   ✅ Linux binary copied to extensions/sqlite/sqlite-linux_x64`);
			} else {
				console.error("   ❌ Linux build output from WSL not found!");
			}
		} catch (err) {
			console.error("   ⚠️ Failed to compile Linux binary in WSL:", err);
		}
	} else {
		console.log("   ⚠️ WSL with GCC not available. Skipping Linux build.");
	}

} else if (platform === "linux") {
	// --- Build Linux natively ---
	console.log("👉 Building Linux binary natively...");
	if (!existsSync(join(BUILD_DIR, "CMakeCache.txt"))) {
		console.log("   ⚙️  Configuring CMake for Linux...");
		await $`cmake -S . -B build`.cwd(SRC);
	}
	console.log("   🏗️  Compiling Linux binary...");
	await $`cmake --build build --config Release`.cwd(SRC);

	const linuxSource = join(BUILD_DIR, "ext_bin");
	const linuxDest = join(EXT_OUT, "sqlite-linux_x64");
	if (existsSync(linuxSource)) {
		await $`cp ${linuxSource} ${linuxDest}`;
		console.log(`   ✅ Linux binary copied to extensions/sqlite/sqlite-linux_x64`);
	} else {
		console.error("   ❌ Linux build output not found!");
	}

} else if (platform === "darwin") {
	// --- Build macOS natively ---
	console.log("👉 Building macOS binary natively...");
	if (!existsSync(join(BUILD_DIR, "CMakeCache.txt"))) {
		console.log("   ⚙️  Configuring CMake for macOS...");
		await $`cmake -S . -B build`.cwd(SRC);
	}
	console.log("   🏗️  Compiling macOS binary...");
	await $`cmake --build build --config Release`.cwd(SRC);

	const macSource = join(BUILD_DIR, "ext_bin");
	const macDest = join(EXT_OUT, "sqlite-mac_x64");
	if (existsSync(macSource)) {
		await $`cp ${macSource} ${macDest}`;
		console.log(`   ✅ macOS binary copied to extensions/sqlite/sqlite-mac_x64`);
	} else {
		console.error("   ❌ macOS build output not found!");
	}
} else {
	console.error(`❌ Unsupported platform: ${platform}`);
}

console.log("🎉 SQLite extension build process complete.");
