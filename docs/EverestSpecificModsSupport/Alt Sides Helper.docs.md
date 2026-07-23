# Welcome to the AltSidesHelper Wiki!

AltSidesHelper allows you to add extra sides to your map, as well as further customize your A-Sides, and display them in the same way as vanilla's B and C sides. It also provides some assets for D-Sides, including a custom cassette entity and a few icons.

If you're using AltSidesHelper for the first time, visit the setup page to get up and running. A list of all possible options for the A-Side meta can then be found on the fields page. The custom cassette and trigger also have their own dedicated page on how to use them.

Verbose logging can be enabled if you're having issues, but if you're unable to resolve them contact Luna (the main developer of the mod) via the Celeste Discord, or just ask around for help.

---

## Setting up AltSidesHelper for your map

To use any of AltSidesHelper's customizations, you'll need to add extra metadata to your map stored in YAML files next to your map.

Similar to Everest's `{map name}.meta.yaml`, you'll need to create a `{map name}.altsideshelper.meta.yaml` for every map you want to customize, or add as an alt-side.

### Notes for alt-side maps

When making an alt-side, save it as a `.bin` as usual. The map file must not end in `-B`, `-C`, `-H`, or `-X`, or otherwise be recognized as a B-Side or C-Side by Everest — that will produce crashes. Ensure that the map is sorted last alphabetically, such as by appending `Z-` or `99-` to the start — not doing so can mess up your campaign's overworld (sorry!).

### For the A-Side

An "A-Side" is used here to refer to a regular map that's being customized, or the A-Side for a map with alt-sides. Here's an example for the A-Side map `examplemodder/ExampleMod/ExampleMap.bin`'s alt-side meta:

```yaml
Sides:
- OverrideVanillaSideData: true
  Preset: "a-side"
  ShowHeartPoem: true
- Map: "examplemodder/ExampleMod/ExampleMap-D"
  Preset: "d-side"
  ShowBerriesAsGolden: true
```

This file would modify the A-Side's heart to show no text when collected, and add the map `examplemodder/ExampleMod/ExampleMap-D.bin` as a D-Side (using AltSidesHelper's D-Side assets) that shows its berries as golden berries on the chapter panel.

If you're not familiar with the YAML format, I recommend using a YAML validator website to check your formatting. In short: each bullet point starts another entry, which can either be an additional map added as an alt-side (by specifying the `Map` field), or a set of customizations to be applied to the A-Side (by specifying `OverrideVanillaSideData: true`). The full list of fields that can be set is detailed in the Fields section below.

### For the alt-side

Here's what the alt-side meta for the D-Side in the previous example would look like:

```yaml
AltSideData:
  IsAltSide: true
  For: "examplemodder/ExampleMod/ExampleMap"
```

There's not much to be customised here. `IsAltSide` should be set to `true` for any map that is an alt-side, so that it can be hidden from the overworld. `For` should be set to the ID (path minus `.bin`) for the A-Side, so that AltSidesHelper can find its customizations.

The field `CopyEndScreenData` can be set, and defaults to `true`. When on, the alt-side will use the end screen of the A-Side when completed (with different text). If this is disabled, you can set it separately in the `{map name}.meta.yaml` like normal.

`CopyTitle` can be set, and defaults to `true`. When on, the alt-side will use the title of the A-Side. If this is disabled, you will need to set the title separately using a language file like normal.

---

## Customisable Fields

Here's the full list of attributes that can be set in the A-Side meta, for each side. Attributes for more customisation (e.g. end screen music, columns in journal) are planned. Journal customisation will likely involve a level-set specific meta file for adding columns (such as for deaths). Note that for any default directory supplied it is also possible to add your own sprites and directory.

### Table of Contents

| Category | Fields |
|---|---|
| **Meta** | Map, Preset, OverrideVanillaSideData, OverrideHeartTextures, UnlockMode |
| **Overworld** | Icon, Label, ShowBerriesAsGolden, DeathsIcon, ChapterPanelHeartIcon, JournalHeartIcon |
| **In-Game** | HeartColour, InWorldHeartIcon, ShowHeartPoem, EndScreenTitle, ShowBSideRemixIntro |
| **Full Clear** | CanFullClear, CassetteNeededForFullClear, HeartNeededForFullClear, EndScreenClearTitle |
| **Experimental** | AddCassetteIcon, JournalCassetteIcon |

### Meta

#### Map

The ID of the map to be used — the map's path from `Maps/`, minus `.bin`.

#### Preset

One of `a-side`, `b-side`, `c-side`, `d-side`, and `none` (default). Setting this will set all attributes that you haven't specified to follow that particular side, with `d-side` using assets provided by AltSidesHelper. You can leave this unset (or set to `none`) to set all values manually. These values are listed for each attribute.

#### OverrideVanillaSideData

If `true`, the A-Side will have its data modified, rather than creating a new side. See "Changing A-Side data". (`false`)

#### OverrideHeartTextures

Whether the in-world heart, chapter panel heart, and heart poem textures and colours should be overridden to match `ChapterPanelHeartIcon`, `HeartColour`, and `InWorldHeartIcon`. `true` by default, but you might want to disable this if you're using e.g. Collab Utils 2's options for overriding the heart textures and colour.

#### UnlockMode

Decides when the alt-side should be available for selection. You may specify it as one of:

- `consecutively` (default) — unlocks this alt-side after the previous mode
- `always` — makes this alt-side always available (if the A-Side is unlocked)
- `triggered` — makes this alt-side hidden until it's unlocked by an Alt-side Cassette or Alt-side Unlock Trigger
- `with_previous` — unlocks this alt-side when the previous one is unlocked
- `c_sides_unlocked` — unlocks this alt-side when C-Sides are unlocked for that save file

