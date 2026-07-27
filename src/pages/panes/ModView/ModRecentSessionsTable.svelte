<script lang="ts">
import { serializeError } from "serialize-error";
import goldenBerryIcon from "../../../assets/interface_goldenstrawberry_icon.png";
import timerIcon from "../../../assets/interface_timer_icon.png";
import CTDB from "../../../db";
import { formatChapterName, formatSessionDate, formatSideName } from "../../../libs/SessionHelpers";
import { DB_Mods, GetDependency } from "../../../setup";
import { uiLogger } from "../../../utils/Logger";
import { formatPlayTime } from "../../../utils/Time";
	import saveSlotStore from "../../../stores/SaveSlot.store.svelte";

type Props = {
	modStringId: string;
};

let { modStringId = $bindable("") }: Props = $props();

const LocalMods_DB = DB_Mods;
const CelesteTracker_DB = GetDependency(CTDB);

let isLoading = $state<boolean>(true);
let errorMsg = $state<string | null>(null);
let sessions: Awaited<ReturnType<typeof CelesteTracker_DB.GameSessions.GetLastSessionsFromStandaloneModMap>> = $state(null);

let heroImage = $state<string | null>(null);

// Fetch Maddies API screenshot internally for hero image background
$effect(() => {
	if (!modStringId) {
		heroImage = null;
		return;
	}
	LocalMods_DB.MaddiesApi_Get_ModByModId(modStringId).then((maddies) => {
		const screenshots = maddies?.Screenshots?.length ? maddies.Screenshots : maddies?.MirroredScreenshots;
		if (screenshots?.length) {
			heroImage = screenshots[0];
		} else {
			heroImage = null;
		}
	});
});

//Initial loding
$effect(() => {
	LocalMods_DB.EverestMods_Get_ModByModId(modStringId)
		.then((found) => {
			if (found) {
				uiLogger.silly("MAP FULL INFO:", found);
				if (found.metadata.isMapMod) {
					if (found.metadata.isLobby) {
						//do nothing, not currently supported (more logic)
					} else {
						CelesteTracker_DB.GameSessions.GetLastSessionsFromStandaloneModMap(saveSlotStore.selectedSaveSlot, found)
							.then((foundSessions) => {
								sessions = foundSessions;
							})
							.catch((err) => {
								errorMsg = serializeError(err).message ?? "There was an error, check logs";
								uiLogger.error("Everest fetching OK, but error when fetching from CelesteTracker_DB last sessions", serializeError(err));
							})
							.finally(() => {
								isLoading = false;
							});
					}
				}
			}
		})
		.catch((err) => {
			errorMsg = serializeError(err).message ?? "There was an error, check logs";
			uiLogger.error("Error while fetching everest mod by modId", serializeError(err));
		})
		.finally(() => {
			isLoading = false;
		});
});
</script>

<div class="relative w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl backdrop-blur-md">
	{#if heroImage}
		<div
			class="pointer-events-none absolute inset-0 -z-10 scale-110 bg-cover bg-center opacity-25 blur-md transition-opacity duration-500"
			style:background-image="url('{heroImage}')"
		></div>
		<div class="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-zinc-950/60 via-zinc-900/80 to-zinc-950/90"></div>
	{/if}

	<div class="mb-4 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<img src={timerIcon} alt="Sessions" class="h-5 w-5 object-contain" />
			<h3 class="text-base font-bold text-zinc-100">Recent Play Sessions</h3>
		</div>
		{#if sessions && sessions.length > 0}
			<span class="rounded-full border border-zinc-700/50 bg-zinc-800/80 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
				{sessions.length} {sessions.length === 1 ? "session" : "sessions"}
			</span>
		{/if}
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center gap-2.5 py-10 text-sm text-zinc-400">
			<div class="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent"></div>
			<span>Loading recent sessions...</span>
		</div>
	{:else if errorMsg}
		<div class="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-400">
			<svg class="h-5 w-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>
			<span>{errorMsg}</span>
		</div>
	{:else if !sessions || sessions.length === 0}
		<div class="rounded-xl border border-zinc-800/50 bg-zinc-950/40 py-8 text-center text-sm text-zinc-500">
			No recent play sessions found for this map.
		</div>
	{:else}
		<div class="max-h-[320px] overflow-y-auto overflow-x-auto rounded-xl border border-zinc-800/80 scrollbar-thin scrollbar-thumb-zinc-700">
			<table class="w-full text-left text-sm text-zinc-300">
				<thead class="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 text-xs font-semibold uppercase tracking-wider text-zinc-400 backdrop-blur-sm">
					<tr>
						<th scope="col" class="px-4 py-3 font-semibold">Date & Time</th>
						<th scope="col" class="px-4 py-3 font-semibold">Chapter</th>
						<th scope="col" class="px-4 py-3 font-semibold">Side</th>
						<th scope="col" class="px-4 py-3 font-semibold">Duration</th>
						<th scope="col" class="px-4 py-3 font-semibold text-right">Status</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-zinc-800/50 bg-zinc-900/30">
					{#each sessions as session (session.id)}
						{@const sideName = formatSideName(session.side_id)}
						<tr class="transition-colors hover:bg-zinc-800/40">
							<td class="whitespace-nowrap px-4 py-3 font-medium text-zinc-200">
								{formatSessionDate(session.date_time_start)}
							</td>
							<td class="whitespace-nowrap px-4 py-3 text-zinc-300">
								{formatChapterName(session.chapter_sid)}
							</td>
							<td class="whitespace-nowrap px-4 py-3">
								<span class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium {sideName === 'A-Side' ? 'border-sky-700/50 bg-sky-950/50 text-sky-300' : sideName === 'B-Side' ? 'border-rose-700/50 bg-rose-950/50 text-rose-300' : 'border-amber-700/50 bg-amber-950/50 text-amber-300'}">
									{sideName}
								</span>
							</td>
							<td class="whitespace-nowrap px-4 py-3 font-mono text-xs text-zinc-300">
								{formatPlayTime(session.duration_ms)}
							</td>
							<td class="whitespace-nowrap px-4 py-3 text-right">
								{#if session.is_goldenberry_completed === 1}
									<span class="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300 shadow-sm">
										<img src={goldenBerryIcon} alt="Golden" class="h-3.5 w-3.5 object-contain" />
										Golden Cleared
									</span>
								{:else if session.is_goldenberry_attempt === 1}
									<span class="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-950/40 px-2.5 py-0.5 text-xs font-medium text-amber-400">
										<img src={goldenBerryIcon} alt="Golden" class="h-3.5 w-3.5 object-contain opacity-80" />
										Golden Attempt
									</span>
								{:else}
									<span class="text-xs text-zinc-500">Standard</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
