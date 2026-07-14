<script lang="ts">
import strawberryIcon from "@assets/interface_strawberry_icon.png";
import timerIcon from "@assets/interface_timer_icon.png";
import deathIcon from "@assets/interface_SIDEA_deaths_icon.png";
import IconAutoGraph from "~icons/material-symbols/auto-graph";
import IconBolt from "~icons/material-symbols/bolt";
import IconCalendarMonth from "~icons/material-symbols/calendar-month";
import IconMilitaryTech from "~icons/material-symbols/military-tech";
import IconRoute from "~icons/material-symbols/route";
import { onMount } from "svelte";
import { Query_GetMonthlyRunStats } from "../../../wailsjs/go/main/App";
import type { src } from "wailsjs/go/models";

type TimelineMonth = src.MonthlyRunStats & {
	label: string;
};

let months = $state<TimelineMonth[]>([]);
let loading = $state(true);
let error: string | null = $state(null);

const maxRuns = $derived(Math.max(1, ...months.map((month) => month.runs)));
const maxDeaths = $derived(Math.max(1, ...months.map((month) => month.deaths)));
const maxPlaytime = $derived(Math.max(1, ...months.map((month) => month.playtimeMs)));
const totals = $derived(months.reduce(
	(acc, month) => ({
		runs: acc.runs + month.runs,
		playtimeMs: acc.playtimeMs + month.playtimeMs,
		deaths: acc.deaths + month.deaths,
		dashes: acc.dashes + month.dashes,
		strawberries: acc.strawberries + month.strawberries,
		goldens: acc.goldens + month.goldenCompletions,
		modRuns: acc.modRuns + month.modRuns,
		vanillaRuns: acc.vanillaRuns + month.vanillaRuns,
	}),
	{
		runs: 0,
		playtimeMs: 0,
		deaths: 0,
		dashes: 0,
		strawberries: 0,
		goldens: 0,
		modRuns: 0,
		vanillaRuns: 0,
	},
));

function buildLastTwelveMonths(rows: src.MonthlyRunStats[]) {
	const byMonth = new Map(rows.map((row) => [row.month, row]));
	const now = new Date();
	const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

	return Array.from({ length: 12 }, (_, index) => {
		const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
		const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
		const existing = byMonth.get(key);

		return {
			month: key,
			runs: existing?.runs ?? 0,
			playtimeMs: existing?.playtimeMs ?? 0,
			deaths: existing?.deaths ?? 0,
			dashes: existing?.dashes ?? 0,
			jumps: existing?.jumps ?? 0,
			strawberries: existing?.strawberries ?? 0,
			goldenAttempts: existing?.goldenAttempts ?? 0,
			goldenCompletions: existing?.goldenCompletions ?? 0,
			modRuns: existing?.modRuns ?? 0,
			vanillaRuns: existing?.vanillaRuns ?? 0,
			label: date.toLocaleDateString(undefined, { month: "short" }),
		};
	});
}

function formatCompact(value: number) {
	return value.toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 1 });
}

function formatPlaytime(ms: number) {
	const hours = Math.floor(ms / 3_600_000);
	const minutes = Math.floor((ms % 3_600_000) / 60_000);
	if (hours <= 0) return `${minutes}m`;
	return `${hours}h ${minutes}m`;
}

onMount(async () => {
	try {
		loading = true;
		const rows = await Query_GetMonthlyRunStats(1, 1);
		months = buildLastTwelveMonths(rows);
		error = null;
	} catch (e) {
		error = String(e);
		months = buildLastTwelveMonths([]);
	} finally {
		loading = false;
	}
});

const statCards = [
	{ label: "Runs", key: "runs", component: IconRoute, color: "text-primary", bg: "bg-primary/10" },
	{ label: "Playtime", key: "playtimeMs", image: timerIcon, color: "text-white", bg: "bg-white/10", format: formatPlaytime },
	{ label: "Deaths", key: "deaths", image: deathIcon, color: "text-red-300", bg: "bg-red-400/10", format: formatCompact },
	{ label: "Dashes", key: "dashes", component: IconBolt, color: "text-cyan-300", bg: "bg-cyan-400/10", format: formatCompact },
	{ label: "Berries", key: "strawberries", image: strawberryIcon, color: "text-tertiary", bg: "bg-tertiary/10", format: formatCompact },
	{ label: "Goldens", key: "goldens", component: IconMilitaryTech, color: "text-yellow-300", bg: "bg-yellow-400/10" },
] as const;
</script>

