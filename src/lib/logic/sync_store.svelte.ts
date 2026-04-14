import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { Campaign, Chapter, Run, CelesteEvent } from "../types/entities";

class SyncStore {
  campaigns = $state<Campaign[]>([]);
  activeCampaignId = $state<number | null>(null);
  activeChapterId = $state<number | null>(null);
  chapters = $state<Chapter[]>([]);
  runs = $state<Run[]>([]);
  activeSlot = $state<number | null>(null);
  isWsConnected = $state(false);
  currentRun = $state<Run | null>(null);

  constructor() {
    this.init();
  }

  async init() {
    // Load initial stats if available
    try {
      const data = await invoke<{ campaigns: Campaign[] }>("fetch_all_stats");
      this.campaigns = data.campaigns;
    } catch (e) {
      console.error("Failed to fetch initial stats", e);
    }

    // Listen for WebSocket events
    await listen<CelesteEvent>("celeste-event", (event) => {
      this.handleEvent(event.payload);
    });

    await listen<string>("ws-connected", () => {
      this.isWsConnected = true;
    });

    await listen<string>("ws-disconnected", () => {
      this.isWsConnected = false;
    });
  }

  handleEvent(event: CelesteEvent) {
    switch (event.Type) {
      case "DatabaseLocation":
        // Trigger a re-fetch of everything when DB path is synced
        this.fetchCampaigns();
        break;
      case "LevelStart":
        this.currentRun = {
          id: -1,
          save_id: this.activeSlot || 0,
          chapter_id: -1,
          completion_time: null,
          time_ticks: 0,
          screens: 0,
          deaths: 0,
          strawberries: 0,
          golden: false,
        };
        break;
      case "Death":
        if (this.currentRun) {
          this.currentRun.deaths = event.TotalDeaths;
        }
        break;
      case "AreaComplete":
        this.currentRun = null;
        this.fetchCampaigns();
        break;
    }
  }

  async fetchCampaigns() {
    try {
      this.campaigns = await invoke<Campaign[]>("get_campaigns");
    } catch (e) {
      console.error(e);
    }
  }

  async fetchChapters(campaignId: number) {
    try {
      this.chapters = await invoke<Chapter[]>("get_chapters", { campaignId });
      this.activeCampaignId = campaignId;
    } catch (e) {
      console.error(e);
    }
  }

  async fetchRuns(chapterId: number) {
    try {
      this.runs = await invoke<Run[]>("get_runs", { chapterId });
      this.activeChapterId = chapterId;
    } catch (e) {
      console.error(e);
    }
  }
}

export const syncStore = new SyncStore();
