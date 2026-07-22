// NODE.JS/BUN/DENO ONLY
import { expect, test } from 'bun:test';
import { writeFileSync } from 'node:fs';
import Everest from '../src/libs/Everest';
import { GetDependency } from './setup';
import { Construct_LocalMods } from './setup.DI.helpers';

test(
	'OOP Software design pattern: Dependency Injection',
	async () => {
		{
			const myMods = Construct_LocalMods();
			const res = await myMods.EverestMods_GetListHumanName();
			console.log(res);
		}
	},
	{ timeout: 30_000 },
);

// test("OOP Software design pattern: Dependency Injection", async () => {
//   {
//     //This works in Bun.js, Node.js, deno y backend! (No Browser required to work)
//     const fs = new NodeJsFileSystem();
//     const path = new NodeJsPath();
//     const mapAdapterCache = new Storage_SimpleMapAdapter();
//     const jsonAdapterPersistent = new Storage_JsonFileAdapter({filePath: "./mods-names.json", indent: 2}, fs, path);
//     const storage = new Storage({adapters:[mapAdapterCache, jsonAdapterPersistent]})

//     const os = new NodeJsOS();
//     const olympus = new Olympus(os, fs, path);

//     const celeste = new Celeste(os, fs);
//     const zipGo = new Zip_Go(os, fs, path);
//     const collabUtils2Canner = new CollabUtils2Scanner(fs, zipGo);
//     const dialogReader = new DialogReader(fs, zipGo);
//     const threadToUse = BunThread;
//     const everest = new Everest(celeste, zipGo, fs, collabUtils2Canner, dialogReader, threadToUse)
//     const myMods = new LocalMods(olympus, everest, storage);

//     //Using Node.js methods!, but business logic doesn't care at all.
//     //I can use all methods from myMods without caring the environment, how was constructed, completely dettached from browser
//     const res = await myMods.GetModsInstalledNames(); //Works the same!
//   }

//   {
//     //This works in Chrome, Edge, Opera, any browser. (No Node.js/Bun.js/Deno required)
//     const path = new BrowserPath();
//     const fs = new NeutralinoFileSystem(path);
//     const mapAdapterCache = new Storage_LocalStorageAdapter(); //Browser only
//     const jsonAdapterPersistent = new Storage_JsonFileAdapter({filePath: "./mods-names.json"}, fs, path);
//     const storage = new Storage({adapters:[mapAdapterCache, jsonAdapterPersistent]})

//     const os = new NeutralinoOS();
//     const olympus = new Olympus(os, fs, path);

//     const celeste = new Celeste(os, fs);
//     const zipGo = new Zip_Go(os, fs, path);
//     const collabUtils2CScanner = new CollabUtils2Scanner(fs, zipGo);
//     const dialogReader = new DialogReader(fs, zipGo);
//     const threadToUse = ThreadBrowser; //Browser only
//     const everest = new Everest(celeste, zipGo, fs, collabUtils2CScanner, dialogReader, threadToUse)
//     const myMods = new LocalMods(olympus, everest, storage);

//     //Using Browser + Neutralino.js emmbeded methods!, but business logic doesn't care at all.
//     //I can use all methods from myMods without caring the environment, how was constructed, completely dettached from browser
//     const res = await myMods.GetModsInstalledNames();  //Works the same!
//   }
//   //I can finally use myMods!!!
// });

test('GetModInfoByZipName is fast', async () => {
	const everest = GetDependency(Everest);
	const start = performance.now();
	const res = await everest.GetModInfoByZipName('Berry 143.zip');
	const elapsed = performance.now() - start;
	expect(res).toBeDefined();
	expect(elapsed).toBeLessThan(5000);
	expect(res?.fileName).toBe('Berry 143.zip');
	expect(res?.metadata.name).toBe('Berry 143');
});

test(
	'GetModsInstalled returns mods',
	async () => {
		const everest = GetDependency(Everest);
		const res = await everest.GetModsInstalled({ modsCountScanningLimit: 60 });
		expect(res.length).toBeGreaterThan(0);

		const modNames = res.map((a) => ({ humanName: a.humanName, modId: a.metadata.name }));
		console.log(modNames);
	},
	{ timeout: 30_000 },
);

test(
	'GetModsInstalled returns mods no workers',
	async () => {
		const everest = GetDependency(Everest);
		const res = await everest.GetModsInstalled();
		expect(res.length).toBeGreaterThan(0);
	},
	{ timeout: 30_000 },
);

test(
	'Getting all installed mods',
	async () => {
		const everest = GetDependency(Everest);

		const res = await everest.GetModInfoByZipName('Berry 143');
		console.log(res);
		writeFileSync('./berry-143.json', JSON.stringify(res, null, 2));
	},
	{ timeout: 50_000 },
);
