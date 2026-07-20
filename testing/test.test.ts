import { test } from 'bun:test';
import Everest from '../src/libs/Everest';
import Olympus from '../src/libs/Olympus';
import { GetDependency } from './setup';


test('Getting all installed mods', async () => {
	const everest = GetDependency(Everest);
	const olympus = GetDependency(Olympus);

	let res = await everest.GetModsInstalled({modsCountScanningLimit: 50});
  res = res.filter(a => a.fileName === "Berry 143.zip");
  console.log(res);

  const res2:string[] = ((await Promise.allSettled(res.map(a => olympus.GetModHumanNameByModId(a.metadata.name ?? '')))).filter(a => a.status === "fulfilled" && a.value !== null)).map(a => a.value!);
  console.log(res2);

  const res3:string[] = ((await Promise.allSettled(res.map(a => olympus.GetModCategoryByModId(a.metadata.name ?? '')))).filter(a => a.status === "fulfilled" && a.value !== null)).map(a => a.value!);
  console.log(res3);


},{timeout: 50_000});
