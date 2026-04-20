<script lang="ts">
    import Snow from "$lib/components/main/Snow.svelte";
    import Dashboard from "~icons/material-symbols/dashboard";
    import MountainFlag from "~icons/material-symbols/mountain-flag";
    import Extension from "~icons/material-symbols/extension";
    import Leaderboard from "~icons/material-symbols/leaderboard";
    import Map from "~icons/material-symbols/map";
    import History from "~icons/material-symbols/history";
    import Timer from "~icons/material-symbols/timer";
    import FilterHdr from "~icons/material-symbols/filter-hdr";
    import { syncStore } from "$lib/logic/sync_store.svelte";
    import RecentRunRow from "$lib/components/RecentRunRow.svelte";
    import NavigationCard from "$lib/components/NavigationCard.svelte";
</script>

<style>
    :root {
        --hub-primary: #ff788c;
        --hub-primary-container: #520017;
        --hub-secondary: #67d8d2;
        --hub-tertiary: #ffc971;
        --hub-bg: #131315;
        --hub-surface: #18181b;
        --hub-surface-high: #27272a;
        --hub-outline: rgba(255, 255, 255, 0.08);
        --hub-glass: rgba(24, 24, 27, 0.85);
        --hub-hero-gradient: linear-gradient(to right, #131315 20%, transparent 100%);
        --hub-card-bg: rgba(39, 39, 42, 0.4);
        --hub-accent-gradient: linear-gradient(135deg, var(--hub-primary), #ff4d6d);
        --hub-glass-filter: blur(16px);
        
        /* Fonts */
        --hub-font-headline: "Space Grotesk", sans-serif;
        --hub-font-body: "Manrope", sans-serif;
    }

    .font-headline {
        font-family: var(--hub-font-headline);
    }
</style>

<Snow />

<!-- Main Content -->
<main>
    <!-- Hero Section -->
    <section class="relative w-full h-auto">
        <div class="relative w-full z-0">
            <enhanced:img src="$lib/assets/banner_flag.png" alt="Banner" class="w-auto h-80 block opacity-60 ml-auto" />
            <div class="absolute inset-0 bg-linear-to-br from-[#ff788c]/20 to-[#67d8d2]/20 mix-blend-overlay"></div>
            <div class="absolute inset-0 bg-linear-to-r from-[#131315] via-[#131315]/80 to-transparent"></div>
            <div class="absolute inset-0 bg-linear-to-t from-[#131315] via-transparent to-transparent"></div>
        </div>
        <div class="absolute inset-0 z-10 flex flex-col justify-end px-6 md:px-12 pb-12 md:pb-24">
            <h1 class="text-4xl md:text-5xl lg:text-6xl font-headline font-bold text-white tracking-tighter mb-4">
                Celeste <span class="text-hub-primary italic">Tracker</span>
            </h1>
            <p class="text-zinc-400 max-w-3xl text-base md:text-xl leading-relaxed">
                Sculpt your own peaks. Manage your mountain progress, vanilla speedruns, and custom mod collections with surgical precision.
            </p>
        </div>
    </section>

    <!-- Navigation Cards Grid -->
    <section class="px-6 md:px-12 -mt-6 relative z-20">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <NavigationCard 
                icon={Dashboard} 
                title="Dashboard" 
                description="Overall progress & stats" 
                disabled 
            />
            <NavigationCard 
                icon={MountainFlag} 
                title="Vanilla Chapters" 
                description="Classic climb tracking" 
                disabled 
            />
            <NavigationCard 
                icon={Extension} 
                title="Modded Content" 
                description="Everest & custom maps" 
                disabled 
            />
            <NavigationCard 
                icon={Leaderboard} 
                title="CSR Roadmap" 
                description="Global ranking goals" 
                disabled 
            />
            <NavigationCard 
                href="/collections"
                icon={Map} 
                title="Collections" 
                description="Organize your levels" 
                hoverColor="orange"
            />
            <NavigationCard 
                icon={History} 
                title="Run History" 
                description="Full archive of ascents" 
                hoverColor="blue"
            />
        </div>
    </section>

    <!-- Recent Run History Section -->
    <section class="px-6 md:px-12 mt-12">
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg accent-bg flex items-center justify-center">
                    <Timer class="text-white text-xl" />
                </div>
                <h2 class="text-2xl font-headline font-bold text-white">Recent Run History</h2>
            </div>
            <button class="text-sm font-medium text-hub-primary hover:underline transition-all">Export Data</button>
        </div>
        <div class="bg-hub-card-bg border border-hub-outline rounded-2xl overflow-hidden overflow-x-auto no-scrollbar">
            <table class="w-full text-left border-collapse min-w-[600px]">
                <thead>
                    <tr class="border-b border-hub-outline bg-zinc-900/50">
                        <th class="px-6 py-4 text-xs uppercase tracking-widest text-zinc-500 font-bold">Level Name</th>
                        <th class="px-6 py-4 text-xs uppercase tracking-widest text-zinc-500 font-bold">Type</th>
                        <th class="px-6 py-4 text-xs uppercase tracking-widest text-zinc-500 font-bold">Clear Time</th>
                        <th class="px-6 py-4 text-xs uppercase tracking-widest text-zinc-500 font-bold">Deaths</th>
                        <th class="px-6 py-4 text-xs uppercase tracking-widest text-zinc-500 font-bold text-right">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-(--hub-outline)/50">
                    {#each syncStore.recentRuns as run}
                        <RecentRunRow {run} />
                    {/each}
                    {#if syncStore.recentRuns.length === 0}
                        <tr>
                            <td colspan="5" class="px-6 py-8 text-center text-zinc-500 italic">No runs recorded yet.</td>
                        </tr>
                    {/if}
                </tbody>
            </table>
        </div>
    </section>
</main>
