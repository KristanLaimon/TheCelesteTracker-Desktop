<script lang="ts">
    import type { Component } from "svelte";

    // == Components ==
    import Snow from "$lib/components/global/Snow.svelte";

    // == Icons ==
    import Dashboard from "~icons/material-symbols/dashboard";
    import MountainFlag from "~icons/material-symbols/mountain-flag";
    import Extension from "~icons/material-symbols/extension";
    import Leaderboard from "~icons/material-symbols/leaderboard";
    import Map from "~icons/material-symbols/map";
    import History from "~icons/material-symbols/history";
    import Timer from "~icons/material-symbols/timer";
</script>

<Snow />

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
        {@render navCard({
            icon: Dashboard,
            title: "Dashboard",
            description: "Overall progress & stats",
            disabled: true
        })}
        {@render navCard({
            icon: MountainFlag,
            title: "Vanilla Chapters",
            description: "Classic climb tracking",
            disabled: true
        })}
        {@render navCard({
            icon: Extension,
            title: "Modded Content",
            description: "Everest & custom maps",
            disabled: true
        })}
        {@render navCard({
            icon: Leaderboard,
            title: "CSR Roadmap",
            description: "Global ranking goals",
            disabled: true
        })}
        {@render navCard({
            href: "/collections",
            icon: Map,
            title: "Collections",
            description: "Organize your levels",
            hoverColor: "orange"
        })}
        {@render navCard({
            icon: History,
            title: "Run History",
            description: "Full archive of ascents",
            hoverColor: "blue"
        })}
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
                    {@render th("Level Name")}
                    {@render th("Type")}
                    {@render th("Clear Time")}
                    {@render th("Deaths")}
                    {@render th("Status", true)}
                </tr>
            </thead>
            <tbody class="divide-y divide-(--hub-outline)/50">
                <!-- {#each syncStore.recentRuns as run} -->
                    <!-- <RecentRunRow {run} /> -->
                <!-- {/each} -->
                <!-- {#if syncStore.recentRuns.length === 0} -->
                <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-zinc-500 italic">No runs recorded yet.</td>
                </tr>
                <!-- {/if} -->
            </tbody>
        </table>
    </div>
</section>

{#snippet navCard({ href = "/", icon: Icon, title, description, disabled = false, hoverColor = "gray" }: { 
    href?: string; 
    icon: Component; 
    title: string; 
    description: string; 
    disabled?: boolean;
    hoverColor?: string;
})}
    {@const hoverClasses = {
        orange: "hover:border-orange-400/50",
        blue: "hover:border-blue-400/50",
        gray: "hover:border-white/20"
    }[hoverColor] || "hover:border-white/20"}
    
    <a 
        class="bg-hub-card-bg border border-hub-outline p-6 rounded-2xl transition-all group {disabled ? 'opacity-40 cursor-auto' : 'hover:scale-[1.02] cursor-pointer ' + hoverClasses}" 
        href={disabled ? undefined : href}
    >
        <Icon class="text-3xl mb-4 block group-hover:scale-110 transition-transform" />
        <h3 class="font-headline font-bold text-white text-lg">{title}</h3>
        <p class="text-xs text-zinc-500 mt-1">{description}</p>
    </a>
{/snippet}

{#snippet th(label: string, alignRight = false)}
    <th class="px-6 py-4 text-xs uppercase tracking-widest text-zinc-500 font-bold {alignRight ? 'text-right' : ''}">
        {label}
    </th>
{/snippet}