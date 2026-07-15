import Dev from './pages/Dev.svelte';
import GlobalWindow from './pages/Main.svelte';
import { router } from './router.svelte';

router.register([
  { pattern: '/', component: GlobalWindow },
  { pattern: '/dev', component: Dev },
  // { pattern: '/user', component: UserProfile },
  // { pattern: '/user/:id', component: UserProfile },
]);
