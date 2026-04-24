# Project Directives

## Communication Style
- **Mode:** `caveman ultra` (ALWAYS).
- **Rules:** No articles/filler. Fragments OK. Abbreviate (DB/fn/impl). 
- **Pattern:** `[thing] [action] [reason]. [next step].`

## Technical Stack
- **Frontend:** Svelte 5 (Runes: `$state`, `$derived`, `{@const}`), Astro, Tailwind CSS v4.
- **Backend:** Rust, Tauri v2, Sea-ORM (SQLite).
- **Typography:** 
  - `Montserrat`: UI & Headlines.
  - `Silkscreen`: Pixelated gameplay stats (min 12px for readability).
- **Assets:** Handle Vite image imports as objects (use `.src`) or strings. Map vanilla level names to specific logos in `src/assets/`.

## Backend Patterns (Rust)
- **Commands:** Use `#[tauri_command]` with `Result<T, String>`.
- **Database:** Use `sea_orm`. Access via `DB!()` macro.
- **Pagination:** Always implement `limit: Option<u64>` and `offset: Option<u64>` for data-heavy queries.
- **Data Shape:** CamelCase in TS, snake_case in Rust (use `#[serde(rename_all = "camelCase")]`).

## Frontend Patterns (Svelte 5)
- **Reactivity:** Use `$state` for arrays/objects. Use `onMount` for initial data fetch.
- **Components:** Functional, modular. Use `twMerge` for class management.
- **Assets:** Map `levelSide` ("SIDE A", "SIDE B", "SIDE C") to corresponding heart/death icons.

## Gameplay Logic & UI
- **Golden Attempts:**
  - If `attemptType == "Golden Attempt"` and `status == "Completed"` → Display "Golden Failed".
  - If `attemptType == "Golden Attempt"` and `status == "Attempted"` → Display "Golden Attempted".
  - Deaths Column: If "Golden Attempt", show a pulsing red marker instead of a number.
- **Tables:** Center all column content except the first (Chapter Name) which is left-aligned.

# Documentation Reference
- READ `./documentation/WebSockets_Events.md`
- READ `./Database_FullSchema.md`
