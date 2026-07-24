// Post Code Change Verification Hook (Bun / Node.js)
// Runs the mandatory post-change verification workflow from CLAUDE.md

import { spawnSync } from "node:child_process";

const steps = [
	{ name: "Step 1/4: bun test", cmd: "bun", args: ["test"] },
	{ name: "Step 2/4: bun run check", cmd: "bun", args: ["run", "check"] },
	{ name: "Step 3/4: bun run lint:fix", cmd: "bun", args: ["run", "lint:fix"] },
	{ name: "Step 4/4: bun run check (post-lint)", cmd: "bun", args: ["run", "check"] },
];

for (const step of steps) {
	console.log(`\n=== ${step.name} ===`);
	const res = spawnSync(step.cmd, step.args, { stdio: "inherit", shell: true });
	if (res.status !== 0) {
		console.error(`❌ Hook failed at ${step.name} with exit code ${res.status}`);
		process.exit(res.status ?? 1);
	}
}

console.log("\n✅ All post-code-change verification steps passed!");
