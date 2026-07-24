// UNIVERSAL COMPATIBILITY
import { describe, expect, test } from "bun:test";

// biome-ignore lint/suspicious/noExplicitAny: mirrors GoldenLayout.svelte's item-config shape
function getItemConfig(item: any): any {
	if (!item) return {};
	if (item.config) return item.config;
	if (item.configuration) {
		item.config = item.configuration;
		return item.config;
	}
	item.config = {};
	return item.config;
}

// biome-ignore lint/suspicious/noExplicitAny: mirrors GoldenLayout.svelte's item type
function getTabId(item: any): string | null {
	const conf = getItemConfig(item);
	const state = conf?.componentState;
	return state && typeof state === "object" && typeof state.__tabId === "string" ? state.__tabId : null;
}

// biome-ignore lint/suspicious/noExplicitAny: mirrors GoldenLayout.svelte's item type
function resolveIsPinned(item: any, pinsMap: Record<string, boolean | "forever">): boolean | "forever" {
	const conf = getItemConfig(item);
	if (conf?.isPinned === "forever") return "forever";
	const tabId = getTabId(item);
	if (tabId && pinsMap[tabId] !== undefined) return pinsMap[tabId];
	return conf?.isPinned === true;
}

describe("GoldenLayout Pinned Tabs Persistence (separate storage key)", () => {
	test("pin state is sourced from pinsMap keyed by componentState.__tabId, not from GL's own config", () => {
		const mapTab = { config: { componentType: "MapTab", componentState: { __tabId: "tab-map" } } };
		const statsTab = { config: { componentType: "StatsTab", componentState: { __tabId: "tab-stats" } } };

		const pinsMap: Record<string, boolean | "forever"> = { "tab-map": true };

		expect(resolveIsPinned(mapTab, pinsMap)).toBe(true);
		expect(resolveIsPinned(statsTab, pinsMap)).toBe(false);
	});

	test("pin state survives a fresh reload where GL's saveLayout/loadLayout has stripped every custom top-level field, since componentState round-trips untouched", () => {
		// Simulates what LAYOUT.saveLayout() -> JSON.stringify -> localStorage -> JSON.parse -> LayoutConfig.fromResolved
		// -> LAYOUT.loadLayout() produces: componentState is preserved verbatim, but any custom top-level
		// key like the old "isPinned" would have been dropped by GL's internal resolve.
		const persistedLayoutJson = JSON.stringify({
			root: {
				type: "stack",
				content: [{ type: "component", componentType: "MapTab", componentState: { __tabId: "tab-map" } }],
			},
		});

		const pinsBefore: Record<string, boolean | "forever"> = { "tab-map": true };
		const fakeStorageBackend = new Map<string, string>();
		fakeStorageBackend.set("test-layout-pins", JSON.stringify(pinsBefore));

		// "reload"
		const reparsed = JSON.parse(persistedLayoutJson);
		const reloadedItem = { config: reparsed.root.content[0] };
		const pinsAfter = JSON.parse(fakeStorageBackend.get("test-layout-pins") as string);

		expect(resolveIsPinned(reloadedItem, pinsAfter)).toBe(true);
	});

	test("forever-pinned tabs ignore pinsMap and can't be toggled off", () => {
		const foreverTab = { config: { componentType: "Journal", isPinned: "forever", componentState: { __tabId: "tab-journal" } } };
		const pinsMap: Record<string, boolean | "forever"> = { "tab-journal": false };

		expect(resolveIsPinned(foreverTab, pinsMap)).toBe("forever");
	});

	test("getTabId returns null when componentState carries no __tabId", () => {
		const untaggedTab = { config: { componentType: "Legacy", componentState: {} } };
		expect(getTabId(untaggedTab)).toBeNull();
	});
});
