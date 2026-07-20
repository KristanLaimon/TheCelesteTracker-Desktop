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

export const ALT_SIDES_META_EXT = '.altsideshelper.meta.yaml';
