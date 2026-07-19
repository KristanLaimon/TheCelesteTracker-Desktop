import InstalledMods from './pages/InstalledMods.svelte';
import GlobalWindow from './pages/Main.svelte';
import { router } from './router.svelte';

router.register([
	{ pattern: '/', component: GlobalWindow },
	{ pattern: '/celeste/installed-mods', component: InstalledMods },
]);
