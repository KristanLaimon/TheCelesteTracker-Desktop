// UNIVERSAL COMPATIBILITY
/**
 * @fileoverview Types for the Alt Sides Helper mod metadata files.
 *
 * Alt Sides Helper is a Celeste mod that allows side-specific overrides
 * per map. Each `.bin` can have a companion file:
 *   <MapBin>.altsideshelper.meta.yaml
 *
 * This YAML defines:
 * - altSideData: whether this map is an alt-side and which SID it's for
 * - sides[]: per-side configuration (label, icon, unlock mode, heart data, etc.)
 *
 * The file lives alongside the map .bin in the Maps/ directory hierarchy.
 */

/**
 * Per-side configuration for a map in Alt Sides Helper.
 *
 * Each entry defines how a particular side (A/B/C/D/none) should behave:
 * - `preset` determines the default behaviours (inherited from vanilla)
 * - Side-specific overrides control icons, labels, unlock logic, heart style,
 *   end-screen titles, full-clear requirements, cassette/berry visuals
 *
 * @example
 *   - map: "myMap"
 *     preset: "b-side"
 *     label: "My Map B-Side"
 *     icon: "myIcon"
 *     unlockMode: "consecutively"
 */
export type AltSideDef = {
	map?: string;
	preset?: 'a-side' | 'b-side' | 'c-side' | 'd-side' | 'none';
	overrideVanillaSideData?: boolean;
	overrideHeartTextures?: boolean;
	unlockMode?: 'consecutively' | 'always' | 'triggered' | 'with_previous' | 'c_sides_unlocked';
	icon?: string;
	label?: string;
	showBerriesAsGolden?: boolean;
	deathsIcon?: string;
	chapterPanelHeartIcon?: string;
	journalHeartIcon?: string;
	heartColour?: string;
	inWorldHeartIcon?: string;
	showHeartPoem?: boolean;
	endScreenTitle?: string;
	showBSideRemixIntro?: boolean;
	canFullClear?: boolean;
	cassetteNeededForFullClear?: boolean;
	heartNeededForFullClear?: boolean;
	endScreenClearTitle?: string;
	addCassetteIcon?: boolean;
	journalCassetteIcon?: string;
	[key: string]: unknown;
};

/**
 * Parsed content of a `<MapBin>.altsideshelper.meta.yaml` file.
 *
 * Contains the top-level `altSideData` declaration (marking this map as
 * an alt side for another SID) and optionally per-side overrides via `sides`.
 *
 * @example
 *   altSideData:
 *     isAltSide: true
 *     for: "bryse0n/berry143/berry143"
 *     copyEndScreenData: false
 *   sides:
 *     - preset: "b-side"
 *       label: "Berry 143 B-Side"
 */
export type AltSidesHelperMeta = {
	sides?: AltSideDef[];
	altSideData?: {
		isAltSide: boolean;
		for: string;
		copyEndScreenData?: boolean;
		copyTitle?: boolean;
		[key: string]: unknown;
	};
	[key: string]: unknown;
};

/**
 * File extension for Alt Sides Helper meta files.
 * Appended after `.meta` in the pattern: `<bin>.altsideshelper.meta.yaml`
 *
 * A full meta path looks like:
 *   Maps/bryse0n/berry143/berry143.altsideshelper.meta.yaml
 */
export const ALT_SIDES_META_EXT = '.altsideshelper.meta.yaml';
