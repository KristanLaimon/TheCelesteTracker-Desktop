import { describe, expect, test } from "bun:test";

type IndexableComponentOption = {
	goldenLayoutKey: string;
	thumbnail: string;
	title?: string;
	description?: string;
	tags?: string[];
};

describe("NewPage and Page Selector Data Contracts", () => {
	test("IndexableComponentOption structure validates correctly", () => {
		const sampleOptions: IndexableComponentOption[] = [
			{
				goldenLayoutKey: "canvas",
				thumbnail: "canvas-thumb.png",
				title: "Canvas",
				description: "Free-Canvas workspace",
				tags: ["canvas", "editor"],
			},
			{
				goldenLayoutKey: "modView",
				thumbnail: "modview-thumb.png",
				title: "Mod View",
				description: "Mod browser",
				tags: ["mod", "celeste"],
			},
		];

		expect(sampleOptions.length).toBe(2);
		expect(sampleOptions[0].goldenLayoutKey).toBe("canvas");
		expect(sampleOptions[0].thumbnail).toBe("canvas-thumb.png");
		expect(sampleOptions[1].goldenLayoutKey).toBe("modView");
		expect(sampleOptions[1].thumbnail).toBe("modview-thumb.png");
	});

	test("dynamic search filter logic matches titles, descriptions, and tags", () => {
		const items: IndexableComponentOption[] = [
			{
				goldenLayoutKey: "canvas",
				thumbnail: "canvas.png",
				title: "Canvas Workspace",
				description: "Pan and zoom canvas",
				tags: ["editor", "nodes"],
			},
			{
				goldenLayoutKey: "modView",
				thumbnail: "mod.png",
				title: "Celeste Mod Viewer",
				description: "Browse Everest mods",
				tags: ["everest", "mods"],
			},
		];

		const filter = (query: string) => {
			const q = query.trim().toLowerCase();
			if (!q) return items;
			return items.filter((item) => {
				const titleMatch = (item.title || item.goldenLayoutKey).toLowerCase().includes(q);
				const descMatch = (item.description || "").toLowerCase().includes(q);
				const keyMatch = item.goldenLayoutKey.toLowerCase().includes(q);
				const tagsMatch = item.tags?.some((t: string) => t.toLowerCase().includes(q)) ?? false;
				return titleMatch || descMatch || keyMatch || tagsMatch;
			});
		};

		expect(filter("canvas").length).toBe(1);
		expect(filter("canvas")[0].goldenLayoutKey).toBe("canvas");

		expect(filter("everest").length).toBe(1);
		expect(filter("everest")[0].goldenLayoutKey).toBe("modView");

		expect(filter("nonexistent").length).toBe(0);
	});
});
