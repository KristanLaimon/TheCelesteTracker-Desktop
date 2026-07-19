# What is Map Metadata?
Map metadata is information that defines how some level-wide characteristics should be configured. This is primarily split up into two parts - the Metadata menu in Lönn, and the `.meta.yaml` file for each map. The Lönn window is relatively self explanatory, and can be found under `Map > Metadata`. The `.meta.yaml` file structure is more complex, and is where you define information like the endscreen a level uses, or what the overworld should look like.

> [!TIP]
> Many of the simpler options are documented in Lönn itself via tooltips, which you can view by hovering over the options name.

> [!NOTE]
> The metadata for the vanilla maps is not stored like this. You can find a compilation in `.meta.yaml` format on the [**Vanilla Metadata**](Vanilla-Metadata) page.

# Setting up a `.meta.yaml` file
To set up a `.meta.yaml` file, either create a blank `mapname.meta.yaml`, or grab one from the example mod, and paste it into the same folder as your map's `.bin` file.  
Note the `mapname` part of the filename - this is how Everest knows what map it should apply the data to, and should be identical to the name for your `.bin` file.

> [!NOTE]
> `.yaml` files don't support tabs as indentations, only spaces. If there are tabs in your `.yaml` file, it will not load.

> [!NOTE]
> `.meta.yaml` changes aren't hot reloaded, so if you want to check any changes you make, you'll need to restart Celeste.

# Table of Contents

<details>
<summary>Click to expand Table of Contents</summary>

