<script lang="ts">
import sideADeaths from "../../assets/interface_SIDEA_deaths_icon.png";
import strawberryIcon from "../../assets/interface_strawberry_icon.png";
import timerIcon from "../../assets/interface_timer_icon.png";
import IconAutoAwesome from "~icons/material-symbols/auto-awesome";
import IconDiamond from "~icons/material-symbols/diamond";
import IconFilterHdr from "~icons/material-symbols/filter-hdr";
import IconLandscape from "~icons/material-symbols/landscape";
import IconTimer from "~icons/material-symbols/timer";
import { Query_GetRecentHistory } from "../../../wailsjs/go/main/App";
import  type {  src  } from "../../../wailsjs/go/models";

import {
	Assets_Vanilla_ChapterIcon,
	Assets_Vanilla_DeathIcons,
	Assets_Vanilla_SideIcon,
} from "../../lib/assets";

let currentPage = $state(1);
const pageSize = 10;
let rows = $state<src.RecentRun[]>([]);
let loading = $state(false);
let hasMore = $state(true); 

async function fetchRuns(reset: boolean = false) {
	if (loading || (!hasMore && !reset)) return;
	loading = true;
	
	const targetPage = reset ? 1 : currentPage + 1;

	try {
		const newRows: src.RecentRun[] = await Query_GetRecentHistory(1, 1, pageSize, targetPage);
		
		if (reset) {
			rows = newRows;
			currentPage = 1;
		} else {
			rows = [...rows, ...newRows];
			currentPage = targetPage;
		}

		// If we got fewer results than requested, we've reached the end
		if (newRows.length < pageSize) {
			hasMore = false;
		} else {
			hasMore = true;
		}
	} catch (e) {
		console.error(e);
		hasMore = false; // Stop trying on error
	} finally {
		loading = false;
	}
}

$effect(() => {
	fetchRuns(true);
});

function loadMore() {
	fetchRuns(false);
}

const headers = [
	"Level Name",
	"Side",
	"Type",
	"Attempt",
	"Time",
	"Deaths",
	"Dashes",
	"Berries achieved",
];

function getLevelIcon(row: src.RecentRun) {
	const logo = Assets_Vanilla_ChapterIcon[row.ChapterName];
	if (logo) return logo.src || logo;
	return null;
}

const iconMap = {
	vanilla: { icon: IconFilterHdr, color: "text-primary", bg: "bg-primary/10" },
	modded: {
		icon: IconAutoAwesome,
		color: "text-tertiary",
		bg: "bg-tertiary/10",
	},
	temple: {
		icon: IconDiamond,
		color: "text-purple-400",
		bg: "bg-purple-400/10",
	},
	summit: {
		icon: IconLandscape,
		color: "text-orange-400",
		bg: "bg-orange-400/10",
	},
};

const attemptTypeColors: Record<string, string> = {
	"Wings Golden": "bg-yellow-500/10 text-yellow-500",
	"Normal try": "bg-zinc-800 text-zinc-400",
	GoldenAttempt:
		"bg-yellow-500/10 text-yellow-500/80 border border-yellow-500/20",
	GoldenCompleted: "bg-yellow-500 text-black font-bold",
};
</script>