<section class="space-y-4">
  <div class="flex items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-secondary/15 border border-secondary/20 flex items-center justify-center">
        <IconAutoGraph class="text-secondary text-xl" />
      </div>
      <div>
        <h2 class="text-2xl font-headline font-bold text-white">Stats Timeline</h2>
        <p class="text-xs text-zinc-500 font-bold uppercase tracking-widest">Last 12 months</p>
      </div>
    </div>
    <div class="hidden sm:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
      <IconCalendarMonth class="text-lg" />
      Monthly progress
    </div>
  </div>

  {#if error}
    <div class="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
      Failed to load stat timelines: {error}
    </div>
  {/if}

  <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
    {#each statCards as card (card.label)}
      <div class="bg-card-bg/50 border border-outline-muted rounded-xl p-4 min-h-28">
        <div class="flex items-center justify-between mb-4">
          <span class="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{card.label}</span>
          <div class="w-9 h-9 rounded-lg {card.bg} flex items-center justify-center">
            {#if "component" in card}
              {@const Component = card.component}
              <Component class="text-xl {card.color}" />
            {:else}
              <img src={card.image.src} alt="" class="w-7 h-7 object-contain" />
            {/if}
          </div>
        </div>
        {#if loading}
          <div class="h-8 w-20 rounded bg-zinc-800 animate-pulse"></div>
        {:else}
          <div class="font-headline text-3xl font-bold {card.color}">
            {card.format ? card.format(totals[card.key]) : totals[card.key].toLocaleString()}
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4">
    <div class="bg-card-bg/50 border border-outline-muted rounded-2xl p-4 md:p-5 overflow-hidden">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-sm font-bold text-white uppercase tracking-widest">Runs by Month</h3>
          <p class="text-xs text-zinc-500 mt-1">Bar height shows completed sessions.</p>
        </div>
        <span class="text-xs font-pixel text-zinc-500">{totals.runs.toLocaleString()} total</span>
      </div>

      <div class="h-48 grid grid-cols-12 gap-2 items-end">
        {#each months as month (month.month)}
          <div class="h-full flex flex-col justify-end gap-2 min-w-0">
            <div class="flex-1 flex items-end">
              <div
                class="w-full rounded-t-lg bg-linear-to-t from-primary/45 to-secondary/80 border border-white/10 min-h-2 transition-all"
                style={`height: ${Math.max(6, (month.runs / maxRuns) * 100)}%`}
                title={`${month.label}: ${month.runs} runs`}
              ></div>
            </div>
            <div class="text-[10px] text-center text-zinc-500 font-bold uppercase truncate">{month.label}</div>
          </div>
        {/each}
      </div>
    </div>

    <div class="bg-card-bg/50 border border-outline-muted rounded-2xl p-4 md:p-5">
      <div class="flex items-center justify-between mb-5">
        <div>
          <h3 class="text-sm font-bold text-white uppercase tracking-widest">Progress Mix</h3>
          <p class="text-xs text-zinc-500 mt-1">Activity, time, and pressure per month.</p>
        </div>
      </div>

      <div class="space-y-3">
        {#each months.slice(-6) as month (month.month)}
          <div class="grid grid-cols-[42px_1fr_auto] items-center gap-3">
            <div class="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{month.label}</div>
            <div class="space-y-1.5">
              <div class="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div class="h-full rounded-full bg-secondary" style={`width: ${(month.playtimeMs / maxPlaytime) * 100}%`}></div>
              </div>
              <div class="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div class="h-full rounded-full bg-primary" style={`width: ${(month.deaths / maxDeaths) * 100}%`}></div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs font-bold text-white">{month.runs}</div>
              <div class="text-[10px] text-zinc-500">runs</div>
            </div>
          </div>
        {/each}
      </div>

      <div class="mt-5 grid grid-cols-2 gap-3">
        <div class="rounded-xl bg-surface-high/60 border border-outline-muted p-3">
          <div class="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Mod runs</div>
          <div class="text-xl font-headline font-bold text-tertiary">{totals.modRuns.toLocaleString()}</div>
        </div>
        <div class="rounded-xl bg-surface-high/60 border border-outline-muted p-3">
          <div class="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Vanilla runs</div>
          <div class="text-xl font-headline font-bold text-secondary">{totals.vanillaRuns.toLocaleString()}</div>
        </div>
      </div>
    </div>
  </div>
</section>
