// UNIVERSAL COMPATIBILITY

import GlobalWindow from "./pages/Main.svelte";
import ModView from "./pages/panes/ModView/ModView.svelte";
import { router } from "./router.svelte";

router.register([
	{ pattern: "/", component: GlobalWindow },
	{ pattern: "/celeste/installed-mods", component: ModView },
	{ pattern: "/celeste/mod-view", component: ModView },
	{ pattern: "/test", component: ModView },
]);
