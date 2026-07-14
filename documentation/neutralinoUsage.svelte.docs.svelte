<script lang="ts">
  import { onMount } from "svelte";
  import { app, events, MessageBoxChoice, os } from "@neutralinojs/lib";

  // State to hold app info (safely checking if variables exist)
  let appId = $state("Loading...");
  let port = $state(0);
  let osName = $state("Loading...");
  let serverVersion = $state("Loading...");
  let clientVersion = $state("Loading...");
  let mode = $state("Loading...");

  let trayConfigured = $state(false);
  let showNotificationSuccess = $state(false);

  onMount(async () => {
    // Read Neutralino global variables from the window object
    appId = window.NL_APPID || "js.neutralino.zero";
    port = window.NL_PORT || 0;
    osName = window.NL_OS || "Unknown";
    serverVersion = window.NL_VERSION || "0.0.0";
    clientVersion = window.NL_CVERSION || "0.0.0";
    mode = window.NL_MODE || "window";

    // Set up windowClose event listener
    try {
      await events.on("windowClose", () => {
        app.exit();
      });
    } catch (e) {
      console.warn("Could not register windowClose event listener:", e);
    }

    // Set up tray menu item clicked listener
    try {
      await events.on("trayMenuItemClicked", onTrayMenuItemClicked);
    } catch (e) {
      console.warn("Could not register trayMenuItemClicked event listener:", e);
    }

    // Conditional initialization: Set up system tray if not running on macOS
    if (osName !== "Darwin") {
      setupTray();
    }
  });

  function openDocs() {
    try {
      os.open("https://neutralino.js.org/docs");
    } catch (e) {
      console.error("Failed to open documentation:", e);
    }
  }

  function openTutorial() {
    try {
      os.open("https://www.youtube.com/c/CodeZri");
    } catch (e) {
      console.error("Failed to open tutorial:", e);
    }
  }

  async function showNotification() {
    try {
      await os.showNotification("Neutralino API", "This is a native OS notification triggered from Svelte!");
      await os.showMessageBox(
        "MessageBoxTitle",
        "A question, is it ok or want to cancel?",
        "OK_CANCEL" as MessageBoxChoice
      );
      showNotificationSuccess = true;
      setTimeout(() => (showNotificationSuccess = false), 3000);
    } catch (e) {
      console.error("Failed to show notification:", e);
    }
  }

  async function setupTray() {
    if (mode !== "window") {
      console.log("INFO: Tray menu is only available in window mode.");
      return;
    }

    try {
      let tray = {
        icon: "/public/favicon.svg", // Using the favicon.svg as tray icon
        menuItems: [
          { id: "VERSION", text: "Get Version Info" },
          { id: "SEP", text: "-" },
          { id: "QUIT", text: "Quit App" },
        ],
      };
      await os.setTray(tray);
      trayConfigured = true;
    } catch (e) {
      console.error("Failed to configure system tray:", e);
    }
  }

  async function onTrayMenuItemClicked(event: any) {
    const id = event.detail?.id || event.detail; // Handle string ID or object
    switch (id) {
      case "VERSION":
        try {
          await os.showMessageBox(
            "Version Information",
            `Neutralinojs Server: v${serverVersion} | Neutralinojs Client: v${clientVersion}`
          );
        } catch (e) {
          console.error(e);
        }
        break;
      case "QUIT":
        try {
          await app.exit();
        } catch (e) {
          console.error(e);
        }
        break;
    }
  }
</script>

<div class="usage-container">
  <h2>Neutralino.js Native API Examples</h2>

  <div class="grid-layout">
    <!-- App Information Card -->
    <div class="info-card">
      <h3>App Environment Info</h3>
      <div class="info-table">
        <div class="info-row">
          <span class="label">App ID:</span>
          <span class="value">{appId}</span>
        </div>
        <div class="info-row">
          <span class="label">Local Port:</span>
          <span class="value">{port}</span>
        </div>
        <div class="info-row">
          <span class="label">Operating System:</span>
          <span class="value badge">{osName}</span>
        </div>
        <div class="info-row">
          <span class="label">Server Version:</span>
          <span class="value">v{serverVersion}</span>
        </div>
        <div class="info-row">
          <span class="label">Client Version:</span>
          <span class="value">v{clientVersion}</span>
        </div>
      </div>
    </div>

    <!-- Actions Card -->
    <div class="actions-card">
      <h3>OS Integration Actions</h3>
      <p class="action-desc">Interact with the user's host operating system using native APIs:</p>

      <div class="button-group">
        <button onclick={openDocs} class="action-btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="btn-svg"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          Open Documentation
        </button>

        <button onclick={openTutorial} class="action-btn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="btn-svg"
          >
            <path
              d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"
            />
            <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
          </svg>
          Open YouTube Tutorial
        </button>

        <button onclick={showNotification} class="action-btn highlighted" class:success={showNotificationSuccess}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="btn-svg"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {showNotificationSuccess ? "Notification Sent!" : "Trigger Notification"}
        </button>
      </div>

      <div class="tray-status">
        <span class="tray-dot" class:active={trayConfigured}></span>
        <span class="tray-text">
          {trayConfigured ? "System tray icon is configured (check taskbar)." : "System tray not active."}
        </span>
      </div>
    </div>
  </div>
</div>

<style>
  .usage-container {
    padding: 1.5rem;
    border-radius: 16px;
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both;
  }

  .usage-container h2 {
    font-size: 0.875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #818cf8;
    margin: 0;
  }

  .grid-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  @media (max-width: 640px) {
    .grid-layout {
      grid-template-columns: 1fr;
    }
  }

  .info-card,
  .actions-card {
    background: rgba(10, 15, 30, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
  }

  .info-card h3,
  .actions-card h3 {
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
    color: #f1f5f9;
  }

  .info-table {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  }

  .info-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .label {
    color: #64748b;
  }

  .value {
    font-family: monospace;
    color: #e2e8f0;
  }

  .value.badge {
    background: rgba(99, 102, 241, 0.1);
    color: #818cf8;
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    font-weight: 600;
  }

  .action-desc {
    font-size: 0.8rem;
    color: #94a3b8;
    margin: 0 0 1rem 0;
    line-height: 1.4;
  }

  .button-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 1rem;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #e2e8f0;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .action-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.15);
    color: #ffffff;
    transform: translateY(-1px);
  }

  .action-btn:active {
    transform: translateY(0);
  }

  .action-btn.highlighted {
    background: rgba(99, 102, 241, 0.1);
    border-color: rgba(99, 102, 241, 0.2);
    color: #a5b4fc;
  }

  .action-btn.highlighted:hover {
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.3);
    color: #ffffff;
  }

  .action-btn.success {
    background: rgba(16, 185, 129, 0.15);
    border-color: rgba(16, 185, 129, 0.3);
    color: #34d399;
  }

  .btn-svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  .tray-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
    font-size: 0.75rem;
  }

  .tray-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #64748b;
  }

  .tray-dot.active {
    background-color: #10b981;
    box-shadow: 0 0 6px #10b981;
  }

  .tray-text {
    color: #64748b;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
