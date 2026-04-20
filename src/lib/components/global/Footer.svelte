<script lang="ts">
  import Terminal from "~icons/material-symbols/terminal";
  import Wifi from "~icons/material-symbols/wifi";

  let { height = '2.5rem' } = $props();

  const celesteState = {
    isConnected: false,
    everestVersion: "not-connected",
    modVersion:"0"
  }
</script>

<!-- Footer -->
<footer
  class="fixed bottom-0 left-0 w-full bg-zinc-950 border-t border-hub-outline flex items-center justify-between px-6 z-50"
  style="height: {height}"
>
    <div class="flex items-center gap-4 text-[11px] font-medium text-zinc-500">
        <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full {celesteState.isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]'}"></span>
            {#if celesteState.isConnected}
                <span class="hidden sm:inline">Everest: {celesteState.everestVersion} | Mod: {celesteState.modVersion}</span>
                <span class="sm:hidden">Everest Connected</span>
            {:else}
                <span class="hidden sm:inline">Waiting for Celeste Client...</span>
                <span class="sm:hidden">Disconnected</span>
            {/if}
        </div>
        <div class="h-3 w-px bg-hub-outline"></div>
        <div class="flex items-center gap-2">
            <Terminal class="w-3.5 h-3.5" />
            <span>{celesteState.isConnected ? 'Client Linked' : 'System Ready'}</span>
        </div>
    </div>
    <div class="flex items-center gap-4 md:gap-6 text-[11px] font-medium text-zinc-500">
        <span class="hover:text-hub-primary cursor-pointer transition-colors hidden md:inline">GitHub Repository</span>
        <span class="hover:text-hub-primary cursor-pointer transition-colors hidden md:inline">API Documentation</span>
        <div class="bg-zinc-900 px-2 py-0.5 rounded flex items-center gap-2">
            <Wifi class="w-3.5 h-3.5 {celesteState.isConnected ? 'text-green-500' : 'text-zinc-500'}" />
            <span class="hidden xs:inline">{celesteState.isConnected ? 'Synchronized' : 'Offline'}</span>
        </div>
    </div>
</footer>

