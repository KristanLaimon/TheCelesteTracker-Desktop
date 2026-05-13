<script lang="ts">
import { GetAvailableCampaigns, GetCollectionStats } from "../../../wailsjs/go/main/App";
import type { src } from "../../../wailsjs/go/models";
import { saveStore } from "../../lib/saveStore.svelte";
import IconFlag from "~icons/material-symbols/flag";
import IconFavorite from "~icons/material-symbols/favorite";
import IconSkull from "~icons/material-symbols/skull";
import IconTimer from "~icons/material-symbols/timer";

type TierSummary = {
	id: number;
	name: string;
	shortName: string;
	levels: number;
	sides: number;
	totalTime: number;
	deaths: number;
	berries: number;
	hearts: number;
};

let loading = $state(true);
let tiers = $state<TierSummary[]>([]);

const tierOrder = ["0-Lobbies", "0-Gyms", "1-Beginner", "2-Intermediate", "3-Advanced", "4-Expert", "5-Grandmaster"];

function isStrawberryJamCampaign(campaign: src.CampaignItem) {
	return campaign.campaignNameId.startsWith("StrawberryJam2021/");
}

function getShortName(campaignName: string) {
	return campaignName.replace("StrawberryJam2021/", "");
}

function formatDuration(ms: number) {
	const totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
}

async function loadStrawberryJam() {
	if (typeof window !== "undefined" && (!window.go || !window.go.main)) {
		loading = false;
		return;
	}

	loading = true;
	try {
		const campaigns = (await GetAvailableCampaigns(saveStore.userId)).filter(isStrawberryJamCampaign);
		if (campaigns.length === 0) {
			tiers = [];
			return;
		}

		const stats = await GetCollectionStats(campaigns.map((campaign) => campaign.id), saveStore.saveDataId);
		const byCampaign = new Map<number, src.LevelCollectionStats[]>();
		for (const row of stats) {
			const existing = byCampaign.get(row.campaignId) ?? [];
			existing.push(row);
			byCampaign.set(row.campaignId, existing);
		}

		tiers = campaigns
			.map((campaign) => {
				const rows = byCampaign.get(campaign.id) ?? [];
				const uniqueLevels = new Set(rows.map((row) => row.levelName));
				const shortName = getShortName(campaign.campaignNameId);
				return {
					id: campaign.id,
					name: campaign.campaignNameId,
					shortName,
					levels: uniqueLevels.size,
					sides: rows.length,
					totalTime: rows.reduce((sum, row) => sum + row.totalTime, 0),
					deaths: rows.reduce((sum, row) => sum + row.deaths, 0),
					berries: rows.reduce((sum, row) => sum + row.strawberries, 0),
					hearts: rows.reduce((sum, row) => sum + row.hearts, 0),
				};
			})
			.sort((a, b) => {
				const aIndex = tierOrder.indexOf(a.shortName);
				const bIndex = tierOrder.indexOf(b.shortName);
				if (aIndex !== -1 || bIndex !== -1) return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
				return a.shortName.localeCompare(b.shortName);
			});
	} catch (error) {
		console.error("Failed to load Strawberry Jam overview", error);
		tiers = [];
	} finally {
		loading = false;
	}
}

$effect(() => {
	void loadStrawberryJam();
});
</script>

<div class="space-y-6">
	{#if loading}
		<div class="border border-outline-muted bg-card-bg rounded-xl p-8 text-center text-zinc-500 font-medium">
			Loading Strawberry Jam...
		</div>
	{:else if tiers.length === 0}
		<div class="border border-outline-muted bg-card-bg rounded-xl p-8 text-center">
			<h2 class="text-xl font-headline font-bold text-white">No Strawberry Jam progress found</h2>
			<p class="text-sm text-zinc-500 mt-2">The tracker database has no `StrawberryJam2021/*` campaigns for this save yet.</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
			{#each tiers as tier (tier.id)}
				<section class="bg-card-bg border border-outline-muted rounded-xl p-5 hover:border-primary/40 transition-colors">
					<div class="flex items-start justify-between gap-4">
						<div>
							<p class="text-xs uppercase tracking-widest text-zinc-500 font-bold">Strawberry Jam</p>
							<h2 class="text-xl font-headline font-bold text-white mt-1">{tier.shortName}</h2>
						</div>
						<div class="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
							<IconFlag class="text-2xl" />
						</div>
					</div>

					<div class="grid grid-cols-2 gap-3 mt-5">
						<div class="bg-zinc-950/40 border border-outline-muted rounded-lg p-3">
							<p class="text-[11px] text-zinc-500 uppercase font-bold">Levels</p>
							<p class="text-lg text-white font-pixel mt-1">{tier.levels}</p>
						</div>
						<div class="bg-zinc-950/40 border border-outline-muted rounded-lg p-3">
							<p class="text-[11px] text-zinc-500 uppercase font-bold">Sides</p>
							<p class="text-lg text-white font-pixel mt-1">{tier.sides}</p>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-3 mt-3 text-sm">
						<div class="flex items-center gap-2 text-zinc-400">
							<IconTimer class="text-primary" />
							<span>{formatDuration(tier.totalTime)}</span>
						</div>
						<div class="flex items-center gap-2 text-zinc-400">
							<IconSkull class="text-red-400" />
							<span>{tier.deaths}</span>
						</div>
						<div class="flex items-center gap-2 text-zinc-400">
							<IconFavorite class="text-pink-400" />
							<span>{tier.hearts}</span>
						</div>
						<div class="flex items-center gap-2 text-zinc-400">
							<span class="w-4 h-4 rounded-full bg-red-500/80 block"></span>
							<span>{tier.berries}</span>
						</div>
					</div>
				</section>
			{/each}
		</div>
	{/if}
</div>
