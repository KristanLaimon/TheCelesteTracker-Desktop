<script lang="ts">
import { onMount } from "svelte";
// import goldenBerryIcon from "../../../assets/interface_goldenstrawberry_icon.png";
// import deathsIcon from "../../../assets/interface_SIDEA_deaths_icon.png";
// import strawberryIcon from "../../../assets/interface_strawberry_icon.png";
// import timerIcon from "../../../assets/interface_timer_icon.png";
// import { formatPlayTime } from "../../../utils/Time";
import CTDB from "../../../db";
import { DB_Mods, GetDependency } from "../../../setup";

type Props = {
	modStringId: string;
};

let { modStringId = $bindable("") }: Props = $props();
const modStringIdSanitized = $derived(modStringId.trim());
/**
 * Mod Map Ids
 * Scrappgin
 */

const LocalMods_DB = DB_Mods;
const CelesteTracker_DB = GetDependency(CTDB);
const CelesteTrackerIsAvailable = CelesteTracker_DB.isDatabaseAvailable();

let isLoading = $state<boolean>(true);

onMount(() => {});
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
