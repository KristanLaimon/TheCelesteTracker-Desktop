<script lang="ts">
  import { onMount } from "svelte";
  import {
    IndexModAssets,
    ValidateCelesteInstall,
  } from "../../../wailsjs/go/main/App";
  import ScreenSaver from "./ScreenSaver.svelte";
  import IconCheckCircle from "~icons/material-symbols/check-circle";
  import IconError from "~icons/material-symbols/error";
  import IconExtensionOff from "~icons/material-symbols/extension-off";
  import loadingOne from "../../assets/loading_1.png";
  import loadingTwo from "../../assets/loading_2.png";
  import loadingThree from "../../assets/loading_3.png";

  type ValidationResult = {
    celesteInstalled: boolean;
    everestInstalled: boolean;
    celestePath: string;
    modsPath: string;
    message: string;
  };

  const fetchingDelayMs = 900;
  const loadingFrames = [loadingOne, loadingTwo, loadingThree];

  let validation = $state<ValidationResult | null>(null);
  let validationDismissed = $state(false);
  let showFetchingAssets = $state(false);
  let fetchingDetail = $state("Scanning installed mods and preparing chapter icons.");

  function validationNeedsAttention(result: ValidationResult | null) {
    return Boolean(result && (!result.celesteInstalled || !result.everestInstalled));
  }

  function validationText(result: ValidationResult) {
    if (!result.celesteInstalled) return "Celeste was not found";
    if (!result.everestInstalled) return "Everest was not found";
    return "Celeste is ready";
  }

  function validationDetail(result: ValidationResult) {
    if (!result.celesteInstalled) {
      return "The app could not find a Steam Celeste installation on this system. You can close this message and keep browsing the app.";
    }
    if (!result.everestInstalled) {
      return `Celeste was found at ${result.celestePath}, but Everest Mod Loader was not detected. You can close this message and continue.`;
    }
    return result.message;
  }

  onMount(() => {
    let delayTimer: ReturnType<typeof setTimeout> | null = null;

    const runStartup = async () => {
      try {
        validation = await ValidateCelesteInstall();
      } catch (error) {
        validation = {
          celesteInstalled: false,
          everestInstalled: false,
          celestePath: "",
          modsPath: "",
          message: String(error),
        };
      }

      delayTimer = setTimeout(() => {
        showFetchingAssets = true;
      }, fetchingDelayMs);

      try {
        const result = await IndexModAssets();
        fetchingDetail = `${result.iconsCopied} icons copied from ${result.modsScanned} mods.`;
        window.dispatchEvent(new CustomEvent("celeste-assets-indexed", { detail: result }));
      } catch (error) {
        console.warn("Failed to index mod assets:", error);
      } finally {
        if (delayTimer) clearTimeout(delayTimer);
        showFetchingAssets = false;
      }
    };

    runStartup();

    return () => {
      if (delayTimer) clearTimeout(delayTimer);
    };
  });
</script>

{#if validationNeedsAttention(validation) && !validationDismissed}
  <ScreenSaver
    text={validationText(validation!)}
    detail={validationDetail(validation!)}
    dismissible
    onDismiss={() => (validationDismissed = true)}
  >
    {#if validation?.celesteInstalled}
      <IconExtensionOff class="h-24 w-24 text-tertiary drop-shadow-[0_0_28px_rgba(255,201,113,0.25)]" />
    {:else}
      <IconError class="h-24 w-24 text-primary drop-shadow-[0_0_28px_rgba(255,120,140,0.25)]" />
    {/if}
  </ScreenSaver>
{/if}

{#if showFetchingAssets}
  <ScreenSaver text="Fetching assets..." detail={fetchingDetail}>
    <div class="relative h-32 w-32">
      {#each loadingFrames as frame, index (frame.src)}
        <img
          src={frame.src}
          alt=""
          class="absolute inset-0 h-full w-full object-contain opacity-0 drop-shadow-[0_14px_34px_rgba(0,0,0,0.45)] [animation:asset-frame_1.05s_steps(1,end)_infinite]"
          style="animation-delay: {index * 0.35}s"
        />
      {/each}
      <IconCheckCircle class="absolute -right-4 -bottom-3 h-9 w-9 text-secondary" />
    </div>
  </ScreenSaver>
{/if}

<style>
  @keyframes asset-frame {
    0%,
    32% {
      opacity: 1;
    }
    33%,
    100% {
      opacity: 0;
    }
  }
</style>
