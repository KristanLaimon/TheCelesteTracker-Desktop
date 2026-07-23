<script lang="ts">
// import Neutralino from '@neutralinojs/lib';
import "reflect-metadata";
import { router } from "./router.svelte";
import "./router_setup";
import "./libs/Hotkeys";
import CommandCenter, { type CommandCenterCommand } from "./components/CommandCenter.svelte";
import { Hotkeys_RegisterHotkey } from "./libs/Hotkeys";

let SHOW_COMMAND_CENTER = $state<boolean>(false);
Hotkeys_RegisterHotkey("ctrl+shift+z", "global", () => {
	SHOW_COMMAND_CENTER = true;
});
const commands: CommandCenterCommand[] = [
	{
		id: "go-to-celestemodslist",
		title: "Installed mods",
		description: "Get an overview about all your current installed mods",
		category: "Celeste",
		action: () => {
			router.navigate("/celeste/installed-mods");
			SHOW_COMMAND_CENTER = false;
		},
	},
];
</script>

{#if router.page.component}
  {#key router.url.pathname + router.url.search}
    <router.page.component />
    {#if SHOW_COMMAND_CENTER}
      <CommandCenter onClose={() => SHOW_COMMAND_CENTER = false} commands={commands}/>
    {/if}
  {/key}
{:else}
  <h2>404 Not Found</h2>
  <p>The page <code>{router.page.path}</code> could not be found.</p>
{/if}
