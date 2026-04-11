<script lang="ts">
    import { LayoutPropsState } from "../lib/state.svelte.js"
    LayoutPropsState.bodyClass = "antialiased selection:bg-[var(--hub-primary)] selection:text-white";
    LayoutPropsState.bodyId = "page-hub";
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

    #page-hub .glass-panel {
        background: var(--hub-glass);
        backdrop-filter: var(--hub-glass-filter);
    }
    
    #page-hub .hero-gradient {
        background: var(--hub-hero-gradient);
    }

    #page-hub .accent-bg {
        background: var(--hub-accent-gradient);
    }

    #page-hub .material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }

    #page-hub .no-scrollbar::-webkit-scrollbar {
        display: none;
    }
</style>

<!-- Header -->
<header class="fixed top-0 left-0 w-full h-16 bg-[var(--hub-bg)]/80 backdrop-blur-md border-b border-[var(--hub-outline)] flex justify-between items-center px-6 md:px-12 z-50">
    <div class="flex items-center gap-8">
        <span class="font-headline font-black text-xl text-[var(--hub-tertiary)] tracking-tight">Celeste Tracker</span>
        <nav class="hidden lg:flex gap-6">
            <a class="text-sm font-medium text-zinc-400 hover:text-[var(--hub-primary)] transition-colors" href="#">Global Stats</a>
            <a class="text-sm font-medium text-zinc-400 hover:text-[var(--hub-primary)] transition-colors" href="#">Resources</a>
        </nav>
    </div>
    <div class="flex items-center gap-4 md:gap-6">
        <div class="flex items-center gap-2">
            <button class="p-2 text-zinc-400 hover:text-white transition-colors">
                <span class="material-symbols-outlined">settings</span>
            </button>
            <button class="p-2 text-zinc-400 hover:text-white transition-colors relative">
                <span class="material-symbols-outlined">notifications</span>
                <span class="absolute top-2.5 right-2.5 w-2 h-2 accent-bg rounded-full border border-zinc-950"></span>
            </button>
        </div>
        <div class="hidden sm:block h-8 w-px bg-[var(--hub-outline)]"></div>
        <button class="hidden sm:block px-4 py-1.5 bg-zinc-900 text-[var(--hub-secondary)] font-bold rounded-lg border border-[var(--hub-secondary)]/20 hover:bg-[var(--hub-secondary)]/10 transition-all text-xs">
            Live Run
        </button>
        <div class="w-8 h-8 rounded-full border border-[var(--hub-primary)]/40 bg-[var(--hub-primary)]/10 flex items-center justify-center text-[var(--hub-primary)] text-[10px] font-bold">KT</div>
    </div>
</header>

