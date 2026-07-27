<script lang="ts">
import goldenBerryIcon from "../../../assets/interface_goldenstrawberry_icon.png";
import deathsIcon from "../../../assets/interface_SIDEA_deaths_icon.png";
import strawberryIcon from "../../../assets/interface_strawberry_icon.png";
import timerIcon from "../../../assets/interface_timer_icon.png";
import type { GameSession, GameSessionChapterRoomStat } from "../../../db/db.types";
import { formatPlayTime } from "../../../utils/Time";

export type SessionWithTotals = GameSession & {
	deaths: number;
	jumps: number;
	dashes: number;
	strawberries: number;
	chapterName: string;
	roomStatsList: GameSessionChapterRoomStat[];
};

type Props = {
	sessions: SessionWithTotals[];
	selectedSessionId?: string | null;
	onSelectSession?: (sessionId: string | null) => void;
};

let { sessions = [], selectedSessionId = null, onSelectSession }: Props = $props();

function cleanChapterName(sid: string): string {
	if (!sid) return "Unknown Chapter";
	const parts = sid.split("/");
	const rawName = parts[parts.length - 1] || sid;
	return rawName.replace(/^\d+-/, "").replace(/_/g, " ");
}

function formatSide(sideId: string): string {
	switch (sideId) {
		case "SIDEB":
			return "Side B";
		case "SIDEC":
			return "Side C";
		default:
			return "Side A";
	}
}

function formatDate(isoStr: string): string {
	try {
		const d = new Date(isoStr);
		return d.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return isoStr;
	}
}
</script>

<div class="rounded-2xl bg-zinc-950/60 border border-zinc-800/80 p-5 backdrop-blur-md space-y-4 w-full">
  <div class="flex items-center justify-between border-b border-zinc-800/80 pb-3">
    <h3 class="text-lg font-bold text-white flex items-center gap-2">
      <svg class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Recent Play Sessions</span>
      <span class="text-xs font-normal text-zinc-400">({sessions.length} recorded)</span>
    </h3>
    {#if selectedSessionId}
      <button
        onclick={() => onSelectSession?.(null)}
        class="text-xs text-zinc-400 hover:text-white bg-zinc-800/60 px-2.5 py-1 rounded-lg border border-zinc-700/50 transition-colors"
      >
        Clear Selection
      </button>
    {/if}
  </div>

  {#if sessions.length === 0}
    <div class="py-8 text-center text-zinc-500 text-sm">
      No recent gameplay sessions logged in database for this mod yet.
    </div>
  {:else}
    <div class="overflow-x-auto rounded-xl border border-zinc-800/60">
      <table class="w-full text-left text-xs">
        <thead class="bg-zinc-900/90 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800/80">
          <tr>
            <th class="py-3 px-4">Date & Time</th>
            <th class="py-3 px-4">Chapter / Map</th>
            <th class="py-3 px-4">Side</th>
            <th class="py-3 px-4">Duration</th>
            <th class="py-3 px-4">Deaths</th>
            <th class="py-3 px-4">Jumps</th>
            <th class="py-3 px-4">Dashes</th>
            <th class="py-3 px-4">Strawberries</th>
            <th class="py-3 px-4 text-right">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-800/40">
          {#each sessions as session (session.id)}
            {@const isSelected = selectedSessionId === session.id}
            {@const isGoldenCompleted = session.is_goldenberry_completed === 1}
            {@const isGoldenAttempt = session.is_goldenberry_attempt === 1}

            <tr
              onclick={() => onSelectSession?.(isSelected ? null : session.id)}
              class="cursor-pointer transition-all duration-150 {
                isGoldenCompleted
                  ? 'bg-amber-950/25 hover:bg-amber-900/35 border-l-4 border-l-amber-400 shadow-[inset_0_0_15px_rgba(245,158,11,0.1)] font-medium text-amber-100'
                  : isSelected
                  ? 'bg-emerald-950/30 hover:bg-emerald-900/40 border-l-4 border-l-emerald-400 text-emerald-100'
                  : isGoldenAttempt
                  ? 'bg-amber-950/10 hover:bg-zinc-900/80 border-l-2 border-l-amber-500/50 text-zinc-200'
                  : 'hover:bg-zinc-900/60 text-zinc-200'
              }"
            >
              <!-- DATE & TIME -->
              <td class="py-3 px-4 whitespace-nowrap text-zinc-300 font-mono text-[11px]">
                {formatDate(session.date_time_start)}
              </td>

              <!-- CHAPTER NAME -->
              <td class="py-3 px-4 font-semibold text-white">
                {cleanChapterName(session.chapter_sid)}
              </td>

              <!-- SIDE BADGE -->
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border {
                  session.side_id === 'SIDEB'
                    ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30'
                    : session.side_id === 'SIDEC'
                    ? 'bg-purple-950/60 text-purple-300 border-purple-500/30'
                    : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                }">
                  {formatSide(session.side_id)}
                </span>
              </td>

              <!-- DURATION -->
              <td class="py-3 px-4 whitespace-nowrap font-mono text-zinc-200">
                <div class="flex items-center gap-1.5">
                  <img src={timerIcon} alt="" class="h-3.5 w-auto opacity-70" />
                  <span>{formatPlayTime(session.duration_ms)}</span>
                </div>
              </td>

              <!-- DEATHS -->
              <td class="py-3 px-4 whitespace-nowrap font-bold text-rose-400">
                <div class="flex items-center gap-1.5">
                  <img src={deathsIcon} alt="" class="h-3.5 w-auto" />
                  <span>{session.deaths.toLocaleString()}</span>
                </div>
              </td>

              <!-- JUMPS -->
              <td class="py-3 px-4 whitespace-nowrap font-medium text-purple-300">
                {session.jumps.toLocaleString()}
              </td>

              <!-- DASHES -->
              <td class="py-3 px-4 whitespace-nowrap font-medium text-cyan-300">
                {session.dashes.toLocaleString()}
              </td>

              <!-- STRAWBERRIES -->
              <td class="py-3 px-4 whitespace-nowrap">
                {#if session.strawberries > 0}
                  <div class="flex items-center gap-1 font-bold text-amber-300">
                    <img src={strawberryIcon} alt="" class="h-3.5 w-auto" />
                    <span>+{session.strawberries}</span>
                  </div>
                {:else}
                  <span class="text-zinc-600">-</span>
                {/if}
              </td>

              <!-- STATUS / GOLDEN BADGES -->
              <td class="py-3 px-4 text-right whitespace-nowrap">
                {#if isGoldenCompleted}
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-[0_0_8px_rgba(245,158,11,0.3)] font-bold text-[10px] uppercase">
                    <img src={goldenBerryIcon} alt="" class="h-3.5 w-auto animate-pulse" />
                    <span>Golden Achieved!</span>
                  </span>
                {:else if isGoldenAttempt}
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-400 border border-amber-500/40 text-[10px]">
                    <img src={goldenBerryIcon} alt="" class="h-3 w-auto opacity-80" />
                    <span>Golden Attempt</span>
                  </span>
                {:else}
                  <span class="text-zinc-500 text-[10px]">Standard</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
