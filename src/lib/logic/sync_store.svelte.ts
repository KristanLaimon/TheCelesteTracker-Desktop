import { toast } from "$lib/components/main/Toaster.svelte.js";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { Campaign, CelesteEvent, Chapter, GameSession, RecentRun } from "../types/entities";

class SyncStore {
  campaigns = $state<Campaign[]>([]);
  recentRuns = $state<RecentRun[]>([]);
  activeCampaignId = $state<number | null>(null);
  activeChapterSid = $state<string | null>(null);
  activeSideId = $state<string | null>(null);
  chapters = $state<Chapter[]>([]);
  runs = $state<GameSession[]>([]);
  activeSlot = $state<number | null>(null);
  isWsConnected = $state(false);
  currentRun = $state<GameSession | null>(null);
  currentRoomDeaths = $state(0);

  constructor() {
    this.init();
  }

  async init() {
    try {
      const data = await invoke<{ campaigns: Campaign[] }>("fetch_all_stats");
      this.campaigns = data.campaigns;
      this.fetchRecentRuns();
    } catch (e) {
      console.error("Failed to fetch initial stats", e);
    }

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
        this.fetchCampaigns();
        this.fetchRecentRuns();
        break;
      case "LevelStart":
        this.activeChapterSid = event.AreaSid;
        this.activeSideId = event.Mode;
        this.currentRoomDeaths = 0;
        this.currentRun = {
          id: "active-session",
          chapter_side_id: -1,
          date_time_start: new Date().toISOString(),
          duration_ms: 0,
          is_goldenberry_attempt: false,
          is_goldenberry_completed: false,
          total_deaths: 0,
          status: "Active",
        };
        break;
      case "LevelInfo":
        this.currentRoomDeaths = 0;
        break;
      case "Death":
        if (this.currentRun) {
          this.currentRun.total_deaths++;
          this.currentRoomDeaths++;
        }
        break;
      case "AreaComplete":
      case "MenuAction":
        if (this.currentRun && this.currentRun.status === "Active") {
          const sid = this.activeChapterSid || "";
          const mode = this.activeSideId || "";

          this.currentRun.status = event.Type === "AreaComplete" ? "Completed" : "Aborted";
          
          const finalizeData = {
            save_id: this.activeSlot || 0,
            area_sid: sid,
            mode: mode,
            duration_ms: this.currentRun.duration_ms,
            deaths: this.currentRun.total_deaths,
            golden: this.currentRun.is_goldenberry_attempt,
            completion_time: this.currentRun.date_time_start,
          };

          invoke("finalize_run", { data: finalizeData })
            .then(() => {
              toast.success("Run Finalized", `Session for ${sid} has been saved.`);
              this.fetchCampaigns();
              this.fetchRecentRuns();
            })
            .catch((e) => {
              console.error("Failed to finalize run", e);
              toast.error("Finalization Error", "Could not save the current run session.");
            });
        }
        this.activeChapterSid = null;
        this.activeSideId = null;
        this.currentRun = null;
        this.fetchCampaigns();
        this.fetchRecentRuns();
        break;
    }
  }

  isChapterActive(sid: string, side_id: string) {
    return this.activeChapterSid === sid && this.activeSideId === side_id;
  }

  absoluteBestAttempt = $derived.by(() => {
    if (this.runs.length === 0) return null;
    return this.runs.reduce((prev, curr) =>
      prev.total_deaths < curr.total_deaths ? prev : curr,
    );
  });

  async fetchCampaigns() {
    try {
      this.campaigns = await invoke<Campaign[]>("get_campaigns");
    } catch (e) {
      console.error(e);
    }
  }

  async fetchRecentRuns() {
    try {
      this.recentRuns = await invoke<RecentRun[]>("get_recent_runs");
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

  async fetchRuns(chapter_sid: string, side_id: string) {
    try {
      this.runs = await invoke<GameSession[]>("get_runs", { chapterSid: chapter_sid, sideId: side_id });
      this.activeChapterSid = chapter_sid;
      this.activeSideId = side_id;
    } catch (e) {
      console.error(e);
    }
  }

  async deleteRun(session_id: string) {
    try {
      await invoke("delete_run", { sessionId: session_id });
      if (this.activeChapterSid && this.activeSideId) {
        await this.fetchRuns(this.activeChapterSid, this.activeSideId);
      }
      this.fetchRecentRuns();
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}

export const syncStore = new SyncStore();