<!-- Main Content -->
<main class="pt-16 pb-20">
    <!-- Hero Section -->
    <section class="relative h-[300px] md:h-[350px] w-full overflow-hidden">
        <div class="absolute inset-0 z-0">
            <div class="absolute inset-0 bg-gradient-to-br from-[#ff788c]/10 to-[#67d8d2]/10"></div>
            <div class="absolute inset-0 bg-gradient-to-r from-[#131315] via-[#131315]/80 to-transparent"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-[#131315] via-transparent to-transparent"></div>
        </div>
        <div class="relative z-10 h-full flex flex-col justify-end px-6 md:px-12 pb-12">
            <h1 class="text-4xl md:text-6xl font-headline font-bold text-white tracking-tighter mb-2">
                Celeste <span class="text-[var(--hub-primary)] italic">Tracker</span>
            </h1>
            <p class="text-zinc-400 max-w-2xl text-base md:text-lg leading-relaxed">
                Sculpt your own peaks. Manage your mountain progress, vanilla speedruns, and custom mod collections with surgical precision.
            </p>
        </div>
    </section>

    <!-- Navigation Cards Grid -->
    <section class="px-6 md:px-12 -mt-6 relative z-20">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <!-- Dashboard / Overview -->
            <a class="bg-[var(--hub-card-bg)] border border-[var(--hub-outline)] p-6 rounded-2xl hover:border-[var(--hub-primary)]/50 transition-all group" href="#">
                <span class="material-symbols-outlined text-[var(--hub-primary)] text-3xl mb-4 block group-hover:scale-110 transition-transform">dashboard</span>
                <h3 class="font-headline font-bold text-white text-lg">Dashboard</h3>
                <p class="text-xs text-zinc-500 mt-1">Overall progress &amp; stats</p>
            </a>
            <!-- Vanilla Chapters -->
            <a class="bg-[var(--hub-card-bg)] border border-[var(--hub-outline)] p-6 rounded-2xl hover:border-[var(--hub-secondary)]/50 transition-all group" href="#">
                <span class="material-symbols-outlined text-[var(--hub-secondary)] text-3xl mb-4 block group-hover:scale-110 transition-transform">mountain_flag</span>
                <h3 class="font-headline font-bold text-white text-lg">Vanilla Chapters</h3>
                <p class="text-xs text-zinc-500 mt-1">Classic climb tracking</p>
            </a>
            <!-- Modded Content -->
            <a class="bg-[var(--hub-card-bg)] border border-[var(--hub-outline)] p-6 rounded-2xl hover:border-[var(--hub-tertiary)]/50 transition-all group" href="#">
                <span class="material-symbols-outlined text-[var(--hub-tertiary)] text-3xl mb-4 block group-hover:scale-110 transition-transform">extension</span>
                <h3 class="font-headline font-bold text-white text-lg">Modded Content</h3>
                <p class="text-xs text-zinc-500 mt-1">Everest &amp; custom maps</p>
            </a>
            <!-- CSR Roadmap -->
            <a class="bg-[var(--hub-card-bg)] border border-[var(--hub-outline)] p-6 rounded-2xl hover:border-purple-400/50 transition-all group" href="#">
                <span class="material-symbols-outlined text-purple-400 text-3xl mb-4 block group-hover:scale-110 transition-transform">leaderboard</span>
                <h3 class="font-headline font-bold text-white text-lg">CSR Roadmap</h3>
                <p class="text-xs text-zinc-500 mt-1">Global ranking goals</p>
            </a>
            <!-- Map Collections -->
            <a class="bg-[var(--hub-card-bg)] border border-[var(--hub-outline)] p-6 rounded-2xl hover:border-orange-400/50 transition-all group" href="#">
                <span class="material-symbols-outlined text-orange-400 text-3xl mb-4 block group-hover:scale-110 transition-transform">map</span>
                <h3 class="font-headline font-bold text-white text-lg">Collections</h3>
                <p class="text-xs text-zinc-500 mt-1">Organize your levels</p>
            </a>
            <!-- History -->
            <a class="bg-[var(--hub-card-bg)] border border-[var(--hub-outline)] p-6 rounded-2xl hover:border-blue-400/50 transition-all group" href="#">
                <span class="material-symbols-outlined text-blue-400 text-3xl mb-4 block group-hover:scale-110 transition-transform">history</span>
                <h3 class="font-headline font-bold text-white text-lg">Run History</h3>
                <p class="text-xs text-zinc-500 mt-1">Full archive of ascents</p>
            </a>
        </div>
    </section>

    <!-- Recent Run History Section -->
    <section class="px-6 md:px-12 mt-12">
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg accent-bg flex items-center justify-center">
                    <span class="material-symbols-outlined text-white text-xl">timer</span>
                </div>
                <h2 class="text-2xl font-headline font-bold text-white">Recent Run History</h2>
            </div>
            <button class="text-sm font-medium text-[var(--hub-primary)] hover:underline transition-all">Export Data</button>
        </div>
        <div class="bg-[var(--hub-card-bg)] border border-[var(--hub-outline)] rounded-2xl overflow-hidden overflow-x-auto no-scrollbar">
            <table class="w-full text-left border-collapse min-w-[600px]">
                <thead>
                    <tr class="border-b border-[var(--hub-outline)] bg-zinc-900/50">
                        <th class="px-6 py-4 text-xs uppercase tracking-widest text-zinc-500 font-bold">Level Name</th>
                        <th class="px-6 py-4 text-xs uppercase tracking-widest text-zinc-500 font-bold">Type</th>
                        <th class="px-6 py-4 text-xs uppercase tracking-widest text-zinc-500 font-bold">Clear Time</th>
                        <th class="px-6 py-4 text-xs uppercase tracking-widest text-zinc-500 font-bold">Deaths</th>
                        <th class="px-6 py-4 text-xs uppercase tracking-widest text-zinc-500 font-bold text-right">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-[var(--hub-outline)]/50">
                    <tr class="hover:bg-white/5 transition-colors group">
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded bg-[var(--hub-primary)]/10 flex items-center justify-center text-[var(--hub-primary)]">
                                    <span class="material-symbols-outlined text-lg">filter_hdr</span>
                                </div>
                                <span class="font-bold text-zinc-200">Forsaken City (A-Side)</span>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <span class="px-2 py-1 rounded text-[10px] font-bold bg-[var(--hub-secondary)]/10 text-[var(--hub-secondary)] uppercase tracking-tighter">Vanilla</span>
                        </td>
                        <td class="px-6 py-4 font-mono text-zinc-400">00:01:24.452</td>
                        <td class="px-6 py-4 text-zinc-400">0</td>
                        <td class="px-6 py-4 text-right">
                            <span class="text-green-400 font-bold text-sm">PB</span>
                        </td>
                    </tr>
                    <tr class="hover:bg-white/5 transition-colors group">
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded bg-[var(--hub-tertiary)]/10 flex items-center justify-center text-[var(--hub-tertiary)]">
                                    <span class="material-symbols-outlined text-lg">auto_awesome</span>
                                </div>
                                <span class="font-bold text-zinc-200">Strawberry Jam - Beginner Heart</span>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <span class="px-2 py-1 rounded text-[10px] font-bold bg-[var(--hub-primary)]/10 text-[var(--hub-primary)] uppercase tracking-tighter">Modded</span>
                        </td>
                        <td class="px-6 py-4 font-mono text-zinc-400">00:15:42.110</td>
                        <td class="px-6 py-4 text-zinc-400">12</td>
                        <td class="px-6 py-4 text-right">
                            <span class="text-zinc-500 text-sm">Cleared</span>
                        </td>
                    </tr>
                    <tr class="hover:bg-white/5 transition-colors group">
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded bg-purple-400/10 flex items-center justify-center text-purple-400">
                                    <span class="material-symbols-outlined text-lg">diamond</span>
                                </div>
                                <span class="font-bold text-zinc-200">Mirror Temple (B-Side)</span>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <span class="px-2 py-1 rounded text-[10px] font-bold bg-[var(--hub-secondary)]/10 text-[var(--hub-secondary)] uppercase tracking-tighter">Vanilla</span>
                        </td>
                        <td class="px-6 py-4 font-mono text-zinc-400">00:08:12.880</td>
                        <td class="px-6 py-4 text-zinc-400">4</td>
                        <td class="px-6 py-4 text-right">
                            <span class="text-zinc-500 text-sm">Cleared</span>
                        </td>
                    </tr>
                    <tr class="hover:bg-white/5 transition-colors group">
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded bg-orange-400/10 flex items-center justify-center text-orange-400">
                                    <span class="material-symbols-outlined text-lg">landscape</span>
                                </div>
                                <span class="font-bold text-zinc-200">Summit - Chapter 7</span>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <span class="px-2 py-1 rounded text-[10px] font-bold bg-[var(--hub-secondary)]/10 text-[var(--hub-secondary)] uppercase tracking-tighter">Vanilla</span>
                        </td>
                        <td class="px-6 py-4 font-mono text-zinc-400">00:32:05.112</td>
                        <td class="px-6 py-4 text-zinc-400">84</td>
                        <td class="px-6 py-4 text-right">
                            <span class="text-zinc-500 text-sm">Cleared</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>
</main>

<!-- Footer -->
<footer class="fixed bottom-0 left-0 w-full h-10 bg-zinc-950 border-t border-[var(--hub-outline)] flex items-center justify-between px-6 z-50">
    <div class="flex items-center gap-4 text-[11px] font-medium text-zinc-500">
        <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-[var(--hub-secondary)]"></span>
            <span class="hidden sm:inline">Everest Core: v1.3452.0-stable</span>
            <span class="sm:hidden">Everest Core</span>
        </div>
        <div class="h-3 w-px bg-[var(--hub-outline)]"></div>
        <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-xs">terminal</span>
            <span>System Ready</span>
        </div>
    </div>
    <div class="flex items-center gap-4 md:gap-6 text-[11px] font-medium text-zinc-500">
        <span class="hover:text-[var(--hub-primary)] cursor-pointer transition-colors hidden md:inline">GitHub Repository</span>
        <span class="hover:text-[var(--hub-primary)] cursor-pointer transition-colors hidden md:inline">API Documentation</span>
        <div class="bg-zinc-900 px-2 py-0.5 rounded flex items-center gap-2">
            <span class="material-symbols-outlined text-[10px]">wifi</span>
            <span class="hidden xs:inline">Synchronized</span>
        </div>
    </div>
</footer>
