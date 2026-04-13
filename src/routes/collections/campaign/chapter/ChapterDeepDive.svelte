<!-- Hero Section with Map Artwork -->
<section class="space-y-4">
  <div
    class="group relative min-h-[400px] w-full overflow-hidden rounded-3xl lg:h-[450px]"
  >
    <img
      class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAfoG-mbwiw_DyXTXlnApNg4K69fgTC1FGetRSxga59Aglg396HJRpahxp6NOzrHZ-rC8p6V9XHsdo7xblx8w3IntK1FJ2SK-7ZqaecJJIgnicv1rHd3oZ0rPSne4Wuhc9kT2cIN2AOm7Crig3kuHIh0QcHch5EtECZOSIAkhl9_pMkKY8MQ5Fk-VM0itX5ohiW_AlweU8wq0b35B4VU7oQFiFNlzpvhiS4sk4zu5zGZ2WVKva4C07ZaIBrK6yPpfcuKj6xwbh7HOY"
      alt="Chapter Background"
    />
    <div class="absolute inset-0 bg-(--chapter-info-hero-gradient)"></div>
    <div
      class="absolute inset-0 pointer-events-none bg-(--chapter-info-hero-overlay)"
    ></div>
    <!-- Thumbnail Edit Button -->
    <button
      class="absolute top-6 right-6 z-20 rounded-xl border border-white/10 bg-black/40 p-2.5 text-white/70 opacity-0 backdrop-blur-md transition-all hover:bg-black/60 hover:text-white group-hover:opacity-100"
    >
      <span class="material-symbols-outlined text-xl">edit</span>
    </button>
    <div
      class="absolute bottom-0 left-0 flex w-full flex-col items-start justify-between gap-6 p-6 sm:p-12 md:flex-row md:items-end"
    >
      <div class="w-full md:w-auto">
        <div class="mb-4 flex items-center gap-3">
          <span
            class="rounded-full border border-(--chapter-info-tertiary)/30 bg-(--chapter-info-tertiary)/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-(--chapter-info-tertiary)"
            >Chapter 9</span
          >
          <span class="text-xs font-medium text-zinc-400 sm:text-sm"
            >C-Side Variant</span
          >
        </div>
        <h1
          class="mb-2 font-black text-4xl tracking-tighter text-white sm:text-5xl lg:text-6xl"
          style="font-family: var(--font-headline);"
        >
          Farewell
        </h1>
        <p
          class="max-w-xl text-sm italic font-light opacity-90 text-(--chapter-info-secondary) sm:text-base"
        >
          "Beyond the heart of the mountain, where the stars breathe and the
          path dissolves into memories."
        </p>
      </div>
      <div class="flex w-full items-center gap-4 md:w-auto">
        <div
          class="glass-panel flex flex-1 flex-col items-center rounded-2xl border border-white/5 p-4 sm:p-6 md:flex-none"
        >
          <span
            class="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400"
            >Golden Status</span
          >
          <div class="flex items-center gap-2">
            <span
              class="material-symbols-outlined text-3xl text-(--chapter-info-tertiary) sm:text-4xl"
              style="font-variation-settings: 'FILL' 1;">workspace_premium</span
            >
            <span
              class="font-black text-xl tracking-tight text-(--chapter-info-tertiary) sm:text-2xl"
              style="font-family: var(--font-headline);">COMPLETED</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- Star Rating Display -->
  <div class="flex items-center justify-end gap-1.5 px-2">
    <div class="flex items-center gap-0.5 text-(--chapter-info-tertiary)">
      <span
        class="material-symbols-outlined"
        style="font-variation-settings: 'FILL' 1">star</span
      >
      <span
        class="material-symbols-outlined"
        style="font-variation-settings: 'FILL' 1">star</span
      >
      <span
        class="material-symbols-outlined"
        style="font-variation-settings: 'FILL' 1">star</span
      >
      <span
        class="material-symbols-outlined"
        style="font-variation-settings: 'FILL' 1">star</span
      >
      <span
        class="material-symbols-outlined"
        style="font-variation-settings: 'FILL' 1">star_half</span
      >
    </div>
    <span
      class="ml-2 text-sm font-bold text-zinc-500"
      style="font-family: var(--font-headline);">4.5 / 5.0</span
    >
  </div>
