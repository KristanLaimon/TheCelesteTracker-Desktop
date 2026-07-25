// BROWSER ONLY
import { OlympusModCategory } from "@domain/Olympus";
import { Construct_LocalMods } from "../../../setup.DI.helpers";

export type ModsSearchCategory = OlympusModCategory | "Uncategorized";
export const ModsSearchCategoryList: readonly ModsSearchCategory[] = [...OlympusModCategory, "Uncategorized"] as const;

/** Live query/filter state shared between ModsSearch_Sidebar and ModsSearch_Results. */
class ModsSearchStore_ {
	searchQuery = $state<string>("");
	selectedCategories = $state<ModsSearchCategory[]>([...ModsSearchCategoryList]);
	sortBy = $state<"size" | "dependencies">("size");

	/** Clears query/filters (not sortBy, a view preference) - called when the Sidebar tab closes. */
	Reset(): void {
		this.searchQuery = "";
		this.selectedCategories = [...ModsSearchCategoryList];
	}
}

export const ModsSearchStore = new ModsSearchStore_();

export type ModsSearchRow = {
	/** modNameId ?? levelSetNames[0] ?? humanName - stable identity for {#each}. */
	key: string;
	modNameId: string | null;
	levelSetNames: string[];
	humanName: string;
	category: ModsSearchCategory;
	sizeBytes: number | null;
	dependenciesCount: number | null;
	installed: boolean;
};

function normalizeCategory(raw: string | null): ModsSearchCategory {
	if (!raw) return "Uncategorized";
	const match = OlympusModCategory.find((c) => c.toLowerCase() === raw.trim().toLowerCase());
	return match ?? "Uncategorized";
}

/**
 * Shared row cache for ModsSearch_Sidebar (category counts) and ModsSearch_Results (the table).
 * All join/cache/fallback logic actually lives in DBMods.Mods_GetAllWithHistory.
 */
class ModsSearchRowsCache_ {
	rows = $state<ModsSearchRow[]>([]);
	loading = $state<boolean>(false);
	#loadPromise: Promise<void> | null = null;

	Load(opts?: { invalidateCache?: boolean }): Promise<void> {
		if (this.#loadPromise && !opts?.invalidateCache) return this.#loadPromise;
		this.loading = true;
		this.#loadPromise = this.#doLoad(opts).finally(() => {
			this.loading = false;
		});
		return this.#loadPromise;
	}

	async #doLoad(opts?: { invalidateCache?: boolean }): Promise<void> {
		const localMods = Construct_LocalMods({ filePath: "./data/mods-dbS.json", indent: 2 });
		try {
			const entries = await localMods.Mods_GetAllWithHistory(
				opts?.invalidateCache ? { invalidateCache: { ALL_EVEREST_MODS_INFO: true, HISTORICAL_UNINSTALLED_MODS: true } } : undefined,
			);
			this.rows = entries.map((e, index) => ({
				key: `${e.modNameId ?? e.levelSetNames[0] ?? e.humanName}-${index}`,
				modNameId: e.modNameId,
				levelSetNames: e.levelSetNames,
				humanName: e.humanName,
				category: normalizeCategory(e.category),
				sizeBytes: e.sizeBytes,
				dependenciesCount: e.dependenciesCount,
				installed: e.installed,
			}));
		} finally {
			await localMods.destroy();
		}
	}
}

export const ModsSearchRowsCache = new ModsSearchRowsCache_();
