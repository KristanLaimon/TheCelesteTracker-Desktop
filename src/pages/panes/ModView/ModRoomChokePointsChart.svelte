<script lang="ts">
import deathsIcon from "../../../assets/interface_SIDEA_deaths_icon.png";
import strawberryIcon from "../../../assets/interface_strawberry_icon.png";
import type { GameSessionChapterRoomStat } from "../../../db/db.types";

export type AggregatedRoomStat = {
	roomName: string;
	deaths: number;
	dashes: number;
	jumps: number;
	strawberries: number;
	hearts: number;
};

type Props = {
	roomStats: GameSessionChapterRoomStat[];
	selectedSessionTitle?: string | null;
};

let { roomStats = [], selectedSessionTitle = null }: Props = $props();

const aggregatedStats = $derived.by(() => {
	const map = new Map<string, AggregatedRoomStat>();
	for (const stat of roomStats) {
		const name = stat.room_name;
		const existing = map.get(name);
		if (existing) {
			existing.deaths += stat.deaths_in_room;
			existing.dashes += stat.dashes_in_room;
			existing.jumps += stat.jumps_in_room;
			existing.strawberries += stat.strawberries_achieved_in_room;
			existing.hearts += stat.hearts_achieved_in_room;
		} else {
			map.set(name, {
				roomName: name,
				deaths: stat.deaths_in_room,
				dashes: stat.dashes_in_room,
				jumps: stat.jumps_in_room,
				strawberries: stat.strawberries_achieved_in_room,
				hearts: stat.hearts_achieved_in_room,
			});
		}
	}
	return [...map.values()];
});

const maxDeaths = $derived.by(() => {
	return Math.max(...aggregatedStats.map((r) => r.deaths), 1);
});

const sortedByDeaths = $derived.by(() => {
	return [...aggregatedStats].sort((a, b) => b.deaths - a.deaths);
});

const topChokePoints = $derived.by(() => {
	return sortedByDeaths.filter((r) => r.deaths > 0).slice(0, 3);
});
</script>

<div class="rounded-2xl bg-zinc-950/60 border border-zinc-800/80 p-5 backdrop-blur-md space-y-4 w-full">
  <div class="flex items-center justify-between border-b border-zinc-800/80 pb-3">
    <div>
      <h3 class="text-lg font-bold text-white flex items-center gap-2">
        <svg class="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        </svg>
        <span>Room Choke Points & Heatmap</span>
      </h3>
      <p class="text-xs text-zinc-400 mt-0.5">
        {#if selectedSessionTitle}
          Showing room breakdown for: <span class="text-emerald-300 font-semibold">{selectedSessionTitle}</span>
        {:else}
          Aggregate deaths and mechanics breakdown across recorded rooms
        {/if}
      </p>
    </div>

    <!-- TOP CHOKE POINTS HIGHLIGHT BADGES -->
    {#if topChokePoints.length > 0}
      <div class="flex items-center gap-2">
        <span class="text-[11px] font-semibold text-zinc-400">Hardest Rooms:</span>
        {#each topChokePoints as point, idx}
          <span class="px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 {
            idx === 0
              ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-sm'
              : 'bg-orange-950/60 text-orange-300 border-orange-500/40'
          }">
            <span>#{idx + 1} {point.roomName}</span>
            <span class="text-[9px] font-mono text-rose-400">({point.deaths}💀)</span>
          </span>
        {/each}
      </div>
    {/if}
  </div>

  {#if aggregatedStats.length === 0}
    <div class="py-8 text-center text-zinc-500 text-sm">
      No room statistics recorded for this selection yet.
    </div>
  {:else}
    <div class="space-y-3.5 max-h-96 overflow-y-auto pr-2">
      {#each sortedByDeaths as room (room.roomName)}
        {@const percentage = Math.round((room.deaths / maxDeaths) * 100)}
        {@const isTopChoke = topChokePoints.some((p) => p.roomName === room.roomName)}

        <div class="space-y-1 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/60 hover:border-zinc-700/60 transition-all">
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="font-bold text-white font-mono">{room.roomName}</span>
              {#if isTopChoke && room.deaths > 0}
                <span class="text-[9px] uppercase px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                  Choke Point
                </span>
              {/if}
            </div>

            <div class="flex items-center gap-4 text-xs">
              <span class="flex items-center gap-1 font-bold text-rose-400">
                <img src={deathsIcon} alt="" class="h-3.5 w-auto" />
                <span>{room.deaths} deaths</span>
              </span>

              <span class="text-cyan-300 font-medium text-[11px]">
                {room.dashes} dashes
              </span>

              <span class="text-purple-300 font-medium text-[11px]">
                {room.jumps} jumps
              </span>

              {#if room.strawberries > 0}
                <span class="flex items-center gap-1 text-amber-300 font-bold text-[11px]">
                  <img src={strawberryIcon} alt="" class="h-3 w-auto" />
                  <span>+{room.strawberries}</span>
                </span>
              {/if}
            </div>
          </div>

          <!-- HEAT BAR VISUALIZER -->
          <div class="h-2 w-full bg-zinc-800/80 rounded-full overflow-hidden relative">
            <div
              class="h-full rounded-full transition-all duration-300 {
                percentage > 70
                  ? 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                  : percentage > 35
                  ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
              }"
              style:width={`${Math.max(percentage, 4)}%`}
            ></div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
