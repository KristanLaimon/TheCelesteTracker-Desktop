<script lang="ts">
import type { SessionWithTotals } from "./ModRecentSessionsTable.svelte";

type Props = {
	sessions: SessionWithTotals[];
};

let { sessions = [] }: Props = $props();

const totals = $derived.by(() => {
	let totalDeaths = 0;
	let totalJumps = 0;
	let totalDashes = 0;
	let totalDurationMs = 0;

	for (const s of sessions) {
		totalDeaths += s.deaths;
		totalJumps += s.jumps;
		totalDashes += s.dashes;
		totalDurationMs += s.duration_ms;
	}

	return { totalDeaths, totalJumps, totalDashes, totalDurationMs };
});

const jumpDashRatio = $derived.by(() => {
	if (totals.totalDashes === 0) return 0;
	return (totals.totalJumps / totals.totalDashes).toFixed(2);
});

const deathsPerMinute = $derived.by(() => {
	const totalMin = totals.totalDurationMs / (1000 * 60);
	if (totalMin <= 0) return "0.0";
	return (totals.totalDeaths / totalMin).toFixed(1);
});
</script>

<div class="rounded-2xl bg-zinc-950/60 border border-zinc-800/80 p-5 backdrop-blur-md space-y-4 w-full">
  <div class="border-b border-zinc-800/80 pb-3">
    <h3 class="text-lg font-bold text-white flex items-center gap-2">
      <svg class="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <span>Movement & Mechanics Metrics</span>
    </h3>
  </div>

  {#if sessions.length === 0}
    <div class="py-6 text-center text-zinc-500 text-sm">
      No session movement metrics available yet.
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- JUMP / DASH RATIO -->
      <div class="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl space-y-1">
        <div class="text-xs font-semibold text-zinc-400">Jump / Dash Ratio</div>
        <div class="text-2xl font-extrabold text-purple-300 font-mono">{jumpDashRatio}x</div>
        <div class="text-[11px] text-zinc-500">
          {totals.totalJumps.toLocaleString()} jumps / {totals.totalDashes.toLocaleString()} dashes
        </div>
      </div>

      <!-- DEATHS PER MINUTE -->
      <div class="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl space-y-1">
        <div class="text-xs font-semibold text-zinc-400">Deaths Per Minute (DPM)</div>
        <div class="text-2xl font-extrabold text-rose-400 font-mono">{deathsPerMinute}</div>
        <div class="text-[11px] text-zinc-500">
          {totals.totalDeaths.toLocaleString()} deaths overall
        </div>
      </div>

      <!-- TOTAL RECORDED SESSIONS -->
      <div class="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl space-y-1">
        <div class="text-xs font-semibold text-zinc-400">Recorded Sessions</div>
        <div class="text-2xl font-extrabold text-cyan-300 font-mono">{sessions.length}</div>
        <div class="text-[11px] text-zinc-500">
          Logged via SQLite Mod
        </div>
      </div>
    </div>
  {/if}
</div>
