// biome-ignore-all lint/style/useImportType: DI Needed
import { injectable } from 'tsyringe';
import ImageCacheService from './ImageCacheService';

@injectable()
export default class MaddiesApi {
	constructor(private imageCache: ImageCacheService) {}

	public async SearchModByName(modName: string): Promise<MaddiesApiModInfo[]> {
		const res = await fetch(`https://maddie480.ovh/celeste/gamebanana-search?q=${this.normalizeTextForUrls(modName)}`);
		const json = await res.json();
		return json as MaddiesApiModInfo[];
	}

	public async ResolveAndInjectModScreenshotsSrcsInto(modInfo: MaddiesApiModInfo | null): Promise<MaddiesApiModInfo | null> {
		if (!modInfo) return null;
		const modId = modInfo.GameBananaId;
		const sanitizedName = this.sanitizeTextForFilename(modInfo.Name);

		const resolveList = async (urls: string[] | undefined) => {
			if (!urls || urls.length === 0) return urls ?? [];
			return Promise.all(
				urls.map(async (url, index) => {
					const extMatch = url.split('.').pop()?.split('?')[0];
					const ext = extMatch && extMatch.length <= 4 ? extMatch : 'png';
					const filename = `${modId}-${sanitizedName}-${index}.${ext}`;
					const diskPath = `./data/cache/modsscreenshots/${filename}`;
					const webUrl = `/data/cache/modsscreenshots/${filename}`;
					return this.imageCache.resolveCachedUrl(url, diskPath, webUrl);
				}),
			);
		};

		const hasOriginalScreenshots = modInfo.Screenshots && modInfo.Screenshots.length > 0;
		if (hasOriginalScreenshots) {
			const screenshots = await resolveList(modInfo.Screenshots);
			return {
				...modInfo,
				Screenshots: screenshots,
			};
		}

		const mirroredScreenshots = await resolveList(modInfo.MirroredScreenshots);
		return {
			...modInfo,
			MirroredScreenshots: mirroredScreenshots,
		};
	}

	private sanitizeTextForFilename(anyText: string): string {
		return anyText
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase()
			.replace(/[^a-z0-9 -]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.trim()
			.replace(/^-+|-+$/g, '');
	}

	private normalizeTextForUrls(anyText: string) {
		const normalized = this.sanitizeTextForFilename(anyText);
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
