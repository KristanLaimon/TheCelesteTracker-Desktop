<script lang="ts">
import { onMount } from 'svelte';
import CenteredLayout from '../layouts/CenteredLayout.svelte';
import { GetDependency } from '../setup';
import Everest from '../libs/Everest';
import type { EverestModInfo } from '../libs/Everest';
import { Log_Info } from '../libs/Logger';
import MaddiesApi from '../libs/MaddiesAPI';
import type { MaddiesApi_ModInfo } from '../libs/MaddiesAPI';

const EVEREST = GetDependency(Everest);
const MaddiesAPI = GetDependency(MaddiesApi);

let mods: EverestModInfo[] = $state([]);
let modsWithInfo: MaddiesApi_ModInfo[] = $state([]);
let unmatchedMods: EverestModInfo[] = $state([]);
let searchQuery: string = $state('');
let isLoading: boolean = $state(false);
let error: string | null = $state(null);

let filteredMods = $derived.by(() => {
  if (!searchQuery.trim()) return modsWithInfo;
  const q = searchQuery.toLowerCase();
  return modsWithInfo.filter((mod) =>
    mod.Name.toLowerCase().includes(q) ||
    mod.Author.toLowerCase().includes(q) ||
    mod.Description.toLowerCase().includes(q),
  );
});

let filteredUnmatched = $derived.by(() => {
  if (!searchQuery.trim()) return unmatchedMods;
  const q = searchQuery.toLowerCase();
  return unmatchedMods.filter((mod) => {
    const metaName = mod.metadata.name ?? '';
    return mod.name.toLowerCase().includes(q) || metaName.toLowerCase().includes(q);
  });
});

onMount(() => { GetModsInfo(); });

async function GetModsInfo() {
  isLoading = true;
  error = null;
  try {
    mods = await EVEREST.GetModsInstalled({ modsCountScanningLimit: 150 });
    Log_Info('InstalledMods:', 'Found Mods:', mods);
    const results = await Promise.allSettled(
      mods.map(async (modInfo) => {
        const apiRes = (await MaddiesAPI.SearchModByName(modInfo.name.replace('.zip', '')))[0];
        return { modInfo, apiRes: apiRes ?? null } as const;
      }),
    );
    const matched: MaddiesApi_ModInfo[] = [];
    const unmatched: EverestModInfo[] = [];
    for (let i = 0; i < mods.length; i++) {
      const r = results[i];
      if (r.status === 'fulfilled' && r.value.apiRes) {
        matched.push(r.value.apiRes);
      } else {
        unmatched.push(mods[i]);
      }
    }
    modsWithInfo = matched.filter(
      (mod, i, arr) => arr.findIndex((m) => m.GameBananaId === mod.GameBananaId) === i,
    );
    unmatchedMods = unmatched;
    Log_Info('InstalledMods:', 'Found Mods with maddiesapi:', modsWithInfo);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to fetch mods';
  } finally {
    isLoading = false;
  }
}

function LimitText(desc: string, limitCharsCount: number): string {
  if (desc.length < limitCharsCount) return desc;
  return `${desc.slice(0, limitCharsCount)}...`;
}

function GetCoverUrl(mod: MaddiesApi_ModInfo): string {
  return mod.MirroredScreenshots?.[0] ?? mod.Screenshots?.[0] ?? '';
}

function FormatDownloads(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}
</script>

