<script lang="ts">
  import { onMount } from "svelte";
  import { filesystem, window as neuWindow } from "@neutralinojs/lib";
  import ExampleUsage from "./ExampleUsage.svelte";

  // Svelte 5 state management using Runes
  let count = $state(0);
  let files = $state<string[]>([]);
  let isNativeConnected = $state(false);
  let errorMsg = $state("");
  let showFiles = $state(false);

  onMount(async () => {
    // Attempt to show window (important in Neutralino apps configured with "hidden": true)
    try {
      await neuWindow.show();
    } catch (err: unknown) {
      console.log("Not running in Neutralino or failed to show window:", err);
    }

    // Try reading directory contents via Neutralino native filesystem API
    try {
      const items = await filesystem.readDirectory("./");
      files = items
        .filter(item => item.entry !== "." && item.entry !== "..")
        .map(item => item.entry);
      isNativeConnected = true;
    } catch (err: unknown) {
      console.log("Failed to access Neutralino Native API:", err);
      errorMsg = String(err);
    }
  });

  function increment() {
    count += 1;
  }

  function decrement() {
    if (count > 0) {
      count -= 1;
    }
  }

  function reset() {
    count = 0;
  }
</script>

<main class="app-container">
  <div class="glow-background"></div>

  <header class="header">
    <div class="logo-wrapper">
      <div class="logo-circle">
        <svg class="orbit-svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(99, 102, 241, 0.2)" stroke-width="1.5" />
          <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(99, 102, 241, 0.4)" stroke-dasharray="10 5" stroke-width="1.5" class="rotating-dash" />
          <circle cx="50" cy="50" r="10" fill="#6366f1" class="pulse-center" />
        </svg>
      </div>
      <div class="brand">
        <h1>Neu<span> + Svelte + Typescript</span></h1>
      </div>
    </div>
  </header>

  <section class="stack-section">
    <h2>The Tech Stack</h2>
    <div class="stack-grid">
      <!-- Neutralino Card -->
      <div class="stack-card">
        <div class="card-icon-wrapper neu-bg">
          <svg class="tech-icon neu" viewBox="0 0 100 100">
            <ellipse cx="50" cy="50" rx="40" ry="15" fill="none" stroke="#22d3ee" stroke-width="4" transform="rotate(30 50 50)" />
            <ellipse cx="50" cy="50" rx="40" ry="15" fill="none" stroke="#22d3ee" stroke-width="4" transform="rotate(90 50 50)" />
            <ellipse cx="50" cy="50" rx="40" ry="15" fill="none" stroke="#22d3ee" stroke-width="4" transform="rotate(150 50 50)" />
            <circle cx="50" cy="50" r="8" fill="#22d3ee" />
          </svg>
        </div>
        <div class="card-content">
          <h3>Neutralino.js</h3>
          <span class="version-tag">v6.8.0</span>
          <p>Lightweight native desktop app runtime using system webview.</p>
        </div>
      </div>

      <!-- Svelte 5 Card -->
      <div class="stack-card">
        <div class="card-icon-wrapper svelte-bg">
          <svg class="tech-icon svelte" viewBox="0 0 128 128" fill="none">
            <path d="M84.3 14.8c-7.9-6.3-19.4-4.8-25.5 3.3L27.6 59.8c-1.5 2-1.3 4.8.5 6.6L71 106.6c6.3 5.7 16 5 21.6-1.5l31.2-36.6c7.9-9.3 6.4-23.2-3.3-30.7L84.3 14.8z" stroke="#ff3e00" stroke-width="8" stroke-linejoin="round" />
            <path d="M43.7 113.2c7.9 6.3 19.4 4.8 25.5-3.3l31.2-41.7c1.5-2 1.3-4.8-.5-6.6L60.5 21.4c-6.3-5.7-16-5-21.6 1.5L7.7 59.5c-7.9 9.3-6.4 23.2 3.3 30.7l32.7 23z" stroke="#ff3e00" stroke-width="8" stroke-linejoin="round" />
          </svg>
        </div>
        <div class="card-content">
          <h3>Svelte 5</h3>
          <span class="version-tag">v5.56.4</span>
          <p>Cybernetic UI compiler featuring highly-reactive Runes.</p>
        </div>
      </div>

      <!-- Vite Card -->
      <div class="stack-card">
        <div class="card-icon-wrapper vite-bg">
          <svg class="tech-icon vite" viewBox="0 0 128 128" fill="none">
            <defs>
              <linearGradient id="vite-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#41D1FF" />
                <stop offset="100%" stop-color="#BD34FE" />
              </linearGradient>
              <linearGradient id="bolt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FFEA79" />
                <stop offset="100%" stop-color="#FFBD3A" />
              </linearGradient>
            </defs>
            <path d="M110.8 19.3L64 100.3 17.2 19.3h93.6z" fill="url(#vite-grad)" />
            <path d="M72 10l-35 48h27L58 110l48-62H75l9-38z" fill="url(#bolt-grad)" />
          </svg>
        </div>
        <div class="card-content">
          <h3>Vite</h3>
          <span class="version-tag">v8.1.1</span>
          <p>Super-fast build tool and developer server (HMR).</p>
        </div>
      </div>

      <!-- TypeScript Card -->
      <div class="stack-card">
        <div class="card-icon-wrapper ts-bg">
          <svg class="tech-icon ts" viewBox="0 0 128 128" fill="none">
            <rect width="128" height="128" rx="16" fill="#3178C6" />
            <path d="M89.7 94.6c-1.8 1.4-4.2 2.2-7.1 2.2-4.5 0-7.8-2.6-7.8-8.2V58.8H62.7v-7.2h24.4v7.2H75.1v27.2c0 2.2 1.2 3.2 2.9 3.2 1.4 0 2.6-.5 3.4-1.1l8.3 5.3zM116.3 84.4c0 8.3-6.5 13.1-16 13.1-5.6 0-10.2-2.1-13-4.7l4.9-6c2.4 2.1 5.9 3.8 9 3.8 4.2 0 6.6-2 6.6-4.9 0-3.3-2.6-4.6-7.5-6.3-6.7-2.3-12-5.4-12-11.9 0-7.1 5.8-11.8 14.1-11.8 5.2 0 8.9 1.7 11.5 3.5l-4.2 6c-2.2-1.5-4.8-2.6-7.5-2.6-3.8 0-5.7 1.7-5.7 4 0 2.8 2.2 3.9 7 5.6 7 2.4 12.8 5.4 12.8 13.2z" fill="white" />
          </svg>
        </div>
        <div class="card-content">
          <h3>TypeScript</h3>
          <span class="version-tag">v6.0.2</span>
          <p>Static typing overlay giving IDE-grade intelligence.</p>
        </div>
      </div>
    </div>

    <!-- Configuration Note -->
    <div class="config-note">
      <div class="note-icon-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="note-icon">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </div>
      <div class="note-content">
        <h4>Neutralino Window Configuration Tip</h4>
        <p>
          The window is configured to start hidden (<code>"hidden": true</code>) in <code>neutralino.config.json</code> and is shown via <code>window.show()</code> inside <code>onMount</code>. <br>(A little trick to prevent the initial flash of unstyled contents!) <br>
          When you remove this svelte default template code, remember to set <code>"hidden": false</code> in the neutralino.config.json.
        </p>
      </div>
    </div>
  </section>

  <div class="interactive-section">
    <!-- Counter Card -->
    <div class="counter-card">
      <div class="counter-glow" style="transform: scale({1 + count * 0.02})"></div>
      <span class="card-label">Rune State Counter</span>
      
      <div class="counter-display">
        <span class="counter-number">{count}</span>
      </div>

      <div class="counter-actions">
        <button onclick={decrement} class="btn btn-secondary" aria-label="Decrement" disabled={count === 0}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="btn-icon">
            <path d="M5 12h14" />
          </svg>
        </button>
        <button onclick={reset} class="btn btn-tertiary" aria-label="Reset" disabled={count === 0}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="btn-icon">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
        <button onclick={increment} class="btn btn-primary" aria-label="Increment">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="btn-icon">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Neutralino File Inspector (Proof of APIs) -->
    <div class="inspector-card">
      <div class="inspector-header">
        <span class="card-label">App Directory Inspector</span>
        <button onclick={() => showFiles = !showFiles} class="btn-toggle" disabled={!isNativeConnected}>
          {showFiles ? "Hide Files" : "Show Files"}
        </button>
      </div>

      {#if isNativeConnected}
        <div class="inspector-body">
          <div class="info-row">
            <span class="info-label">Current Folder:</span>
            <code class="info-val">./</code>
          </div>
          <div class="info-row">
            <span class="info-label">Detected Files/Dirs:</span>
            <span class="info-badge">{files.length} items</span>
          </div>

          {#if showFiles}
            <div class="files-list">
              {#each files as file}
                <div class="file-item">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="file-icon">
                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
                    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                  </svg>
                  <span>{file}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {:else}
        <div class="inspector-body disabled">
          <p class="api-notice">
            {#if errorMsg}
              Error reading filesystem: <br><span class="error-text">{errorMsg}</span>
            {:else}
              Native API unavailable. Run this app inside Neutralino (`npm run dev`) to inspect the project directory.
            {/if}
          </p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Example Native Usage Examples -->
  <ExampleUsage />
  
  <footer class="footer">
    <p>NeutralinoJS template. Edit <code>src/App.svelte</code> to see your changes in real time.</p>
  </footer>
</main>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background-color: #05070f !important; /* Force darker background */
    color: #f1f5f9;
    overflow-x: hidden;
    min-height: 100vh;
    display: block !important; /* Override the center loader centering */
    height: auto !important;
  }

  .app-container {
    position: relative;
    max-width: 900px;
    margin: 0 auto;
    padding: 2.5rem 1.5rem;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    z-index: 1;
  }

  /* Radial glowing background */
  .glow-background {
    position: fixed;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100vw;
    height: 100vh;
    background: 
      radial-gradient(circle at 50% -10%, rgba(99, 102, 241, 0.15) 0%, transparent 60%),
      radial-gradient(circle at 10% 80%, rgba(14, 165, 233, 0.05) 0%, transparent 40%);
    z-index: -1;
    pointer-events: none;
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    padding-bottom: 1.5rem;
    animation: fadeInDown 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .logo-wrapper {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .logo-circle {
    width: 48px;
    height: 48px;
    position: relative;
  }

  .orbit-svg {
    width: 100%;
    height: 100%;
  }

  .rotating-dash {
    transform-origin: center;
    animation: spin 20s linear infinite;
  }

  .pulse-center {
    animation: pulseGlow 2s ease-in-out infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes pulseGlow {
    0%, 100% { fill: #6366f1; filter: drop-shadow(0 0 2px #6366f1); }
    50% { fill: #818cf8; filter: drop-shadow(0 0 6px #818cf8); }
  }

  .brand h1 {
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: 0.15em;
    margin: 0;
    color: #f8fafc;
  }

  .brand h1 span {
    background: linear-gradient(135deg, #6366f1, #38bdf8);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .brand p {
    font-size: 0.75rem;
    color: #64748b;
    margin: 2px 0 0 0;
    font-weight: 500;
    letter-spacing: 0.05em;
  }



  /* Stack Grid Section */
  .stack-section {
    animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
  }

  .stack-section h2 {
    font-size: 0.875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #64748b;
    margin: 0 0 1.25rem 0;
  }

  .stack-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .stack-card {
    display: flex;
    flex-direction: column;
    padding: 1.25rem;
    border-radius: 14px;
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(8px);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .stack-card:hover {
    transform: translateY(-4px);
    border-color: rgba(255, 255, 255, 0.12);
    background: rgba(15, 23, 42, 0.6);
    box-shadow: 0 12px 20px -10px rgba(0, 0, 0, 0.5);
  }

  .card-icon-wrapper {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .tech-icon {
    width: 22px;
    height: 22px;
  }

  /* Core Tech Brand Backgrounds & Shadows */
  .neu-bg {
    background: rgba(34, 211, 238, 0.1);
    box-shadow: 0 0 12px rgba(34, 211, 238, 0.05);
  }
  .svelte-bg {
    background: rgba(255, 62, 0, 0.1);
    box-shadow: 0 0 12px rgba(255, 62, 0, 0.05);
  }
  .vite-bg {
    background: rgba(189, 52, 254, 0.1);
    box-shadow: 0 0 12px rgba(189, 52, 254, 0.05);
  }
  .ts-bg {
    background: rgba(49, 120, 198, 0.1);
    box-shadow: 0 0 12px rgba(49, 120, 198, 0.05);
  }

  .card-content h3 {
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0 0 0.25rem 0;
    color: #f1f5f9;
  }

  .version-tag {
    display: inline-block;
    font-size: 0.7rem;
    font-family: monospace;
    font-weight: 600;
    color: #94a3b8;
    background: rgba(148, 163, 184, 0.1);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    margin-bottom: 0.5rem;
  }

  .card-content p {
    font-size: 0.8rem;
    color: #94a3b8;
    margin: 0;
    line-height: 1.4;
  }

  /* Interactive Elements Section */
  .interactive-section {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 1.5rem;
    animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
  }

  @media (max-width: 640px) {
    .interactive-section {
      grid-template-columns: 1fr;
    }
  }

  /* Counter Card */
  .counter-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2.25rem;
    border-radius: 16px;
    background: radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1) 0%, rgba(15, 23, 42, 0.5) 100%);
    border: 1px solid rgba(99, 102, 241, 0.2);
    overflow: hidden;
  }

  .counter-glow {
    position: absolute;
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%);
    filter: blur(10px);
    z-index: 0;
    pointer-events: none;
    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .card-label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #818cf8;
    margin-bottom: 1rem;
    z-index: 1;
  }

  .counter-display {
    z-index: 1;
    margin-bottom: 1.5rem;
  }

  .counter-number {
    font-size: 4.5rem;
    font-weight: 800;
    line-height: 1;
    background: linear-gradient(to bottom, #ffffff, #94a3b8);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
  }

  .counter-actions {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    z-index: 1;
  }

  .btn {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .btn-icon {
    width: 18px;
    height: 18px;
  }

  .btn-primary {
    background: #6366f1;
    color: #ffffff;
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
  }

  .btn-primary:hover:not(:disabled) {
    background: #4f46e5;
    transform: scale(1.08);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);
  }

  .btn-primary:active:not(:disabled) {
    transform: scale(0.95);
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.06);
    color: #f1f5f9;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .btn-secondary:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.2);
    transform: scale(1.08);
  }

  .btn-secondary:active:not(:disabled) {
    transform: scale(0.95);
  }

  .btn-tertiary {
    background: transparent;
    color: #64748b;
    border: 1px solid transparent;
  }

  .btn-tertiary:hover:not(:disabled) {
    color: #f1f5f9;
    background: rgba(255, 255, 255, 0.05);
    transform: scale(1.08) rotate(-45deg);
  }

  .btn-tertiary:active:not(:disabled) {
    transform: scale(0.95);
  }

  /* File Inspector Card */
  .inspector-card {
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    border-radius: 16px;
    background: rgba(15, 23, 42, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(8px);
  }

  .inspector-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
  }

  .btn-toggle {
    background: rgba(99, 102, 241, 0.1);
    color: #a5b4fc;
    border: 1px solid rgba(99, 102, 241, 0.2);
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-toggle:hover:not(:disabled) {
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.4);
    color: #ffffff;
  }

  .btn-toggle:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .inspector-body {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .inspector-body.disabled {
    justify-content: center;
    align-items: center;
    padding: 1.5rem 0;
    text-align: center;
  }

  .api-notice {
    font-size: 0.8rem;
    color: #64748b;
    margin: 0;
    line-height: 1.5;
  }

  .error-text {
    color: #f43f5e;
    font-family: monospace;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }

  .info-label {
    color: #64748b;
  }

  .info-val {
    font-family: monospace;
    color: #e2e8f0;
    background: rgba(255, 255, 255, 0.05);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
  }

  .info-badge {
    background: rgba(16, 185, 129, 0.1);
    color: #34d399;
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
  }

  .files-list {
    max-height: 110px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.03);
  }

  /* Custom Scrollbar for list */
  .files-list::-webkit-scrollbar {
    width: 6px;
  }
  .files-list::-webkit-scrollbar-track {
    background: transparent;
  }
  .files-list::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  .files-list::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-family: monospace;
    color: #94a3b8;
  }

  .file-icon {
    width: 14px;
    height: 14px;
    color: #64748b;
  }

  /* Footer */
  .footer {
    text-align: center;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    padding-top: 1.5rem;
    margin-top: auto;
    animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
  }

  .footer p {
    font-size: 0.75rem;
    color: #475569;
    margin: 0;
  }

  .footer code {
    color: #64748b;
    background: rgba(255, 255, 255, 0.03);
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
  }

  /* Configuration Note Styling */
  .config-note {
    display: flex;
    gap: 1rem;
    padding: 1.25rem;
    border-radius: 12px;
    background: rgba(15, 23, 42, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.05);
    color: #94a3b8;
    margin-top: 1.5rem;
    animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
  }

  .note-icon-wrapper {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #818cf8;
  }

  .note-icon {
    width: 20px;
    height: 20px;
  }

  .note-content h4 {
    margin: 0 0 0.375rem 0;
    font-size: 0.875rem;
    font-weight: 700;
    color: #f1f5f9;
  }

  .note-content p {
    margin: 0;
    font-size: 0.8rem;
    line-height: 1.5;
    color: #94a3b8;
  }

  .note-content code {
    color: #818cf8;
    background: rgba(99, 102, 241, 0.1);
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.75rem;
  }

  /* Animation Keyframes */
  @keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>