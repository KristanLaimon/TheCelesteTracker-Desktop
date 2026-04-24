<script lang="ts">
  import { onMount } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import IconTimer from "~icons/material-symbols/timer";
  import IconFilterHdr from "~icons/material-symbols/filter-hdr";
  import IconAutoAwesome from "~icons/material-symbols/auto-awesome";
  import IconDiamond from "~icons/material-symbols/diamond";
  import IconLandscape from "~icons/material-symbols/landscape";

  import sideADeaths from "../../assets/interface_SIDEA_deaths_icon.png";
  import sideBDeaths from "../../assets/interface_SIDEB_deaths_icon.png";
  import sideCDeaths from "../../assets/interface_SIDEC_deaths_icon.png";
  import sideAHeart from "../../assets/interface_SIDEA_heart.png";
  import sideBHeart from "../../assets/interface_SIDEB_heart.png";
  import sideCHeart from "../../assets/interface_SIDEC_heart.png";
  import strawberryIcon from "../../assets/interface_strawberry_icon.png";
  import timerIcon from "../../assets/interface_timer_icon.png";

  import logo1 from "../../assets/level_1_logo_prologue.png";
  import logo2 from "../../assets/level_2_logo_forsakencity.png";
  import logo3 from "../../assets/level_3_logo_oldsite.png";
  import logo4 from "../../assets/level_4_logo_celestialresort.png";
  import logo5 from "../../assets/level_5_logo_goldenridge.png";
  import logo6 from "../../assets/level_6_logo_mirrortemple.png";
  import logo7 from "../../assets/level_7_logo_reflection.png";
  import logo8 from "../../assets/level_8_logo_summit.png";
  import logo9 from "../../assets/level_9_logo_epilogue.png";
  import logo10 from "../../assets/level_10_logo_core.png";
  import logo11 from "../../assets/level_11_logo_farewell_both_front_back.png";

  type RunData = {
    levelName: string;
    levelSide: string;
    type: "Vanilla" | "Modded";
    attemptType: "Wings Golden" | "Normal" | "Golden Attempt";
    clearTime: number; // In milliseconds
    deaths: number;
    dashes: number;
    jumps: number;
    berriesAchieved: number;
    status: "Completed" | "Goldenberry completed" | "Attempted" | "PB";
    iconPath: string;
  };

  let rows: RunData[] = $state([]);

  onMount(async () => {
    console.log("On mount menu!!")
    try {
      rows = await invoke("runs_get_recent_ones");
      console.log(rows);
    } catch (e) {
      console.error(e);
    }
  });

  const headers = ["Level Name", "Side", "Type", "Attempt", "Time", "Deaths", "Dashes", "Berries achieved", "Status"];

  const deathIcons: Record<string, any> = {
    "SIDE A": sideADeaths,
    "SIDE B": sideBDeaths,
    "SIDE C": sideCDeaths
  };

  const heartIcons: Record<string, any> = {
    "SIDE A": sideAHeart,
    "SIDE B": sideBHeart,
    "SIDE C": sideCHeart
  };

  const levelLogos: Record<string, any> = {
    "Prologue": logo1,
    "Forsaken City": logo2,
    "Old Site": logo3,
    "Celestial Resort": logo4,
    "Golden Ridge": logo5,
    "Mirror Temple": logo6,
    "Reflection": logo7,
    "The Summit": logo8,
    "Epilogue": logo9,
    "Core": logo10,
    "Farewell": logo11
  };

  function getLevelIcon(row: RunData) {
    if (row.iconPath) return row.iconPath;
    const logo = levelLogos[row.levelName];
    if (logo) return logo.src || logo;
    return null;
  }

  function formatTime(ms: number): string {
    const milliseconds = Math.floor(ms % 1000);
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    const hStr = hours.toString().padStart(2, "0");
    const mStr = minutes.toString().padStart(2, "0");
    const sStr = seconds.toString().padStart(2, "0");
    const msStr = milliseconds.toString().padStart(3, "0");

    if (hours > 0) return `${hStr}:${mStr}:${sStr}.${msStr}`;
    return `${mStr}:${sStr}.${msStr}`;
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
        {@const levelIcon = getLevelIcon(row)}
        {@const IconData = levelIcon ? null : (row.type === 'Vanilla' ? iconMap.vanilla : iconMap.modded)}
        {@const isGolden = row.status === "Goldenberry completed"}
        <tr class="hover:bg-white/5 transition-all group border-l-2 {isGolden ? 'border-l-yellow-400 bg-yellow-400/5 shadow-[inset_0_0_20px_rgba(250,204,21,0.05)]' : 'border-l-transparent'}">
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded flex items-center justify-center {IconData ? IconData.bg : 'bg-zinc-800/50'} {IconData ? IconData.color : ''}">
                {#if levelIcon}
                  <img src={levelIcon} alt="" class="w-7 h-7 object-contain" />
                {:else if IconData}
                  <IconData.icon class="text-lg" />
                {/if}
              </div>
              <span class="font-bold text-zinc-200">{row.levelName}</span>
            </div>
          </td>
          <td class="px-6 py-4">
            <div class="flex items-center gap-2">
              {#if heartIcons[row.levelSide]}
                <img src={heartIcons[row.levelSide].src || heartIcons[row.levelSide]} alt="" class="w-4 h-4" />
              {/if}
              <span class="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 whitespace-nowrap">
                {row.levelSide}
              </span>
            </div>
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
          <td class="px-6 py-4 font-mono text-zinc-400">
            <div class="flex items-center gap-2">
              <img src={timerIcon.src || timerIcon} alt="" class="w-4 h-4 opacity-50" />
              {formatTime(row.clearTime)}
            </div>
          </td>
          <td class="px-6 py-4 text-zinc-400">
            <div class="flex items-center gap-2">
              <img src={(deathIcons[row.levelSide] || sideADeaths).src || (deathIcons[row.levelSide] || sideADeaths)} alt="" class="w-5 h-5" />
              {row.deaths}
            </div>
          </td>
          <td class="px-6 py-4 text-zinc-400">{row.dashes}</td>
          <td class="px-6 py-4 text-zinc-400">
            <div class="flex items-center gap-2">
              <img src={strawberryIcon.src || strawberryIcon} alt="" class="w-5 h-5" />
              {row.berriesAchieved}
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
