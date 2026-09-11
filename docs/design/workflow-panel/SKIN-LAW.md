# The fixed-position law, as Blizzard actually enforces it

The three-race console was worth checking because it is the strongest available test of *"the fields
maintain the same position across all the elements."* The result is stronger than the argument needed.

## It is not three reskins over one geometry. It is forty-five, and the format cannot move a pixel.

Four independent proofs, from the shipped files in `core.sc2mod/base.sc2data/UI/`:

**1 · Two sibling layers, and Blizzard's own comments name the split.** `GameUI.SC2Layout` mounts the
console as two full-bleed siblings:

```xml
<!-- Console Panel - actual model frame which makes up the console -->
<Frame type="ConsolePanel" name="ConsolePanel" template="ConsolePanel/ConsolePanelTemplate">
<!-- Console UI elements - elements attached to console -->
<Frame type="Frame" name="ConsoleUIContainer">
```

The first is the race **art**. The second holds the functional widgets with unconditional literal
geometry no race can reach — `MinimapPanel` 395×327, `CommandPanel` 400×242, `InfoPanel` 580×199,
`PortraitPanel` 152×232.

**2 · The race strings live in exactly one file.** Case-insensitive line counts across the console
layouts: `terran` 22, `protoss` 26, `zerg` 24 — **every one inside `ConsolePanel.SC2Layout`**.
`CommandPanel`, `MinimapPanel`, `InfoPanel`, `PortraitPanel` and `ResourcePanel` contain **zero**. And
every race string is a skin *condition*, never a measurement:

```xml
<When type="Property" frame="$this" CurrentConsoleSkin="ConsoleProtoss_Nerazim"/>
```

**3 · A skin may only paint.** `ConsoleSkin_Template.SC2Layout` is the entire contract: three
decorative image containers whose only per-skin content is a texture indirection
(`<Texture val="{$ConsolePanel/@InfoPanelImage}"/>`). Not one interactive frame, not one command cell.
It renders `LDR`, i.e. *under* the HDR functional console.

**4 · The data schema has no geometry fields at all.** `ConsoleSkinData.xml` defines **45** concrete
`CConsoleSkin` entries. The type carries three art fields — `MinimapPanelModel`, `InfoPanelModel`,
`CommandPanelModel` — plus Light, Description, Thumbnail. Grep `width|height|anchor|offset` across the
whole catalog: **0 hits**.

### The one exception, and it proves the rule

`APMMeter` is the only console frame that receives per-skin `SetAnchor` actions. It is a
non-interactive APM readout whose `DefaultState` is `NotVisible`, shown only for premium skins — the
base Terran/Protoss/Zerg consoles never display it. A decorative label chasing a blank spot in the
painting; never a field moving.

## The stronger evidence is not the race axis at all

`InfoPanel.SC2Layout` mounts **five different content types at byte-identical anchors**:

```
InfoPaneUnit · InfoPaneHero · InfoPaneQueue · InfoPaneProgress · InfoPaneCargo
all: Top/$parent/Min/0 · Bottom/$parent/Max/0 · Right/$parent/Max/0 · Width 402
```

A marine, a hero, a production queue, a build-progress bar and a transport's cargo hold are wildly
different payloads, and Blizzard gives them **one 402-wide box with zero position variance**.

**The race axis proves skin-vs-geometry. The pane axis proves content-vs-geometry** — and content is
what this panel actually varies over. That is the law, shipped.

## The command card cannot drift, structurally

`CommandButton00` anchors to `$parent` Min/Min; 01–04 each anchor `Left → previous:Max`; 05 drops a row
(`Top → 00:Max`); 06–09 chain right; 10 drops off 05; 11–14 chain right. Fifteen cells, 5 × 3, each a
hard 76 × 76 with `CommandButtonGap = 1`. **A cell physically cannot move alone — shifting one drags
its row-mates.** The grid is a chain, not a coordinate list.

## Warcraft III reaches the same result through a different format

`War3Skins.txt` opens `[Main] Skins=Orc,Human,NightElf,Undead`, with Human's art in `[Default]` —
Human is WC3's fallback exactly as Terran is SC2's. Every race defines **identical key names** and only
the path changes. Counting every key in `[Default]`: **360 entries, and not one is a coordinate.**
Every value is a `.blp`, an `.mdl`, an `.mp3` or a font.

Four complete reskins, zero geometric authority — the same result reached by a different file format
eight years earlier.

## The palettes, and my correction

I guessed the race colours first and got **all three wrong** — I even gave Terran the orange that
belongs to Zerg. Blizzard publishes them as named constants in `FontStyles.SC2Style`:

| race | constant | value | |
|---|---|---|---|
| Terran | `ColorTerranLabel` | **#9BFFBE** | pale phosphor green |
| Protoss | `ColorProtossLabel` | **#6EAAFF** | pale psionic blue |
| Zerg | `ColorZergLabel` | **#F58C46** | carapace orange |

Confirmed twice over by Blizzard's own filenames: `UI_Battlenet_Glue_MiniButton_{Green,Blue,Orange}_
NormalPressed.dds` bind to `_Terr` / `_Prot` / `_Zerg`.

The frame bodies are **not** published — the console is a lit 3D model with no single hex — so those
tokens are read off screenshots and marked estimated in `_variants-defs.js`.

And the default skin is now **Station**, not Zerg: the violet `#8b83f5` this page has always used is
the Gabe palette. Calling it Zerg was the same class of guess.

## What this licenses in the panel

A skin here may set colour tokens and **nothing else**. The probe exercises all variants and all skins
and asserts region widths are byte-identical — currently `328,232,572,220,188,168,212` in every
combination. If a skin ever moves a region by a pixel, that check fails, which is the point.
