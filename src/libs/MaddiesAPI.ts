// UNIVERSAL COMPATIBILITY
import { injectable } from 'tsyringe';

@injectable()
export default class MaddiesApi {
	public async SearchModByName(modName: string): Promise<MaddiesApiModInfo[]> {
		const res = await fetch(`https://maddie480.ovh/celeste/gamebanana-search?q=${this.normalizeTextForUrls(modName)}`);
		const json = await res.json();
		return json as MaddiesApiModInfo[];
	}

	private normalizeTextForUrls(anyText: string) {
		const normalized = anyText
			// 1. Normalize Unicode characters (e.g., é to e)
			.normalize('NFD')
			// 2. Remove combining diacritical marks (the accents)
			.replace(/[\u0300-\u036f]/g, '')
			// 3. Convert to lowercase
			.toLowerCase()
			// 4. Remove special characters (keep only alphanumeric, hyphens, and spaces)
			.replace(/[^a-z0-9 -]/g, '')
			// 5. Replace spaces and multiple hyphens with a single hyphen
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			// 6. Trim hyphens from the start and end of the string
			.trim()
			.replace(/^-+|-+$/g, '');
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
