/* ═══════════════════════════════════════════════════════════════════════════
   ROW GLYPHS — the panel's words, replaced.

   576 row keys across the 16 elements, 33 distinct, every one rendering as an
   uppercase word in the row gutter. Operator: "reduce the amount of words that we
   use in the panel... use as many icons as possible and embed the wording in the
   hover effect."

   The word survives in the shared tooltip, so nothing is lost — it moves.
   Opt-in via window.__ICONMODE so proposals A-F keep their word gutters.
   ═══════════════════════════════════════════════════════════════════════════ */

var ROWI = {
  /* identity */
  name:'<path d="M20.6 13.4 12 22l-9-9V3h10z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
  kind:'<circle cx="7" cy="7" r="4"/><rect x="13" y="13" width="8" height="8" rx="1"/>',
  entity:'<circle cx="12" cy="12" r="3"/><circle cx="12" cy="4" r="2"/><circle cx="19" cy="16" r="2"/><circle cx="5" cy="16" r="2"/>',
  file:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  /* operation */
  sig:'<path d="M9 20s-3 0-3-3V7c0-3 3-3 3-3M15 4s3 0 3 3v10c0 3-3 3-3 3"/>',
  fn:'<path d="M5 20V8a4 4 0 0 1 4-4h1"/><path d="M3 12h8"/>',
  delivery:'<path d="M2 7h11v9H2z"/><path d="M13 10h4l4 3v3h-8z"/><circle cx="6" cy="18" r="1.8"/><circle cx="17" cy="18" r="1.8"/>',
  doc:'<path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/>',
  /* IN */
  gate:'<path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/>',
  dep:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3A5 5 0 0 0 13.5 3.5L12 5"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3A5 5 0 0 0 10.5 20.5L12 19"/>',
  payload:'<path d="m21 8-9-5-9 5 9 5 9-5z"/><path d="m3 8v8l9 5 9-5V8"/>',
  caller:'<path d="M21 12H8"/><path d="m12 5-7 7 7 7"/><circle cx="21" cy="12" r="1.6"/>',
  fetch:'<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 21h16"/>',
  api:'<path d="M9 2v6M15 2v6"/><rect x="6" y="8" width="12" height="7" rx="2"/><path d="M12 15v7"/>',
  /* STORE */
  read:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="2.6"/>',
  write:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',
  commits:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3"/><path d="M20 5v6"/><path d="m15 19 2 2 4-4"/>',
  store:'<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/>',
  col:'<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18M15 3v18"/>',
  shape:'<path d="M8 5H6a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h2"/><path d="M16 5h2a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a2 2 0 0 1-2 2h-2"/>',
  state:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none"/>',
  via:'<circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M7.5 6H14a4 4 0 0 1 0 8H10a4 4 0 0 0 0 8h.5"/>',
  fk:'<circle cx="7.5" cy="15.5" r="4.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
  /* OUT */
  resp:'<path d="M3 12h13"/><path d="m12 5 7 7-7 7"/><circle cx="3" cy="12" r="1.6"/>',
  touch:'<path d="M9 11V5.5a1.5 1.5 0 1 1 3 0V11"/><path d="M12 11V4.5a1.5 1.5 0 1 1 3 0V11"/><path d="M15 11V6.5a1.5 1.5 0 1 1 3 0V14a7 7 0 0 1-7 7h-1a7 7 0 0 1-7-7v-2a1.5 1.5 0 1 1 3 0"/>',
  dispatch:'<path d="M3 11 21 3l-8 18-2-7z"/><path d="m11 14 10-11"/>',
  /* EVIDENCE + PLACE */
  test:'<path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m9 11 3 3 10-10"/>',
  journey:'<circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>',
  flag:'<path d="M4 22V4"/><path d="M4 4h13l-2.5 4L17 12H4"/>',
  conn:'<circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="m7.4 11 9.2-4M7.4 13l9.2 4"/>',
  reach:'<path d="m12 3-9 4.5 9 4.5 9-4.5z"/><path d="m3 12 9 4.5 9-4.5"/><path d="m3 16.5 9 4.5 9-4.5"/>',
  home:'<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  above:'<path d="M12 20V5"/><path d="m5 12 7-7 7 7"/>',
  __row:'<circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none"/>',
};
function rowSvg(k, size){
  return '<svg viewBox="0 0 24 24" width="' + (size||12) + '" height="' + (size||12) + '" fill="none" '
    + 'style="pointer-events:none" stroke="currentColor" stroke-width="1.8" '
    + 'stroke-linecap="round" stroke-linejoin="round">' + (ROWI[k] || ROWI.__row) + '</svg>';
}

/* the four VITALS meters, the three EVIDENCE verdicts, and the region headers */
var METERI = { reach:"reach", surface:"col", tested:"test", fanin:"caller" };
var EVI    = { TESTS:"test", JOURNEYS:"journey", VERDICTS:"flag" };
var REGI   = { PORTRAIT:"kind", VITALS:"reach", "STATUS DISPLAY":"conn", CARGO:"payload",
               EVIDENCE:"test", COMMAND:"dispatch", IN:"caller", STORE:"store", OUT:"resp" };

/* the fifteen command verbs — the card's own word load */
var CMDI = { frame:"cmdFrame", focus:"cmdFocus", depthd:"cmdDown", depthu:"cmdUp",
  neigh:"cmdNeigh", callers:"cmdCallers", behind:"cmdBehind", tables:"cmdTables",
  screens:"cmdScreens", expand:"cmdExpand", upclu:"cmdCluster", upent:"cmdEntity",
  walkb:"cmdBack", walkf:"cmdFwd", clear:"cmdClear" };
