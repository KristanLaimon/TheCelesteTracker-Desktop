# Creating a Texture Pack


## Table of Contents:

<details>
<summary>Click to expand the Table of Contents</summary>

*    [Required Software](#required-software)
*    [Mod Setup](#mod-setup)
*    [Replacing Textures]()
*    [Modifying Animation Data](#modifying-animation-data)
*    [Replacing Sounds](#replacing-sounds)
*    [SkinMod Helper](#skinmodhelper)

</details>

## [Required Software](Required-Software)


## Mod Setup
Follow the [Mod Setup Tutorial](Mod-Setup) to begin setting up your mod.

Create the following folders inside your mod folder. The `Graphics` folder should be next to the `everest.yaml` file:
```
Celeste
- Mods
  - MyExampleMod
    - Graphics
```


## Replacing Textures
Replacing any asset in Everest is quite simple: just add a file in your mod with the same relative path as a vanilla asset.

For textures, this path will always be in a subfolder of the `Graphics` folder called `Atlases`. Each Atlas is used for a different part of the game:
- `Gameplay` - Pixel-art textures for almost every texture used during gameplay.
- `Gui` - High resolution textures for UI elements.
- `Portraits` - Character portraits for use in dialog boxes.
- `{Chapter Name}` - High resolution textures used in chapter complete screens.

For example, to replace the Forsaken City level logo, you would place the replacement texture in `Mods/yourmodname/Graphics/Atlases/Gui/areas/city.png`.

Examples of texture packs both with and without [SkinModHelper](#skinmodhelper) can be found on [GameBanana :link:](https://gamebanana.com/mods/cats/11181).

**Please note that this will affect vanilla levels as well.** This is _not_ what you want if you need custom graphics specifically for your map.

_(By the way, if you want to replace Madeline with some other character, you will need 817 sprites. If you do decide to attempt this, you can use the [SkinMod Checklist :link:](https://docs.google.com/spreadsheets/d/1yQpj05TaNuI5rfxF4zCfg8Z9oX_XzihGwm94D2t5ZkE) to track your progress.)_


## Modifying Animation Data
Configuration for different textures are stored in the `.xml` files that are located in the *game's* `Content/Graphics/` folder (not the graphics dump):
- `ForegroundTiles.xml`, `BackgroundTiles.xml` and `AnimatedTiles.xml` [define how tilesets are drawn](Tileset-Format-Reference).
- `CompleteScreens.xml` defines how chapter complete screen components are arranged.
- `Sprites.xml`, `SpritesGui.xml`, and `Portraits.xml` define animation data for some animated sprites (others are defined in code).

This tutorial will not discuss modifying these in detail, and the reference pages for each file format should be consulted to understand how to change them.


## Replacing Sounds
Replacing sounds can be done by exporting an FMOD bank with event names that match those in the vanilla project.
A guide is available on the [Adding Custom Audio](Adding-Custom-Audio#overwriting-vanilla-events) page.


## SkinModHelper
In order to make managing multiple installed skin mods easier, it is encouraged to configure them to make use of the [SkinModHelper mod :link:](https://github.com/bigkahuna443/SkinModHelper). If you do so, make sure to add SkinModHelper as a dependency in your everest.yaml file.

This mod provides an in-game setting that can be used to easily toggle between skin mods, instead of requiring the player to disable and enable each mod to avoid conflicts.

Documentation for setting up a mod with SkinModHelper is available on the [SkinModHelper GitHub :link:](https://github.com/bigkahuna443/SkinModHelper/blob/dev/docs/guide/README.md).
