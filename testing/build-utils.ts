import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..');

function getBinaryName(): string {
	const { platform } = process;
	if (platform === 'win32') return 'utilities-win_x64.exe';
	if (platform === 'linux') return 'utilities-linux_x64';
	if (platform === 'darwin') return 'utilities-mac_x64';
	return 'utilities-win_x64.exe';
}

export function ensureBuild(): void {
	const binaryPath = join(ROOT, 'bin', getBinaryName());
	if (existsSync(binaryPath)) return;

	console.log(`Building Go CLI helper (missing: ${binaryPath})...`);
	const result = spawnSync('bun', ['run', 'build'], { cwd: ROOT, stdio: 'inherit' });
	if (result.status !== 0) {
		throw new Error('Go CLI helper build failed');
	}
}
