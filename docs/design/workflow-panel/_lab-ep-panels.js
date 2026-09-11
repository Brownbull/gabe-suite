/* ═══ Endpoint lab — the five panels (registry + the shared toolkit) ═══════════════════════════
   Each panel: { icon (a STATION icon name), word (the hover word), hint, count(F), render(box, F, S) }.
   render() draws into the box from window.LABEP (facts) with window.STATION (tokens) and marks the
   station inventory rows it covers via COV.mark(row, panelKey). The spec (from the design workflow)
   fills the render bodies; until then a panel says "spec pending" in the feed's own words. */
(function(){
  var S = window.STATION;
  /* ── toolkit ───────────────────────────────────────────────────────────────────────── */
  function E(t, a){ var e = document.createElement(t), k = [].slice.call(arguments, 2);
    for (var p in (a || {})) { if (p === "class") e.className = a[p]; else if (p === "html") e.innerHTML = a[p]; else if (p === "style") e.setAttribute("style", a[p]); else e.setAttribute(p, a[p]); }
    k.forEach(function f(c){ if (c == null) return; if (Array.isArray(c)) c.forEach(f); else if (typeof c === "string") e.insertAdjacentHTML("beforeend", c); else e.append(c); }); return e; }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function ico(n, size, col, cls){ return S.icon(n, size || 13, col, cls); }
  var RWC = { r: S.RW.r, w: S.RW.w, rw: S.RW.rw };
  function rwChip(rw){ return '<i class="jdrw jdrw-' + rw + '" style="background:' + RWC[rw] + '">' + rw.toUpperCase() + '</i>'; }
  function trust(tr){ return tr === "inferred" ? '<span class="ttag inferred" title="inferred — a graft-call / web-bridge floor (kind-level)">inferred</span>' : '<span class="ttag structural" title="structural — an exact archmap / FK join">structural</span>'; }
  function pchip(cls, glyph, text, title){ return '<span class="pchip ' + cls + '"' + (title ? ' title="' + esc(title) + '"' : "") + '>' + (glyph ? ico(glyph, 11) : "") + esc(text) + '</span>'; }
  function sechd(icon, label, count, ok){ return '<div class="sechd">' + ico(icon, 13) + '<span>' + esc(label) + '</span>' + (count != null ? '<span class="cnt' + (ok ? " ok" : "") + '">' + esc(count) + '</span>' : "") + '</div>'; }
  /* the hover card in the station's _jdCellPop shape: header · kind/entity · rows · fields · "in the station" */
  function card(o){ var h = '<div class="cphd">' + (o.icon ? ico(o.icon, 15, o.color) : "") + '<b' + (o.color ? ' style="color:' + o.color + '"' : "") + '>' + esc(o.title) + '</b></div>';
    if (o.sub) h += '<div class="cpsub">' + esc(o.sub) + '</div>';
    (o.rows || []).forEach(function(r){ h += '<div class="cprow"><span class="cpk">' + esc(r[0]) + '</span><span class="cpv"' + (r[2] ? ' style="color:' + r[2] + '"' : "") + '>' + esc(r[1]) + '</span></div>'; });
    if (o.fields && o.fields.length) { h += '<div class="cpsep"></div><div class="cpf">'; o.fields.forEach(function(f){ h += '<div class="cpfn2">' + esc(f) + '</div>'; }); h += '</div>'; }
    if (o.body) h += '<div class="cpbody">' + o.body + '</div>';
    if (o.station) h += '<div class="cpclick">in the station: ' + esc(o.station) + '</div>';
    return h; }
  function pending(box, key, what){ box.innerHTML = '<div class="pend">' + ico("info", 14) + '<b>' + esc(key) + '</b> — the spec is pending (design workflow in flight). This panel will carry: ' + esc(what) + '</div>'; }
  window.EPKIT = { E: E, esc: esc, ico: ico, rwChip: rwChip, trust: trust, pchip: pchip, sechd: sechd, card: card, RWC: RWC };

  /* ── the registry — icons are STATION icons (words on hover), counts answer A ─────────── */
  window.PANELS = {
    data: { icon: "table", word: "Data + schemas", hint: "where the reads and writes land (13 tables on 5 entities, one DB commit) and the shapes that cross the door (request 7 fields · response 6) — abstractions drawn as lines, the exact columns on hover",
      count: function(F){ return F.data.tables.length; },
      render: function(box, F, S){ pending(box, "DATA + SCHEMAS", F.data.ops.length + " ops over " + F.data.tables.length + " tables · request " + F.data.schemas.request.name + " · response " + F.data.schemas.response.name); } },
    functions: { icon: "function", word: "Functions", hint: "the handler and the call tree behind it — reach 5 · 29 behind; the levels walk 3·16·5·1 with the confidence of each hop; ONE bead walks it",
      count: function(F){ return F.functions.behind.fns; },
      render: function(box, F, S){ pending(box, "FUNCTIONS", "reach " + F.functions.behind.depth + " · " + F.functions.behind.fns + " behind · walk " + F.functions.walk_levels.join("·")); } },
    tests: { icon: "test", word: "Tests", hint: "the cases that reach this door (26 api, all passing · 15 web cases as file coverage), by HTTP status, and the 6+21 cross-entity journeys that pass through",
      count: function(F){ return F.tests.cases.length + F.tests.case_files.length; },
      render: function(box, F, S){ pending(box, "TESTS", F.tests.cases.length + " cases · " + F.tests.journeys.length + "+" + F.tests.journeys_more + " journeys"); } },
    widening: { icon: "globe", word: "Widening", hint: "how far the door reaches: who fetches it (1 hook → screen → route), the workflow steps around it, its usage and its place in the entity",
      count: function(F){ return (F.widening.fetched_by.length + F.widening.chain.reduce(function(s, l){ return s + l.length; }, 0)); },
      render: function(box, F, S){ pending(box, "WIDENING", "fetched by " + F.widening.fetched_by.length + " · chain " + F.widening.chain.map(function(l){ return l.length; }).join("·")); } },
    security: { icon: "key", word: "Security", hint: "what stands before the body runs: the ASGI band (3, app scope), the door's 3 deps with 1 gate, flag walls (none), the status contract, idempotency, the DB commit",
      count: function(F){ return F.security.guards.length + F.security.asgi.length; },
      render: function(box, F, S){ pending(box, "SECURITY", F.security.guards.length + " guards · " + F.security.asgi.length + " asgi · " + F.security.walls.length + " walls"); } },
  };
})();
