<script>
</script>

<main
  class="bg-(--mapcollections-bg) text-(--mapcollections-text) font-['Manrope'] antialiased selection:bg-(--mapcollections-primary) selection:text-white"
  id="page-mapcollections"
>
  <!-- Main Content Area -->
  <div class="transition-all duration-300">
    <main class="p-8 md:p-12 max-w-7xl mx-auto">
      <!-- Hero Header -->
      <div
        class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 items-center "
      >
        <div>
          <h2
            class="text-5xl font-['Space_Grotesk'] font-bold tracking-tighter mb-2"
            style=""
          >
            Map Collections
          </h2>
          <p
            class="text-(--mapcollections-text-muted) font-medium"
            style=""
          >
            Manage your personal tiers and community gauntlets.
          </p>
        </div>
        <div class="relative group flex-1 max-w-sm ml-auto">
          <span
            class="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 material-symbols-outlined text-sm"
            >search</span
          >
          <input
            class="w-full bg-zinc-900 border border-(--mapcollections-border) rounded-xl pl-12 pr-4 py-3 text-sm text-(--mapcollections-text) placeholder-zinc-500 focus:ring-1 focus:ring-(--mapcollections-secondary)/50 focus:border-(--mapcollections-secondary)/50 transition-all outline-none"
            placeholder="Search collections..."
            type="text"
          />
        </div>
        <button
          class="flex items-center gap-2 bg-zinc-900 text-(--mapcollections-secondary) px-6 py-3 rounded-xl border border-(--mapcollections-secondary)/20 hover:bg-(--mapcollections-secondary)/10 hover:border-(--mapcollections-secondary)/50 transition-all font-['Space_Grotesk'] font-bold text-sm"
          style=""
        >
          <span class="material-symbols-outlined" style="">add</span>
          Add collection</button
        >
      </div>
      <!-- Card Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Map Card 1 -->
        <a href="/collections/campaign"
          class="group relative bg-(--mapcollections-surface) border border-(--mapcollections-border) rounded-2xl overflow-hidden hover:border-(--mapcollections-primary)/50 transition-all duration-500 hover:shadow-[0_0_20px_-5px_var(--mapcollections-glow)]"
        >
          <div class="h-48 relative overflow-hidden">
            <img
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-75"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAc2puFo_Cu2E-kDAiFeqQmYbcY9ouRPWiI7Ok71AgsQWUYN6g-wKWYCkbH_PDxwHMWRKXHyh-uIHNPb3z7_haBAme-ZH6AweeYraVUZc6LxrqbuH7UNBScx0PQoqJHr_poGS4LoQw3M2iVyw7mDM-zMXY2mhdx-uCAqyvA1C1KT-k0ILjuQ7cOCcNbmlNmLbwlYWGo5sl92ySY0o87NVi0fLVunt2rlbVgiyiXb8ZJgmqQgFP4npmOpIs40w-IYsm2ui8tLruAP6w"
              style=""
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-(--mapcollections-surface) via-transparent to-transparent"
            ></div>
            <div class="absolute top-4 left-4 flex gap-2">
              <span
                class="bg-(--mapcollections-primary) text-white text-[10px] font-black px-2 py-1 rounded-sm uppercase tracking-widest"
                style="">CLEAR</span
              >
              <span
                class="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest"
                style="">Expert</span
              >
            </div>
          </div>
          <div class="p-6">
            <div class="flex justify-between items-start mb-6 cursor-pointer">
              <div>
                <h3
                  class="text-xl font-['Space_Grotesk'] font-bold text-white"
                  style=""
                >
                  Monochrome Peak
                </h3>
                <p
                  class="text-xs text-(--mapcollections-text-muted)"
                  style=""
                >
                  by <span
                    class="text-(--mapcollections-secondary)"
                    style="">EtherealGlitch</span
                  >
                </p>
              </div>
              <div class="text-right">
                <span
                  class="text-[10px] text-zinc-500 font-bold block uppercase tracking-tighter"
                  style="">Best Time</span
                >
                <span
                  class="text-lg font-['Space_Grotesk'] font-black text-(--mapcollections-tertiary)"
                  style="">04:12.83</span
                >
              </div>
            </div>
            <div
              class="grid grid-cols-2 gap-4 pt-4 border-t border-(--mapcollections-border)"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 bg-zinc-900 rounded-lg">
                  <span
                    class="material-symbols-outlined text-(--mapcollections-primary)"
                    style="">skull</span
                  >
                </div>
                <div>
                  <p
                    class="text-[10px] text-zinc-500 font-bold uppercase"
                    style=""
                  >
                    Deaths
                  </p>
                  <p class="font-black text-sm" style="">1,248</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="p-2 bg-zinc-900 rounded-lg">
                  <span
                    class="material-symbols-outlined text-(--mapcollections-secondary)"
                    style="">bolt</span
                  >
                </div>
                <div>
                  <p
                    class="text-[10px] text-zinc-500 font-bold uppercase"
                    style=""
                  >
                    Dashes
                  </p>
                  <p class="font-black text-sm" style="">3,892</p>
                </div>
              </div>
            </div>
          </div>
        </a>
        <!-- Map Card 2 -->
        <div
          class="group relative bg-(--mapcollections-surface) border border-(--mapcollections-border) rounded-2xl overflow-hidden hover:border-zinc-500 transition-all duration-500"
        >
          <div class="h-48 relative overflow-hidden">
            <img
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-75"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2DpLblzhFNf2orSi2UzqyOrdQbtpgiqSQyStEOPhokMiCKMV87vZgUu44TISaHgrq8zF-MtFA5siwXBjk1ZUN6pGmnqLbvK6E28N0lkw10kNgBpRLAyowvLVcPRz5Rx0T5_Qww64AqR0oMQ8xjNjgA_CJqiwPKANHizd7wb5YSWgXODstblP4PNBuBnOie7CV48IcdvHmwrJozHesp7p3W81en9XG-5iEcr6VY3LL-tU__kalNtfziMXm7DOsEqBRYB_TonBY6rs"
              style=""
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-(--mapcollections-surface) via-transparent to-transparent"
            ></div>
            <div class="absolute top-4 left-4 flex gap-2">
              <span
                class="bg-zinc-800 text-zinc-400 text-[10px] font-black px-2 py-1 rounded-sm uppercase tracking-widest"
                style="">NOT CLEAR</span
              >
              <span
                class="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest"
                style="">Grandmaster</span
              >
            </div>
          </div>
          <div class="p-6">
            <div class="flex justify-between items-start mb-6">
              <div>
                <h3
                  class="text-xl font-['Space_Grotesk'] font-bold text-white"
                  style=""
                >
                  Shattered Skyline
                </h3>
                <p
                  class="text-xs text-(--mapcollections-text-muted)"
                  style=""
                >
                  by <span
                    class="text-(--mapcollections-secondary)"
                    style="">OshiroFan99</span
                  >
                </p>
              </div>
              <div class="text-right opacity-40">
                <span
                  class="text-[10px] text-zinc-500 font-bold block uppercase tracking-tighter"
                  style="">Best Time</span
                >
                <span class="text-lg font-['Space_Grotesk'] font-black" style=""
                  >--:--.--</span
                >
              </div>
            </div>
            <div
              class="grid grid-cols-2 gap-4 pt-4 border-t border-(--mapcollections-border)"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 bg-zinc-900 rounded-lg">
                  <span
                    class="material-symbols-outlined text-(--mapcollections-primary)"
                    style="">skull</span
                  >
                </div>
                <div>
                  <p
                    class="text-[10px] text-zinc-500 font-bold uppercase"
                    style=""
                  >
                    Deaths
                  </p>
                  <p class="font-black text-sm" style="">8,401</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="p-2 bg-zinc-900 rounded-lg">
                  <span
                    class="material-symbols-outlined text-(--mapcollections-secondary)"
                    style="">bolt</span
                  >
                </div>
                <div>
                  <p
                    class="text-[10px] text-zinc-500 font-bold uppercase"
                    style=""
                  >
                    Dashes
                  </p>
                  <p class="font-black text-sm" style="">12,504</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Map Card 3 -->
        <div
          class="group relative bg-(--mapcollections-surface) border border-(--mapcollections-border) rounded-2xl overflow-hidden hover:border-(--mapcollections-primary)/50 transition-all duration-500 hover:shadow-[0_0_20px_-5px_var(--mapcollections-glow)]"
        >
          <div class="h-48 relative overflow-hidden">
            <img
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-75"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDloAOkl3EDw4l6zfIQC-dQP1P204djXn2_6vLS0p6if2LFLsT4jcsUtGZhlzbOpO4t-Df4_J6lW-vGXwUNEbwQoZTMTw8wOxJ6hrkx4ZbSCfL9WNljLZ7KVsC5pT-hv4jga-mqLKHDa-CeJqC_GV-Aj7s0EV0LkcTpqAyQACCWXhK7j9zDaGowt5UngZqdpcLv-D3ZQpWw4QTsi1qKTUiJkHR8kGAh_xmTgeUjLKQ3iUuOhgazgcGpUwQNv9WSE8sx6eFePAPGpYg"
              style=""
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-(--mapcollections-surface) via-transparent to-transparent"
            ></div>
            <div class="absolute top-4 left-4 flex gap-2">
              <span
                class="bg-(--mapcollections-primary) text-white text-[10px] font-black px-2 py-1 rounded-sm uppercase tracking-widest"
                style="">CLEAR</span
              >
              <span
                class="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest"
                style="">Advanced</span
              >
            </div>
          </div>
          <div class="p-6">
            <div class="flex justify-between items-start mb-6">
              <div>
                <h3
                  class="text-xl font-['Space_Grotesk'] font-bold text-white"
                  style=""
                >
                  Golden Ridge
                </h3>
                <p
                  class="text-xs text-(--mapcollections-text-muted)"
                  style=""
                >
                  by <span
                    class="text-(--mapcollections-secondary)"
                    style="">MattMakesMaps</span
                  >
                </p>
              </div>
              <div class="text-right">
                <span
                  class="text-[10px] text-zinc-500 font-bold block uppercase tracking-tighter"
                  style="">Best Time</span
                >
                <span
                  class="text-lg font-['Space_Grotesk'] font-black text-(--mapcollections-tertiary)"
                  style="">12:55.10</span
                >
              </div>
            </div>
            <div
              class="grid grid-cols-2 gap-4 pt-4 border-t border-(--mapcollections-border)"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 bg-zinc-900 rounded-lg">
                  <span
                    class="material-symbols-outlined text-(--mapcollections-primary)"
                    style="">skull</span
                  >
                </div>
                <div>
                  <p
                    class="text-[10px] text-zinc-500 font-bold uppercase"
                    style=""
                  >
                    Deaths
                  </p>
                  <p class="font-black text-sm" style="">432</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="p-2 bg-zinc-900 rounded-lg">
                  <span
                    class="material-symbols-outlined text-(--mapcollections-secondary)"
                    style="">bolt</span
                  >
                </div>
                <div>
                  <p
                    class="text-[10px] text-zinc-500 font-bold uppercase"
                    style=""
                  >
                    Dashes
                  </p>
                  <p class="font-black text-sm" style="">942</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Add Map Card -->
        <button
          class="group relative bg-zinc-900/40 border-2 border-dashed border-(--mapcollections-border) rounded-2xl flex flex-col items-center justify-center p-8 text-center transition-all hover:border-(--mapcollections-primary)/40 min-h-[400px]"
          style=""
        >
          <div
            class="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
          >
            <span
              class="material-symbols-outlined text-zinc-500 text-3xl group-hover:text-(--mapcollections-primary) transition-colors"
              style="">add_circle</span
            >
          </div>
          <h3
            class="text-xl font-['Space_Grotesk'] font-bold text-zinc-300 mb-2"
            style=""
          >
            Add collection
          </h3>
          <p class="text-xs text-zinc-500 max-w-[200px] mb-8" style="">
            Start tracking a new chapter or community mod collection.
          </p>
          <div
            class="px-8 py-2 bg-zinc-900 border border-(--mapcollections-border) rounded-full text-sm font-bold group-hover:bg-(--mapcollections-primary)/10 group-hover:text-(--mapcollections-primary) group-hover:border-(--mapcollections-primary)/30 transition-all"
            style=""
          >
            Add
          </div>
        </button>
      </div>
    </main>
  </div>
</main>

<style>
  #page-mapcollections {
    --mapcollections-bg: #131315;
    --mapcollections-surface: #18181b;
    --mapcollections-surface-bright: #27272a;
    --mapcollections-primary: #ff788c;
    --mapcollections-secondary: #67d8d2;
    --mapcollections-tertiary: #ffc971;
    --mapcollections-text: #f4f4f5;
    --mapcollections-text-muted: #a1a1aa;
    --mapcollections-border: rgba(255, 255, 255, 0.08);
    --mapcollections-glow: rgba(255, 120, 140, 0.15);
  }

  .material-symbols-outlined {
    font-variation-settings:
      "FILL" 0,
      "wght" 400,
      "GRAD" 0,
      "opsz" 24;
  }
</style>
