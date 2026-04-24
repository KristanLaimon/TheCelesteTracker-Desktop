# TheCelesteTracker Desktop

<div align="center">
  <img src=".github/banner.png" alt="TheCelesteTracker_Desktop_Banner" width="100%">

  ### **Stop tracking Celeste in Excel.**
  *Auto-track runs, deaths, and progress with zero manual effort.*

  [Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [Architecture](#architecture)
</div>

---

**TheCelesteTracker** is a high-performance desktop companion for Celeste. It captures real-time gameplay data giving you instant insights without the manual data entry.

> ***Still under development, not ready for usage***

## Why this exists?
The Celeste community uses **spreadsheets** for pretty much everything: achievements, map progress, lobby stats—all manual.
**No more.** TheCelesteTracker aims to automate the "Excel grind" so you can focus on the "Celeste grind."

<div align="center">
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <th align="center">Manual Excel (The Past)</th>
      <th align="center">Auto Desktop App (The Future)</th>
    </tr>
    <tr>
      <td align="center">
        <img src=".github/old_excel_example.png" alt="Old Excel Example" width="100%">
        <p><sub><i>This is my real Excel that I use to track my Celeste modding and vanilla progress.</i></sub></p>
      </td>
      <td align="center">
        <img src=".github/beta2_screenshot.png" alt="Beta Screenshot" width="100%">
        <p><sub><i>Automating with a dedicated app, including support for "Celeste Skill Rating" maps (planned feature).</i></sub></p>
      </td>
    </tr>
  </table>
</div>

Note: While there are mods to track this info, they are all in-game, limited by the interface, and sometimes have a learning curve that makes them hard to use.

## Key Features

- **⚡ Real-time Sync**: Auto-connect to Everest WebSocket server.
- **🔍 Auto-Port Scanning**: Instant discovery (ports `50500`-`50600`).
- **🖥️ Live Overlay**: Immersive HUD triggers on level entry.
- **📊 Deep Stats**: Track `Deaths`, `Dashes`, `AreaCompletion`, and `Personal Bests`.
- **🛠️ Rust-Backed**: Type-safe event handling.

## Preview

https://github.com/user-attachments/assets/b3583abc-d71b-4a0a-a61a-d4abebb43749
<p><i>Live gameplay event tracking in action.</i></p>

<div align="center">
  <img src=".github/beta_run_history.png" alt="Run History Beta" width="80%">
  <p><i>History tracking for recent runs and PB attempts.</i></p>
</div>

*Current UI is subject to change during beta.*

## Tech Stack
- **Backend**: [Rust](https://www.rust-lang.org/) + [Tauri v2](https://v2.tauri.app/) (Desktop bridge & Performance)
- **Frontend**: [Svelte 5](https://svelte.dev/) + [Tailwind CSS](https://tailwindcss.com/) (Reactive UI & Styling)
- **Database**: [SQLite](https://sqlite.org/) (Local data persistence)
- **Communication**: [Tokio](https://tokio.rs/) (Asynchronous WebSockets)

## Getting Started

### Prerequisites
- **Rust**: [Installation Guide](https://www.rust-lang.org/tools/install)
- **Node.js/Bun**: [Bun](https://bun.sh/) is recommended for faster installs.
- **Celeste Mod**: Install **TheCelesteTracker-Mod** in Everest. Currently available via [GitHub](https://github.com/KristanLaimon/TheCelesteTracker-Mod) (coming soon to GameBanana).

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/KristanLaimon/TheCelesteTracker_Desktop.git
   cd TheCelesteTracker_Desktop
   ```
2. Install dependencies:
   ```bash
   bun install
   ```
3. Run in development mode:
   ```bash
   bun run tauri dev
   ```

## Architecture
- `src-tauri/src/ws.rs`: Manages WebSocket lifecycle and automated port scanning.
- `src-tauri/src/events.rs`: Defines type-safe structures for gameplay events.
- `src/lib/saveStore.svelte.ts`: Handles reactive application state using Svelte 5 Runes.
- `src-tauri/src/db/`: SQL queries and database migrations.

## License
MIT License. Created for the Celeste community.