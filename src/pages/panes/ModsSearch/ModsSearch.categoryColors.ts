// BROWSER ONLY
import type { ModsSearchCategory } from "./ModsSearch.store.svelte";

/**
 * Category chip/tag colors. `Maps` uses a muted brick-red rather than the app's
 * `--apptheme-accent-primary` (#E84A5F, used for active tabs/primary buttons) -
 * reusing that exact hex here would read as "active UI state", not "category".
 * Dialog/WiPs/Tools reuse existing `--apptheme-status-*` tokens for consistency.
 */
export const CATEGORY_COLORS: Record<ModsSearchCategory, string> = {
	Maps: "#D65D5D",
	Helpers: "#A78BFA",
	Skins: "#F2C94C",
	Mechanics: "#22D3EE",
	Tools: "#4CAF50",
	UI: "#FB923C",
	Dialog: "#2196F3",
	WiPs: "#FFC107",
	Assets: "#8B8B99",
	"Other/Misc": "#8B8B99",
	Uncategorized: "#5A5A66",
};
