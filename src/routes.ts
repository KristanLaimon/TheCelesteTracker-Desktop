import GlobalWindow from './pages/Main.svelte';
import { router } from './router.svelte';

router.register([
  { pattern: '/', component: GlobalWindow },
  // { pattern: '/user', component: UserProfile },
  // { pattern: '/user/:id', component: UserProfile },
]);
