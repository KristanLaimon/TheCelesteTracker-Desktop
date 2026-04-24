<script lang="ts">
  import IconTimer from "~icons/material-symbols/timer";
  import IconFilterHdr from "~icons/material-symbols/filter-hdr";
  import IconAutoAwesome from "~icons/material-symbols/auto-awesome";
  import IconDiamond from "~icons/material-symbols/diamond";
  import IconLandscape from "~icons/material-symbols/landscape";

  export type RunData = {
    levelName: string;
    levelSide: "SIDE A" | "SIDE B" | "SIDE C";
    type: "Vanilla" | "Modded";
    attemptType: "Wings Golden" | "Normal" | "Golden Attempt";
    clearTime: number; // In milliseconds
    deaths: number;
    dashes: number;
    berries: number;
    status: "Completed" | "Goldenberry completed" | "Attempted" | "PB";
    iconPath: string;
  };

  let { rows } = $props<{ rows: RunData[] }>();

  const headers = ["Level Name", "Side", "Type", "Attempt", "Clear Time", "Deaths", "Dashes", "Berries", "Status"];

  function formatTime(ms: number): string {
    const milliseconds = Math.floor(ms % 1000);
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    const hStr = hours.toString().padStart(2, "0");
    const mStr = minutes.toString().padStart(2, "0");
    const sStr = seconds.toString().padStart(2, "0");
    const msStr = milliseconds.toString().padStart(3, "0");

    return `${hStr}:${mStr}:${sStr}.${msStr}`;
  }

  const iconMap = {
    vanilla: { icon: IconFilterHdr, color: "text-primary", bg: "bg-primary/10" },
    modded: { icon: IconAutoAwesome, color: "text-tertiary", bg: "bg-tertiary/10" },
    temple: { icon: IconDiamond, color: "text-purple-400", bg: "bg-purple-400/10" },
    summit: { icon: IconLandscape, color: "text-orange-400", bg: "bg-orange-400/10" },
  };

  const attemptTypeColors = {
    "Wings Golden": "bg-yellow-500/10 text-yellow-500",
    "Normal": "bg-zinc-800 text-zinc-400",
    "Golden Attempt": "bg-red-500/10 text-red-500",
  };
</script>

<div class="flex items-center justify-between mb-6">
  <div class="flex items-center gap-3">
    <div class="w-8 h-8 rounded-lg bg-accent-gradient flex items-center justify-center">
      <IconTimer class="text-white text-xl" />
    </div>
    <h2 class="text-2xl font-headline font-bold text-white">Recent Run History</h2>
  </div>
  <button class="text-sm font-medium text-primary hover:underline transition-all">Export Data</button>
</div>

<div class="bg-card-bg border border-outline-muted rounded-2xl overflow-hidden overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
  <table class="w-full text-left border-collapse min-w-[900px]">
    <thead>
      <tr class="border-b border-outline-muted bg-zinc-900/50">
        {#each headers as header, i}
          <th class="px-6 py-4 text-xs uppercase tracking-widest text-zinc-500 font-bold {i === headers.length - 1 ? 'text-right' : ''}">
            {header}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody class="divide-y divide-outline-muted/50">
      {#each rows as row}
        {@const IconData = row.iconPath ? null : (row.type === 'Vanilla' ? iconMap.vanilla : iconMap.modded)}
        {@const isGolden = row.status === "Goldenberry completed"}
        <tr class="hover:bg-white/5 transition-all group border-l-2 {isGolden ? 'border-l-yellow-400 bg-yellow-400/5 shadow-[inset_0_0_20px_rgba(250,204,21,0.05)]' : 'border-l-transparent'}">
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded flex items-center justify-center {IconData ? IconData.bg : 'bg-zinc-800'} {IconData ? IconData.color : 'text-zinc-400'}">
                {#if row.iconPath}
                  <img src={row.iconPath} alt="" class="w-6 h-6 object-contain" />
                {:else if IconData}
                  <IconData.icon class="text-lg" />
                {/if}
              </div>
              <span class="font-bold text-zinc-200">{row.levelName}</span>
            </div>
          </td>
          <td class="px-6 py-4">
            <span class="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              {row.levelSide}
            </span>
          </td>
          <td class="px-6 py-4">
            <span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter {row.type === 'Vanilla' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}">
              {row.type}
            </span>
          </td>
          <td class="px-6 py-4">
            <span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter {attemptTypeColors[row.attemptType]}">
              {row.attemptType}
            </span>
          </td>
          <td class="px-6 py-4 font-mono text-zinc-400">{formatTime(row.clearTime)}</td>
          <td class="px-6 py-4 text-zinc-400">{row.deaths}</td>
          <td class="px-6 py-4 text-zinc-400">{row.dashes}</td>
          <td class="px-6 py-4 text-zinc-400">
            <div class="flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]"></span>
              {row.berries}
            </div>
          </td>
          <td class="px-6 py-4 text-right">
            <span class="font-bold text-sm {row.status === 'PB' ? 'text-green-400' : ''} {row.status === 'Goldenberry completed' ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : ''} {row.status === 'Completed' ? 'text-zinc-500' : ''} {row.status === 'Attempted' ? 'text-red-400/70' : ''}">
              {row.status === "Goldenberry completed" ? "Goldenberry" : row.status}
            </span>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
