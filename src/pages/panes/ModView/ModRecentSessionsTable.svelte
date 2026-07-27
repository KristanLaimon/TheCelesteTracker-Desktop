<script lang="ts">
// import goldenBerryIcon from "../../../assets/interface_goldenstrawberry_icon.png";
// import deathsIcon from "../../../assets/interface_SIDEA_deaths_icon.png";
// import strawberryIcon from "../../../assets/interface_strawberry_icon.png";
// import timerIcon from "../../../assets/interface_timer_icon.png";
// import { formatPlayTime } from "../../../utils/Time";
import CTDB from "../../../db";
import { DB_Mods, GetDependency } from "../../../setup";
import type { EverestModInfo } from "../../../domain/Everest";
	import { serializeError } from "serialize-error";
	import { logger } from "../../../utils/Logger";
	import { LogLevel } from "tslog";

type Props = {
	modStringId: string;
};

const log =  logger.getSubLogger({name:"ModsRecentSessionsTable", minLevel: LogLevel.TRACE});

let { modStringId = $bindable("") }: Props = $props();

const LocalMods_DB = DB_Mods;
const CelesteTracker_DB = GetDependency(CTDB);
let modEverestInfo = $state<EverestModInfo | null>(null);

let isLoading = $state<boolean>(true);
let errorMsg = $state<string | null>(null);
let sessions: Awaited<ReturnType<typeof CelesteTracker_DB.GameSessions.GetLastSessionsFromStandaloneModMap>> = $state(null);
	
//Initial loding
$effect(() => {
	LocalMods_DB.EverestMods_Get_ModByModId(modStringId)
		.then((found) => {
			if (found) {
				modEverestInfo = found;
				console.log("MAP FULL INFO:", found);
				if (found.metadata.isMapMod){
					if (found.metadata.isLobby){
						//do nothing, not currently supported (more logic)
					} else {
						CelesteTracker_DB.GameSessions.GetLastSessionsFromStandaloneModMap(found)
							.then((foundSessions) => {
								sessions = foundSessions
							})
					}
				}
			}
		})
		.catch(err => {
			errorMsg = serializeError(err).message ?? "There was an error, check logs"
			log.error(serializeError(err))
		})
		.finally(()=> {
			isLoading = false;
		})
});
// $effect(() => {
// 	const currentModId = modStringId;
// 	if (!currentModId || currentModId.trim() === "") {
// 		isLoading = false;
// 		return;
// 	}

// 	isLoading = true;
// });
</script>

<h1>Hola</h1>
