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
  activeChapterSid = $state<string | null>(null);
  activeMode = $state<string | null>(null);
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
        this.activeChapterSid = event.AreaSid;
        this.activeMode = event.Mode;
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
        this.activeChapterSid = null;
        this.activeMode = null;
        this.currentRun = null;
        this.fetchCampaigns();
        break;
    }
  }

  isChapterActive(sid: string, mode: string) {
    return this.activeChapterSid === sid && this.activeMode === mode;
  }

  absoluteBestAttempt = $derived.by(() => {
    if (this.runs.length === 0) return null;
    return this.runs.reduce((prev, curr) => (prev.deaths < curr.deaths ? prev : curr));
  });

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

  async fetchRuns(chapter_id: number) {
    try {
      this.runs = await invoke<Run[]>("get_runs", { chapterId: chapter_id });
      this.activeChapterId = chapter_id;
    } catch (e) {
      console.error(e);
    }
  }

  async updateRun(runId: number, deaths: number, strawberries: number) {
    try {
      await invoke("update_run", { runId, deaths, strawberries });
      if (this.activeChapterId) await this.fetchRuns(this.activeChapterId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async deleteRun(runId: number) {
    try {
      await invoke("delete_run", { runId });
      if (this.activeChapterId) await this.fetchRuns(this.activeChapterId);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}

export const syncStore = new SyncStore();