<CenteredLayout>
  <main class="root">
    <header class="header">
      <input
        class="search"
        type="text"
        name="search"
        placeholder="Search installed mods..."
        bind:value={searchQuery}
      />
    </header>

    {#if isLoading}
      <div class="state-msg">Loading mods...</div>
    {:else if error}
      <div class="state-msg error">{error}</div>
    {:else}
      <div class="scroll-area">
        {#if filteredMods.length > 0}
          <article class="content">
            {#each filteredMods as mod (mod.GameBananaId + mod.Name)}
              <article class="card">
                {#if GetCoverUrl(mod)}
                  <header class="card-img">
                    <img
                      src={GetCoverUrl(mod)}
                      alt={`${mod.Name} cover`}
                      loading="lazy"
                    />
                  </header>
                {/if}
                <div class="card-body">
                  <h2 class="card-title">{mod.Name}</h2>
                  <p class="card-author">{mod.Author}</p>
                  <p class="card-desc">{LimitText(mod.Description, 120)}</p>
                  <footer class="card-footer">
                    <span class="card-downloads">{FormatDownloads(mod.Downloads)} downloads</span>
                  </footer>
                </div>
              </article>
            {/each}
          </article>
        {:else if filteredUnmatched.length === 0}
          <div class="state-msg">
            {#if searchQuery}
              No mods match &ldquo;{searchQuery}&rdquo;
            {:else}
              No mods found
            {/if}
          </div>
        {/if}

        {#if filteredUnmatched.length > 0}
          <section class="unmatched-section">
            <h3 class="unmatched-heading">
              Unmatched Mods ({filteredUnmatched.length})
            </h3>
            <div class="unmatched-grid">
              {#each filteredUnmatched as mod (mod.name)}
                <article class="unmatched-card">
                  <span class="unmatched-type-badge">{mod.isZip ? 'ZIP' : 'DIR'}</span>
                  <div class="unmatched-body">
                    <h4 class="unmatched-name">{mod.metadata.name || mod.name}</h4>
                    <p class="unmatched-meta">
                      {#if mod.metadata.version}
                        v{mod.metadata.version} &middot;
                      {/if}
                      {mod.name}
                    </p>
                  </div>
                </article>
              {/each}
            </div>
          </section>
        {/if}
      </div>
    {/if}

    <button class="fetch-btn" onclick={() => GetModsInfo()} disabled={isLoading}>
      {isLoading ? 'Loading...' : 'Refresh Mod Data'}
    </button>
  </main>
</CenteredLayout>

<style>
  .root {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 24px;
    gap: 20px;
    overflow: hidden;
  }

  .header {
    display: flex;
    gap: 12px;
    flex-shrink: 0;
  }

  .search {
    flex: 1;
    padding: 10px 16px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(30, 30, 32, 0.8);
    color: #f1f5f9;
    font-size: 14px;
    font-family: var(--font-inter, system-ui), sans-serif;
    outline: none;
    transition: border-color 0.15s;
  }

  .search::placeholder {
    color: #555558;
  }

  .search:focus {
    border-color: rgba(255, 255, 255, 0.25);
  }

  .content {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
    padding: 4px;
  }

  .scroll-area {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .card {
    background: rgba(30, 30, 32, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    overflow: hidden;
    transition: background 0.15s, border-color 0.15s, transform 0.15s;
  }

  .card:hover {
    background: rgba(40, 40, 44, 0.8);
    border-color: rgba(255, 255, 255, 0.12);
    transform: translateY(-2px);
  }

  .card-img {
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: #0a0c14;
  }

  .card-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .card-body {
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: #f1f5f9;
    margin: 0;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-author {
    font-size: 12px;
    color: #727276;
    margin: 0;
  }

  .card-desc {
    font-size: 13px;
    color: #a1a1a6;
    margin: 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    overflow: hidden;
  }

  .card-footer {
    margin-top: 4px;
  }

  .card-downloads {
    font-size: 12px;
    color: #555558;
  }

  .unmatched-section {
    height: fit-content;
    flex-shrink: 0;
  }

  .unmatched-heading {
    font-size: 13px;
    font-weight: 600;
    color: #727276;
    margin: 0 0 12px 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .unmatched-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 8px;
    padding: 4px;
  }

  .unmatched-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: rgba(30, 30, 32, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    transition: background 0.15s;
  }

  .unmatched-card:hover {
    background: rgba(40, 40, 44, 0.6);
  }

  .unmatched-type-badge {
    font-size: 10px;
    font-weight: 700;
    color: #555558;
    background: rgba(255, 255, 255, 0.06);
    padding: 2px 6px;
    border-radius: 4px;
    flex-shrink: 0;
    letter-spacing: 0.3px;
  }

  .unmatched-body {
    min-width: 0;
    flex: 1;
  }

  .unmatched-name {
    font-size: 13px;
    font-weight: 500;
    color: #f1f5f9;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .unmatched-meta {
    font-size: 11px;
    color: #555558;
    margin: 2px 0 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .state-msg {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #727276;
    font-size: 15px;
  }

  .state-msg.error {
    color: #ef4444;
  }

  .fetch-btn {
    flex-shrink: 0;
    padding: 10px 20px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(30, 30, 32, 0.8);
    color: #f1f5f9;
    font-size: 13px;
    font-family: var(--font-inter, system-ui), sans-serif;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }

  .fetch-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .fetch-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
scr