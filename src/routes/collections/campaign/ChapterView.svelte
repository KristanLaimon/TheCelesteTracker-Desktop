<header class="mb-10">
  <nav
    class="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4"
  >
    <span>Map Collections</span>
    <span class="material-symbols-outlined text-[10px]"
      >chevron_right</span
    >
    <span style="color: var(--mapscollection-primary)">Expert Maps</span
    >
  </nav>
  <div
    class="flex flex-col lg:flex-row lg:items-end justify-between gap-6"
  >
    <div class="flex-1">
      <div class="flex items-center justify-between gap-4 mb-4">
        <h1
          class="text-3xl sm:text-4xl md:text-5xl font-headline font-bold text-white tracking-tighter"
        >
          Expert Maps <span
            class="italic"
            style="color: var(--mapscollection-primary)"
            >Collection</span
          >
        </h1>
        <button
          class="px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg active:scale-95 mb-1"
          style="background: var(--mapscollection-primary); color: var(--mapscollection-on-primary)"
        >
          <span class="material-symbols-outlined text-sm">add</span>
          Add Map
        </button>
      </div>
      <div class="relative mb-6 max-w-2xl">
        <input
          class="peer hidden"
          id="edit-description-toggle"
          type="checkbox"
        />
        <div
          class="description-container border-none rounded-xl p-5 relative min-h-[100px]"
        >
          <label
            class="absolute top-4 right-4 cursor-pointer text-zinc-500 hover:text-(--mapscollection-primary) transition-colors"
            for="edit-description-toggle"
          >
            <span class="material-symbols-outlined edit-icon text-xl"
              >edit</span
            >
            <span class="material-symbols-outlined save-icon text-xl"
              >check</span
            >
          </label>
          <div class="text-zinc-400 text-sm leading-relaxed pr-8">
            A comprehensive log of the Expert Map collection, tracking
            clears, golden berries, and personal best times. This
            collection represents the peak of Celeste modding challenges
            and vanilla endgame content.
          </div>
        </div>
      </div>
      <div class="flex flex-wrap gap-8 sm:gap-12">
        <div class="flex flex-col">
          <span
            class="text-zinc-500 uppercase tracking-widest text-[10px] font-bold"
            >Total Maps</span
          >
          <div class="flex items-baseline gap-2 mt-1">
            <span
              class="text-2xl sm:text-3xl font-headline font-bold text-white"
              >12</span
            >
            <span
              class="material-symbols-outlined text-xl"
              style="color: var(--mapscollection-tertiary)">map</span
            >
          </div>
        </div>
        <div class="flex flex-col">
          <span
            class="text-zinc-500 uppercase tracking-widest text-[10px] font-bold"
            >Total Deaths</span
          >
          <div class="flex items-baseline gap-2 mt-1">
            <span
              class="text-2xl sm:text-3xl font-headline font-bold text-white"
              >4.2k</span
            >
            <span
              class="material-symbols-outlined text-xl"
              style="color: var(--mapscollection-primary)">skull</span
            >
          </div>
        </div>
        <div class="flex flex-col">
          <span
            class="text-zinc-500 uppercase tracking-widest text-[10px] font-bold"
            >Golden Berries</span
          >
          <div class="flex items-baseline gap-2 mt-1">
            <span
              class="text-2xl sm:text-3xl font-headline font-bold text-white"
              >3</span
            >
            <span
              class="material-symbols-outlined text-xl"
              style="color: var(--mapscollection-tertiary)"
              >workspace_premium</span
            >
          </div>
        </div>
      </div>
    </div>
    <div
      class="inline-flex p-1 bg-zinc-900 rounded-lg border border-(--mapscollection-outline) self-start lg:mb-1"
    >
      <label
        class="view-toggle-label cursor-pointer px-4 sm:px-5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-tighter transition-all flex items-center gap-2 text-zinc-500"
        for="table-view-trigger"
      >
        <span class="material-symbols-outlined text-sm">list</span> Table
      </label>
      <label
        class="view-toggle-label cursor-pointer px-4 sm:px-5 py-1.5 rounded-md text-[10px] font-black uppercase tracking-tighter transition-all flex items-center gap-2 text-zinc-500"
        for="grid-view-trigger"
      >
        <span class="material-symbols-outlined text-sm">grid_view</span> Grid
      </label>
    </div>
  </div>
