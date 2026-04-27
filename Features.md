Feature Specification: "Collections" (Campaign & Mod Manager) v1.1
1. Feature Overview
The "Collections" feature digitizes a manual Excel-based Celeste tracking system into a dynamic, hierarchical data view. It allows the Administrator to view aggregated statistics across custom tiers, drill down into specific campaigns/mods, and review chapter-by-chapter statistics. Crucially, it acts as a dynamic file scanner and an interactive CRUD (Create, Read, Update, Delete) interface for live data modification.

2. Data Hierarchy & Relationships
The data follows a strict 3-level hierarchy:

Tier (Collection): The highest level (e.g., "Personal TIER", "Bronze Tier"). Contains multiple Campaigns.

Campaign (Mod): A grouping of levels (e.g., "Glyph", "Inwards"). Contains multiple Chapters.

Chapter (Level): The lowest level (e.g., "Spring-Side"). Contains the actual granular run statistics and reviews.

3. UI Layout & View Structure
A. The Tier Summary Banner (Header)
Tier Name

Aggregated Stats: Total Time, Strawberries, Golden Strawberries, Hearts, Deaths, Dashes, Campaigns, Chapters.

B. The Campaign Block & Banner Handling
Campaign Name

Dynamic Campaign Banner: An image dynamically fetched from the local Celeste installation (see Section 6).

Global Campaign Review Text ### C. The Chapter Data Table (Interactive Rows)
The data table displays individual levels. All cells (except aggregated totals) must support an "Edit Mode".

State (Status Indicator): Dropdown selector for the ActualState enum.

Chapter Name: Editable text field.

Strawberries: Numeric input (Collected / Max).

Golden Strawberry: Checkbox or Numeric input.

Total Time: Time input format.

Hearts: Numeric input.

Deaths / Fewest Deaths / Dashes / Jumps: Numeric inputs.

Difficulty: Dropdown or numeric rating.

Fun / Enjoyment: Slider or numeric input (0-100).

Review Notes: Expandable text area.

Action Column: "Edit", "Save", and "Cancel" buttons for the row.

4. State Management (Enums)
The ActualState of a chapter must be strictly typed using an Enum:

never_played, attempted, completed, full_clear, golden_completed, wingberry_completed, golden_and_wingberry.

5. Backend / Technical Requirements (Rust / SQLite)
Aggregation Logic: The backend (sqlx) handles the mathematical SUM of deaths, times, and berries at the Tier level.

Update Commands (CRUD): The backend must expose #[tauri::command] functions like update_chapter_stats(id, new_data) to write frontend changes permanently to the SQLite database.

6. System & Non-Functional Requirements (New)
6.1. Dynamic Asset Scanning (The Banner Resolution Engine)
The system must not rely on manually uploaded images. Instead, the Rust backend will act as an automated scanner.

Path Resolution: The app must store a global configuration for the Celeste_Installation_Path.

Mod Inspection: When a Campaign is loaded, the backend will inspect the Mods/ directory (handling both .zip files and unpacked folders).

Target Assets: The scanner will search for specific image files to use as banners:

Priority 1: UI Atlases (e.g., Graphics/Atlases/UI/...)

Priority 2: Custom Mod preview images or Final Screen captures.

Fallback Protocol: If the mod has no extractable images, or if the file cannot be read, the backend will serve a bundled default_banner.png so the UI layout never breaks.

Delivery: Images should be served to the frontend using Tauri's custom asset protocol (asset://localhost/path/to/image) to bypass browser security restrictions on local files.

6.2. Editability & Data Persistence
The UI must function as a two-way interface, not just a static dashboard.

Optimistic UI Updates: When the user clicks "Save" on an edited row, the UI should update immediately while the save request is sent to the Rust backend in the background.

Database Updates: Rust will execute UPDATE chapters SET ... WHERE id = ? queries to persist the changes.

Rollback: If the database save fails (e.g., file lock, invalid data), the UI must revert to the previous state and show an error notification.