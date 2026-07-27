<script lang="ts">
import goldenBerryIcon from "../../../assets/interface_goldenstrawberry_icon.png";
import type { SessionWithTotals } from "./ModRecentSessionsTable.svelte";

type Props = {
	sessions: SessionWithTotals[];
};

let { sessions = [] }: Props = $props();

const goldenSessions = $derived.by(() => {
	return sessions.filter((s) => s.is_goldenberry_attempt === 1 || s.is_goldenberry_completed === 1);
});

const totalAttempts = $derived(goldenSessions.length);
const totalCompletions = $derived(goldenSessions.filter((s) => s.is_goldenberry_completed === 1).length);

const successRatePct = $derived.by(() => {
	if (totalAttempts === 0) return 0;
	return Math.round((totalCompletions / totalAttempts) * 100);
});

const goldenFailRooms = $derived.by(() => {
	const map = new Map<string, number>();
	for (const session of goldenSessions) {
		if (session.is_goldenberry_completed === 1) continue;
		// Find the room with deaths in this failed golden attempt
		for (const stat of session.roomStatsList) {
			if (stat.deaths_in_room > 0) {
				const room = stat.room_name;
				map.set(room, (map.get(room) || 0) + stat.deaths_in_room);
			}
		}
	}
	return [...map.entries()].map(([room, deaths]) => ({ room, deaths })).sort((a, b) => b.deaths - a.deaths);
});
</script>

<div class="rounded-2xl bg-amber-950/20 border border-amber-500/30 p-5 backdrop-blur-md space-y-4 w-full">
  <div class="flex items-center justify-between border-b border-amber-500/20 pb-3">
    <h3 class="text-lg font-bold text-amber-200 flex items-center gap-2">
      <img src={goldenBerryIcon} alt="" class="h-5 w-auto" />
      <span>Golden Berry Analytics</span>
    </h3>
    <span class="text-xs font-semibold text-amber-400/80 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
      {totalAttempts} Total Attempt{totalAttempts === 1 ? '' : 's'}
    </span>
  </div>

  {#if totalAttempts === 0}
    <div class="py-6 text-center text-amber-300/60 text-sm">
      No Golden Berry attempts recorded for this mod yet.
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- STAT PILL 1: COMPLETIONS -->
      <div class="bg-amber-950/40 border border-amber-500/30 p-3.5 rounded-xl flex items-center gap-3">
        <div class="p-2.5 rounded-lg bg-amber-500/20 text-amber-300">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <div class="text-xs text-amber-300/70 font-semibold">Completions</div>
          <div class="text-xl font-extrabold text-amber-100">{totalCompletions} / {totalAttempts}</div>
        </div>
      </div>

      <!-- STAT PILL 2: SUCCESS RATE -->
      <div class="bg-amber-950/40 border border-amber-500/30 p-3.5 rounded-xl flex items-center gap-3">
        <div class="p-2.5 rounded-lg bg-amber-500/20 text-amber-300">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <div class="text-xs text-amber-300/70 font-semibold">Success Rate</div>
          <div class="text-xl font-extrabold text-amber-100">{successRatePct}%</div>
        </div>
      </div>

      <!-- STAT PILL 3: GOLDEN FAIL ROOMS -->
      <div class="bg-amber-950/40 border border-amber-500/30 p-3.5 rounded-xl flex items-center gap-3">
        <div class="p-2.5 rounded-lg bg-amber-500/20 text-amber-300">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <div class="text-xs text-amber-300/70 font-semibold">Choke Point Rooms</div>
          <div class="text-sm font-bold text-amber-200">
            {#if goldenFailRooms.length > 0}
              {goldenFailRooms[0].room} ({goldenFailRooms[0].deaths} fails)
            {:else}
              None!
            {/if}
          </div>
        </div>
      </div>
    </div>

    {#if goldenFailRooms.length > 0}
      <div class="space-y-2 pt-2 border-t border-amber-500/20">
        <h4 class="text-xs font-bold text-amber-300 uppercase tracking-wider">Golden Attempt Fail Rooms Breakdown:</h4>
        <div class="flex flex-wrap gap-2">
          {#each goldenFailRooms as item}
            <span class="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/30 text-xs font-mono text-amber-200 flex items-center gap-1.5">
              <span>{item.room}</span>
              <span class="text-rose-400 font-bold">({item.deaths}💀)</span>
            </span>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>
