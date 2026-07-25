# Collab Utils 2: Collectibles Storage & TheCelesteTracker-Mod Audit

This document provides a comprehensive technical reference for how all custom collectibles in **Collab Utils 2** are stored across save files, and evaluates what modifications are required in **`TheCelesteTracker-Mod`** (C# Everest tracking mod) and **`TheCelesteTrackerDesktop`**.

---

## 1. Collectibles Storage Overview

| Collectible | Save File (`Saves/N.celeste`) | Mod Save (`N-modsave-CollabUtils2.celeste`) | Standard Strawberry Count | Primary Identifier Key |
|---|---|---|---|---|
| **Mini Heart** | `AreaModeStats HeartGem="true"` | `OpenedMiniHeartDoors` (array) | ❌ No (Counts as Heart) | `AreaModeStats[0]["@_HeartGem"]` |
| **Silver Berry** | `AreaModeStats -> Strawberries -> EntityID` | None | ✅ Yes | `<EntityID Key="room:id"/>` |
| **Speed Berry** | ❌ None (Does not alter `N.celeste`) | `SpeedBerryPBs: { SID: timeTicks }` | ❌ No | `SpeedBerryPBs` dictionary in modsave |
| **Rainbow Berry** | Lobby `<Strawberries>` Entity ID | `CombinedRainbowBerries: [ LevelSetID ]` | ✅ Yes (in Lobby) | `CombinedRainbowBerries` array in modsave |
| **Warp Pedestal** | ❌ None | `CompletedWarpPedestalSIDs: [ SID ]` | ❌ No | `CompletedWarpPedestalSIDs` array in modsave |

---

## 2. Detailed Technical Breakdown per Collectible

### A. Mini Hearts
- **Game Behavior**: Placed at map end. Touch Mini Heart -> Level ends -> Player returns to lobby.
- **`N.celeste`**: Sets `HeartGem="true"` and `Completed="true"` on the A-Side (`Mode="Normal"`) `AreaModeStats`.
- **`N-modsave-CollabUtils2.celeste`**: Tracks opened heart doors under `OpenedMiniHeartDoors`.

### B. Silver Berries
- **Game Behavior**: Deathless run berry for Collab entries (equivalent to Golden Berries).
- **`N.celeste`**: Stored as a standard strawberry inside `<AreaModeStats><Strawberries><EntityID Key="room:entityID"/></Strawberries></AreaModeStats>`.
- **Note**: Silver Berries increase `TotalStrawberries` for that map/levelset in `N.celeste`.

### C. Speed Berries
- **Game Behavior**: Timed run with Gold, Silver, and Bronze thresholds. Timed out = death. Crossing Speed Berry Collect Trigger stops timer and awards berry.
- **`N.celeste`**: **Not saved in `N.celeste`**. Does not count towards `TotalStrawberries`.
- **`N-modsave-CollabUtils2.celeste`**: Stored in the `SpeedBerryPBs` dictionary:
```yaml
SpeedBerryPBs:
  2021MapCollection/1-Mild Lobby/Summit Skydive: 793900000
  SpringCollab2020/1-Beginner/Lichtbaulb: 660790000
```
*(Value is best time in 100-nanosecond ticks, e.g. 793,900,000 = 79.39 seconds).*

### D. Rainbow Berries
- **Game Behavior**: Appears in lobby once all Silver Berries in the level set are collected.
- **`N.celeste`**: Recorded as an `EntityID` under the Lobby map's `<Strawberries>`.
- **`N-modsave-CollabUtils2.celeste`**: Recorded in `CombinedRainbowBerries`:
```yaml
CombinedRainbowBerries:
  - SpringCollab2020/1-Beginner
```

---

## 3. Analysis & Required Changes in `TheCelesteTracker-Mod` (C#)

`TheCelesteTracker-Mod` monitors gameplay events, writes runs to SQLite (`TheCelesteTracker_DB.db`), and streams real-time WebSocket events.

### 🚨 1. Silver Berry Detection (Action Required in Mod)
- **Problem**: Standard Everest golden berry detection in C# typically checks `if (entity is GoldenBerry)` or `session.GrabbedGolden`. Collab Utils 2 Silver Berries are instances of `Celeste.Mod.CollabUtils2.Entities.SilverBerry`.
- **Fix in `TheCelesteTracker-Mod`**:
  Update the entity check to recognize `SilverBerry` or check reflection property `berry.IsGolden` / `berry.Golden`:
  ```csharp
  // C# snippet for TheCelesteTracker-Mod
  bool isGoldenOrSilver = entity is GoldenBerry 
      || entity.GetType().FullName == "Celeste.Mod.CollabUtils2.Entities.SilverBerry";
  ```
  This ensures Silver Berry runs set `IsGoldenRun = true` (or `IsSilverRun = true`) in the SQLite database and WebSocket events.

### 🚨 2. Speed Berry PB Tracking (Action Required in Mod)
- **Problem**: Speed Berry PBs do not write to `N.celeste` `<Strawberries>`. If `TheCelesteTracker-Mod` only checks vanilla strawberry collection, it will miss Speed Berry completions entirely!
- **Fix in `TheCelesteTracker-Mod`**:
  - Hook into `SpeedBerryCollectTrigger.OnInteract` or listen to `CollabUtils2Module.SaveData.SpeedBerryPBs` updates.
  - When a Speed Berry is collected, log `SpeedBerryTime` and `SpeedBerryMedal` (Gold/Silver/Bronze) into the run record in `TheCelesteTracker_DB.db` and emit a `speedberry_pb` WebSocket event.

### ⚠️ 3. Mini Heart Flag in WebSockets (Optional/Recommended)
- **Improvement**: In `TheCelesteTracker-Mod`, when emitting a `level_complete` WebSocket event, include `"isMiniHeart": true` if the completion was triggered by a CollabUtils2 `MiniHeart` entity. This allows `TheCelesteTrackerDesktop` to render a Mini Heart icon on the live overlay instead of a generic Crystal Heart.

---

## 4. Verification & Testing Instructions

1. **Verify Desktop Reading**:
   Run unit tests in `TheCelesteTrackerDesktop`:
   ```bash
   bun test
   bun run check
   ```
2. **Verify Save Files**:
   Inspect sample files in `testing/Celeste/Saves/0-modsave-CollabUtils2.celeste` to verify `SpeedBerryPBs` and `OpenedMiniHeartDoors` entries.
