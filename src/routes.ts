import Home from './pages/Home.svelte';
import UserProfile from './pages/UserProfile.svelte';
import { router } from "./router.svelte";

router.register([
  { pattern: '/', component: Home },
  { pattern: '/user', component: UserProfile },
  { pattern: '/user/:id', component: UserProfile }
]);