// biome-ignore-all lint/style/useImportType: DI Needed

import Configuration from "@domain/Configuration";
import { injectable } from "tsyringe";
import ImageCacheService from "./ImageCacheService";

@injectable()
export default class MaddiesApi {
	constructor(
		private imageCache: ImageCacheService,
		private config: Configuration,
	) {}

	public async SearchModByName(modName: string): Promise<MaddiesApiModInfo[]> {
		const res = await fetch(`https://maddie480.ovh/celeste/gamebanana-search?q=${this.normalizeTextForUrls(modName)}`);
		const json = await res.json();
		return json as MaddiesApiModInfo[];
	}

	public async ResolveAndInjectModScreenshotsSrcsInto(modInfo: MaddiesApiModInfo | null): Promise<MaddiesApiModInfo | null> {
		if (!modInfo) return null;
		const modId = modInfo.GameBananaId;
		const sanitizedName = this.imageCache.sanitizeFilename(modInfo.Name);

		const modScreenshotsCachePath = await this.config.getModScreenshotsCachePath();
		const opts = {
			baseDiskDir: modScreenshotsCachePath,
			baseWebDir: `/data/cache/modsscreenshots`,
			getFilename: (index: number, ext: string) => `${modId}-${sanitizedName}-${index}.${ext}`,
		};

		const hasOriginalScreenshots = modInfo.Screenshots && modInfo.Screenshots.length > 0;
		if (hasOriginalScreenshots) {
			const screenshots = await this.imageCache.resolveUrlList(modInfo.Screenshots, opts);
			return {
				...modInfo,
				Screenshots: screenshots,
			};
		}

		const mirroredScreenshots = await this.imageCache.resolveUrlList(modInfo.MirroredScreenshots, opts);
		return {
			...modInfo,
			MirroredScreenshots: mirroredScreenshots,
		};
	}

	private normalizeTextForUrls(anyText: string) {
		const normalized = this.imageCache.sanitizeFilename(anyText);
		return encodeURIComponent(normalized);
	}
}

export type MaddiesApiModInfo = {
	CategoryId: number;
	Screenshots: string[];
	Description: string;
	Views: number;
	GameBananaType: string;
	TokenizedName: string[];
	UpdatedDate: number;
	SubcategoryId?: number;
	SubcategoryName?: string;
	GameBananaId: number;
	Featured?: Featured;
	Text: string;
	ModifiedDate: number;
	Name: string;
	PageURL: string;
	MirroredScreenshots: string[];
	CreatedDate: number;
	Author: string;
	CategoryName: string;
	Downloads: number;
	Likes: number;
	Files: File[];
};

export type Featured = {
	Position: number;
	Category: string;
};

export type File = {
	Description: string;
	HasEverestYaml: boolean;
	Size: number;
	CreatedDate: number;
	Downloads: number;
	URL: string;
	Name: string;
};
