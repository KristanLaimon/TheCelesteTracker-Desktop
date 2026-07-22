import { describe, expect, test } from 'bun:test';
import { GB_AllowedFields } from '../src/libs/GameBananaAPI';

describe('GameBananaApi', () => {
	test('GB_AllowedFields has Mod and Member schema definitions', () => {
		expect(GB_AllowedFields.Mod.Name).toBe('name');
		expect(GB_AllowedFields.Mod.Authors).toBe('authors');
		expect(GB_AllowedFields.Member.Name).toBe('name');
	});

	// test(
	// 	'Testing members',
	// 	async () => {
	// 		const api = new GameBananaApi();
	// 		const localMods = Construct_LocalMods();
	// 		const allMaddiesInfoMods = await localMods.MaddiesAPI_GetMap_EverestModId_MaddiesModInfo();
	// 		const allAuthorsNames = Object.values(allMaddiesInfoMods).map((x) => x.Author);
	// 		const finalRes = await api.GetUserMetadataByUsernames(allAuthorsNames);
	// 		writeFileSync('./RESPONSE-GB.json', JSON.stringify(finalRes, null, 2));
	// 		console.log(finalRes);
	// 	},
	// 	{ timeout: 100_000 },
	// );

	// test('GetUserMetadataByUsernames constructs URL query correctly', async () => {
	// 	const api = new GameBananaApi();
	// 	// Given unresolvable username, should return null or handle gracefully without throwing
	// 	const result = await api.GetUserMetadataByUsernames('nonexistent_user_xyz_12345');
	// 	expect(result === null || typeof result === 'object').toBe(true);
	// });

	// test('ItemExistsById returns boolean without throwing on invalid ID', async () => {
	// 	const api = new GameBananaApi();
	// 	const exists = await api.ItemExistsById('Mod', -1);
	// 	expect(typeof exists).toBe('boolean');
	// });
});
