// BROWSER ONLY

/**
 * Tab-scoped side-channel for steering an already-mounted `ModView` panel to a
 * different mod. GoldenLayout only spreads props into a component once at mount
 * time — there's no way to push new props into an already-mounted instance — so
 * a caller (e.g. `ModsSearch_Results`) that wants to update a `ModView` tab it
 * previously opened does so by writing here, keyed by that tab's `__tabId`.
 */
class ModViewSteering_ {
	steeredModIdByTabId = $state<Record<string, string>>({});

	SetSteeredMod(tabId: string, modId: string): void {
		this.steeredModIdByTabId = { ...this.steeredModIdByTabId, [tabId]: modId };
	}
}

const ModViewSteering = new ModViewSteering_();
export default ModViewSteering;
