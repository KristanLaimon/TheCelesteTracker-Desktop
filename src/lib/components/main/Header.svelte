<!-- Header -->
<header
  class="fixed top-0 left-0 w-full h-16 bg-[var(--hub-bg)]/80 backdrop-blur-md border-b border-[var(--hub-outline)] flex justify-between items-center px-6 md:px-12 z-50"
>
  <div class="flex items-center gap-8">
    <enhanced:img src="../../assets/strawberry.gif"  />
    <span class="font-headline font-black text-xl text-[var(--hub-tertiary)] tracking-tight">Celeste Tracker</span>
    <!-- <nav class="hidden lg:flex gap-6"> -->
      <!-- <a class="text-sm font-medium text-zinc-400 hover:text-[var(--hub-primary)] transition-colors" href="#"
        >Global Stats</a
      >
      <a class="text-sm font-medium text-zinc-400 hover:text-[var(--hub-primary)] transition-colors" href="#"
        >Resources</a
      > -->
    <!-- </nav> -->
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
    <button
      class="hidden sm:block px-4 py-1.5 bg-zinc-900 text-[var(--hub-secondary)] font-bold rounded-lg border border-[var(--hub-secondary)]/20 hover:bg-[var(--hub-secondary)]/10 transition-all text-xs"
    >
      Live Run
    </button>
    <div
      class="w-8 h-8 rounded-full border border-[var(--hub-primary)]/40 bg-[var(--hub-primary)]/10 flex items-center justify-center text-[var(--hub-primary)] text-[10px] font-bold"
    >
      KT
    </div>
  </div>
</header>
