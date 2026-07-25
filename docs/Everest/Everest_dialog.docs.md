Generated Dialog Keys
 
Luke870 edited this page on Jul 31, 2025 · 11 revisions
Setting values for generated dialog keys requires having a Dialog File in your mod. Setup instructions can be found on the Mod Structure page.

Table of Contents:
Click to expand the Table of Contents
Maps
The examples in this section will use the following placeholders, which should be replaced with the appropriate equivalent for your mod:

MyName: Your name, nickname, or an otherwise unique identifier
MyExampleMod: The name of your mod
MyMap: The name of your map file, excluding the .bin extension.
These examples assume the following folder structure:

Celeste
- Mods
  - MyExampleMod
    - Maps
      - MyName
        - MyExampleMod
          - MyMap.bin
In each example, the value on the right side of the equals sign (=) can be replaced with whatever text you want your mod to display.

Important

When used as Dialog IDs, all spaces ( ), hyphens (-), forward slashes (/) and plus signs (+) are replaced with underscores (_).

For example, assume the below structure:

Celeste
- Mods
  - Expedition
    - Maps
      - SnipUndercover
        - IntoTheDepths
          - 1-CaveIn.bin
If you wanted to change the map name, you would put this in your English.txt:

SnipUndercover_IntoTheDepths_1_CaveIn= Cave In
Campaign Name
MyName_MyExampleMod= CAMPAIGN NAME HERE
Map Name
MyName_MyExampleMod_MyMap= MAP NAME HERE
Checkpoint Name
MyName_MyExampleMod_MyMap_CheckpointRoomName= CHECKPOINT NAME HERE
To rename the START checkpoint, use A_start (or B_start if your map is a B-Side) as the "CheckpointRoomName".

Poem Name
poem_MyName_MyExampleMod_MyMap_MapSide= POEM NAME HERE
MapSide is either A, B, or C depending on if your map is an A-side, B-side, or C-side.

Intro Postcard
MyName_MyExampleMod_MyMap_postcard= POSTCARD TEXT HERE
B-Side Remix Name
MyName_MyExampleMod_MyMap_remix= REMIX NAME TEXT HERE
B-Side Remix Artist Name
MyName_MyExampleMod_MyMap_remix_artist= REMIX ARTIST NAME TEXT HERE
Note that for the B-Side remix name and artist name to show up, your map must be marked as a B-Side map.

Code Mods
The examples in this section will assume an EverestModuleSettings class name of ExampleModuleSettings. A trailing Settings, if present, will be stripped from the class name.

Mod Options Menu Title
modoptions_examplemodule_title= MOD NAME HERE