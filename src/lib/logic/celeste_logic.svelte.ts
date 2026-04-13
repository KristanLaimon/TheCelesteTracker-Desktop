import { toast } from "$lib/components/main/Toaster.svelte.js";
import { celesteState } from "$lib/types/celeste_state.svelte";
import type { CelesteEvent } from "$lib/types/events";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { onMount } from "svelte";

export function useCelesteLogic() {
  let wsStatus = $state<"connected" | "disconnected">("disconnected");
  let lastUrl = $state("");

  const handleEvent = (payload: CelesteEvent) => {
    celesteState.currentEvent = payload;
    celesteState.isConnected = true;

    switch (payload.Type) {
      case "DatabaseLocation":
        celesteState.everestVersion = payload.EverestVersion;
        celesteState.modVersion = payload.ModVersion;
        toast.success(
          "Connected to Celeste Client",
          `Everest: ${payload.EverestVersion} | Mod: ${payload.ModVersion}`,
        );
        break;
      case "LevelStart":
      case "LevelInfo":
        celesteState.activeLevel = {
          AreaSid: payload.AreaSid,
          RoomName: payload.RoomName,
          Mode: payload.Mode,
        };
        break;
      case "Death":
        celesteState.stats.totalDeaths = payload.TotalDeaths;
        celesteState.stats.roomDeaths = payload.RoomDeaths;
        break;
      case "Dash":
        celesteState.stats.totalDashes = payload.TotalDashes;
        break;
      case "MenuAction":
        celesteState.activeLevel = null;
        break;
    }
  };

  onMount(() => {
    // Check for cached initial state
    invoke<CelesteEvent | null>("get_celeste_initial_state").then((cached) => {
      if (cached) {
        console.log("RECOVERED CACHED STATE", cached);
        handleEvent(cached);
      }
    });

    const unlistenConnected = listen<string>("ws-connected", (event) => {
      console.log("WS CONNECTED EVENT RECEIVED", event.payload);
      wsStatus = "connected";
      celesteState.isConnected = true;
      lastUrl = event.payload;
    });

    const unlistenDisconnected = listen<string>("ws-disconnected", (event) => {
      console.log("WS DISCONNECTED EVENT RECEIVED", event.payload);
      wsStatus = "disconnected";
      celesteState.isConnected = false;
      toast.warning(
        "Celeste Connection Lost",
        "The game was closed or the connection was interrupted. Retrying...",
      );
    });

    const unlistenEvents = listen<CelesteEvent>("celeste-event", (event) => {
      handleEvent(event.payload);
    });

    return () => {
      unlistenConnected.then((f) => f());
      unlistenDisconnected.then((f) => f());
      unlistenEvents.then((f) => f());
    };
  });

  return {
    get wsStatus() {
      return wsStatus;
    },
    get lastUrl() {
      return lastUrl;
    },
  };
}
