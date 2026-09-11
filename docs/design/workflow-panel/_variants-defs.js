/* ═══ THE VARIANTS — content for the mechanism in _variants.js ═══════════════
   Every variant renders from data that ALREADY EXISTS in _data.js / _kinds.js.
   A variant that would need a field the feed does not carry is listed as a gap
   in the README rather than invented here. */

/* HONEST STATE, 2026-09-08. A structural-similarity probe (probe-dissim.mjs)
   scored every pair of variants by DOM fingerprint: 16 of 19 pairs came back at
   >=0.85, i.e. the same container restyled. The operator had already said so.

   Two causes, both worth recording:
     1. Two patches (vitals, cargo) silently never applied — a str.replace whose
        anchor had drifted. Python does not error on a miss, so the variants were
        registered in the menu and rendered nothing different. A menu entry that
        does nothing is worse than no menu entry.
     2. The rest were genuinely one idea at three densities. COMMAND's g53 and g35
        were the same grid rotated.

   So this file is now cut back to the variants that MEASURE as distinct, and the
   replacement set is being sourced from four unrelated design traditions rather
   than from the RTS console alone. Anything below scores <0.60 against its
   baseline, or is a behavioural difference the DOM probe cannot see (the minimap's
   rotation lock), which is stated where it applies. */

vRegister("status", [
  { key:"spine",  name:"Spine 3-col", density:"read",
    note:"IN | STORE | OUT as three columns. The baseline." },
  { key:"table",  name:"Ledger",      density:"audit",
    note:"one side-labelled dense table. Measured 0.04 similarity to the spine \u2014 a genuinely different container." },
]);

vRegister("portrait", [
  { key:"planet", name:"Planetary", density:"read",
    note:"the field's own render: mass, glow, belt, satellites, raiders." },
  { key:"glyph",  name:"Glyph",     density:"glance",
    note:"the static kind glyph. 0.96 against planetary \u2014 marked as a WEAK distinction, pending the divergent set." },
]);

vRegister("command", [
  { key:"g53",  name:"5x3 grid", density:"read",
    note:"SC2's CommandPanel. Fifteen cells, hotkey letters." },
  { key:"list", name:"Verb list", density:"audit",
    note:"one labelled row per verb. 0.87 \u2014 also weaker than it looked; a radial or annunciator form is the real alternative." },
]);

vRegister("minimap", [
  { key:"cam",   name:"Camera-up", density:"read",
    note:"the map rotates with the view." },
  { key:"north", name:"North-up",  density:"read",
    note:"the map holds still, only the wedge turns. DOM-identical \u2014 the probe cannot see this one; it is a behaviour difference, not a container difference." },
]);

/* ── FRAME — the container treatment. Taxonomy from the 9-slice UI-kit families
   that ship in game asset packs (LINE · SOFT · BEVEL · NOTCH · FRAME · ORNATE);
   every one here is image-free CSS, and none may move a region by a pixel. */
vRegister("frame", [
  { key:"line",   name:"Line",   density:"read",  note:"a hairline and a 3px radius \u2014 the baseline" },
  { key:"soft",   name:"Soft",   density:"read",  note:"generous radii, no hard corner anywhere" },
  { key:"bevel",  name:"Bevel",  density:"read",  note:"a raised plate: light top edge, dark bottom. The Terran read." },
  { key:"notch",  name:"Notch",  density:"read",  note:"angular corner cuts \u2014 the sci-fi rectangle, via clip-path" },
  { key:"frame",  name:"Frame",  density:"read",  note:"a double rule: the border plus an inset accent line" },
  { key:"ornate", name:"Ornate", density:"read",  note:"heavy accent corner brackets. The Warcraft read." },
]);

/* ── SKINS — colour tokens ONLY ──────────────────────────────────────────────
   CORRECTED 2026-09-08. My first pass guessed the race colours and got all three
   wrong — it even gave Terran the orange that belongs to Zerg. Blizzard PUBLISHES
   them, as named constants in
   core.sc2mod/base.sc2data/UI/FontStyles.SC2Style:

     ColorTerranLabel   155,170,190 -> #9BFFBE   pale phosphor green   Terran = GREEN
     ColorProtossLabel  110,170,255 -> #6EAAFF   pale psionic blue     Protoss = BLUE
     ColorZergLabel     245,140, 70 -> #F58C46   carapace orange       Zerg = ORANGE

   and the binding is confirmed twice over by Blizzard's own filenames —
   UI_Battlenet_Glue_MiniButton_{Green,Blue,Orange}_NormalPressed.dds are bound to
   _Terr / _Prot / _Zerg respectively.

   The ACCENT below is that published label colour. The body/frame tokens are NOT
   published — the console is a lit 3D model with no single hex — so those are read
   off screenshots and marked as such. Anything unmarked is Blizzard's own number.

   NOTE the default skin is now "station", not "zerg". The violet #8b83f5 this page
   has always used is the Gabe palette; calling it Zerg was the same guess. */

vSkin("station", { name:"Station", note:"the Gabe palette — the page's own, not a race",
  tokens:{ "--bg":"#0e1524", "--panel":"#182136", "--nav-bg":"#0c1322", "--chip-bg":"#0e1524",
           "--line":"#2b3650", "--ink":"#e7ebf3", "--muted":"#8794ab", "--accent":"#8b83f5" } });

vSkin("terran", { name:"Terran", note:"accent #9BFFBE is Blizzard's ColorTerranLabel; frame estimated",
  tokens:{ "--bg":"#0d1117", "--panel":"#1b2028", "--nav-bg":"#0a0e14", "--chip-bg":"#12171f",
           "--line":"#333d4a", "--ink":"#dfe6ee", "--muted":"#8592a3", "--accent":"#9BFFBE" } });

vSkin("protoss", { name:"Protoss", note:"accent #6EAAFF is ColorProtossLabel — psionic BLUE, not gold",
  tokens:{ "--bg":"#0a1220", "--panel":"#14202f", "--nav-bg":"#08101c", "--chip-bg":"#0e1826",
           "--line":"#2d4258", "--ink":"#e8eef6", "--muted":"#8fa6bd", "--accent":"#6EAAFF" } });

vSkin("zerg", { name:"Zerg", note:"accent #F58C46 is ColorZergLabel; chitin body estimated",
  tokens:{ "--bg":"#16101a", "--panel":"#2a1f2e", "--nav-bg":"#100b13", "--chip-bg":"#1d1522",
           "--line":"#4a3348", "--ink":"#f0e6dd", "--muted":"#a89099", "--accent":"#F58C46" } });

vSkin("warcraft", { name:"Warcraft III", note:"WC3 publishes filenames, never colours — all estimated",
  tokens:{ "--bg":"#14100c", "--panel":"#231c14", "--nav-bg":"#0f0b08", "--chip-bg":"#1a140e",
           "--line":"#4a3a26", "--ink":"#f0e6d2", "--muted":"#a89878", "--accent":"#d4a24c" } });
