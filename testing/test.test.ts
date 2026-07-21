import { expect, test } from 'bun:test';
import { writeFileSync } from "node:fs";
import Everest from '../src/libs/Everest';
import { GetDependency } from './setup';


test('GetModInfoByZipName is fast', async () => {
	const everest = GetDependency(Everest);
	const start = performance.now();
	const res = await everest.GetModInfoByZipName("Berry 143.zip");
	const elapsed = performance.now() - start;
	expect(res).toBeDefined();
	expect(elapsed).toBeLessThan(5000);
	expect(res!.fileName).toBe("Berry 143.zip");
	expect(res!.metadata.name).toBe("Berry 143");
});

test('GetModsInstalled returns mods', async () => {
	const everest = GetDependency(Everest);
	const res = await everest.GetModsInstalled({modsCountScanningLimit: 60 });
	expect(res.length).toBeGreaterThan(0);

  const modNames = res.map(a => ({humanName: a.name, modId: a.metadata.name}));
  console.log(modNames)

}, { timeout: 30_000 });

test('GetModsInstalled returns mods no workers', async () => {
	const everest = GetDependency(Everest);
	const res = await everest.GetModsInstalled();
	expect(res.length).toBeGreaterThan(0);
}, { timeout: 30_000 });

test('Getting all installed mods', async () => {
	const everest = GetDependency(Everest);

	let res = await everest.GetModInfoByZipName("Berry 143");
	console.log(res);
	writeFileSync("./berry-143.json", JSON.stringify(res, null, 2))
},{timeout: 50_000});
