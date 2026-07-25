# Collab Utils 2: Mini Hearts Storage & Retrieval

This document explains how **Mini Hearts** from Collab Utils 2 are structured in Celeste, how their collected state is stored on disk, and how `TheCelesteTrackerDesktop` and `TheCelesteTracker-Mod` retrieve and process them.

---

## 1. Overview of Mini Hearts

In Celeste collab mods (such as *2020 Spring Community Collab* or *Strawberry Jam 2021*), a **Mini Heart** is a custom entity placed at the end of a map entry. 

- **Behavior**: Collecting a Mini Heart ends the level and teleports the player back to the corresponding Lobby.
- **Save State**: Collecting a Mini Heart sets `HeartGem="true"` for that map in Celeste's save file (`N.celeste`).
- **Gating**: Mini Heart Doors in lobbies check the total number of Mini Hearts (i.e. `HeartGem="true"` maps) collected in the level set.

---

## 2. On-Disk Storage Locations

### A. Primary Storage: `Saves/N.celeste` (XML)

Mini Hearts write directly to standard Celeste save data (`SaveData -> LevelSetStats -> Areas -> AreaStats -> Modes -> AreaModeStats`):

```xml
<SaveData>
  <LevelSetStats Name="SpringCollab2020/1-Beginner">
    <Areas>
      <AreaStats ID="29" Cassette="false" SID="SpringCollab2020/1-Beginner/Abby">
        <Modes>
          <AreaModeStats TotalStrawberries="1" Completed="true" SingleRunCompleted="true" FullClear="false" Deaths="102" TimePlayed="21644570000" BestTime="655860000" BestFullClearTime="0" BestDashes="44" BestDeaths="0" HeartGem="true">
            <Strawberries>
              <EntityID Key="Jude_00:336" />
            </Strawberries>
            <Checkpoints />
          </AreaModeStats>
        </Modes>
      </AreaStats>
    </Areas>
  </LevelSetStats>
</SaveData>
```

#### Key Fields:
- **`LevelSetStats Name`**: LevelSet path (e.g. `SpringCollab2020/1-Beginner`).
- **`AreaStats SID`**: Full map SID (e.g. `SpringCollab2020/1-Beginner/Abby`).
- **`AreaModeStats[0] HeartGem`**: Set to `"true"` when the Mini Heart is collected.

---

### B. Secondary Storage: `Saves/N-modsave-CollabUtils2.celeste` (YAML)

Collab Utils 2 tracks lobby progression data in its dedicated YAML modsave file:

```yaml
OpenedMiniHeartDoors:
  - SpringCollab2020/0-Lobbies/1-Beginner
  - StartupContest2021/0-Lobbies/1-Submissions:1
CompletedWarpPedestalSIDs:
  - BreezeContest2024/1-Submissions/Loasno
```

#### Key Fields:
- **`OpenedMiniHeartDoors`**: Array of door identifiers unlocked by reaching Mini Heart collection thresholds.
- **`CompletedWarpPedestalSIDs`**: Array of map SIDs whose warp pedestals have played their completion fill animation.

---

## 3. Retrieval Strategies in `TheCelesteTrackerDesktop`

1. **Static / Offline Parsing**:
   - Parse `Saves/N.celeste` using fast XML parser.
   - Look up `<LevelSetStats Name="<CollabName>/<LobbyId>">`.
   - Count maps where `<AreaModeStats HeartGem="true">`.

2. **Real-Time Stream**:
   - `TheCelesteTracker-Mod` listens to level completion events.
   - Emits a WebSocket payload with `heartCollected: true` and `sid: "SpringCollab2020/1-Beginner/Abby"`.
