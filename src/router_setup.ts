import Database from './pages/Database.svelte';
import Dev from './pages/Dev.svelte';
import GlobalWindow from './pages/Main.svelte';
import Test from './pages/Test.svelte';
import { router } from './router.svelte';

router.register([
	{ pattern: '/', component: GlobalWindow },
	{ pattern: '/dev', component: Dev },
	{ pattern: '/test', component: Test },
	{ pattern: '/database', component: Database },
	// { pattern: '/user', component: UserProfile },
	// { pattern: '/user/:id', component: UserProfile },
]);