</header>
<div class="relative" id="view-canvas">
  <!-- Table View Container -->
  <section
    class="bg-transparent sm:bg-zinc-900/50 sm:border sm:border-(--mapscollection-outline) sm:rounded-2xl overflow-hidden"
    id="table-view-container"
  >
    <div
      class="hidden sm:grid grid-cols-12 px-6 py-4 border-b border-(--mapscollection-outline) text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em]"
    >
      <div class="col-span-1"></div>
      <div class="col-span-3">Level Name</div>
      <div class="col-span-1 text-center">Type</div>
      <div class="col-span-2">Campaign</div>
      <div class="col-span-1 text-center">Hearts</div>
      <div class="col-span-1 text-center">Berries</div>
      <div class="col-span-1 text-center">Sides</div>
      <div class="col-span-1 text-right">Deaths</div>
      <div class="col-span-1 text-right">Time</div>
    </div>
    <div
      class="flex flex-col gap-4 sm:gap-0 sm:divide-y sm:divide-[var(--mapscollection-outline)]"
    >
      <!-- Entry 1 -->
      <a href="/collections/campaign/chapter"
        class="bg-zinc-900/50 sm:bg-transparent border-none rounded-xl sm:rounded-none overflow-hidden group hover:bg-white/5 transition-colors"
      >
        <div
          class="grid grid-cols-1 sm:grid-cols-12 items-center px-5 py-5 sm:px-6 sm:py-4"
        >
          <div
            class="col-span-1 flex items-center gap-3 mb-4 sm:mb-0 sm:col-span-4"
          >
            <div
              class="hidden sm:block shrink-0 w-12 h-8 rounded overflow-hidden border border-(--mapscollection-outline)"
            >
              <img
                alt="Thumbnail"
                class="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvU2T4j-t9CqJ0EGTcYs4jQSlk3eHh1AItvymwq2VXs4_TD8tvXP_7AgwkBhoKbFgNJFiwUN9FxfcOT34qAE83q8Gczezr63CzJ97TRIwClsFbB1vrI427YDwzqU_RT5x0F0bdl4umBkv9GK7Cw5hM2oqFmFqAS4nBvfjEorcYJOReZV7_FUDtsOsAVnfbEt46LC3iq8MhL_pd73aIZ9HA2oO9ZHqU2HJEulfQ4SnObuWu_4EgnCPXwVZXc0ZRinsx6qTyHJzmTv8"
              />
            </div>
            <div
              class="w-10 h-10 sm:w-8 sm:h-8 rounded flex items-center justify-center transition-transform group-hover:scale-105"
              style="background: rgba(255,120,140,0.1); color: var(--mapscollection-primary)"
            >
              <span class="material-symbols-outlined text-xl sm:text-lg"
                >filter_hdr</span
              >
            </div>
            <div>
              <h3 class="font-bold text-zinc-200 text-sm">
                Forsaken City (A)
              </h3>
              <p
                class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider"
              >
                Chapter 1
              </p>
            </div>
          </div>
          <div
            class="col-span-1 sm:col-span-8 grid grid-cols-2 sm:grid-cols-8 gap-4 sm:gap-0 items-center"
          >
            <div class="sm:col-span-1 flex flex-col sm:items-center">
              <span
                class="sm:hidden text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1"
                >Type</span
              >
              <span
                class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter w-fit"
                style="background: rgba(103,216,210,0.1); color: var(--mapscollection-secondary)"
                >Vanilla</span
              >
            </div>
            <div class="sm:col-span-2 flex flex-col sm:block">
              <span
                class="sm:hidden text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1"
                >Campaign</span
              >
              <span class="text-[11px] text-zinc-400 font-medium"
                >Celeste Original</span
              >
            </div>
            <div class="sm:col-span-1 flex flex-col sm:items-center">
              <div class="flex items-center gap-1 text-zinc-300">
                <span
                  class="material-symbols-outlined text-sm"
                  data-weight="fill"
                  style="color: var(--mapscollection-primary)"
                  >favorite</span
                >
                <span class="text-[11px] font-bold">1/1</span>
              </div>
            </div>
            <div class="sm:col-span-1 flex flex-col sm:items-center">
              <div class="flex items-center gap-1 text-zinc-300">
                <span
                  class="material-symbols-outlined text-sm text-red-400"
                  >nutrition</span
                >
                <span class="text-[11px] font-bold">20/20</span>
              </div>
            </div>
            <div class="sm:col-span-1 flex flex-col sm:items-center">
              <div class="flex items-center gap-1">
                <span
                  class="material-symbols-outlined text-sm"
                  data-weight="fill"
                  style="color: var(--mapscollection-tertiary)"
                  >cassette</span
                >
                <span
                  class="material-symbols-outlined text-sm"
                  data-weight="fill"
                  style="color: var(--mapscollection-tertiary)"
                  >cassette</span
                >
              </div>
            </div>
            <div class="sm:col-span-1 sm:text-right">
              <span
                class="font-headline text-sm font-bold text-zinc-200"
                >0</span
              >
            </div>
            <div class="sm:col-span-1 sm:text-right">
              <span
                class="font-mono text-[10px] font-medium text-zinc-400"
                >1:42.3</span
              >
            </div>
          </div>
        </div>
      </a>
    </div>
  </section>
  <!-- Grid View Container -->
  <section
    class="hidden grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    id="grid-view-container"
  >
    <div
      class="achievement-card relative group overflow-hidden rounded-2xl bg-zinc-900 h-[340px] flex flex-col justify-end p-6 border-none"
    >
      <div class="absolute inset-0 z-0">
        <img
          alt="Forsaken City"
          class="w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvU2T4j-t9CqJ0EGTcYs4jQSlk3eHh1AItvymwq2VXs4_TD8tvXP_7AgwkBhoKbFgNJFiwUN9FxfcOT34qAE83q8Gczezr63CzJ97TRIwClsFbB1vrI427YDwzqU_RT5x0F0bdl4umBkv9GK7Cw5hM2oqFmFqAS4nBvfjEorcYJOReZV7_FUDtsOsAVnfbEt46LC3iq8MhL_pd73aIZ9HA2oO9ZHqU2HJEulfQ4SnObuWu_4EgnCPXwVZXc0ZRinsx6qTyHJzmTv8"
        />
        <div
          class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"
        ></div>
      </div>
      <div class="relative z-10">
        <div class="flex justify-between items-start mb-2">
          <span
            class="material-symbols-outlined"
            data-weight="fill"
            style="color: var(--mapscollection-tertiary)"
            >workspace_premium</span
          >
          <span
            class="text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-tighter"
            style="background: rgba(103,216,210,0.2); color: var(--mapscollection-secondary)"
            >Vanilla</span
          >
        </div>
        <h3 class="text-xl font-headline font-bold text-white mb-4">
          Forsaken City
        </h3>
        <div
          class="grid grid-cols-2 gap-y-4 gap-x-6 border-t border-(--mapscollection-outline) pt-4"
        >
          <div>
            <p
              class="text-[9px] text-zinc-500 uppercase font-black tracking-widest"
            >
              Deaths
            </p>
            <p class="text-base font-headline font-bold text-white">
              0
            </p>
          </div>
          <div>
            <p
              class="text-[9px] text-zinc-500 uppercase font-black tracking-widest"
            >
              Time
            </p>
            <p class="text-base font-headline font-bold text-white">
              1:42
            </p>
          </div>
          <div>
            <p
              class="text-[9px] text-zinc-500 uppercase font-black tracking-widest"
            >
              Hearts
            </p>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span
                class="material-symbols-outlined text-sm"
                data-weight="fill"
                style="color: var(--mapscollection-primary)"
                >favorite</span
              >
              <span class="text-sm font-bold text-zinc-200">1/1</span>
            </div>
          </div>
          <div>
            <p
              class="text-[9px] text-zinc-500 uppercase font-black tracking-widest"
            >
              Sides
            </p>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span
                class="material-symbols-outlined text-sm"
                data-weight="fill"
                style="color: var(--mapscollection-tertiary)"
                >cassette</span
              >
              <span
                class="material-symbols-outlined text-sm"
                data-weight="fill"
                style="color: var(--mapscollection-tertiary)"
                >cassette</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</div>