</section>

<!-- Editable Text Blocks -->
<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
  <!-- Description Section -->
  <div
    class="group relative overflow-hidden rounded-3xl border-none bg-(--chapter-info-surface) p-6 sm:p-8"
    id="section-description"
  >
    <input class="peer hidden" id="edit-description-toggle" type="checkbox" />
    <div class="mb-4 flex items-center justify-between">
      <h3
        class="text-[10px] font-bold uppercase tracking-widest text-zinc-500"
        style="font-family: var(--font-headline);"
      >
        Description
      </h3>
      <label
        class="cursor-pointer rounded-lg p-2 text-zinc-400 opacity-0 transition-opacity hover:bg-white/5 hover:text-white group-hover:opacity-100"
        for="edit-description-toggle"
      >
        <span class="material-symbols-outlined text-lg peer-checked:hidden"
          >edit</span
        >
        <span
          class="material-symbols-outlined text-lg hidden peer-checked:block"
          >check</span
        >
      </label>
    </div>
    <div class="peer-checked:hidden">
      <p class="text-sm leading-relaxed text-zinc-300">
        Chapter 9: Farewell is the final main chapter of Celeste. It is an
        extremely long and difficult chapter that introduces many new mechanics
        while testing everything learned throughout the game. This tracking
        record focuses on the C-Side variant which condenses the difficulty into
        three grueling rooms.
      </p>
    </div>
    <div class="hidden peer-checked:block">
      <textarea
        class="min-h-[120px] w-full resize-none rounded-xl border border-(--chapter-info-outline) bg-zinc-900/50 p-4 text-sm text-zinc-100 transition-colors focus:border-(--chapter-info-primary)/50 focus:outline-none"
        placeholder="Enter map description..."
        >Chapter 9: Farewell is the final main chapter of Celeste. It is an
        extremely long and difficult chapter that introduces many new mechanics
        while testing everything learned throughout the game. This tracking
        record focuses on the C-Side variant which condenses the difficulty into
        three grueling rooms.</textarea
      >
    </div>
  </div>
  <!-- Opinion Section -->
  <div
    class="group relative overflow-hidden rounded-3xl border-none bg-(--chapter-info-surface) p-6 sm:p-8"
    id="section-opinion"
  >
    <input class="peer hidden" id="edit-opinion-toggle" type="checkbox" />
    <div class="mb-4 flex items-center justify-between">
      <h3
        class="text-[10px] font-bold uppercase tracking-widest text-zinc-500"
        style="font-family: var(--font-headline);"
      >
        Opinion
      </h3>
      <label
        class="cursor-pointer rounded-lg p-2 text-zinc-400 opacity-0 transition-opacity hover:bg-white/5 hover:text-white group-hover:opacity-100"
        for="edit-opinion-toggle"
      >
        <span class="material-symbols-outlined text-lg peer-checked:hidden"
          >edit</span
        >
        <span
          class="material-symbols-outlined text-lg hidden peer-checked:block"
          >check</span
        >
      </label>
    </div>
    <div class="peer-checked:hidden">
      <p class="text-sm italic text-zinc-500">
        No personal thoughts recorded yet. Click the edit icon to share your
        experience with this map.
      </p>
    </div>
    <div class="hidden peer-checked:block">
      <textarea
        class="min-h-[120px] w-full resize-none rounded-xl border border-(--chapter-info-outline) bg-zinc-900/50 p-4 text-sm text-zinc-100 transition-colors focus:border-(--chapter-info-primary)/50 focus:outline-none"
        placeholder="Record your thoughts or strategies here..."
      ></textarea>
    </div>
  </div>
</div>

