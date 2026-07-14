<script lang="ts">
  import './global.css';
  import { router } from './router.svelte';
  import "./routes";
</script>

<nav style="display: flex; gap: 15px; padding: 15px; background: #1e1e2e; border-radius: 8px; margin-bottom: 20px;">
  <a href="/" use:router.link style="color: #cdd6f4; text-decoration: none;">Home</a>
  <a href="/user?query=books&category=fiction" use:router.link style="color: #cdd6f4; text-decoration: none;">Books Search</a>
  <a href="/user/123?tab=activity" use:router.link style="color: #cdd6f4; text-decoration: none;">User 123</a>
  <a href="/user/456#profile-section" use:router.link style="color: #cdd6f4; text-decoration: none;">User 456</a>
  <a href="/non-existent" use:router.link style="color: #cdd6f4; text-decoration: none;">404 Page</a>
</nav>

<div style="background: #181825; padding: 20px; border-radius: 8px; min-height: 200px; border: 1px solid #313244;">
  {#if router.page.component}
    <svelte:component this={router.page.component} />
  {:else}
    <h2>404 Not Found</h2>
    <p>The page <code>{router.page.path}</code> could not be found.</p>
  {/if}
</div>
