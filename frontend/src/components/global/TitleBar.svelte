<script lang="ts">
  import { QuitApp } from "../../../wailsjs/go/main/App";
  import { EventsOn, WindowMinimise, WindowToggleMaximise } from "../../../wailsjs/runtime";
  import IconClose from "~icons/material-symbols/close";
  import IconRemove from "~icons/material-symbols/remove";
  import IconSquareOutline from "~icons/material-symbols/square-outline";
  import IconArrowBack from "~icons/material-symbols/arrow-back";
  import { tick } from "svelte";

  import StrawberryRedGif from "../../assets/gifs/red_strawberryy.gif";
  import StrawberryWingsGif from "../../assets/gifs/red_strawberrywings.gif";
  import gsap from "gsap";

  const closeEventName = "app:close-requested";
  const closeAnimation = {
    testFadeDuration: 0.12,
    popDuration: 0.1,
    pauseDuration: 0.03,
    flyDuration: 0.18,
    linesDuration: 0.14,
    quitDelayMs: 20,
  };

  let showClosingAnimation = $state(false);
  let containerEl = $state<HTMLElement | null>(null);
  let linesWrapperEl = $state<HTMLElement | null>(null);
  let isHomePage = $state(true);

  $effect(() => {
    const checkPath = () => {
      isHomePage = window.location.pathname === "/" || window.location.pathname === "/index.html";
    };
    checkPath();
    
    // Watch for navigation events
    window.addEventListener("popstate", checkPath);
    document.addEventListener("astro:after-swap", checkPath);

    return () => {
      window.removeEventListener("popstate", checkPath);
      document.removeEventListener("astro:after-swap", checkPath);
    };
  });

  async function handleClose(isTest = false) {
    if (showClosingAnimation) return;
    showClosingAnimation = true;

    // Wait for Svelte to render the animation overlay
    await tick();

    if (containerEl && linesWrapperEl) {
      const lines = linesWrapperEl.querySelectorAll(".speed-line");

      // 1. Setup initial states
      gsap.set(containerEl, { opacity: 0, scale: 0.7, y: 24 });
      // Start lines with some visibility as requested
      gsap.set(lines, { opacity: 0.3, y: -100 });

      // 2. Infinite background animations
      lines.forEach((line) => {
        gsap.to(line, {
          y: window.innerHeight + 200,
          duration: "random(0.1, 0.18)",
          repeat: -1,
          ease: "none",
          delay: "random(0, 0.08)",
          opacity: "random(0.4, 0.7)", // Higher opacity for clearer effect
        });
      });

      // 3. Main sequence timeline
      const tl = gsap.timeline({
        onComplete: () => {
          if (isTest) {
            gsap.to([containerEl, linesWrapperEl], {
              opacity: 0,
              duration: closeAnimation.testFadeDuration,
              onComplete: () => {
                showClosingAnimation = false;
              },
            });
            return;
          }
          setTimeout(() => QuitApp(), closeAnimation.quitDelayMs);
        },
      });

      // Pop in strawberry
      tl.to(containerEl, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: closeAnimation.popDuration,
        ease: "back.out(1.7)",
      })
        // Pause briefly
        .to({}, { duration: closeAnimation.pauseDuration })
        // Blast off!
        .to(containerEl, {
          y: -window.innerHeight - 300,
          duration: closeAnimation.flyDuration,
          ease: "power4.in",
        })
        // Speed lines acceleration (simulated by moving the wrapper)
        .to(
          linesWrapperEl,
          {
            y: window.innerHeight,
            duration: closeAnimation.linesDuration,
            ease: "power2.in",
          },
          "-=0.17"
        );
    } else {
      if (!isTest) QuitApp();
      else showClosingAnimation = false;
    }
  }

  // Dev shortcut: Alt + Shift + D
  $effect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "F4") {
        e.preventDefault();
        handleClose(false);
        return;
      }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleClose(true);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  });

  $effect(() => {
    return EventsOn(closeEventName, () => handleClose(false));
  });
</script>

{#if showClosingAnimation}
  <div
    class="fixed inset-0 z-200 flex items-center justify-center bg-zinc-950/70 backdrop-blur-sm pointer-events-auto overflow-hidden"
  >
    <!-- Speed Lines -->
    <div bind:this={linesWrapperEl} class="speed-lines-wrapper absolute inset-0 pointer-events-none">
      {#each Array(40)}
        <div
          class="speed-line absolute w-[2px] h-32 bg-linear-to-b from-transparent via-white/60 to-transparent"
          style="left: {Math.random() * 100}%; top: -25%;"
        ></div>
      {/each}
    </div>

    <div bind:this={containerEl} class="closing-container relative flex flex-col items-center">
      <img
        src={StrawberryWingsGif.src}
        alt="flying strawberry"
        class="closing-strawberry w-64 h-64 object-contain"
      />
    </div>
  </div>
{/if}

<div
  class="fixed top-0 left-0 w-full h-8 bg-zinc-950/90 backdrop-blur-sm border-b border-outline-muted flex justify-between items-center z-[100]"
  style="--wails-draggable:drag"
>
  <div class="flex items-center gap-2 px-4 h-full">
    {#if !isHomePage}
      <button
        onclick={() => window.history.back()}
        class="no-drag h-full px-2 -ml-2 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
        title="Go Back"
      >
        <IconArrowBack class="w-4 h-4" />
      </button>
    {/if}
    <a href="/" class="no-drag flex items-center gap-2 cursor-pointer group">
      <img src={StrawberryRedGif.src} alt="strawberry_red_gif" class="w-auto h-6 object-contain" />
      <span class="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300 transition-colors">The Celeste Tracker</span>
    </a>
  </div>

  <div class="flex items-center h-full no-drag" style="--wails-draggable:no-drag">
    <button
      onclick={WindowMinimise}
      class="h-full px-3 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
      title="Minimize"
    >
      <IconRemove class="w-4 h-4" />
    </button>
    <button
      onclick={WindowToggleMaximise}
      class="h-full px-3 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
      title="Maximize"
    >
      <IconSquareOutline class="w-3.5 h-3.5" />
    </button>
    <button
      onclick={() => handleClose(false)}
      class="h-full px-3 text-zinc-500 hover:text-white hover:bg-red-600 transition-colors"
      title="Close"
    >
      <IconClose class="w-4 h-4" />
    </button>
  </div>
</div>

<style>
  .no-drag {
    --wails-draggable: no-drag;
  }
</style>
