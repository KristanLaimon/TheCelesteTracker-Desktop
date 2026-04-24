<script lang="ts">
    import { invoke } from "@tauri-apps/api/core";
    import { onMount } from "svelte";
    
    // Asset imports
    import iconDeaths from "../../assets/interface_SIDEA_deaths_icon.png";
    import iconStrawberry from "../../assets/interface_strawberry_icon.png";
    import iconHeart from "../../assets/interface_SIDEA_heart.png";
    import iconTimer from "../../assets/interface_timer_icon.png";
    import iconFlag from "../../assets/interface_level_cleared_flag.png";
    import iconCassette from "../../assets/interface_cassete.png";
    import iconBird from "../../assets/interface_bird.png";
    import iconGolden from "../../assets/interface_goldenstrawberry_icon.png";

    import { saveStore } from "/src/lib/saveStore.svelte.ts";

    interface GeneralInfo {
        totalCampaigns: number;
        totalChapters: number;
        totalRooms: number;
        totalPlaytime: number;
        totalDeaths: number;
        totalDashes: number;
        totalStrawberries: number;
        totalHearts: number;
        totalGoldenStrawberries: number;
    }

    let stats: GeneralInfo | null = $state(null);
    let error: string | null = $state(null);
    let activePopover: string | null = $state(null);

    $effect(() => {
        const fetchStats = async () => {
            try {
                stats = null; // Trigger skeleton
                stats = await invoke("get_general_info", { userId: saveStore.userId, slotNumber: saveStore.selectedSlot });
                error = null;
            } catch (e) {
                error = String(e);
                console.error("Failed to fetch general info:", e);
            }
        };
        fetchStats();
    });

    function formatTime(ms: number) {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }

    const statDefinitions = [
        { key: 'totalCampaigns', label: 'Campaigns', icon: iconFlag, color: 'text-white', info: 'Total number of campaigns (vanilla + mods) you have progress in.' },
        { key: 'totalChapters', label: 'Chapters', icon: iconCassette, color: 'text-blue-400', info: 'Unique chapters or maps entered across all campaigns.' },
        { key: 'totalRooms', label: 'Rooms', icon: iconBird, color: 'text-green-400', info: 'Total count of unique rooms visited across all chapters.' },
        { key: 'totalPlaytime', label: 'Playtime', icon: iconTimer, color: 'text-white', info: 'Cumulative time spent in-game on this save slot.', format: formatTime },
        { key: 'totalDeaths', label: 'Deaths', icon: iconDeaths, color: 'text-primary', info: 'Total number of deaths recorded on this save slot.', format: (v: number) => v.toLocaleString() },
        { key: 'totalDashes', label: 'Dashes', icon: '⚡', color: 'text-secondary', info: 'Total number of dashes performed across all chapters.', format: (v: number) => v.toLocaleString() },
        { key: 'totalStrawberries', label: 'Berries', icon: iconStrawberry, color: 'text-tertiary', info: 'Total number of regular strawberries collected.' },
        { key: 'totalHearts', label: 'Hearts', icon: iconHeart, color: 'text-purple-400', info: 'Total number of Crystal Hearts (A, B, and C sides) collected.' },
        { key: 'totalGoldenStrawberries', label: 'Goldens', icon: iconGolden, color: 'text-orange-400', info: 'Total number of Golden Strawberries collected (deathless clears).' },
    ];

    function togglePopover(key: string, event: MouseEvent) {
        event.stopPropagation();
        activePopover = activePopover === key ? null : key;
    }

    function closePopover() {
        activePopover = null;
    }
</script>

<svelte:window onclick={closePopover} />

<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-4 mb-8">
    {#if stats}
        {#each statDefinitions as def (def.key)}
            <div class="bg-card-bg/40 border border-outline-muted p-4 rounded-xl flex items-center gap-4 relative group">
                {#if typeof def.icon === 'string'}
                    <div class="w-8 h-8 flex items-center justify-center">
                        <span class="{def.color} text-2xl">{def.icon}</span>
                    </div>
                {:else}
                    <img src={def.icon.src} alt={def.label} class="w-8 h-8 object-contain opacity-80" />
                {/if}
                <div class="flex-1">
                    <p class="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-0.5">{def.label}</p>
                    <p class="text-xl font-headline font-bold {def.color}">
                        {def.format ? def.format(stats[def.key as keyof GeneralInfo]) : stats[def.key as keyof GeneralInfo]}
                    </p>
                </div>

                <button 
                    type="button"
                    class="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full text-xs text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-all cursor-help"
                    onclick={(e) => togglePopover(def.key, e)}
                    aria-label="Show info for {def.label}"
                >
                    ?
                </button>

                {#if activePopover === def.key}
                    <div 
                        role="dialog"
                        aria-modal="false"
                        aria-label="{def.label} description"
                        class="absolute bottom-full left-0 mb-2 w-48 p-3 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50 text-[11px] leading-relaxed text-zinc-300"
                        onclick={(e) => e.stopPropagation()}
                        onkeydown={(e) => e.key === 'Escape' && closePopover()}
                    >
                        <div class="font-bold text-white mb-1 uppercase tracking-tighter text-[10px]">{def.label}</div>
                        {def.info}
                        <div class="absolute -bottom-1 left-4 w-2 h-2 bg-zinc-900 border-r border-b border-zinc-700 rotate-45"></div>
                    </div>
                {/if}
            </div>
        {/each}
    {:else if error}
        <div class="col-span-full bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-sm">
            Failed to load stats: {error}
        </div>
    {:else}
        {#each Array(9) as _, i (i)}
            <div class="bg-card-bg/40 border border-outline-muted p-4 rounded-xl animate-pulse flex items-center gap-4">
                <div class="w-8 h-8 bg-zinc-800 rounded-full"></div>
                <div>
                    <div class="h-2 w-10 bg-zinc-800 rounded mb-2"></div>
                    <div class="h-6 w-16 bg-zinc-800 rounded"></div>
                </div>
            </div>
        {/each}
    {/if}
</div>
