import "../setup";
import { describe, expect, test } from "bun:test";
import saveSlotStore from "../../src/stores/SaveSlot.store.svelte";

describe("SaveSlotStore", () => {
	test("initializes automatically and loads save slots", async () => {
		await saveSlotStore.Initialize();
		expect(saveSlotStore.selectedSaveSlot).toBeGreaterThanOrEqual(0);
		expect(Array.isArray(saveSlotStore.availableSaveSlots)).toBe(true);
	});

	test("allows setting selected save slot", () => {
		saveSlotStore.SetSelectedSaveSlot(2);
		expect(saveSlotStore.selectedSaveSlot).toBe(2);
	});
});