### Overworld

#### Icon

The image to be displayed on the chapter panel select banner for that side.

| Side | Default Icon |
|---|---|
| A-Side | `menu/play` (backpack) |
| B-Side | `menu/remix` (cassette) |
| C-Side | `menu/rmx2` (c-side cassette) |
| D-Side | `menu/leppa/AltSidesHelper/rmx3` (d-side cassette) |

#### Label

The dialog key of text that appears when this side is selected.

| Side | Dialog Key |
|---|---|
| A-Side | `OVERWORLD_NORMAL` |
| B-Side | `OVERWORLD_REMIX` |
| C-Side | `OVERWORLD_REMIX2` |
| D-Side | `leppa_AltSidesHelper_overworld_remix3` |

#### ShowBerriesAsGolden

Decides whether strawberries should be shown as golden berries on the chapter panel, like in a vanilla B/C-Side. `false` by default, but you will want to set this for any side that has no red berries.

#### DeathsIcon

The image to be used for the deaths counter.

| Side | Default Icon |
|---|---|
| A-Side | `collectables/skullBlue` |
| B-Side | `collectables/skullRed` |
| C-Side | `collectables/skullGold` |
| D-Side | `collectables/skullGold` |

#### ChapterPanelHeartIcon

The sprite set to be used for the crystal heart on the chapter panel and when displaying the heart poem. Note that you must append an additional `/` at the end of the filepath for this to register if your images are named `00`, `01`, etc. instead of `name00`, `name01`, etc.

| Side | Default Icon |
|---|---|
| A-Side | `collectables/heartgem/0/spin` |
| B-Side | `collectables/heartgem/1/spin` |
| C-Side | `collectables/heartgem/2/spin` |
| D-Side | `collectables/leppa/AltSidesHelper/heartgem/dside` (a grey heart) |

#### JournalHeartIcon

The texture to be used for the crystal heart in the journal, in the Journal atlas. Also used for the file select screen.

| Side | Default Icon |
|---|---|
| A-Side | `heartgem0` |
| B-Side | `heartgem1` |
| C-Side | `heartgem2` |
| D-Side | `leppa/AltSidesHelper/heartgemD` |

### In-Game

#### HeartColour

The colour of the text and lines in the heart poem, and the heart's particles and light, specified as a hex value.

| Side | Default Colour |
|---|---|
| A-Side | `8cc7fa` |
| B-Side | `ff668a` |
| C-Side | `fffc24` |
| D-Side | `ffffff` |

#### InWorldHeartIcon

The textures to be used for the crystal heart entity.

| Side | Default Icon |
|---|---|
| A-Side | `collectables/heartGem/0` |
| B-Side | `collectables/heartGem/1` |
| C-Side | `collectables/heartGem/2` |
| D-Side | `collectables/heartGem/3` |

#### ShowHeartPoem

Whether the crystal heart should show text when collected. (`true`, except in C-Side.)

#### EndScreenTitle

The dialog key of the text to be displayed on the end screen. If this is unset, or set to nothing, it won't be modified.

| Side | Dialog Key |
|---|---|
| A-Side | `AREACOMPLETE_NORMAL` |
| B-Side | `AREACOMPLETE_BSIDE` |
| C-Side | `AREACOMPLETE_CSIDE` |
| D-Side | `leppa_AltSidesHelper_areacomplete_dside` |

#### ShowBSideRemixIntro

Whether the music remix title, artist, and album should be displayed when entering the chapter.

- Setting the `{map name}_remix_artist`, `{map name}_remix`, and `{map name}_remix_album` dialog keys will display those just like a vanilla B-Side.
- Setting the `{map name}_altsides_remix_intro` dialog key will allow you to instead write your own list of text, with as many lines as you want.

### Full Clear

#### CanFullClear

Determines whether the other full clear options (`HeartNeededForFullClear`, `CassetteNeededForFullClear`) are considered. If `true`, `EndScreenClearTitle` will be used for the end screen title after a full clear. You can use this with the B-Side or C-Side presets to create a B/C side that can be full-cleared. Do also note that if you have every Berry, Heart, and Cassette in the level, it will always register as a full clear, regardless of what's set here. (`false`)

#### CassetteNeededForFullClear

Whether the player must collect a cassette (vanilla or alt-side) to full clear the map in question. This is especially important for maps that lack a Cassette but you want to be full clear-able. (`true` by default)

#### HeartNeededForFullClear

Whether the player must collect a crystal heart to full clear. (`true`)

#### EndScreenClearTitle

If `CanFullClear` is set to `true`, this dialog key will be used for the title on the end screen after a full clear. If this is unset, or set to nothing, it won't be modified.

| Side | Dialog Key |
|---|---|
| A-Side | `AREACOMPLETE_NORMAL_FULLCLEAR` |
| B-Side | `leppa_AltSidesHelper_areacomplete_fullclear_bside` |
| C-Side | `leppa_AltSidesHelper_areacomplete_fullclear_cside` |
| D-Side | `leppa_AltSidesHelper_areacomplete_fullclear_dside` |

### Experimental

These options are experimental. They should be fully functional, but have not been as tested as other options and may have bugs or performance issues. Please report any you find!

#### AddCassetteIcon

For alt-sides unlocked by custom cassettes. Enabling this option will add the icon specified in `JournalCassetteIcon` to both the journal entry for the A-Side and the file select screen. `false` by default.

#### JournalCassetteIcon

For alt-sides unlocked by custom cassettes. A texture in the journal atlas to be added to the journal and file select screen.

| Side | Default Icon |
|---|---|
| A-Side | `cassette` |
| B-Side | `cassette` |
| C-Side | `cassette` |
| D-Side | `leppa/AltSidesHelper/cassetteD` |
