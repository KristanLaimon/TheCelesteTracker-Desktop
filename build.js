import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);

console.log('🏁 Running global extensions build...');

// Build SQLite
console.log('\n--- 1. Building SQLite Extension ---');
const sqliteRes = spawnSync('bun', [join(__dirname, 'src-sqlite-extension', 'build.ts'), ...args], { stdio: 'inherit' });
if (sqliteRes.status !== 0) {
	console.error('❌ SQLite Extension build failed');
	process.exit(sqliteRes.status || 1);
}

// Build Utilities
console.log('\n--- 2. Building Utilities Extension ---');
const utilsRes = spawnSync('bun', [join(__dirname, 'src-utils-extension', 'build.ts'), ...args], { stdio: 'inherit' });
if (utilsRes.status !== 0) {
	console.error('❌ Utilities Extension build failed');
	process.exit(utilsRes.status || 1);
}

console.log('\n🎉 All extensions built successfully!');

// Run Neutralino Build
console.log('\n--- 3. Running Neutralino Build ---');
const neuRes = spawnSync('neu', ['build', '--embed-resources'], { stdio: 'inherit', shell: true });
if (neuRes.status !== 0) {
	console.error('❌ Neutralino Build failed');
	process.exit(neuRes.status || 1);
}

// Post-build organization
const distPath = join(__dirname, 'dist');
const myappPath = join(distPath, 'myapp');

if (fs.existsSync(myappPath)) {
	console.log('\n--- 4. Organizing Build Binaries ---');
	
	const windowsDist = join(distPath, 'windows');
	const linuxDist = join(distPath, 'linux');
	
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
	ensureDir(windowsDist);
	ensureDir(linuxDist);

	const items = fs.readdirSync(myappPath);
	for (const item of items) {
		const itemPath = join(myappPath, item);
		const stat = fs.statSync(itemPath);

		if (stat.isFile()) {
			// Delete macOS binaries or move others
			if (item.includes('mac')) {
				// console.log(` Deleting macOS binary: ${item}`);
				fs.unlinkSync(itemPath);
			} else if (item.includes('win')) {
				console.log(`  Moving Windows binary: ${item}`);
				fs.renameSync(itemPath, join(windowsDist, item));
			} else if (item.includes('linux')) {
				console.log(`  Moving Linux binary: ${item}`);
				fs.renameSync(itemPath, join(linuxDist, item));
			} else {
				if (item.endsWith('.log')) {
					fs.unlinkSync(itemPath);
				}
			}
		}
	}

	// Now handle extensions
	const srcExtensionsDir = join(myappPath, 'extensions');
	if (fs.existsSync(srcExtensionsDir)) {
		const extFolders = fs.readdirSync(srcExtensionsDir);
		for (const ext of extFolders) {
			const extSrcPath = join(srcExtensionsDir, ext);
			if (fs.statSync(extSrcPath).isDirectory()) {
				const extFiles = fs.readdirSync(extSrcPath);
				for (const file of extFiles) {
					const filePath = join(extSrcPath, file);
					if (file.includes('mac')) {
						console.log(`     Deleting macOS extension binary: ${ext}/${file}`);
						fs.unlinkSync(filePath);
					} else if (file.includes('win')) {
						const destDir = join(windowsDist, 'extensions', ext);
						ensureDir(destDir);
						console.log(`     Moving Windows extension binary: ${ext}/${file}`);
						fs.renameSync(filePath, join(destDir, file));
					} else if (file.includes('linux')) {
						const destDir = join(linuxDist, 'extensions', ext);
						ensureDir(destDir);
						console.log(`     Moving Linux extension binary: ${ext}/${file}`);
						fs.renameSync(filePath, join(destDir, file));
					}
				}
			}
		}
	}

	// Delete temporary / source directory myapp if empty
	removeDir(myappPath);
	console.log('Build organization completed');
}