<!-- Footer Summary Sections -->
<section class="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
  <div
    class="bg-zinc-900 p-6 sm:p-8 rounded-2xl border border-(--mapscollection-outline) relative overflow-hidden group"
  >
    <span
      class="material-symbols-outlined absolute -right-4 -bottom-4 text-7xl sm:text-9xl text-white/5 rotate-12 transition-transform group-hover:rotate-0"
      data-weight="fill">workspace_premium</span
    >
    <div class="relative z-10">
      <p
        class="font-bold uppercase tracking-[0.2em] text-[10px] mb-4"
        style="color: var(--mapscollection-primary)"
      >
        Next Challenge
      </p>
      <h2
        class="text-2xl sm:text-3xl font-headline font-bold text-white mb-2"
      >
        Reflections (B-Side)
      </h2>
      <p class="text-sm text-zinc-400 mb-6 max-w-md">
        You're only 4 deaths away from your first Expert B-Side Golden.
        The mirror awaits.
      </p>
      <div class="flex flex-wrap items-center gap-4">
        <button
          class="px-6 py-2 rounded-full font-bold text-sm transition-colors"
          style="background: var(--mapscollection-primary); color: var(--mapscollection-on-primary)"
          >Resume Practice</button
        >
        <span
          class="text-xs font-bold text-zinc-500 uppercase tracking-wider"
          >PB: 4 Deaths</span
        >
      </div>
    </div>
  </div>
  <div
    class="bg-zinc-900 p-6 sm:p-8 rounded-2xl border border-(--mapscollection-outline) relative overflow-hidden group"
  >
    <span
      class="material-symbols-outlined absolute -right-4 -bottom-4 text-7xl sm:text-9xl text-white/5 -rotate-12 transition-transform group-hover:rotate-0"
      data-weight="fill">insights</span
    >
    <div class="relative z-10">
      <p
        class="font-bold uppercase tracking-[0.2em] text-[10px] mb-4"
        style="color: var(--mapscollection-secondary)"
      >
        Collection Mastery
      </p>
      <div class="flex items-baseline gap-2 mb-2">
        <h2
          class="text-5xl sm:text-6xl font-headline font-bold text-white"
        >
          64
        </h2>
        <span
          class="text-xl sm:text-2xl font-headline font-bold text-zinc-500"
          >%</span
        >
      </div>
      <p class="text-sm text-zinc-400 mb-6">
        Mastery of the Expert Collection based on Clears and Goldens.
      </p>
      <div class="w-full bg-zinc-950 h-2 rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500"
          style="width: 64%; background: var(--mapscollection-secondary); box-shadow: 0 0 8px var(--mapscollection-secondary)"
        ></div>
      </div>
    </div>
  </div>
</section>
