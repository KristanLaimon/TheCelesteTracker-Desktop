<script lang="ts">
import type { SessionWithTotals } from "./ModRecentSessionsTable.svelte";

type Props = {
	sessions: SessionWithTotals[];
};

let { sessions = [] }: Props = $props();

const chronologicalSessions = $derived.by(() => {
	return [...sessions].sort((a, b) => new Date(a.date_time_start).getTime() - new Date(b.date_time_start).getTime());
});

const maxDeaths = $derived.by(() => {
	return Math.max(...chronologicalSessions.map((s) => s.deaths), 1);
});

const maxDurationSec = $derived.by(() => {
	return Math.max(...chronologicalSessions.map((s) => Math.round(s.duration_ms / 1000)), 1);
});

const polylinePoints = $derived.by(() => {
	if (chronologicalSessions.length < 2) return "";
	return chronologicalSessions
		.map((s, idx) => {
			const x = (idx / (chronologicalSessions.length - 1)) * 480 + 10;
			const y = 150 - (s.deaths / maxDeaths) * 140;
			return `${x},${y}`;
		})
		.join(" ");
});
</script>

<div class="rounded-2xl bg-zinc-950/60 border border-zinc-800/80 p-5 backdrop-blur-md space-y-4 w-full">
  <div class="flex items-center justify-between border-b border-zinc-800/80 pb-3">
    <div>
      <h3 class="text-lg font-bold text-white flex items-center gap-2">
        <svg class="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <span>Session Progression & Practice Trend</span>
      </h3>
      <p class="text-xs text-zinc-400 mt-0.5">
        Chronological trend of session deaths and duration to track improvement over time
      </p>
    </div>

    <div class="flex items-center gap-4 text-xs font-semibold">
      <div class="flex items-center gap-1.5 text-rose-400">
        <span class="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
        <span>Deaths</span>
      </div>
      <div class="flex items-center gap-1.5 text-cyan-400">
        <span class="w-3 h-3 rounded-full bg-cyan-500 inline-block"></span>
        <span>Duration (s)</span>
      </div>
    </div>
  </div>

  {#if chronologicalSessions.length < 2}
    <div class="py-8 text-center text-zinc-500 text-sm">
      Need at least 2 recorded sessions to display progression chart trends.
    </div>
  {:else}
    <div class="w-full h-56 relative pt-4 pb-2 px-2">
      <svg class="w-full h-full overflow-visible" viewBox="0 0 500 180" preserveAspectRatio="none">
        <!-- GRID LINES -->
        <line x1="0" y1="0" x2="500" y2="0" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4" />
        <line x1="0" y1="45" x2="500" y2="45" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4" />
        <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4" />
        <line x1="0" y1="135" x2="500" y2="135" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4" />

        <!-- DURATION BARS -->
        {#each chronologicalSessions as session, idx}
          {@const x = (idx / (chronologicalSessions.length - 1)) * 480 + 10}
          {@const durSec = Math.round(session.duration_ms / 1000)}
          {@const barHeight = (durSec / maxDurationSec) * 140}
          {@const y = 150 - barHeight}

          <rect
            x={x - 6}
            {y}
            width="12"
            height={Math.max(barHeight, 2)}
            rx="3"
            class="fill-cyan-500/30 hover:fill-cyan-400/50 transition-colors"
          />
        {/each}

        <!-- DEATHS LINE & POINTS -->
        <polyline
          fill="none"
          stroke="#f43f5e"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          points={polylinePoints}
        />

        {#each chronologicalSessions as session, idx}
          {@const x = (idx / (chronologicalSessions.length - 1)) * 480 + 10}
          {@const y = 150 - (session.deaths / maxDeaths) * 140}

          <circle
            cx={x}
            cy={y}
            r="4"
            class="fill-rose-500 stroke-zinc-950 stroke-2 hover:r-6 transition-all"
          />
        {/each}
      </svg>
    </div>
  {/if}
</div>
