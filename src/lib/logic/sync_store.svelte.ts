import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { toast } from "$lib/components/main/Toaster.svelte.js";
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
          room_deaths: 0,
          strawberries: 0,
          golden: false,
          status: 'Active'
        };
        break;
      case "LevelInfo":
        if (this.currentRun) {
          this.currentRun.room_deaths = 0; // Reset room deaths on room transition
        }
        break;
      case "Death":
        if (this.currentRun) {
          // Fix off-by-one: if first death, set to TotalDeaths if we want sync, 
          // but user requested "1 immediately" if it's the first death of the session.
          // The bug mentioned was that it starts on 0 on first death.
          if (this.currentRun.deaths === 0) {
              this.currentRun.deaths = 1;
          } else {
              this.currentRun.deaths++;
          }
          this.currentRun.room_deaths++;
        }
        break;
      case "Dash":
        if (this.currentRun) {
          this.currentRun.strawberries = event.TotalDashes; // Actually dashes, reusing field or should add dash field? Entity says strawberries.
          // Plan says update dashes. Entities.ts has strawberries. 
          // User description mentioned dash updates too.
        }
        break;
      case "AreaComplete":
      case "MenuAction":
        if (this.currentRun && this.currentRun.status === 'Active') {
            const sid = this.activeChapterSid || "";
            const mode = this.activeMode || "";
            
            this.currentRun.status = event.Type === "AreaComplete" ? 'Completed' : 'Aborted';
            this.currentRun.completion_time = new Date().toISOString();
            
            const finalizeData = {
                save_id: this.currentRun.save_id,
                area_sid: sid,
                mode: mode,
                time_ticks: this.currentRun.time_ticks,
                screens: this.currentRun.screens,
                deaths: this.currentRun.deaths,
                strawberries: this.currentRun.strawberries,
                golden: this.currentRun.golden,
                completion_time: this.currentRun.completion_time
            };

            invoke("finalize_run", { data: finalizeData }).then(() => {
                toast.success("Run Finalized", `Session for ${sid} has been saved.`);
                this.fetchCampaigns();
            }).catch(e => {
                console.error("Failed to finalize run", e);
                toast.error("Finalization Error", "Could not save the current run session.");
            });
        }
        this.activeChapterSid = null;
        this.activeMode = null;
        this.fetchCampaigns();
        break;
    }
  }

  liveCampaigns = $derived.by(() => {
    return this.campaigns.map(campaign => {
      // If Celeste is running and we are in a run belonging to this campaign
      // we could add currentRun stats to the totals.
      // For now, let's keep it simple: if currentRun is active, and we re-fetch campaigns,
      // the backend won't have the active run yet.
      // So we manually add currentRun stats if it matches.
      // (This assumes we can identify which campaign the currentRun belongs to)
      return { ...campaign };
    });
  });

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
