import { spawnSync } from 'node:child_process';
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
