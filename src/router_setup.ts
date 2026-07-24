// UNIVERSAL COMPATIBILITY

import ModView from "./pages/available/ModView.svelte";
import InstalledMods from "./pages/InstalledMods.svelte";
import GlobalWindow from "./pages/Main.svelte";
import { router } from "./router.svelte";

router.register([
	{ pattern: "/", component: GlobalWindow },
	{ pattern: "/celeste/installed-mods", component: InstalledMods },
	{ pattern: "/celeste/mod-view", component: ModView },
	{ pattern: "/test", component: ModView },
]);
