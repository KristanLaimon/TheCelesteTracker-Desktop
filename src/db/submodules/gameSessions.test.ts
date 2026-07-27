// NODE.JS/BUN/DENO ONLY
import { describe, expect, test } from "bun:test";
import { GetDependency } from "../../../testing/setup";
import type { EverestModInfo } from "../../domain/Everest";
import CTDB from "../index";

describe("Submodule_GameSessions", () => {
	const ctdb = GetDependency(CTDB);

	test("GetLastSessionsFromStandaloneModMap returns valid GameSession records with string UUID ids", async () => {
		const mockModInfo = {
			modId: "Glyph",
			humanName: "Glyph",
			metadata: {
				isMapMod: true,
				isLobby: false,
				campaigns: [
					{
						campaignNameId: "BeefyUncleTorre/map",
						humanName: "Glyph",
						chapters: [],
					},
				],
			},
		} as unknown as EverestModInfo;

		// Save slot 1 has sessions for BeefyUncleTorre/map
		const sessions = await ctdb.GameSessions.GetLastSessionsFromStandaloneModMap(1, mockModInfo);

		expect(sessions).not.toBeNull();
		if (sessions) {
			expect(sessions.length).toBeGreaterThan(0);
			// Verify each session has a valid string UUID id (not overwritten by numeric Campaign.id)
			for (const session of sessions) {
				expect(typeof session.id).toBe("string");
				expect(session.chapter_sid).toContain("BeefyUncleTorre/map");
			}
		}
	});

	test("GetLastSessionsFromStandaloneModMap supports multi-campaign mods", async () => {
		const mockModInfo = {
			modId: "MonikaDSides",
			humanName: "Monika D-Sides",
			metadata: {
				isMapMod: true,
				isLobby: false,
				campaigns: [{ campaignNameId: "monikadsidespack/0" }, { campaignNameId: "monikadsidespack/1" }, { campaignNameId: "monikadsidespack/2" }],
			},
		} as unknown as EverestModInfo;

		const sessions = await ctdb.GameSessions.GetLastSessionsFromStandaloneModMap(1, mockModInfo);
		expect(sessions).not.toBeNull();
		if (sessions) {
			expect(sessions.length).toBe(5); // 2 + 2 + 1 = 5 sessions
		}
	});

	test("GetLastSessionsFromStandaloneModMap returns null when not a map mod", async () => {
		const mockModInfo = {
			modId: "SomeCodeMod",
			metadata: {
				isMapMod: false,
				isLobby: false,
				campaigns: [],
			},
		} as unknown as EverestModInfo;

		const sessions = await ctdb.GameSessions.GetLastSessionsFromStandaloneModMap(1, mockModInfo);
		expect(sessions).toBeNull();
	});
});
