<script lang="ts">
  import { QuitApp } from "../../../wailsjs/go/main/App";
  import { WindowMinimise, WindowToggleMaximise } from "../../../wailsjs/runtime";
  import IconClose from "~icons/material-symbols/close";
  import IconRemove from "~icons/material-symbols/remove";
  import IconSquareOutline from "~icons/material-symbols/square-outline";
  import { tick } from "svelte";

  import StrawberryRedGif from "../../assets/gifs/red_strawberryy.gif";
  import StrawberryWingsGif from "../../assets/gifs/red_strawberrywings.gif";
  import gsap from "gsap";

  let showClosingAnimation = $state(false);
  let containerEl = $state<HTMLElement | null>(null);
  let linesWrapperEl = $state<HTMLElement | null>(null);

  async function handleClose(isTest = false) {
    if (showClosingAnimation) return;
    showClosingAnimation = true;

    // Wait for Svelte to render the animation overlay
    await tick();

    if (containerEl && linesWrapperEl) {
      const lines = linesWrapperEl.querySelectorAll(".speed-line");

      // 1. Setup initial states
      gsap.set(containerEl, { opacity: 0, scale: 0.5, y: 50 });
      // Start lines with some visibility as requested
      gsap.set(lines, { opacity: 0.3, y: -100 });

      // 2. Infinite background animations
      lines.forEach((line) => {
        gsap.to(line, {
          y: window.innerHeight + 200,
          duration: "random(0.3, 0.6)",
          repeat: -1,
          ease: "none",
          delay: "random(0, 0.5)",
          opacity: "random(0.4, 0.7)", // Higher opacity for clearer effect
        });
      });

      // 3. Main sequence timeline
      const tl = gsap.timeline({
        onComplete: () => {
          if (isTest) {
            gsap.to([containerEl, linesWrapperEl], {
              opacity: 0,
              duration: 0.5,
              onComplete: () => {
                showClosingAnimation = false;
              },
            });
            return;
          }
          setTimeout(() => QuitApp(), 400);
        },
      });

      // Pop in strawberry
      tl.to(containerEl, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.5,
        ease: "back.out(1.7)",
      })
        // Pause briefly
        .to({}, { duration: 0.3 })
        // Blast off!
        .to(containerEl, {
          y: -window.innerHeight - 300,
          duration: 0.8, // Slightly faster blast off
          ease: "power4.in",
        })
        // Speed lines acceleration (simulated by moving the wrapper)
        .to(
          linesWrapperEl,
          {
            y: window.innerHeight,
            duration: 0.6,
            ease: "power2.in",
          },
          "-=0.7"
        );
    } else {
      if (!isTest) QuitApp();
      else showClosingAnimation = false;
    }
  }

  // Dev shortcut: Alt + Shift + D
  $effect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleClose(true);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  });
</script>

{#if showClosingAnimation}
  <div
    class="fixed inset-0 z-200 flex items-center justify-center bg-zinc-950/80 backdrop-blur-xl pointer-events-auto cursor-wait overflow-hidden"
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
  <div class="flex items-center gap-2 px-4 pointer-events-none">
    <img src={StrawberryRedGif.src} alt="strawberry_red_gif" class="w-auto h-6 object-contain" />
    <span class="text-[10px] font-bold uppercase tracking-widest text-zinc-500">The Celeste Tracker</span>
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

  .closing-text {
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
  }
</style>
