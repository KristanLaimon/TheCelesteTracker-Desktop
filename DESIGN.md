# Design Specification: Mod Explorer Interface

## 1. Overview
This document outlines the visual and structural design for the "Mod Explorer" module of the application. The interface utilizes a three-pane layout designed for high data density, filtering, and detailed inspection of game modifications. It employs a dark theme with high-contrast accent colors inspired by the game's aesthetic.

## 2. Global Theme & Styling

### 2.1. Color Palette
*   **Background (App Shell):** Very dark grey/black (approx. `#121216`)
*   **Background (Panels/Cards):** Dark grey (approx. `#1A1A20`)
*   **Accent (Primary):** Crimson/Pink (approx. `#E84A5F` or `#FF5E7E`) - Used for active tabs, selected items, primary buttons, and the app logo.
*   **Accent (Secondary/Borders):** Subdued blue-grey (approx. `#2A2A35`)
*   **Text (Primary):** Pure White (`#FFFFFF`) or very light grey (`#E0E0E0`) for main headings and titles.
*   **Text (Secondary):** Dim grey (`#8B8B99`) for authors, metadata, and placeholder text.
*   **Status Colors:**
    *   *Success/Installed:* Muted Green (approx. `#4CAF50` or `#2E7D32`)
    *   *Update Available:* Light Blue (approx. `#2196F3` or `#64B5F6`)
    *   *Warning/Missing:* Yellow/Orange (approx. `#FFC107`)

### 2.2. Typography
*   **Font Family:** A clean, modern sans-serif (e.g., Inter, Roboto, or system UI fonts to maintain native feel across Windows, macOS, and Linux).
*   **Hierarchy:**
    *   *Headers (H1/H2):* Uppercase, bold, slightly tracked out (e.g., "MOD LIBRARY", "MOD DETAILS").
    *   *List Items:* Medium weight for titles, regular weight for secondary text.
    *   *Badges/Tags:* Small, bold, often uppercase.

## 3. Layout Architecture

The application window uses a custom, frameless layout to support a unified, cross-platform appearance.

### 3.1. Title Bar (`<TitleBar />`)
*   Custom draggable area.
*   **Left:** Application branding (Icon + "CelesteTracker").
*   **Center:** Tabbed navigation (`Mod Explorer` [Active], `Campaign Stats`, `Live HUD`, `Canvas`, `+`).
*   **Right:** Custom window controls (macOS-style traffic lights are mocked in the design, but should dynamically adapt or remain unified based on implementation preferences).

### 3.2. Three-Pane Structure
The main content area is divided into three flexible columns:

1.  **Left Sidebar: Mod Library (`<FilterSidebar />`) - Width: ~250px**
    *   Search input field.
    *   Source toggles (GameBanana, Installed, Pinned).
    *   Category list with item counts (Maps, Helpers, Skins, Mechanics, Tools, UI). Active state highlights the category and count.
    *   Sort dropdown.
    *   Footer with total indexed and installed counts.

2.  **Center Pane: Data Grid (`<ModList />`) - Width: Flexible (Main Content)**
    *   Header row with context-aware title (e.g., "Maps 612"), sub-filters (All, Installed, Updates), and view toggles (List/Grid).
    *   Data table with sortable columns: `NAME / AUTHOR`, `CATEGORY`, `DOWNLOADS`, `SIZE`, `DEP` (Dependencies), `STATUS`.
    *   **List Item Rows:**
        *   Icon/Initials block.
        *   Title with inline update indicators.
        *   Category badge (color-coded).
        *   Action button (Install vs. Installed status).
        *   Active row state (e.g., "Strawberry Jam Collab") features a crimson background tint and border.

3.  **Right Sidebar: Mod Details (`<ModInspector />`) - Width: ~350px**
    *   Top actions (Pin button).
    *   Hero image/banner.
    *   Header: Title, Author, Version.
    *   Primary Actions: `Installed` (Dropdown/Check), `Uninstall`.
    *   Tags/Labels container.
    *   Stats grid (Downloads, Size, Updated date).
    *   Scrollable body containing:
        *   Description block.
        *   Dependencies list with version matching and status indicators.
        *   Contextual action buttons (e.g., "Resolve Missing Dependencies").
        *   Screenshots gallery (thumbnail grid).

## 4. Component Breakdown (Svelte 5 Structure)

Suggested component hierarchy for development:

```text
src/
├── components/
│   ├── layout/
│   │   ├── TitleBar.svelte
│   │   ├── SidebarLeft.svelte
│   │   └── SidebarRight.svelte
│   ├── ui/
│   │   ├── Button.svelte
│   │   ├── Badge.svelte
│   │   ├── SearchInput.svelte
│   │   ├── SelectDropdown.svelte
│   │   └── TabNav.svelte
│   └── views/
│       └── ModExplorer/
│           ├── ModExplorer.svelte (Main View Container)
│           ├── FilterPanel.svelte
│           ├── ModDataGrid.svelte
│           ├── ModRow.svelte
│           └── ModDetailsPanel.svelte