<style>
  @keyframes golden-shine {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .status-goldenberry {
    background: linear-gradient(
      90deg,
      rgba(250, 204, 21, 0) 0%,
      rgba(250, 204, 21, 0.4) 50%,
      rgba(250, 204, 21, 0) 100%
    );
    background-size: 200% auto;
    animation: golden-shine 3s linear infinite;
    text-shadow: 0 0 10px rgba(250, 204, 21, 0.8);
  }
</style>

<div class="flex items-center justify-between mb-6">
  <div class="flex items-center gap-3">
    <div class="w-8 h-8 rounded-lg bg-accent-gradient flex items-center justify-center">
      <IconTimer class="text-white text-xl" />
    </div>
    <h2 class="text-2xl font-headline font-bold text-white">Recent Run History</h2>
  </div>
  <button class="text-sm font-medium text-primary hover:underline transition-all">Export Data</button>
</div>

<div class="bg-card-bg border border-outline-muted rounded-2xl overflow-hidden overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
  <table class="w-full text-left border-collapse min-w-[900px]">
    <thead>
      <tr class="border-b border-outline-muted bg-zinc-900/50">
        {#each headers as header, i}
          <th class="px-6 py-4 text-xs uppercase tracking-widest text-zinc-500 font-bold {i === 0 ? 'text-left' : 'text-center'}">
            {header}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody class="divide-y divide-outline-muted/50">
      {#each rows as row}
        {@const levelIcon = getLevelIcon(row)}
        {@const IconData = levelIcon ? null : (row.CampaignType === 'Vanilla' ? iconMap.vanilla : iconMap.modded)}
        {@const isGoldenCompleted = row.AttemptType === "GoldenCompleted"}
        {@const isGoldenAttempt = row.AttemptType === "GoldenAttempt"}
        <tr class="hover:bg-white/5 transition-all group border-l-2 {isGoldenCompleted ? 'border-l-yellow-400 bg-yellow-400/5 shadow-[inset_0_0_20px_rgba(250,204,21,0.05)]' : 'border-l-transparent'}">
          <td class="px-6 py-4">
            <div class="flex items-center gap-3 justify-start">
              <div class="w-8 h-8 rounded flex items-center justify-center {IconData ? IconData.bg : 'bg-zinc-800/50'} {IconData ? IconData.color : ''}">
                {#if levelIcon}
                  <img src={levelIcon} alt="" class="w-7 h-7 object-contain" />
                {:else if IconData}
                  <IconData.icon class="text-lg" />
                {/if}
              </div>
              <span class="font-bold text-zinc-200">{row.ChapterName}</span>
            </div>
          </td>
          <td class="px-6 py-4">
            <div class="flex items-center gap-2 justify-center">
              {#if Assets_Vanilla_SideIcon[row.Side]}
                <img src={Assets_Vanilla_SideIcon[row.Side].src || Assets_Vanilla_SideIcon[row.Side]} alt="" class="w-4 h-4" />
              {/if}
              <span class="text-[12px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 whitespace-nowrap">
                {row.Side}
              </span>
            </div>
          </td>
          <td class="px-6 py-4 text-center">
            <span class="px-2 py-1 rounded text-[12px] font-bold uppercase tracking-tighter {row.CampaignType === 'Vanilla' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}">
              {row.CampaignType}
            </span>
          </td>
          <td class="px-6 py-4 text-center">
            <span class="px-2 py-1 rounded text-[12px] font-bold uppercase tracking-tighter {attemptTypeColors[row.AttemptType]}">
              {row.AttemptType}
            </span>
          </td>
          <td class="px-6 py-4 font-pixel text-[12px] text-zinc-400 text-center">
            <div class="flex items-center gap-2 justify-center">
              <img src={timerIcon.src || timerIcon} alt="" class="w-4 h-4 opacity-50" />
              {row.FormattedTime}
            </div>
          </td>
          <td class="px-6 py-4 font-pixel text-[12px] text-zinc-400 text-center">
            <div class="flex items-center gap-2 justify-center">
              {#if isGoldenAttempt}
                <div class="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" title="Golden Death"></div>
              {:else}
                <img src={(Assets_Vanilla_DeathIcons[row.Side] || sideADeaths).src || (Assets_Vanilla_DeathIcons[row.Side] || sideADeaths)} alt="" class="w-5 h-5" />
                {row.Deaths}
              {/if}
            </div>
          </td>
          <td class="px-6 py-4 font-pixel text-[12px] text-zinc-400 text-center">{row.Dashes}</td>
          <td class="px-6 py-4 font-pixel text-[12px] text-zinc-400 text-center w-24">
            <div class="flex items-center gap-2 justify-center">
              <img src={strawberryIcon.src || strawberryIcon} alt="" class="w-5 h-5" />
              {row.Strawberries}
            </div>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>

  {#if hasMore}
    <div class="p-4 border-t border-outline-muted flex justify-center">
      <button
        onclick={loadMore}
        disabled={loading}
        class="px-6 py-2 rounded-xl bg-surface-high border border-outline-muted text-sm font-bold text-zinc-400 hover:text-white hover:border-zinc-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {#if loading}
          <div class="w-4 h-4 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin"></div>
          Loading...
        {:else}
          Load More Recent Runs
        {/if}
      </button>
    </div>
  {:else if rows.length > 0}
    <div class="p-4 border-t border-outline-muted text-center text-xs text-zinc-600 font-bold uppercase tracking-widest">
      End of history
    </div>
  {/if}
</div>