<!-- Data Deep-Dive Content -->
<div class="space-y-12">
  <!-- Comparison Bento Grid -->
  <div class="grid grid-cols-12 gap-6">
    <!-- PB Statistics -->
    <div
      class="glass-panel relative col-span-12 flex min-h-[320px] flex-col justify-between overflow-hidden rounded-3xl p-6 shadow-[var(--chapter-info-strawberry-glow)] sm:p-8 lg:col-span-8 border-none"
    >
      <div class="pointer-events-none absolute top-0 right-0 p-8 opacity-5">
        <span
          class="material-symbols-outlined text-[120px] sm:text-[160px]"
          style="font-variation-settings: 'FILL' 1;">trophy</span
        >
      </div>
      <div class="z-10 flex items-start justify-between">
        <div>
          <h2
            class="font-bold text-xl text-white sm:text-2xl"
            style="font-family: var(--font-headline);"
          >
            Personal Best
          </h2>
          <p class="text-xs text-zinc-400 sm:text-sm">
            Achieved 12 days ago • Session #142
          </p>
        </div>
        <span
          class="rounded-full border border-(--chapter-info-secondary)/30 bg-(--chapter-info-secondary)/20 px-4 py-1 text-[10px] font-bold text-(--chapter-info-secondary) sm:text-xs"
          >New Peak</span
        >
      </div>
      <div
        class="z-10 mt-8 grid grid-cols-2 gap-6 sm:gap-4 lg:mt-0 sm:grid-cols-4"
      >
        <div class="space-y-1">
          <span
            class="text-[10px] font-bold uppercase tracking-widest text-zinc-400"
            >Clear Time</span
          >
          <p
            class="font-black text-2xl text-(--chapter-info-primary) sm:text-3xl"
            style="font-family: var(--font-headline);"
          >
            18:42.04
          </p>
        </div>
        <div class="space-y-1">
          <span
            class="text-[10px] font-bold uppercase tracking-widest text-zinc-400"
            >Deaths</span
          >
          <p
            class="font-black text-2xl text-white sm:text-3xl"
            style="font-family: var(--font-headline);"
          >
            0
          </p>
        </div>
        <div class="space-y-1">
          <span
            class="text-[10px] font-bold uppercase tracking-widest text-zinc-400"
            >Dashes</span
          >
          <p
            class="font-black text-2xl text-white sm:text-3xl"
            style="font-family: var(--font-headline);"
          >
            412
          </p>
        </div>
        <div class="space-y-1">
          <span
            class="text-[10px] font-bold uppercase tracking-widest text-zinc-400"
            >Avg Speed</span
          >
          <p
            class="font-black text-2xl text-(--chapter-info-secondary) sm:text-3xl"
            style="font-family: var(--font-headline);"
          >
            94%
          </p>
        </div>
      </div>
      <div
        class="z-10 mt-8 h-2 w-full overflow-hidden rounded-full bg-(--chapter-info-surface-high)"
      >
        <div
          class="h-full w-full bg-gradient-to-r from-(--chapter-info-secondary) to-(--chapter-info-primary)"
        ></div>
      </div>
    </div>
    <!-- Last Run vs PB -->
    <div
      class="col-span-12 flex flex-col justify-between rounded-3xl border-none bg-(--chapter-info-surface) p-6 sm:p-8 lg:col-span-4"
    >
      <div>
        <h2
          class="mb-6 font-bold text-xl text-white"
          style="font-family: var(--font-headline);"
        >
          Last Session
        </h2>
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <span class="text-sm text-zinc-400">Time Variance</span>
            <span
              class="font-mono text-sm font-bold text-(--chapter-info-primary)"
              >+02:14.30</span
            >
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-zinc-400">Deaths</span>
            <span class="font-mono text-sm font-bold text-white">14</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-zinc-400">Room Efficiency</span>
            <span class="font-mono text-sm font-bold text-white">82.4%</span>
          </div>
        </div>
      </div>
      <button
        class="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white transition-all hover:bg-white/10"
      >
        <span class="material-symbols-outlined text-lg">analytics</span>
        View Detailed Split
      </button>
    </div>
  </div>
  <!-- Consistency Visualization -->
  <section>
    <div
      class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <h2
          class="font-black text-2xl tracking-tight text-white sm:text-3xl"
          style="font-family: var(--font-headline);"
        >
          Consistency Tracker
        </h2>
        <p class="mt-2 max-w-md text-sm text-zinc-400">
          Heatmap of death frequency per sub-section over the last 50 attempts.
        </p>
      </div>
      <div class="flex gap-4">
        <div class="flex items-center gap-2">
          <span class="h-3 w-3 rounded-full bg-(--chapter-info-secondary)"
          ></span>
          <span class="text-[10px] font-bold uppercase text-zinc-400"
            >Low Risk</span
          >
        </div>
        <div class="flex items-center gap-2">
          <span class="h-3 w-3 rounded-full bg-(--chapter-info-primary)"></span>
          <span class="text-[10px] font-bold uppercase text-zinc-400"
            >Choke Point</span
          >
        </div>
      </div>
    </div>
    <div class="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-10">
      <div
        class="pointer-events-none absolute bottom-[-20%] right-[-5%] rotate-12 opacity-[0.03]"
      >
        <span
          class="material-symbols-outlined text-[300px] sm:text-[400px]"
          style="font-variation-settings: 'FILL' 1;">stars</span
        >
      </div>
      <div
        class="relative z-10 flex h-40 items-end justify-between gap-1.5 sm:h-48 sm:gap-3"
      >
        <div
          class="group relative h-[20%] flex-1 cursor-pointer rounded-t-lg bg-(--chapter-info-secondary)/40 transition-colors hover:bg-(--chapter-info-secondary)/60"
        ></div>
        <div
          class="group relative h-[15%] flex-1 cursor-pointer rounded-t-lg bg-(--chapter-info-secondary)/40 transition-colors hover:bg-(--chapter-info-secondary)/60"
        ></div>
        <div
          class="group relative h-[25%] flex-1 cursor-pointer rounded-t-lg bg-(--chapter-info-secondary)/40 transition-colors hover:bg-(--chapter-info-secondary)/60"
        ></div>
        <div
          class="group relative h-[85%] flex-1 cursor-pointer rounded-t-lg bg-(--chapter-info-primary)/60 transition-colors hover:bg-(--chapter-info-primary)/80"
        >
          <div
            class="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-(--chapter-info-primary)/20 bg-(--chapter-info-surface-high) px-2 py-1 text-[10px] text-(--chapter-info-primary) opacity-0 transition-opacity group-hover:opacity-100"
          >
            S4: Power Source (24)
          </div>
        </div>
        <div
          class="group relative h-[55%] flex-1 cursor-pointer rounded-t-lg bg-(--chapter-info-primary)/40 transition-colors hover:bg-(--chapter-info-primary)/60"
        ></div>
        <div
          class="group relative h-[10%] flex-1 cursor-pointer rounded-t-lg bg-(--chapter-info-secondary)/40 transition-colors hover:bg-(--chapter-info-secondary)/60"
        ></div>
        <div
          class="group relative h-[15%] flex-1 cursor-pointer rounded-t-lg bg-(--chapter-info-secondary)/40 transition-colors hover:bg-(--chapter-info-secondary)/60"
        ></div>
        <div
          class="group relative h-[95%] flex-1 cursor-pointer rounded-t-lg bg-(--chapter-info-primary)/80 transition-colors hover:bg-(--chapter-info-primary)"
        >
          <div
            class="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-(--chapter-info-primary)/20 bg-(--chapter-info-surface-high) px-2 py-1 text-[10px] text-(--chapter-info-primary) opacity-0 transition-opacity group-hover:opacity-100"
          >
            S8: Final Screen (38)
          </div>
        </div>
        <div
          class="group relative h-[5%] flex-1 cursor-pointer rounded-t-lg bg-(--chapter-info-secondary)/40 transition-colors hover:bg-(--chapter-info-secondary)/60"
        ></div>
        <div
          class="group relative h-[12%] flex-1 cursor-pointer rounded-t-lg bg-(--chapter-info-secondary)/40 transition-colors hover:bg-(--chapter-info-secondary)/60"
        ></div>
        <div
          class="group relative h-[8%] flex-1 cursor-pointer rounded-t-lg bg-(--chapter-info-secondary)/40 transition-colors hover:bg-(--chapter-info-secondary)/60"
        ></div>
        <div
          class="group relative h-[14%] flex-1 cursor-pointer rounded-t-lg bg-(--chapter-info-secondary)/40 transition-colors hover:bg-(--chapter-info-secondary)/60"
        ></div>
      </div>
      <div
        class="relative z-10 mt-4 flex justify-between border-t border-white/5 pt-4 text-[8px] font-bold uppercase tracking-widest text-zinc-500 sm:text-[10px]"
      >
        <span class="truncate">Singularity</span>
        <span class="hidden truncate sm:inline">Power Source</span>
        <span class="truncate">Remembered</span>
        <span class="hidden truncate sm:inline">Event Horizon</span>
        <span class="truncate">Reconciliation</span>
        <span class="truncate">Farewell</span>
      </div>
    </div>
  </section>
  <!-- Run History Table -->
  <section>
    <div class="mb-8 flex items-center justify-between">
      <h2
        class="font-black text-2xl tracking-tight text-white sm:text-3xl"
        style="font-family: var(--font-headline);"
      >
        Run History
      </h2>
      <div class="flex items-center gap-2">
        <button class="rounded-lg p-2 transition-colors hover:bg-white/5"
          ><span class="material-symbols-outlined text-zinc-400"
            >filter_list</span
          ></button
        >
        <button class="rounded-lg p-2 transition-colors hover:bg-white/5"
          ><span class="material-symbols-outlined text-zinc-400">download</span
          ></button
        >
      </div>
    </div>
    <div
      class="overflow-x-auto rounded-3xl border-none bg-(--chapter-info-surface)"
    >
      <table
        class="w-full min-w-[600px] border-separate border-spacing-0 text-left"
      >
        <thead>
          <tr class="bg-(--chapter-info-surface-high)/50">
            <th
              class="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 sm:px-8"
              >Date &amp; Time</th
            >
            <th
              class="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 sm:px-8"
              >Clear Time</th
            >
            <th
              class="px-6 py-5 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-500 sm:px-8"
              >Deaths</th
            >
            <th
              class="px-6 py-5 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-500 sm:px-8"
              >Dashes</th
            >
            <th
              class="px-6 py-5 text-right text-[10px] font-bold uppercase tracking-widest text-zinc-500 sm:px-8"
              >Status</th
            >
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          <tr class="group transition-colors hover:bg-white/[0.02]">
            <td class="px-6 py-5 sm:px-8">
              <div class="flex flex-col">
                <span class="text-sm font-bold text-white">Oct 24, 2023</span>
                <span class="text-[10px] text-zinc-500">14:22 PM</span>
              </div>
            </td>
            <td
              class="px-6 py-5 font-mono text-sm font-bold text-(--chapter-info-secondary) sm:px-8"
              >18:42.04</td
            >
            <td class="px-6 py-5 text-center font-bold text-white sm:px-8">0</td
            >
            <td class="px-6 py-5 text-center font-bold text-zinc-400 sm:px-8"
              >412</td
            >
            <td class="px-6 py-5 text-right sm:px-8">
              <span
                class="rounded-full border border-(--chapter-info-tertiary)/20 bg-(--chapter-info-tertiary)/10 px-3 py-1 text-[10px] font-black uppercase text-(--chapter-info-tertiary)"
                >Golden Success</span
              >
            </td>
          </tr>
          <tr class="group transition-colors hover:bg-white/[0.02]">
            <td class="px-6 py-5 sm:px-8">
              <div class="flex flex-col">
                <span class="text-sm font-bold text-white">Oct 23, 2023</span>
                <span class="text-[10px] text-zinc-500">21:05 PM</span>
              </div>
            </td>
            <td class="px-6 py-5 font-mono text-sm font-bold text-white sm:px-8"
              >20:56.34</td
            >
            <td
              class="px-6 py-5 text-center font-bold text-(--chapter-info-primary) sm:px-8"
              >14</td
            >
            <td class="px-6 py-5 text-center font-bold text-zinc-400 sm:px-8"
              >503</td
            >
            <td class="px-6 py-5 text-right sm:px-8">
              <span
                class="rounded-full border border-(--chapter-info-primary)/20 bg-(--chapter-info-primary)/10 px-3 py-1 text-[10px] font-black uppercase text-(--chapter-info-primary)"
                >Choked @ S8</span
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="mt-8 flex justify-center">
      <button
        class="rounded-xl border border-white/5 px-8 py-3 text-sm font-bold text-zinc-400 transition-all hover:bg-white/5 hover:text-white"
        >Load Full History</button
      >
    </div>
  </section>
</div>
