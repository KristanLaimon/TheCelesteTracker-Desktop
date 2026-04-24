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

    onMount(async () => {
        try {
            stats = await invoke("get_general_info", { userId: 1, slotNumber: 1 });
        } catch (e) {
            error = String(e);
            console.error("Failed to fetch general info:", e);
        }
    });

    function formatTime(ms: number) {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }
</script>

<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-4 mb-8">
    {#if stats}
        <!-- Campaigns -->
        <div class="bg-card-bg/40 border border-outline-muted p-4 rounded-xl flex items-center gap-4">
            <img src={iconFlag.src} alt="Campaigns" class="w-8 h-8 object-contain opacity-80" />
            <div>
                <p class="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-0.5">Campaigns</p>
                <p class="text-xl font-headline font-bold text-white">{stats.totalCampaigns}</p>
            </div>
        </div>

        <!-- Chapters -->
        <div class="bg-card-bg/40 border border-outline-muted p-4 rounded-xl flex items-center gap-4">
            <img src={iconCassette.src} alt="Chapters" class="w-8 h-8 object-contain opacity-80" />
            <div>
                <p class="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-0.5">Chapters</p>
                <p class="text-xl font-headline font-bold text-blue-400">{stats.totalChapters}</p>
            </div>
        </div>

        <!-- Rooms -->
        <div class="bg-card-bg/40 border border-outline-muted p-4 rounded-xl flex items-center gap-4">
            <img src={iconBird.src} alt="Rooms" class="w-8 h-8 object-contain opacity-80" />
            <div>
                <p class="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-0.5">Rooms</p>
                <p class="text-xl font-headline font-bold text-green-400">{stats.totalRooms}</p>
            </div>
        </div>

        <!-- Playtime -->
        <div class="bg-card-bg/40 border border-outline-muted p-4 rounded-xl flex items-center gap-4">
            <img src={iconTimer.src} alt="Time" class="w-8 h-8 object-contain opacity-80" />
            <div>
                <p class="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-0.5">Playtime</p>
                <p class="text-xl font-headline font-bold text-white">{formatTime(stats.totalPlaytime)}</p>
            </div>
        </div>

        <!-- Deaths -->
        <div class="bg-card-bg/40 border border-outline-muted p-4 rounded-xl flex items-center gap-4">
            <img src={iconDeaths.src} alt="Deaths" class="w-8 h-8 object-contain opacity-80" />
            <div>
                <p class="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-0.5">Deaths</p>
                <p class="text-xl font-headline font-bold text-primary">{stats.totalDeaths.toLocaleString()}</p>
            </div>
        </div>

        <!-- Dashes -->
        <div class="bg-card-bg/40 border border-outline-muted p-4 rounded-xl flex items-center gap-4">
            <div class="w-8 h-8 flex items-center justify-center">
                <span class="text-secondary text-2xl">⚡</span>
            </div>
            <div>
                <p class="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-0.5">Dashes</p>
                <p class="text-xl font-headline font-bold text-secondary">{stats.totalDashes.toLocaleString()}</p>
            </div>
        </div>

        <!-- Strawberries -->
        <div class="bg-card-bg/40 border border-outline-muted p-4 rounded-xl flex items-center gap-4">
            <img src={iconStrawberry.src} alt="Berries" class="w-8 h-8 object-contain opacity-80" />
            <div>
                <p class="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-0.5">Berries</p>
                <p class="text-xl font-headline font-bold text-tertiary">{stats.totalStrawberries}</p>
            </div>
        </div>

        <!-- Hearts -->
        <div class="bg-card-bg/40 border border-outline-muted p-4 rounded-xl flex items-center gap-4">
            <img src={iconHeart.src} alt="Hearts" class="w-8 h-8 object-contain opacity-80" />
            <div>
                <p class="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-0.5">Hearts</p>
                <p class="text-xl font-headline font-bold text-purple-400">{stats.totalHearts}</p>
            </div>
        </div>

        <!-- Goldens -->
        <div class="bg-card-bg/40 border border-outline-muted p-4 rounded-xl flex items-center gap-4">
            <img src={iconStrawberry.src} alt="Goldens" class="w-8 h-8 object-contain brightness-[1.5] sepia-[1] saturate-[10] hue-rotate-[10deg]" />
            <div>
                <p class="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-0.5">Goldens</p>
                <p class="text-xl font-headline font-bold text-orange-400">{stats.totalGoldenStrawberries}</p>
            </div>
        </div>
    {:else if error}
        <div class="col-span-full bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-sm">
            Failed to load stats: {error}
        </div>
    {:else}
        {#each Array(9) as _}
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
