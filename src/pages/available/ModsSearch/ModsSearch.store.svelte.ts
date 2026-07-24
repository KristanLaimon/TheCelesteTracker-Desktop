// BROWSER ONLY
import { OlympusModCategory } from "../../../libs/Olympus";

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

const ModsSearchStore = new ModsSearchStore_();
export default ModsSearchStore;