* [Overworld](#overworld)
  * [Map Name](#map-name)
  * [Heart Text](#heart-text)
  * [Map Icon](#map-icon)
  * [Map Banner](#map-banner)
  * [Map Scarf](#map-scarf)
  * [Chapter Card](#chapter-card)
  * [Checkpoint Images](#checkpoint-images)
  * [Interlude Chapters](#interlude-chapters)
* [In-Game](#in-game)
  * [Respawn Wipes](#respawn-wipes)
  * [Bloom Base and Strength](#bloom-base-and-strength)
  * [Darkness Alpha](#darkness-alpha)
  * [Colorgrades](#colorgrades)
    * [How Colorgrades Work](#how-colorgrades-work)
  * [Postcards](#postcards)
  * [Loading Vignette](#loading-vignette)
* [Overriding Metadata](#overriding-metadata)

</details>


# Overworld

## Map Name

First, you have to ensure your map follows the [mod structure](Mod-Structure).
In particular, your map bin should be in `Mods/yourmodname/Maps/yournickname/campaignname/mapname.bin`.

You should now create the file `Mods/yourmodname/Dialog/English.txt` and paste in the following:
```
yournickname_campaignname= Campaign Name
yournickname_campaignname_mapname= Map Name
```
It also works to define checkpoint names:
```
yournickname_campaignname_mapname_roomname= CheckpointName
```
As a general rule, if you see `{blah_blah}` in the game, and you want it to display `some text` instead,
you need to add this in your English.txt:
```
blah_blah= some text
```

(If you feel like translating your map name in other languages, you can create other files in the Dialog directory, for example `French.txt`.
All non-existing languages will fall back to English.)

## Heart Text
To specify the text that appears when collecting a heart in your map, head back to your English.txt and add the following line below the ones denoting your map name.

```
poem_yournickname_campaigname_mapname_mapside= HeartText
```

Replace the nickname and campaign name as you did above, the mapname with your maps .bin name minus the extension, and the mapside with either A, B, or C, before entering the text you want to display to the right, and then saving and reloading your map. 

Do also note that if you want your level to end upon collecting the heart you'll need to navigate to the Map > Metadata > Mode section in Loenn and toggle End Level on Heart.

## Map Icon 

You can define the map icon in the map editor, in the Title Banner Icon field of the Map > Metadata menu.

If you want to use a custom icon, place it in `Mods/yourmodname/Graphics/Atlases/Gui/areas/yournickname/campaignname/mymapicon.png` (and `mymapicon_back.png` for the icon's back), then use `areas/yournickname/campaignname/mymapicon` as the map's icon. The icon should be 180x180.

## Map Banner

You can specify the colours of the banner and text that appear behind your icon can be changed by editing the Title Base Colour and Title Accent Colour - if you don't specify this, it will just default to Grey. If you just want to copy a vanilla banner, you can find them listed below.

<details>

	Prologue/Epilogue: 383838, 50afae
	Forsaken City: 6c7c81, 2f344b
	Old Site: 247f35, e4ef69
	Celestial Resort: b93c27, ffdd42
	Golden Ridge: ff7f83, 6d54b7 
	Mirror Temple: 8314bc, df72f9
	Reflection: 359fe0, 3c5cbc
	The Summit: ffd819, 197db7
	Core: 761008, e0201d
	Farewell: 240d7c, ff6aa9 

</details>

You can also customize the texture used for the banner and the accent (the differently colored shape to the left of the banner) by placing it in the appropriate folder as follows:

If your map is in `Mods/yourmod/Maps/foldername/mapname.bin`:
- if you want a banner specific to your campaign, drop the textures in `Mods/yourmod/Graphics/Atlases/Gui/areaselect/foldername/title.png` and `accent.png`.
- if you want a banner specific to one of your maps, drop the textures in `Mods/yourmod/Graphics/Atlases/Gui/areaselect/foldername/mapname_title.png` and `mapname_accent.png`.

If you want the textures to be displayed as is, set the appropriate color to `ffffff` in Metadata.

You will find the vanilla banner in the graphics dump (check the [Useful Links](Useful-Links) page), in `Graphics/Atlases/Gui/areaselect`.

## Map Scarf

The scarf that appears behind your map's icon can also be changed by placing the texture for it in a folder that matches your campaign/map's path.

If your map is in `Mods/yourmod/Maps/foldername/mapname.bin`:
- if you want a scarf specific to your campaign, drop it in `Mods/yourmod/Graphics/Atlases/Gui/areas/foldername/hover.png` 
- if you want a scarf specific to one of your maps, drop it in `Mods/yourmod/Graphics/Atlases/Gui/areas/foldername/mapname_hover.png`

You will find the vanilla scarf in the graphics dump (check the [Useful Links](Useful-Links) page), in `Graphics/Atlases/Gui/areas/hover.png`.

## Chapter Card

You can change the chapter card (the card that shows up when your chapter is selected, showing collected berries, deaths, etc):

![image](https://github.com/EverestAPI/Resources/assets/52103563/abb42a35-1e2d-4562-84f7-93ca63782ee2)

If your map is in `Mods/yourmod/Maps/foldername/mapname.bin`:
- if you want a chapter card specific to your campaign, drop the textures in `Mods/yourmod/Graphics/Atlases/Gui/areaselect/foldername/card.png`, `cardtop.png`, `card_golden.png` and `cardtop_golden.png`.
- if you want a chapter card specific to one of your maps, drop the textures in `Mods/yourmod/Graphics/Atlases/Gui/areaselect/foldername/mapname_card.png`, `mapname_cardtop.png`, `mapname_card_golden.png` and `mapname_cardtop_golden.png`.

Here is an example setup for a map in `Mods/CardTestMod/Maps/SSM24/cardtest/test2.bin`, for both the campaign and the map itself:

![image](https://github.com/EverestAPI/Resources/assets/52103563/c50a152f-6c1e-4e5c-8a19-70d6a10b73dc)

You will find the vanilla chapter card in the graphics dump (check the [Useful Links](Useful-Links) page), in `Graphics/Atlases/Gui/areaselect`.

## Chapter Panel Tab
You can change the tab that appears below the CLIMB text:

If your map is in `Mods/yourmod/Maps/foldername/mapname.bin`:
- if you want a tab specific to your campaign, drop it in `Mods/yourmod/Graphics/Atlases/Gui/areaselect/foldername/tab.png` 
- if you want a tab specific to one of your maps, drop it in `Mods/yourmod/Graphics/Atlases/Gui/areaselect/foldername/mapname_tab.png`

You can also change the backpack icon that appears on it:
If your map is in `Mods/yourmod/Maps/foldername/mapname.bin`:
- if you want an icon specific to your campaign, drop it in `Mods/yourmod/Graphics/Atlases/Gui/menu/foldername/play.png` 
- if you want an icon specific to one of your maps, drop it in `Mods/yourmod/Graphics/Atlases/Gui/menu/foldername/mapname_play.png`
The B side and C side tape icons can be changed the same way by replacing `play` with `remix` or `rmx2` respectively.

## Checkpoint Images

If your map is in Mods/yourmodname/Maps/**yournickname/campaignname/mapname**.bin, you should drop your checkpoint images to this location for them to work:

Mods/yourmodname/Graphics/Atlases/Checkpoints/**yournickname/campaignname/mapname**/side/roomname.png

Replace `side` with A, B or C, and `roomname` with the name of the room the checkpoint is in, or `start` for the starting checkpoint.

If you want to make the checkpoint images look like vanilla ones, you can add the mask to the image with [Postcard :link:](http://postcard.leo60228.space/mask). Simply upload your screenshot, hit submit, and save the new image. Please report issues to @leo60228#0480 on Discord. If this doesn't work, manual instructions are also available below.

<details>
<summary>Manual instructions (click to view)</summary>

For starters, download this mask. (using other masks from a graphics dump of Celeste is fine also)
![](https://github.com/EverestAPI/Resources/assets/52103563/67df1050-b012-465c-a594-1866019dc7f3)

(These instructions assume you're using [GIMP :link:](https://www.gimp.org/).)

Right click your original image in the layers tab and click Add Layer Mask.

Be sure you have Transfer Layer's Alpha Channel chosen and Invert Mask checkmarked, then, right click on the checkpoint mask in the editor and Copy it. (Edit > Copy)

In the layer tab be sure that the black part of the original image is selected (that's the mask), then right click in the editor and paste.

Use a tool like the Rectangle Select tool to get rid of the _floating selection layer_ by clicking anywhere in the editor - you should now see your image with the checkpoint mask on it.

![](https://github.com/EverestAPI/Resources/assets/52103563/f42b660d-e7e4-4188-ac62-58f2304af0bc)

</details>

## Interlude Chapters

Interlude chapters are typically chapters that lack collectibles and significant gameplay, like Prologue and Epilogue in vanilla. By checking the `Interlude` box in Ahorn, the chapters name will be centered vertically and the `Chapter x` removed from the banner, collectibles and deaths will not appear on the chapter card, and the chapter will not show in the journal or as a datapoint on the file select cards. Toggling this setting also breaks B- and C-Sides for the chapter. 

# In-Game

## Respawn Wipes

These are the short transition animations that play when the player is respawning after death. If you want to use your own custom wipes, you'll need a sequence of 1920x1080 black and white images, which can then be converted into a wipe at [this site :link:](https://maddie480.ovh/celeste/wipe-converter).

## Bloom Base and Strength

Bloom is a value that controls how much light static objects emit (like foreground tiles or decals, rather than torches). Increasing Bloom Base will make things give off light, while Bloom Strength will increase how much light those objects emit - you can think of it as a multiplier to Bloom Base. Note that increasing this value too far may impact photosensitive players, and it is recommended to include warnings and a way to alter the bloom if your default bloom is quite strong.

## Darkness Alpha

Alters how dark the map is, and ranges from 0.0 to 1.0, with 1.0 being the darkest. This helps you alter how dark your map is incrementally without simply enabling the "dark" option.

## Colorgrades

To create a colorgrade for yourself, you'll want to open up a copy of the `none.png` colorgrade from your Celeste installation, and either edit it manually or apply a color filter to shift colors to appear closer to the color of your filter (for example, if you wanted a colorgrade for an ice map, you might apply a blue filter). You should then export the image, give it an appropriate name (for our blue example, it might be `yournicknameblue`), and then place the exported image in `yourmodname/Graphics/ColorGrading/yourname/campaignname`. You can now enter the path for your colorgrade into the Color Grade field in your Map Metadata (for example, `yourname/campaignname/colorgrade`).

You can also use [this page :link:](https://lostinnowhere314.github.io/celeste-colorgrade-gen/) to generate your own colorgrades.

### How Colorgrades work

Colorgrades are essentially a map for the game of what colors should be shown as to the player. This is represented as a 16x16x16 cube, split up to be a 256x16 2d image - ie each square that you see represents one layer of the cube. So if you wanted to change any instances of #000000 that appear on your screen to say, #fc4ee2, you would edit the topleftmost pixel to that color, and you can repeat this for any color represented. If a value isn't represented by the 4096 pixels, it will simply be interpolated between the nearest 4 pixels on the 2d image.

## Postcards

Postcards will appear whenever you start a level, and display a short snippet of text.  
To customize them, head back to your `English.txt` and paste in the following:

```
yournickname_campaignname_mapname_postcard= YourTextHere
```

What the example text corresponds to and what to replace it with is documented above.

> [!NOTE]
> The postcard only appears when you haven't completed the chapter or if you begin the chapter in a debug save file.

Additionally, as of Everest 6170, it is possible to change the texture of the postcard.  
In your `.meta.yaml` file, add this section:

```yaml
Postcard:
  Texture: yournickname/campaignname/postcardtexture  # relative to the Gui atlas
```

> [!NOTE]
> More postcard customization features are planned to be added in the future. See [EverestAPI/Everest#1058 :link:](https://github.com/EverestAPI/Everest/issues/1058) for more details.

## Loading Vignette

A loading vignette is displayed when a level is selected, similarly to the Intro, Summit, and Core chapters.

To display an image, use the same structure as a Chapter Complete Screen, but replace `CompleteScreen` with `LoadingVignetteScreen`.

To display text, add the following and replace `Dialog_ID_Here` with your maps Dialog ID:

```yaml
LoadingVignetteText:
    Dialog: "Dialog_ID_Here"
```

Note that only one of these can be used for each level.

# Overriding Metadata

By default, the map metadata for the A-side is also used for the B and C-Sides. Some metadata can be overridden by checking `OverrideASideMeta` in the B/C side metadata.

A semi-comprehensive list of the features that can be overridden is as follows:
- IntroType
- Dreaming
- ColorGrade
- DarknessAlpha
- BloomBase
- BloomStrength
- CoreMode


_If any of this information is incorrect, feel free to correct it and to shout at maddie480#4596 on Discord._
