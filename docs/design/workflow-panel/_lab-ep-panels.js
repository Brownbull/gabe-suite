/* ═══ Endpoint lab — the five panels (registry + the shared toolkit) ═══════════════════════════
   Each panel: { icon (a STATION icon name), word (the hover word), hint, count(F), render(box, F, S) }.
   render() draws into the box from window.LABEP (facts) with window.STATION (tokens) and marks the
   station inventory rows it covers via COV.mark(row, panelKey).

   The laws every panel obeys (operator rulings 2026-09-10, see ep-brief.md):
     A how many   — a count on every title, counts INSIDE each part
     C which kind — icons on labels, the word on hover
     D order      — at most TWO sequence pictures: FUNCTIONS (animated bead) · WIDENING (static ladder)
     E deep/far   — the DATA axis: a shape is a STACK, its height is its field count
     G how sure   — dashed = inferred · hatched = unmeasured · hollow = measured-zero
     I pulse      — the DB transaction commit, never git
     J mutation   — writes are #f97316, reads #22c55e, both #eab308 (the station's own chips)
     K / M        — mass (payload in/out) and waiting (async · cache · idempotency)                    */
(function(){
  var S = window.STATION;
  /* ── toolkit ───────────────────────────────────────────────────────────────────────── */
  function E(t, a){ var e = document.createElement(t), k = [].slice.call(arguments, 2);
    for (var p in (a || {})) { if (p === "class") e.className = a[p]; else if (p === "html") e.innerHTML = a[p]; else if (p === "style") e.setAttribute("style", a[p]); else e.setAttribute(p, a[p]); }
    k.forEach(function f(c){ if (c == null) return; if (Array.isArray(c)) c.forEach(f); else if (typeof c === "string") e.insertAdjacentHTML("beforeend", c); else e.append(c); }); return e; }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function ico(n, size, col, cls){ return S.icon(n, size || 13, col, cls); }
  var RWC = { r: S.RW.r, w: S.RW.w, rw: S.RW.rw };
  /* the Tests part's colour, read from its registry row at call time — one source, never a pasted hex */
  function testCol(){ var P = window.PANELS && window.PANELS.tests; return (P && P.col) || S.OPC.read; }
  function rwChip(rw){ return '<i class="jdrw jdrw-' + rw + '" style="--rwc:' + RWC[rw] + '">' + (rw === "rw" ? "RW" : rw.toUpperCase()) + '</i>'; }
  function trust(tr){ return tr === "inferred" ? '<span class="ttag inferred" title="inferred — a graft-call / web-bridge floor (kind-level, not per-edge proof)">inferred</span>' : '<span class="ttag structural" title="structural — an exact archmap / FK join">structural</span>'; }
  function sechd(icon, label, count, ok, col){ return '<div class="sechd">' + ico(icon, 13, col) + '<span>' + esc(label) + '</span>' + (count != null ? '<span class="cnt' + (ok ? " ok" : "") + '">' + esc(count) + '</span>' : "") + '</div>'; }
  /* the hover card in the station's _jdCellPop shape: header · kind/entity · rows · fields · "in the station" */
  function card(o){ var h = '<div class="cphd">' + (o.icon ? ico(o.icon, 15, o.color) : "") + '<b' + (o.color ? ' style="color:' + o.color + '"' : "") + '>' + esc(o.title) + '</b></div>';
    if (o.sub) h += '<div class="cpsub">' + esc(o.sub) + '</div>';
    (o.rows || []).forEach(function(r){ if (!r) return; h += '<div class="cprow"><span class="cpk">' + esc(r[0]) + '</span><span class="cpv"' + (r[2] ? ' style="color:' + r[2] + '"' : "") + '>' + esc(r[1]) + '</span></div>'; });
    if (o.fields && o.fields.length) { h += '<div class="cpsep"></div><div class="cpf">'; o.fields.forEach(function(f){ h += '<div class="cpfn2">' + esc(f) + '</div>'; }); h += '</div>'; }
    if (o.body) h += '<div class="cpbody">' + o.body + '</div>';
    if (o.station) h += '<div class="cpclick">in the station: ' + esc(o.station) + '</div>';
    return h; }
  function bind(el, fn){ return window.hoverBind(el, fn); }
  /* THE FIELD LAYER (D-024, _lab-ep-map.js): a renderer tags the element it drew with the card's inventory attribute id(s).
     tg() for a node · fa() inside a markup string, then claim(box) registers what the string drew. `hover` = the fact rides
     only the element's hover card. The ids are the inventory's (LABEP.sectionmap.attrs); the probe refuses any other. */
  function tg(el, ids, hover){ if (el && window.DRAWN) window.DRAWN.tag(el, ids, hover ? { hover: 1 } : null); return el; }
  function fa(ids, hover){ return window.DRAWN ? window.DRAWN.fa(ids, hover) : ""; }
  function claim(box){ if (window.DRAWN) window.DRAWN.claim(box); return box; }
  /* what a function DOES here (F.functions.does) → the inventory's function rows; the four words are the feed's own */
  var DOESFA = { "faces the web": "the-handler", "decides an ending": "decision-point-functions",
                 "reads or writes data": "data-touching-functions", "gives context": "context-giving-functions" };
  function doesIds(F, key, handler){ var dz = doesOf(F, key), out = handler ? ["the-handler"] : [];
    if (dz) { out.push("roles-per-function"); dz.does.forEach(function(w){ var id = DOESFA[w]; if (id && out.indexOf(id) < 0) out.push(id); }); }
    return out; }
  function head(box, icon, label, count, note, col){ var h = E("div", { class: "phd" }, sechd(icon, label, count, false, col));
    if (note) h.append(E("div", { class: "phdnote", html: note })); box.append(h); return h; }
  function legend(items){ var l = E("div", { class: "plgd" });
    items.forEach(function(it){ var s = E("span", { class: "lg" });
      if (it.node) s.append(it.node);                       /* the legend draws the MARK as drawn */
      else if (it.swatch) s.insertAdjacentHTML("beforeend", '<i class="sw" style="' + it.swatch + '"></i>');
      else if (it.icon) s.insertAdjacentHTML("beforeend", ico(it.icon, 12, it.col));
      s.insertAdjacentHTML("beforeend", esc(it.t));
      if (it.tip) bind(s, it.tip); l.append(s); }); return l; }
  /* a SHAPE drawn as lines — the operator's ask: abstractions, never the data. Height answers E. */
  function shapeStack(name, cols, opt){ opt = opt || {};
    var wrap = E("div", { class: "shape" + (opt.cls ? " " + opt.cls : "") });
    var bars = E("div", { class: "bars" });
    cols.forEach(function(c, i){ var isFk = (opt.fkSet || {})[c[0]], isUq = (opt.uqSet || {})[c[0]], isNest = (opt.nestSet || {})[String(c[1]).replace(/\s*\|\s*None$/, "")];
      var b = E("i", { class: "bar" + (isFk ? " fk" : "") + (isUq ? " uq" : "") + (isNest ? " nest" : ""), style: "width:" + Math.max(22, Math.min(100, 34 + String(c[0]).length * 3.2)) + "%" });
      bind(b, card({ title: c[0], sub: String(c[1] || "—"), icon: isFk ? "key" : "table", color: opt.color,
        rows: [["in", name], isFk ? ["foreign key", "→ " + (isFk === true ? "another table" : isFk)] : null, isUq ? ["unique", "yes"] : null, isNest ? ["nested shape", String(c[1])] : null],
        body: "one line = one field — the shape is drawn as an abstraction; this card is the only place the exact field appears." }));
      bars.append(b); });
    if (opt.more) bars.append(E("i", { class: "bar more", style: "width:30%" }));
    wrap.append(bars); return wrap; }

  /* ══════════════════════════════════════════════════════════════════════════════════════
     1 · DATA + SCHEMAS — the operator's merged panel.
     request shape (lines) → the door → reads/writes landing on 13 tables grouped on 5
     entity-coloured grounds (each table a stack: height = columns) → the DB COMMIT pulse →
     the response shape (lines). Hover any bar or tile for the exact fields.
     ══════════════════════════════════════════════════════════════════════════════════════ */
  function renderData(box, F, S){
    var D = F.data, I = F.identity, TS = dtables(D);
    dhead(box, F, D, TS, "table",
      "every table this endpoint touches, grouped on its entity's ground — each tile a stack whose height is its column count");
    if (!TS.length) { chanEmpty(box, D, S); COV.mark("ACCESSES", "data"); return; }
    var body = E("div", { class: "dbody nowings" });

    /* middle — the grounds */
    var mid = E("div", { class: "dcol dmid wide" });
    var grounds = {}; TS.forEach(function(t){ (grounds[t.entity || "—"] = grounds[t.entity || "—"] || []).push(t); });
    var DC = window.DATACFG || { order: "size" };
    var order = Object.keys(grounds).sort(function(a, b){
      if (DC.order === "name") return a.localeCompare(b);
      if (DC.order === "home") return (b === I.entity) - (a === I.entity) || grounds[b].length - grounds[a].length || a.localeCompare(b);
      return grounds[b].length - grounds[a].length || a.localeCompare(b); });
    var gwrap = E("div", { class: "grounds" });
    order.forEach(function(ent){
      var ts = grounds[ent], ec = ts[0].entity_color || "#8794ab";
      var g = E("div", { class: "ground" + (ent === I.entity ? " home" : ""),
        style: "--ec:" + ec + ";flex-grow:" + (DC.width === "equal" ? 1 : Math.min(3, ts.length)) });
      var gh = E("div", { class: "ghd" }, '<i class="pdot" style="background:' + ec + '"></i>', esc(ent), E("span", { class: "n" }, String(ts.length)));
      bind(gh, card({ title: ent, icon: "entity", color: ec, sub: "entity ground · " + ts.length + " table(s) this endpoint touches",
        rows: [["writes", String(ts.filter(function(t){ return t.rw !== "r"; }).length)], ["reads", String(ts.filter(function(t){ return t.rw !== "w"; }).length)], ["own entity", ent === I.entity ? "yes — the endpoint's own" : "no — the endpoint reaches across"]],
        body: ent === I.entity ? "the endpoint's own entity." : "a CROSS-ENTITY touch: this endpoint writes into another entity's tables." }));
      g.append(gh);
      var tiles = E("div", { class: "tiles" });
      ts.sort(function(a, b){ return b.cols.length - a.cols.length; }).forEach(function(t){
        var fkSet = {}; (t.fks || []).forEach(function(f){ fkSet[Array.isArray(f) ? f[0] : f] = (Array.isArray(f) && f[1]) ? f[1] : true; });
        var uqSet = {}; (t.uqs || []).forEach(function(u){ (Array.isArray(u) ? u : [u]).forEach(function(c){ uqSet[c] = 1; }); });
        var tile = E("div", { class: "tile rw-" + t.rw });
        tile.dataset.table = t.table; tg(tile, "tables-touched");
        tile.append(E("div", { class: "tnm" }, rwChip(t.rw), E("b", null, esc(t.table)), E("span", { class: "tc" }, String(t.cols.length))));
        tg(tile.querySelector(".tnm .jdrw"), "operation-per-table");
        tile.append(shapeStack(t.table, t.cols, { color: ec, fkSet: fkSet, uqSet: uqSet, more: t.cols_more, cls: "tbars" }));
        bind(tile, card({ title: t.table, icon: "model", color: S.KINDCOL.model, sub: "model " + t.model + " · entity " + t.entity,
          rows: [["here", t.rw === "rw" ? "reads + writes" : t.rw === "w" ? "writes" : "reads", RWC[t.rw]],
                 ["columns", String(t.cols.length) + (t.cols_more ? " (+" + t.cols_more + " more)" : "")],
                 (t.fks || []).length ? ["foreign keys", String(t.fks.length)] : null,
                 (t.uqs || []).length ? ["unique", String(t.uqs.length)] : null,
                 ["file", String(t.file || "—")]],
          fields: t.cols.map(function(c){ return c[0] + " · " + c[1] + (fkSet[c[0]] ? "  (fk)" : "") + (uqSet[c[0]] ? "  (unique)" : ""); }),
          station: t.id || ("model:" + t.model) }));
        tiles.append(tile); });
      g.append(tiles); gwrap.append(g); });
    mid.append(gwrap);

    /* the DB COMMIT baseline — I pulse, one per transaction commit, never git */
    var cm = E("div", { class: "commit" + (D.commits ? " on" : " off") },
      ico(D.commits ? "key" : "info", 13, D.commits ? S.OPC.write : "var(--muted)"),
      E("b", null, D.commits ? "DB COMMIT" : "no commit"),
      E("span", { class: "cnote" }, D.commits ? "the writes above become permanent in ONE transaction" : "this endpoint only reads — access.commits is false"),
      E("i", { class: "pulse" }));
    bind(cm, card({ title: D.commits ? "the DB transaction commits" : "no DB commit", icon: "key", color: S.OPC.write,
      sub: "access.commits · the pulse means the transaction, NEVER a git commit",
      rows: [["writes", String(D.writes.length) + " ops"], ["tables written", String(D.tables.filter(function(t){ return t.rw !== "r"; }).length)], ["idempotency", F.security.idempotent ? "guarded by " + F.security.idempotency_table : "none"]],
      body: "git history is a different thing entirely — this endpoint appears in " + (F.git_touches.commits.length) + " of the feed's " + F.feedwide.commits_on_feed + " recent git commits." }));
    mid.append(cm);
    body.append(mid);

    box.append(body);

    /* the foot: the evidence row (home_ev), the entity-model row, and the legend */
    var foot = E("div", { class: "pfoot" });
    var ev = I.home_ev;
    if (ev && ev.verdict) { var top = function(m){ var ks = Object.keys(m || {}); if (!ks.length) return null; ks.sort(function(a, b){ return m[b] - m[a]; }); var tot = ks.reduce(function(s, k){ return s + m[k]; }, 0); return ks[0] + " " + Math.round(100 * m[ks[0]] / tot) + "% of " + tot; };
      var u = top(ev.users), d = top(ev.data);
      var er = E("div", { class: "kv ev" }, ico("role", 13), E("span", { class: "k" }, "evidence"), E("span", { class: "v" }, "home " + I.entity + " by its file claim · users say " + (u || "abstain") + " · data says " + (d || "abstain") + " → " + String(ev.verdict).toUpperCase()));
      bind(er, card({ title: "membership evidence", icon: "role", sub: "file · users · data — the three witnesses",
        rows: [["home by", String(ev.by)], ["users", u || "abstain"], ["data", d || "abstain"], ["verdict", String(ev.verdict).toUpperCase()]],
        body: (function(){ var de = ev.data || {}, ks = Object.keys(de).sort(function(a, b){ return de[b] - de[a]; }), tot = ks.reduce(function(n, k){ return n + de[k]; }, 0);
          return "the FILE wins here — evidence only, nothing is re-homed." + (ks.length ? " The data witness leans <b>" + esc(ks[0]) + "</b>: " + de[ks[0]] + " of the " + tot + " table touches it counted belong to " + esc(ks[0]) + "." : ""); })() }));
      foot.append(er); COV.mark("EVIDENCE", "data"); }
    var mh = I.models_home || {}; var mrow = E("div", { class: "kv mdl" }, ico("link", 13), E("span", { class: "k" }, "model"), E("span", { class: "v" }, "claim " + I.entity + (mh.seeded || mh.derived || mh.proposed ? " · a view re-homes it" : " · every entity model keeps it here (no delta)")));
    bind(mrow, card({ title: "entity model", icon: "link", sub: "claim is the join key; seeded · derived · proposed are views",
      rows: [["claim", I.entity], ["seeded", mh.seeded || "no delta"], ["derived", mh.derived || "no delta"], ["proposed", mh.proposed || "no delta"]],
      body: "the station is settled on <b>seeded</b>; a view moves a piece as a DELTA, nothing is re-homed on disk." }));
    foot.append(mrow); COV.mark("MODEL ROW", "data");
    foot.append(legend([
      { t: "reads", swatch: "background:" + RWC.r, tip: card({ title: "reads", sub: "the station's journey-matrix chip", body: "13 read ops. Colour inherited from <code>.jdrw-r</code>." }) },
      { t: "writes", swatch: "background:" + RWC.w, tip: card({ title: "writes", sub: "the station's journey-matrix chip", body: "11 write ops — J mutation." }) },
      { t: "both", swatch: "background:" + RWC.rw, tip: card({ title: "reads + writes", sub: "the same table on both channels", body: D.both.length + " of the 13 tables are read AND written by this one endpoint." }) },
      { t: "a line = a field", swatch: "background:var(--muted);height:2px;width:16px", tip: card({ title: "the abstraction", sub: "E — how deep", body: "a shape is a STACK; its height is its field count. The exact field is only ever on the hover card — never on the picture." }) },
      { t: "fk", swatch: "background:" + S.KINDCOL.external + ";height:2px;width:16px", tip: card({ title: "foreign key", sub: "a column that points out", body: "drawn in the external colour — the table leans on another table." }) },
      { t: "unique", swatch: "background:transparent;border:1px dashed " + S.OPC.gate + ";height:5px;width:16px", tip: card({ title: "unique", sub: "a latch on the column", body: "the DB refuses a second row with this value — the idempotency table carries 3." }) }]));
    box.append(foot);

    COV.mark("ACCESSES", "data"); COV.mark("PAYLOAD", "data"); COV.mark("CONNECTIONS", "data");
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════
     1b · SCHEMAS — its own part again (operator 2026-09-12: merging it into DATA was too much).
     What crosses the door, drawn as lines: the request shape in, the response shape out, each
     nested shape a stack of its own. The exact fields live on the hover cards.
     ══════════════════════════════════════════════════════════════════════════════════════ */
  function schemaBlock(sc, dir, F, S){
    var nest = {}; (sc.nested || []).forEach(function(n){ nest[n.name] = 1; });
    var col = E("div", { class: "scol " + dir });
    col.append(E("div", { class: "dslbl " + (dir === "in" ? "in" : "out") },
      ico("down", 12, dir === "in" ? S.OPC.read : S.OPC.write), dir === "in" ? "REQUEST" : "RESPONSE",
      E("span", { class: "n" }, String((sc.cols || []).length))));
    if (!sc.present) { col.append(E("div", { class: "wempty" }, sc.why || "— not carried by the feed")); return col; }
    var main = E("div", { class: "schm" }, E("div", { class: "snm" }, ico("schema", 12, S.KINDCOL.schema), esc(sc.name)),
      shapeStack(sc.name, sc.cols || [], { color: S.KINDCOL.schema, nestSet: nest }));
    main.dataset.schema = sc.name; tg(main, dir === "in" ? "request-shape" : "response-shape-per-ending");
    bind(main, card({ title: sc.name, icon: "schema", color: S.KINDCOL.schema, sub: (dir === "in" ? "request body" : "response body") + " · entity " + sc.entity,
      rows: [["fields", String((sc.cols || []).length)], ["nested", String((sc.nested || []).length) + " shapes"], ["file", String(sc.file || "—")],
             sc.doc ? ["doc", sc.doc.slice(0, 90)] : null],
      fields: (sc.cols || []).map(function(c){ return c[0] + " · " + c[1]; }), station: "schema:" + sc.name }));
    col.append(main);
    if ((sc.nested || []).length) {
      col.append(E("div", { class: "dnlbl" }, "nested ×" + sc.nested.length + " — each one a shape of its own"));
      var nb = E("div", { class: "nestgrid" });
      sc.nested.forEach(function(n){
        var t = E("div", { class: "nestcard" }, E("div", { class: "snm" }, ico("schema", 11, S.KINDCOL.schema), esc(n.name), E("span", { class: "tc" }, String(n.cols.length))),
          shapeStack(n.name, n.cols, { color: S.KINDCOL.schema, cls: "tbars" }));
        t.dataset.schema = n.name; tg(t, dir === "in" ? "request-shape" : "response-shape-per-ending");
        bind(t, card({ title: n.name, icon: "schema", color: S.KINDCOL.schema, sub: "nested in " + sc.name + " · " + n.cols.length + " fields",
          fields: n.cols.map(function(c){ return c[0] + " · " + c[1]; }), station: "schema:" + n.name }));
        nb.append(t); });
      col.append(nb); }
    return col; }

  function renderSchemas(box, F, S){
    var D = F.data, I = F.identity, req = D.schemas.request, res = D.schemas.response;
    var nIn = (req.cols || []).length, nOut = (res.cols || []).length;
    head(box, "schema", "Schemas", nIn + " in · " + nOut + " out",
      "the shapes that cross the endpoint, drawn as LINES — one line per field, its height the field count; the exact fields live on the hover cards");
    var body = E("div", { class: "scbody" });
    body.append(schemaBlock(req, "in", F, S));
    body.append(E("div", { class: "dfarrow" }, ico("drill", 15, "var(--muted)")));
    body.append(schemaBlock(res, "out", F, S));
    box.append(body);
    var foot = E("div", { class: "pfoot" });
    var pr = E("div", { class: "kv" }, ico("down", 13, S.OPC.write), E("span", { class: "k" }, "payload"), E("span", { class: "v" },
      ((I.payload || {}).n != null ? I.payload.n : nOut) + " fields ferried → " + (res.name || "—")
      + (F.widening.response_consumers.length ? " · also returned by " + F.widening.response_consumers.length + " other endpoint(s)" : "")));
    bind(pr, card({ title: "payload", icon: "down", color: S.OPC.write, sub: "the response contract's field count",
      rows: [["schema", res.name || "—"], ["fields", String((I.payload || {}).n != null ? I.payload.n : nOut)],
             ["shared with", F.widening.response_consumers.join(" · ") || "— this endpoint alone"]],
      body: "the cargo shuttle in the graph scales with this number." }));
    foot.append(pr);
    foot.append(legend([
      { t: "a line = a field", swatch: "background:var(--muted);height:2px;width:16px", tip: card({ title: "the abstraction", sub: "E — how deep", body: "a shape is a STACK; its height is its field count. The exact field only ever appears on the hover card." }) },
      { t: "nested shape", swatch: "background:#06b6d4;height:3px;width:16px", tip: card({ title: "a nested shape", sub: "a field whose type is another schema", body: "drawn brighter in the parent, then given its own stack below." }) },
      { t: "in", swatch: "background:" + S.OPC.read }, { t: "out", swatch: "background:" + S.OPC.write }]));
    box.append(foot);
    COV.mark("PAYLOAD", "schemas"); COV.mark("CONNECTIONS", "schemas");
  }

  /* SCHEMAS · B "fields" — every field of both shapes as rows, nested ones indented under their parent */
  function renderSchemaFields(box, F, S){
    var D = F.data, I = F.identity;
    var nIn = (D.schemas.request.cols || []).length, nOut = (D.schemas.response.cols || []).length;
    head(box, "schema", "Schemas", nIn + " in · " + nOut + " out",
      "every field of both shapes, one per row — the densest reading, with each nested shape under its parent");
    var body = E("div", { class: "lbody" });
    [["in", D.schemas.request], ["out", D.schemas.response]].forEach(function(pair){
      var dir = pair[0], sc = pair[1]; if (!sc.present) return;
      var hd = E("div", { class: "lschm" }, ico("schema", 13, S.KINDCOL.schema), E("b", null, esc(sc.name)),
        E("span", { class: "ls" }, (dir === "in" ? "request" : "response") + " · " + (sc.cols || []).length + " fields · " + (sc.nested || []).length + " nested · " + sc.entity));
      hd.dataset.schema = sc.name; tg(hd, dir === "in" ? "request-shape" : "response-shape-per-ending");
      bind(hd, card({ title: sc.name, icon: "schema", color: S.KINDCOL.schema, sub: dir === "in" ? "request body" : "response body",
        rows: [["file", String(sc.file || "—")]], fields: (sc.cols || []).map(function(c){ return c[0] + " · " + c[1]; }) }));
      body.append(hd);
      var nestOf = {}; (sc.nested || []).forEach(function(n){ nestOf[n.name] = n; });
      var rows = [];
      (sc.cols || []).forEach(function(c){
        var base = String(c[1]).replace(/\s*\|\s*None$/, "").replace(/^(list|List|Optional)\[(.*)\]$/, "$2");
        var n = nestOf[base];
        rows.push({ fa: dir === "in" ? "request-shape" : "response-shape-per-ending", tag: { schema: sc.name, field: c[0] }, cells: [dir === "in" ? "→" : "←", "<b>" + esc(c[0]) + "</b>", esc(c[1]), n ? n.cols.length + " fields" : "—"],
          card: card({ title: c[0], icon: n ? "schema" : "table", color: n ? S.KINDCOL.schema : null, sub: String(c[1]),
            rows: [["in", sc.name], n ? ["a nested shape", n.name + " · " + n.cols.length + " fields"] : null],
            fields: n ? n.cols.map(function(x){ return x[0] + " · " + x[1]; }) : null }) });
        if (n) n.cols.forEach(function(x){ rows.push({ cls: "sub", fa: dir === "in" ? "request-shape" : "response-shape-per-ending", tag: { schema: n.name, field: x[0] }, cells: ["", "<span class='nsub'>" + esc(x[0]) + "</span>", esc(x[1]), ""],
          card: card({ title: x[0], sub: String(x[1]), rows: [["in", n.name], ["nested in", sc.name]] }) }); }); });
      ledger(body, ["dir", "field", "type", "nested"], rows, { grid: "28px 1fr 190px 74px" }); });
    box.append(body);
    var foot = E("div", { class: "pfoot" });
    foot.append(E("div", { class: "kv" }, ico("down", 13, S.OPC.write), E("span", { class: "k" }, "payload"),
      E("span", { class: "v" }, ((I.payload || {}).n != null ? I.payload.n : nOut) + " fields ferried → " + (D.schemas.response.name || "—"))));
    box.append(foot);
    COV.mark("PAYLOAD", "schemas"); COV.mark("CONNECTIONS", "schemas");
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════
     2 · FUNCTIONS — the ONE animated sequence picture (D with a bead).
     the handler, then the levels calls-walk as ordered columns (3 · 16 · 5 · 1), a chip per
     callee: role colour · size = its lines · dashed = an inferred hop · a pulse dot = it commits.
     ══════════════════════════════════════════════════════════════════════════════════════ */
  function renderFunctions(box, F, S){
    var FN = F.functions, h = FN.handler, RC = S.BADGE_COL.role || {};
    head(box, "function", "Functions", FN.behind.fns + " behind",
      "reach " + FN.behind.depth + " · the walk below is the LEVELS call graph (" + FN.walk_levels.join(" · ") + " = " + FN.walk_total + " functions); c4 counts " + FN.behind.fns + " behind because graft sees hops the walk cannot");
    var body = E("div", { class: "fbody" });

    /* the handler card */
    var hc = E("div", { class: "fhandler" },
      E("div", { class: "fnm" }, ico("function", 14, S.KINDCOL["function"]), E("b", null, esc(h.name || "—")),
        E("span", { class: "rolebadge", style: "background:" + (RC[h.role] || "#8794ab") }, esc(h.role || "—"))),
      E("div", { class: "fsig", html: esc(F.identity.gsig || "—") }),
      E("div", { class: "fmeta" }, (F.identity.sig ? ((F.identity.sig.async ? "async · " : "") + F.identity.sig.lines + " lines · → " + (F.identity.sig.returns || "—")) : "—")
        + " · " + (F.identity.doc ? "documented" : "no docstring in the feed")));
    hc.dataset.fn = h.name || ""; tg(hc, doesIds(F, String(h.id || "").replace("#", "::"), true).concat(["signature", "file-line"]));
    bind(hc, card({ title: h.name, icon: "function", color: S.KINDCOL["function"], sub: "the handler · role " + (h.role || "—") + " · entity " + (h.entity || "—"),
      rows: [["signature", (F.identity.sig || {}).async ? "async" : "sync"], ["body", ((F.identity.sig || {}).lines || "?") + " lines"], ["returns", (F.identity.sig || {}).returns || "—"],
             ["file", F.identity.at || h.file], ["fan-in", F.identity.fanin + " caller (graph in-degree)"], ["docstring", F.identity.doc ? "present" : "— none in the feed"]],
      body: "<code>" + esc(F.identity.gsig || "") + "</code>", station: h.id }));
    body.append(hc);

    /* the walk — one column per level, a bead crossing them on the shared clock */
    var walk = E("div", { class: "fwalk" });
    var strip = E("div", { class: "fstrip" });
    FN.walk.forEach(function(level, i){
      var col = E("div", { class: "flevel" });
      var inferred = level.filter(function(f){ return f.conf === "inferred"; }).length;
      var lh = E("div", { class: "flhd" }, E("b", null, "L" + (i + 1)), E("span", { class: "n" }, String(level.length)), inferred ? E("i", { class: "inf" }, "⌁" + inferred) : null);
      bind(lh, card({ title: "level " + (i + 1), icon: "layers", sub: level.length + " function(s) reached at this hop",
        rows: [["extracted", String(level.length - inferred) + " hops the scanner proved"], ["inferred", String(inferred) + " hops graft inferred"], ["commit here", String(level.filter(function(f){ return f.commits; }).length)]],
        body: "G — how sure: a dashed chip is an INFERRED hop (a floor, not a census)." }));
      col.append(lh); tg(lh, "functions-behind-walk-levels");
      var list = E("div", { class: "flist" });
      level.slice(0, 9).forEach(function(f){
        var chip = E("span", { class: "fchip" + (f.conf === "inferred" ? " inf" : "") + (f.god ? " god" : ""), style: "border-left-color:" + (RC[f.role] || "#8794ab") },
          E("b", null, esc(f.name)), f.lines ? E("span", { class: "ln" }, f.lines + "L") : null, f.commits ? E("i", { class: "cdot" }) : null);
        chip.dataset.fn = f.name; tg(chip, doesIds(F, String(f.id || "").replace("#", "::")));
        bind(chip, card({ title: f.name, icon: "function", color: RC[f.role] || S.KINDCOL["function"], sub: (f.role || "—") + " · " + (f.entity || "—") + " · hop " + f.conf,
          rows: [["file", f.file], ["lines", f.lines != null ? String(f.lines) : "— not measured"], ["reached by", f.via || h.name],
                 ["commits", f.commits ? "yes — a DB transaction boundary" : "no"], f.ops && f.ops.length ? ["tables", f.ops.map(function(o){ return o.rw + ":" + o.table; }).join(" · ")] : null,
                 ["god", f.god ? "yes — over the 50-line size flag" : "no"]],
          body: f.conf === "inferred" ? "an INFERRED hop — graft resolved it, the scanner did not prove it." : "an EXTRACTED hop — proven by the suite's own AST pass.", station: f.id }));
        list.append(chip); });
      if (level.length > 9) { var mb = E("span", { class: "more" }, "+" + (level.length - 9) + " more");
        bind(mb, card({ title: "level " + (i + 1) + " · the rest", sub: (level.length - 9) + " more functions at this hop", fields: level.slice(9).map(function(f){ return f.name + " · " + (f.role || "—") + (f.lines ? " · " + f.lines + "L" : ""); }) })); list.append(mb); }
      col.append(list); strip.append(col); });
    strip.append(E("i", { class: "bead" }));
    walk.append(strip); body.append(walk); box.append(body);

    var foot = E("div", { class: "pfoot" });
    var bn = E("div", { class: "kv" }, ico("layers", 13), E("span", { class: "k" }, "code behind"), E("span", { class: "v" }, FN.behind.fns + " functions · reach " + FN.behind.depth + " · " + FN.behind.names.length + " named" + (FN.behind.names_more ? " (+" + FN.behind.names_more + " unnamed)" : "")));
    bind(bn, card({ title: "code behind", icon: "layers", sub: "derive_behind — the transitive callee mass",
      rows: [["functions", String(FN.behind.fns)], ["reach", String(FN.behind.depth) + " (BFS depth, a floor)"], ["named", String(FN.behind.names.length)], ["the walk", FN.walk_levels.join(" · ") + " = " + FN.walk_total]],
      fields: FN.behind.names, body: FN.walk_note }));
    foot.append(tg(bn, "functions-behind-walk-levels"));
    foot.append(legend([
      { t: "accessor", swatch: "background:" + (RC.accessor || "#ef4444"), tip: card({ title: "accessor", sub: "role badge", body: (S.BADGE_DESC.role || {}).accessor || "touches the database" }) },
      { t: "caller", swatch: "background:" + (RC.caller || "#3b82f6"), tip: card({ title: "caller", sub: "role badge", body: (S.BADGE_DESC.role || {}).caller || "calls other functions" }) },
      { t: "gate", swatch: "background:" + (RC.gate || "#eab308"), tip: card({ title: "gate", sub: "role badge", body: (S.BADGE_DESC.role || {}).gate || "decides whether the work proceeds" }) },
      { t: "pure", swatch: "background:" + (RC.pure || "#8794ab"), tip: card({ title: "pure", sub: "role badge", body: (S.BADGE_DESC.role || {}).pure || "computes, touches nothing" }) },
      { t: "inferred hop", swatch: "background:transparent;border-left:3px dashed var(--edge);width:14px;height:9px", tip: card({ title: "inferred", sub: "G — how sure", body: "graft resolved the call; the scanner did not prove it. A floor, never a census." }) },
      { t: "commits", swatch: "background:" + S.OPC.write + ";border-radius:50%;width:7px;height:7px", tip: card({ title: "commits", sub: "I — the pulse", body: "this function ends a DB transaction. 4 of the walk's functions do." }) }]));
    box.append(foot);
    COV.mark("CODE BEHIND", "functions"); COV.mark("SIGNATURE", "functions"); COV.mark("DOCSTRING", "functions");
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════
     3 · TESTS — the cases that reach the door, stacked by the HTTP STATUS they assert,
     then the cross-entity journeys as the station's own rows (cid · corpus · comp · faces).
     ══════════════════════════════════════════════════════════════════════════════════════ */
  function renderTests(box, F, S){
    var T = F.tests, byS = T.by_status, keys = Object.keys(byS).sort(function(a, b){ return (/^\d/.test(a) ? 0 : 1) - (/^\d/.test(b) ? 0 : 1) || a.localeCompare(b); });
    var allPass = T.cases.length > 0 && (T.by_state.pass || 0) === T.cases.length;
    head(box, "test", "Tests", T.cases.length + " + " + T.case_files.length + " file",
      "every case that names this endpoint, stacked under the STATUS it asserts · the declared status is " + T.declared_status + " · " + (allPass ? "all measured cases pass" : "not every case passes"));
    var body = E("div", { class: "tbody" });

    var cols = E("div", { class: "tcols" });
    keys.forEach(function(k){
      var cids = byS[k], isCode = /^\d/.test(k), declared = String(k) === String(T.declared_status);
      var col = E("div", { class: "tcol" + (declared ? " declared" : "") + (isCode ? "" : " nocode") });
      var col_c = isCode ? (k[0] === "2" ? S.OPC.read : k[0] === "4" ? S.OPC.gate : S.OPC.write) : "var(--muted)";
      var ch = E("div", { class: "thd", style: "color:" + col_c }, E("b", null, esc(k)), E("span", { class: "n" }, String(cids.length)));
      bind(ch, card({ title: isCode ? "HTTP " + k : "no code in the name", color: col_c, icon: isCode ? "info" : "test",
        sub: cids.length + " case(s)" + (declared ? " · the DECLARED status" : ""),
        rows: [["how", isCode ? "the case name carries _" + k + "_" : "the name carries no status — the assertion is elsewhere"], declared ? ["declared", "the decorator declares " + k] : null],
        fields: cids, body: isCode ? "" : "18 of the 26 cases name no status: they are journeys and round-trips, not status assertions." }));
      col.append(tg(ch, "coverage-per-condition"));
      var stack = E("div", { class: "tstack" });
      cids.slice(0, 10).forEach(function(cid){ var c = T.cases.filter(function(x){ return x.cid === cid; })[0] || { cid: cid, state: "unknown" };
        var chip = E("span", { class: "pchip st-" + (c.state || "unknown") }, ico(c.state === "pass" ? "test" : c.state === "fail" ? "alert" : "info", 11), esc(cid));
        chip.dataset["case"] = cid; tg(chip, "cases");
        if (rosterOf(F, cid)) tg(chip, ["case-role-on-this-endpoint", "what-the-case-asserts-on-this-condition"], true);
        bind(chip, card({ title: cid, icon: "test", color: c.state === "pass" ? "var(--ok)" : "var(--muted)", sub: (c.corpus || "api") + " · " + (c.state === "pass" ? "passing" : c.state),
          rows: [["name", c.name || "—"], ["role", (function(){ var r = rosterOf(F, cid); return r ? ROLEWORD[r.role] || r.role : null; })()],
                 ["asserts", assertWords((rosterOf(F, cid) || {}).asserts) || (isCode ? "HTTP " + k + " — read off the test's name" : "no status in the name")], ["corpus", c.corpus || "api"]].filter(function(r){ return r[1] != null; }) }));
        stack.append(chip); });
      if (cids.length > 10) { var m = E("span", { class: "more" }, "+" + (cids.length - 10));
        bind(m, card({ title: k + " · the rest", fields: cids.slice(10) })); stack.append(m); }
      col.append(stack); cols.append(col); });
    /* the web corpus — file coverage, the honest weaker signal (hatched) */
    T.case_files.forEach(function(f){
      var col = E("div", { class: "tcol filecov" });
      var ch = E("div", { class: "thd" }, E("b", null, esc(f.corpus || "web")), E("span", { class: "n" }, esc(f.name)));
      bind(ch, card({ title: (f.corpus || "web") + " · file coverage", icon: "file", sub: "reaches this endpoint, names no case id",
        rows: [["signal", f.name], ["strength", "weaker — the file reaches it, no case claims it"]],
        body: "G — how sure: hatched means MEASURED but not attributed. The web corpus tests the screen, not the endpoint by name." }));
      col.append(ch); col.append(E("div", { class: "tstack" }, E("span", { class: "pchip filecov" }, ico("file", 11), esc(f.name))));
      cols.append(col); });
    body.append(cols);

    /* journeys — the station's own jmeta rows + entity faces */
    var jr = E("div", { class: "jrn" });
    jr.append(E("div", { class: "jhd" }, sechd("journey", "Journeys", T.journeys.length + (T.journeys_more ? "+" + T.journeys_more : ""), false)));
    var jl = E("div", { class: "jlist" });
    T.journeys.forEach(function(j){
      var real = /^C\d/.test(j.cid || "");
      var row = E("div", { class: "jmeta" + (real ? "" : " jagg") }, E("span", { class: "jcid" + (real ? "" : " noc") }, esc(j.cid)), E("span", { class: "corp" }, esc(j.corpus)), E("span", { class: "ncomp" }, (j.comp || 0) + " comp"));
      var faces = E("div", { class: "jfaces" });
      (j.entities || []).forEach(function(ent){ var h = 0; for (var i = 0; i < ent.length; i++) h = (h * 31 + ent.charCodeAt(i)) >>> 0;
        faces.append(E("span", { class: "face" + (ent === F.identity.entity ? " fhome" : ""), title: ent, style: "color:hsl(" + (h % 360) + " 55% 62%)" }, ico("entity", 13))); });
      var cell = E("div", { class: "jcell" }, row, faces);
      bind(cell, card({ title: j.cid, icon: "journey", sub: j.corpus + " · spans " + (j.entities || []).length + " entities · " + (j.comp || 0) + " components",
        rows: [["entities", (j.entities || []).join(" · ")], ["home", F.identity.entity], ["kind", real ? "one named case" : "an AGGREGATE — web cases folded into one row"]],
        body: "a cross-entity test: it starts or passes through this endpoint and travels out." }));
      jl.append(cell); });
    if (T.journeys_more) { var jm = E("span", { class: "more" }, "+" + T.journeys_more + " more");
      bind(jm, card({ title: "+" + T.journeys_more + " journeys", sub: "beyond the loaded set", body: "the emitter caps the per-node journey list; the full ledger is the evidence matrix." })); jl.append(jm); }
    jr.append(jl); body.append(jr); box.append(body);

    var foot = E("div", { class: "pfoot" });
    if (T.workflows.length) T.workflows.forEach(function(w){
      var wr = E("div", { class: "kv" }, ico("journey", 13, "var(--accent)"), E("span", { class: "k" }, "workflow"), E("span", { class: "v" }, esc(w.name) + " — step " + (w.step_index[0] + 1) + " of " + w.steps.length));
      bind(wr, card({ title: w.name, icon: "journey", color: "var(--accent)", sub: "a CURATED user workflow · level " + w.level,
        fields: w.steps.map(function(s, i){ return (i === w.step_index[0] ? "▶ " : "  ") + s; }), body: esc(w.note || "") })); foot.append(tg(wr, "workflow-step")); });
    foot.append(legend([
      { t: "passing", swatch: "background:var(--ok)", tip: card({ title: "passing", sub: "the case's recorded state", body: "all " + (F.tests.by_state.pass || 0) + " measured cases pass." }) },
      { t: "file coverage", swatch: "background:transparent;border:1px dashed var(--muted);height:6px;width:16px", tip: card({ title: "file coverage", sub: "G — measured, not attributed", body: "a test file reaches the endpoint but names no case id." }) },
      { t: "declared status", swatch: "border:1px solid " + S.OPC.read + ";background:transparent;height:9px;width:9px", tip: card({ title: "the declared status", sub: T.declared_status, body: "the decorator declares it; the cases assert five different codes around it." }) },
      { t: "a face = an entity", icon: "entity", tip: card({ title: "journey faces", sub: "who the test touches", body: "one face per REAL entity the test spans; the ringed face is this endpoint's own." }) }]));
    box.append(foot);
    COV.mark("TESTS", "tests"); COV.mark("JOURNEYS", "tests");
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════
     4 · WIDENING — the STATIC sequence picture (D, the ladder): how far the door reaches.
     the workflow step before → the route → the screen → the hook that fetches → THE DOOR →
     what the response feeds. Plus usage and the door's place.
     ══════════════════════════════════════════════════════════════════════════════════════ */
  /* leftovers piece 7 — who fetches it, against the app: the count, how many endpoints no screen fetches, and the floor under both */
  function screenRows(F){ var W = (F.feedwide || {}).screens; if (!W) return [];
    return [["fetched by", W.fetched_by + " hook" + (W.fetched_by === 1 ? "" : "s") + " · " + W.with_none + " of " + W.of + " endpoints have none"],
            ["a floor", ((W.unmatched || []).length) + " fetches matched no endpoint · " + (W.dynamic == null ? "?" : W.dynamic) + " build their path at run time"]]; }
  function renderWidening(box, F, S){
    var W = F.widening, I = F.identity, KC = S.KINDCOL;
    var reach = W.fetched_by.length + W.chain.reduce(function(s, l){ return s + l.length; }, 0);
    head(box, "globe", "Widening", reach + " reached",
      "the ladder reads OUTWARD from the endpoint: who fetches it, what renders that, and where it sits in the user's journey");
    var body = E("div", { class: "wbody" });

    /* the ladder — the door at the bottom, the app at the top; each rung a real piece */
    var rungs = [];
    rungs.push({ kind: "endpoint", name: I.path, sub: I.method + " · " + I.entity, col: KC.endpoint, self: true, fa: "method-path",
      card: card({ title: I.label, icon: "endpoint", color: KC.endpoint, sub: "the endpoint itself",
        rows: [["usage", (I.usage || {}).api + " api · " + (I.usage || {}).internal + " internal caller(s)"], ["fan-in", I.fanin + " (graph in-degree)"], ["entity", I.entity], ["layer", I.layer]] }) });
    W.fetched_by.forEach(function(p){ rungs.push({ kind: p.kind, name: p.name, sub: (p.hrole || p.kind) + (p.cache ? " · client-cached" : ""), col: S.KINDCOL.hook || "#10b981", fa: "who-fetches-it",
      card: card({ title: p.name, icon: "hook", color: S.KINDCOL.hook, sub: "the hook that fetches this endpoint · home " + p.home,
        rows: [["role", p.hrole || "—"], ["cache", p.cache ? "yes — a server-cache sink (M, waiting)" : "no"], ["hops to a write", p.fed2w != null ? String(p.fed2w) : "—"], ["file", String(p.id || "").replace(/^fe:/, "")]].concat(screenRows(F)),
        body: "the web→API bridge matched its fetch to this endpoint by method + path.", station: p.id }) }); });
    W.chain.forEach(function(level){ level.forEach(function(p){ rungs.push({ kind: p.kind, name: p.name, sub: p.rel + " → " + p.to + (p.feClass ? " · " + p.feClass : ""), col: KC[p.kind] || KC.component || "#2f7de1", fa: "who-fetches-it",
      card: card({ title: p.name, icon: p.kind === "route" ? "nav" : "web", color: KC[p.kind] || KC.component, sub: p.kind + " · home " + p.home,
        rows: [["relation", p.rel + " " + p.to], ["class", p.feClass || "—"], ["file", String(p.id || "").replace(/^fe:/, "")]], station: p.id }) }); }); });
    var ladder = E("div", { class: "ladder" });
    rungs.slice().reverse().forEach(function(r, i){
      var rr = E("div", { class: "rung" + (r.self ? " self" : "") , style: "--rc:" + r.col });
      rr.dataset.rung = r.name; rr.dataset.rkind = r.kind; if (r.fa) tg(rr, r.fa);
      rr.append(E("span", { class: "rk", html: ico(r.kind === "endpoint" ? "endpoint" : r.kind === "route" ? "nav" : r.kind === "hook" ? "merge" : "web", 14, r.col) }));
      rr.append(E("div", { class: "rt" }, E("b", null, esc(r.name)), E("span", { class: "rs" }, esc(r.sub))));
      rr.append(E("span", { class: "rn" }, String(rungs.length - i)));
      bind(rr, r.card); ladder.append(rr); });
    body.append(ladder);

    /* the journey the door sits in — the workflow steps around it */
    var side = E("div", { class: "wside" });
    side.append(E("div", { class: "wshd" }, sechd("journey", "In the user's journey", W.steps_around.length || null, false)));
    if (W.steps_around.length) W.steps_around.forEach(function(s){
      var line = E("div", { class: "steps" });
      [[s.prev, "before"], [I.label, "here"], [s.next, "after"]].forEach(function(pair, i){
        if (!pair[0]) return;
        var st = E("span", { class: "step" + (pair[1] === "here" ? " here" : "") }, ico("endpoint", 11, pair[1] === "here" ? KC.endpoint : "var(--muted)"), esc(pair[0]));
        bind(st, card({ title: pair[0], icon: "endpoint", sub: pair[1] === "here" ? "this endpoint" : "the step " + pair[1], rows: [["workflow", s.workflow]] }));
        line.append(tg(st, "workflow-step")); if (i < 2 && (i === 0 ? true : s.next)) line.append(E("i", { class: "arw", html: ico("drill", 11, "var(--muted)") })); });
      side.append(E("div", { class: "wname" }, esc(s.workflow)), line); });
    else side.append(E("div", { class: "wempty" }, "— no curated workflow names this endpoint"));
    /* usage + the response's other consumers */
    var ub = E("div", { class: "ubar" }, E("div", { class: "ufill", style: "width:" + Math.min(100, ((I.usage || {}).api + (I.usage || {}).internal) * 9) + "%" }));
    var ur = E("div", { class: "uwrap" }, sechd("merge", "Usage", ((I.usage || {}).api || 0) + ((I.usage || {}).internal || 0), false), ub,
      E("div", { class: "sublbl" }, ico("link", 12), ((I.usage || {}).api || 0) + " api · " + ((I.usage || {}).internal || 0) + " internal caller(s)"));
    bind(ur, card({ title: "usage", icon: "merge", sub: "IN-DEGREE — how many elements depend on this one",
      rows: [["api", String((I.usage || {}).api)], ["internal", String((I.usage || {}).internal)], ["fan-in (graph)", String(I.fanin)], ["entity", I.entity], ["layer", I.layer]],
      body: "break it and this many are affected. In the graph: N satellites orbit the node." }));
    side.append(ur);
    if (W.response_consumers.length) { var rc = E("div", { class: "kv" }, ico("schema", 13, KC.schema), E("span", { class: "k" }, "shared out"), E("span", { class: "v" }, W.response_consumers.length + " other endpoint(s) return " + F.data.schemas.response.name));
      bind(rc, card({ title: "the response is shared", icon: "schema", color: KC.schema, sub: F.data.schemas.response.name + " leaves by more than one endpoint", fields: W.response_consumers })); side.append(rc); }
    body.append(side); box.append(body);

    var foot = E("div", { class: "pfoot" });
    foot.append(legend([
      { t: "the endpoint", icon: "endpoint", col: KC.endpoint, tip: card({ title: "the endpoint", sub: "the rung the ladder stands on" }) },
      { t: "hook", icon: "merge", col: S.KINDCOL.hook, tip: card({ title: "the fetcher", sub: "the bridge leg", body: "the hook whose fetch matched this endpoint." }) },
      { t: "screen · route", icon: "web", col: KC.component, tip: card({ title: "the climb", sub: "renders / imports", body: "each rung is a REAL fe piece and a real wire — nothing is drawn that the feed does not carry." }) },
      { t: "a rung = a real wire", swatch: "background:var(--line);height:2px;width:16px", tip: card({ title: "the ladder", sub: "D — order, drawn still", body: "the static sequence picture. The animated one lives on FUNCTIONS; the rulings allow two per element." }) }]));
    box.append(foot);
    COV.mark("USAGE", "widening"); COV.mark("IDENTITY", "widening"); COV.mark("CONNECTIONS", "widening");
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════
     5 · SECURITY — what stands between the request and the body: the app-scope ASGI band
     (H, posture), the door's own deps (the gate turnstile), flag walls (none — hollow),
     the status contract, idempotency and the commit.
     ══════════════════════════════════════════════════════════════════════════════════════ */
  /* leftovers piece 6 — what the feed read of one helper: its place in the order, who asks for it, whether it can end a request, what runs after the handler */
  function resolvedRows(r){ if (!r) return [];
    return [["resolved", ordinal(r.order) + " of " + r.of + " — asked for by " + r.asked_by.join(" and ")],
            r.placed_by === "a guess" ? ["its place", "a guess — the map clipped the handler's signature before this name, so it was placed last"] : null,
            ["can end the request", r.can_end_the_request ? "yes — " + r.exits.concat(r.inherited_exits).map(function(e){ return e.status + " " + (e.detail || ""); }).join(" · ") : "no — the feed reads no ending in it"],
            r.subdeps.length ? ["asks for", r.subdeps.join(" · ")] : null,
            r.runs_after_the_handler ? ["after the handler", "it yields — its closing code runs once the handler is done"] : null].filter(Boolean); }
  function renderSecurity(box, F, S){
    var SEC = F.security, FW = F.feedwide;
    head(box, "key", "Security", SEC.guards.length + " deps · " + SEC.asgi.length + " app",
      "read top to bottom: every request crosses the app band first, then this endpoint's own deps, then the body runs");
    var body = E("div", { class: "sbody" });

    /* the ASGI band — app scope, ordered, saturated (it gates everything, so it separates nothing) */
    var band = E("div", { class: "band" });
    band.append(E("div", { class: "bhd" }, sechd("shield", "App band", SEC.asgi.length, false), E("span", { class: "bnote" }, "scope ALL · gates " + (SEC.app_middleware || {}).gates_endpoints + " of " + FW.endpoints + " endpoints" + ((SEC.app_middleware || {}).saturated ? " — saturated: it separates nothing" : ""))));
    var lanes = E("div", { class: "lanes" });
    SEC.asgi.forEach(function(m){
      var lane = E("div", { class: "lane" }, E("span", { class: "lo" }, runsNo(m)), ico("shield", 13, S.OPC.gate), E("b", null, esc(m.name)), E("span", { class: "lg2" }, m.gates + " gated"));
      lane.dataset.lane = m.name; lane.dataset.runs = m.runs == null ? "" : String(m.runs); tg(lane, "app-band");
      bind(lane, card({ title: m.name, icon: "shield", color: S.OPC.gate, sub: "ASGI middleware · " + runsWord(m) + " · scope " + m.scope,
        rows: [["runs", "before every handler — " + runsWord(m)], ["registered", m.registered == null ? "—" : ordinal(m.registered + 1) + " in the code — the last one registered runs first"], ["gates", m.gates + " endpoints"], ["file", m.file + ":" + m.line], ["tie to this endpoint", "— measured at APP scope only; no per-endpoint wire exists"]],
        body: "H — posture: the band is LIT because it is measured; the tie to this one endpoint is not, so no wire is drawn." }));
      lanes.append(lane); });
    band.append(lanes); body.append(band);

    /* the door's own deps — the turnstile */
    var gates = E("div", { class: "gates" });
    var ghd = E("div", { class: "bhd" }, sechd("key", "This endpoint's deps", SEC.guards.length, false), E("span", { class: "bnote" }, SEC.gates.length + " of " + SEC.guards.length + " decide whether the work proceeds"));
    var RES = SEC.resolution;
    if (RES) { var rOn = RES.state === "present" && RES.rows.length;
      var resNote = E("span", { class: "bnote bres" }, rOn ? "· resolved " + RES.rows.map(function(r){ return r.name; }).join(" → ") : "· resolution order not read");
      resNote.dataset.fact = "resolution"; resNote.dataset.state = rOn ? "lit" : "hatched"; tg(resNote, "context-giving-functions");
      bind(resNote, card({ title: "resolved in order", icon: "layers", sub: rOn ? RES.counts.end_nothing + " of " + RES.counts.rows + " can end no request" : "not read",
        rows: rOn ? RES.rows.map(function(r){ return [r.order + " · " + r.name, (r.can_end_the_request ? "can end the request — " + r.exits.concat(r.inherited_exits).map(function(e){ return e.status; }).join(" · ") : "can end no request")
          + (r.runs_after_the_handler ? " · runs its closing code after the handler" : "") + " · " + r.applies_to + " of " + r.endpoints + " endpoints" + (r.placed_by === "a guess" ? " · its place is a guess" : "")]; }) : [["why", RES.why || "—"]],
        body: esc(RES.rule || "") }));
      ghd.append(resNote); }
    gates.append(ghd);
    var grow = E("div", { class: "grow" });
    SEC.guards.forEach(function(g){
      var isGate = !!g.gate, pct = Math.round(100 * g.feedwide / FW.endpoints);
      var t = E("div", { class: "turn" + (isGate ? " gate" : "") },
        ico(isGate ? "key" : "link", 14, isGate ? S.OPC.gate : "var(--muted)"),
        E("div", { class: "tt" }, E("b", null, esc(g.name)), E("span", { class: "ts" }, g.via + (isGate ? " · gate" : "") + (g.resolved ? " · resolved " + ordinal(g.resolved.order) + " of " + g.resolved.of : ""))),
        E("span", { class: "tw" }, pct + "%"));
      t.dataset.dep = g.name; tg(t, isGate ? ["auth-scheme-gate", "context-giving-functions"] : "context-giving-functions");
      if (isGate && (((F.forms || {}).auth || {}).schemes || []).length) tg(t, "how-common-this-piece-is", true);
      bind(t, card({ title: g.name, icon: isGate ? "key" : "link", color: isGate ? S.OPC.gate : null, sub: g.via + (isGate ? " · a GATE" : " · a dependency"),
        rows: [["runs", "before the handler body"], ["feed-wide", g.feedwide + " of " + FW.endpoints + " endpoints use it (" + pct + "%)"],
               g.fn_rec ? ["function", g.fn_rec.name + " · " + (g.fn_rec.role || "—") + (g.fn_rec.lines ? " · " + g.fn_rec.lines + " lines" : "")] : null,
               ["decides", isGate ? "yes — it can refuse the request" : "no — it supplies a resource"]].concat(resolvedRows(g.resolved))
                 .concat(isGate ? (((F.forms || {}).auth || {}).schemes || []).reduce(function(a, sc){ return a.concat(commonRows(F, "auth:scheme:" + sc.scheme)); }, []) : []),
        body: isGate ? "the turnstile: an unauthenticated request stops here." : "a resource dependency — a session, settings. It cannot refuse." }));
      grow.append(t); });
    gates.append(grow); body.append(gates);

    /* walls · contract · idempotency · commit — the four one-line facts, honest-empty where empty */
    var facts = E("div", { class: "sfacts" });
    var wallRow = E("div", { class: "sfact" + (SEC.walls.length ? "" : " hollow") }, ico("swords", 13, SEC.walls.length ? S.OPC.write : "var(--muted)"),
      E("b", null, "flag walls"), E("span", { class: "sv" }, SEC.walls.length ? SEC.walls.length + " — " + SEC.walls.map(function(w){ return w.flag; }).join(" · ") : "none — no feature flag can close this endpoint"));
    bind(wallRow, card({ title: "flag walls", icon: "swords", sub: SEC.walls.length ? SEC.walls.length + " wall(s)" : "measured zero",
      rows: [["here", SEC.walls.length ? "walled" : "no wall"], ["feed-wide", SEC.flags_feedwide + " flag(s) exist, walling other endpoints"]],
      body: "G — HOLLOW means measured and empty: the emitter looked and found none. Not the same as unmeasured." }));
    facts.append(tg(wallRow, "switches"));
    var sc = SEC.status, obs = Object.keys(sc.observed).filter(function(k){ return /^\d/.test(k); });
    var scRow = E("div", { class: "sfact" }, ico("info", 13, S.OPC.read), E("b", null, "status contract"), E("span", { class: "sv" }, "declares " + sc.declared + (sc.declared_name ? " (" + sc.declared_name + ")" : "") + " · the cases assert " + obs.join(" · ")));
    bind(scRow, card({ title: "the status contract", icon: "info", sub: "what the endpoint promises vs what the tests assert",
      rows: [["declared", String(sc.declared)], ["asserted", obs.join(" · ")], ["untyped cases", String((sc.observed["no code in name"] || []).length) + " name no code"]],
      body: "the decorator declares one code; the corpus proves five. Both are true — the others are failure paths." }));
    facts.append(tg(scRow, "declared-status"));
    var idRow = E("div", { class: "sfact" + (SEC.idempotent ? "" : " hollow") }, ico("target", 13, SEC.idempotent ? S.OPC.gate : "var(--muted)"), E("b", null, "idempotency"),
      E("span", { class: "sv" }, SEC.idempotent ? "guarded — writes " + SEC.idempotency_table + " (3 unique constraints)" : "none — a retry runs the work again"));
    bind(idRow, card({ title: "idempotency", icon: "target", sub: SEC.idempotent ? "the endpoint claims a key before it works" : "unguarded",
      rows: [["table", SEC.idempotency_table || "—"], ["M — waiting", "a repeat request waits on the claim rather than doing the work twice"]].concat(commonRows(F, "repeat:key")),
      body: "the walk shows it: <code>claim</code> and <code>complete</code> both commit against this table." }));
    facts.append(tg(idRow, "idempotency-claim"));
    if (commonRows(F, "repeat:key").length) tg(idRow, "how-common-this-piece-is", true);
    var cRow = E("div", { class: "sfact" + (SEC.commits ? "" : " hollow") }, ico("key", 13, SEC.commits ? S.OPC.write : "var(--muted)"), E("b", null, "DB commit"),
      E("span", { class: "sv" }, SEC.commits ? "yes — one transaction makes the 11 writes permanent" : "no — this endpoint only reads"), E("i", { class: "pulse" }));
    bind(cRow, card({ title: "the DB transaction", icon: "key", color: S.OPC.write, sub: "access.commits — never a git commit",
      rows: [["writes", String(F.data.writes.length) + " ops"], ["tables", String(F.data.tables.filter(function(t){ return t.rw !== "r"; }).length)]],
      body: "the same pulse beats on the DATA panel's baseline — one clock, one meaning." }));
    facts.append(cRow);
    var dRow = E("div", { class: "sfact" + (SEC.stream ? "" : " hollow") }, ico("wave", 13, SEC.stream ? S.KINDCOL.web : "var(--muted)"), E("b", null, "delivery"),
      E("span", { class: "sv" }, SEC.stream ? "streams to the client — pieces leave as they are made" : "one response, whole — this endpoint does not stream"));
    bind(dRow, card({ title: "delivery", icon: "wave", sub: SEC.stream ? "streaming" : "not a stream",
      rows: [["stream", SEC.stream ? "yes (SSE / chunked)" : "no"], ["exported", SEC.exported ? "yes" : "no"]],
      body: "M — waiting: a stream keeps the connection open; this one answers once." }));
    facts.append(tg(dRow, "delivery"));
    body.append(facts); box.append(body);

    var foot = E("div", { class: "pfoot" });
    foot.append(legend([
      { t: "gate", swatch: "background:" + S.OPC.gate, tip: card({ title: "a gate", sub: "it can refuse", body: "1 of this endpoint's 3 deps decides whether the work proceeds." }) },
      { t: "resource dep", swatch: "background:var(--muted)", tip: card({ title: "a dependency", sub: "it supplies", body: "a session, settings — it cannot refuse the request." }) },
      { t: "hollow = measured zero", swatch: "background:transparent;border:1px solid var(--line);height:9px;width:14px", tip: card({ title: "hollow", sub: "G — how sure", body: "the emitter looked and found nothing. Unmeasured would be HATCHED, and would say so." }) },
      { t: "app scope", icon: "shield", col: S.OPC.gate, tip: card({ title: "the app band", sub: "it gates everything", body: "measured at app scope; the per-endpoint tie is not measured, so it is never drawn as a wire." }) }]));
    box.append(foot);
    COV.mark("GUARDS", "security"); COV.mark("DELIVERY", "security");
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════
     SECOND AND THIRD DISTRIBUTIONS — the same facts, laid out differently. These are
     PROPOSALS to compare, not settings: the operator picks one per part (2026-09-11).
     ══════════════════════════════════════════════════════════════════════════════════════ */
  function cap(n){ return window.DENS === "dense" ? Math.round(n * 2) : window.DENS === "air" ? Math.max(2, Math.round(n * 0.6)) : n; }

  /* a DENSE LEDGER — one row per thing, every column the feed knows. The densest honest form. */
  function ledger(box, cols, rows, opt){ opt = opt || {};
    var t = E("div", { class: "ldg" });
    var hd = E("div", { class: "lrow lhd", style: "grid-template-columns:" + opt.grid });
    cols.forEach(function(c){ hd.append(E("span", null, c)); }); t.append(hd);
    rows.forEach(function(r){ var row = E("div", { class: "lrow" + (r.cls ? " " + r.cls : ""), style: "grid-template-columns:" + opt.grid });
      if (r.tag) for (var tk in r.tag) { if (r.tag[tk] != null) row.setAttribute("data-" + tk, r.tag[tk]); }
      r.cells.forEach(function(c){ row.append(typeof c === "string" ? E("span", { html: c }) : c); });
      if (r.fa) tg(row, r.fa);
      if (r.card) bind(row, r.card); t.append(row); });
    box.append(t); return t; }

  /* ── DATA · B "flow" — the width used: request → the whole table field (wrapped, writes first) → response ── */
  function renderDataFlow(box, F, S){
    var D = F.data, I = F.identity, TS = dtables(D);
    dhead(box, F, D, TS, "table",
      "every table on ONE field, writes first, each tile carrying its entity's dot — the widest reading of the same facts");
    if (!TS.length) { chanEmpty(box, D, S); COV.mark("ACCESSES", "data"); return; }
    var body = E("div", { class: "dfbody" });
    var field = E("div", { class: "dffield" });
    var fhd = E("div", { class: "dfhd" }, sechd("key", "the endpoint writes, then reads", TS.length, false),
      E("span", { class: "dfnote" }, D.writes.length + " write ops · " + D.reads.length + " read ops · " + D.entities.length + " entities · " + D.both.length + " tables on both channels"));
    field.append(fhd);
    var grid = E("div", { class: "dfgrid" });
    TS.slice().sort(function(a, b){ return (a.rw === "r") - (b.rw === "r") || b.cols.length - a.cols.length; }).forEach(function(t){
      var fkSet = {}; (t.fks || []).forEach(function(f){ fkSet[Array.isArray(f) ? f[0] : f] = true; });
      var uqSet = {}; (t.uqs || []).forEach(function(u){ (Array.isArray(u) ? u : [u]).forEach(function(c){ uqSet[c] = 1; }); });
      var tile = E("div", { class: "tile rw-" + t.rw, style: "--ec:" + (t.entity_color || "#888") },
        E("div", { class: "tnm" }, '<i class="pdot" style="background:' + (t.entity_color || "#888") + '"></i>', rwChip(t.rw), E("b", null, esc(t.table)), E("span", { class: "tc" }, String(t.cols.length))),
        shapeStack(t.table, t.cols, { color: t.entity_color, fkSet: fkSet, uqSet: uqSet, more: t.cols_more, cls: "tbars" }));
      tile.dataset.table = t.table; tg(tile, "tables-touched"); tg(tile.querySelector(".tnm .jdrw"), "operation-per-table");
      bind(tile, card({ title: t.table, icon: "model", color: S.KINDCOL.model, sub: "model " + t.model + " · entity " + t.entity,
        rows: [["here", t.rw === "rw" ? "reads + writes" : t.rw === "w" ? "writes" : "reads", RWC[t.rw]], ["columns", String(t.cols.length)], ["file", String(t.file || "—")]],
        fields: t.cols.map(function(c){ return c[0] + " · " + c[1]; }), station: t.id }));
      grid.append(tile); });
    field.append(grid);
    var cm = E("div", { class: "commit" + (D.commits ? " on" : " off") }, ico("key", 13, S.OPC.write), E("b", null, "DB COMMIT"),
      E("span", { class: "cnote" }, "one transaction · " + D.writes.length + " writes become permanent"), E("i", { class: "pulse" }));
    bind(cm, card({ title: "the DB transaction commits", icon: "key", color: S.OPC.write, sub: "access.commits — never a git commit",
      rows: [["writes", String(D.writes.length)], ["idempotency", F.security.idempotent ? "guarded by " + F.security.idempotency_table : "none"]] }));
    field.append(cm); body.append(field); box.append(body);
    var foot = E("div", { class: "pfoot" });
    foot.append(E("div", { class: "kv ents" }, ico("role", 13), E("span", { class: "k" }, "entities"), E("span", { class: "v" }, D.entities.join(" · ") + " — the dot on each tile says which")));
    foot.append(legend([{ t: "reads", swatch: "background:" + RWC.r }, { t: "writes", swatch: "background:" + RWC.w }, { t: "both", swatch: "background:" + RWC.rw },
      { t: "a line = a field", swatch: "background:var(--muted);height:2px;width:16px" }]));
    box.append(foot);
    COV.mark("ACCESSES", "data"); COV.mark("CONNECTIONS", "data");   /* no evidence / model row in this distribution */
  }

  /* ── DATA · C "ledger" — the densest honest form: one row per table, every column the feed knows ── */
  function renderDataLedger(box, F, S){
    var D = F.data, I = F.identity, TS = dtables(D);
    dhead(box, F, D, TS, "table",
      "one row per table, every column the feed knows — the bar strip is still the shape, a line per column");
    if (!TS.length) { chanEmpty(box, D, S); COV.mark("ACCESSES", "data"); return; }
    var body = E("div", { class: "lbody" });
    var rows = TS.slice().sort(function(a, b){ return (a.entity || "").localeCompare(b.entity || "") || b.cols.length - a.cols.length; }).map(function(t){
      var fkSet = {}; (t.fks || []).forEach(function(f){ fkSet[Array.isArray(f) ? f[0] : f] = true; });
      var uqSet = {}; (t.uqs || []).forEach(function(u){ (Array.isArray(u) ? u : [u]).forEach(function(c){ uqSet[c] = 1; }); });
      return { fa: "tables-touched", tag: { table: t.table }, cells: ['<i class="pdot" style="background:' + (t.entity_color || "#888") + '"></i>' + esc(t.entity || "—"), rwChip(t.rw), "<b>" + esc(t.table) + "</b>",
          shapeStack(t.table, t.cols, { color: t.entity_color, fkSet: fkSet, uqSet: uqSet, cls: "inline" }),
          String(t.cols.length), String((t.fks || []).length || "—"), String((t.uqs || []).length || "—"), esc(t.model)],
        card: card({ title: t.table, icon: "model", color: S.KINDCOL.model, sub: "model " + t.model + " · entity " + t.entity,
          rows: [["here", t.rw === "rw" ? "reads + writes" : t.rw === "w" ? "writes" : "reads", RWC[t.rw]], ["file", String(t.file || "—")]],
          fields: t.cols.map(function(c){ return c[0] + " · " + c[1] + (fkSet[c[0]] ? "  (fk)" : "") + (uqSet[c[0]] ? "  (unique)" : ""); }), station: t.id }) }; });
    var ldg = ledger(body, ["entity", "rw", "table", "shape", "cols", "fk", "uq", "model"], rows, { grid: "104px 34px 1fr 128px 44px 34px 34px 150px" });
    [].forEach.call(ldg.querySelectorAll(".lrow[data-table] .jdrw"), function(c){ tg(c, "operation-per-table"); });
    box.append(body);
    var foot = E("div", { class: "pfoot" });
    foot.append(E("div", { class: "kv cmt" }, ico("key", 13, S.OPC.write), E("span", { class: "k" }, "commit"), E("span", { class: "v" }, D.commits ? "one transaction makes the " + D.writes.length + " writes permanent · " + (F.security.idempotent ? "idempotency guarded by " + F.security.idempotency_table : "no idempotency") : "reads only")));
    foot.append(legend([{ t: "reads", swatch: "background:" + RWC.r }, { t: "writes", swatch: "background:" + RWC.w }, { t: "both", swatch: "background:" + RWC.rw }]));
    box.append(foot);
    COV.mark("ACCESSES", "data"); COV.mark("CONNECTIONS", "data");   /* no evidence / model row in this distribution */
  }

  /* ── DATA · D "fields" — the columns THEMSELVES, named (operator 2026-09-12: "instead of showing the
     shapes as bars, we can actually see them"). This distribution deliberately breaks law E for one
     view: everywhere else a shape is a stack of lines and the exact field lives only on a hover card.
     Here the names ARE the picture, filtered by the channel the door uses the table on.
     HONEST FLOOR: the feed records the channel per TABLE, never per COLUMN. A field wears its table's
     channel and the note says so — nothing here claims to know which column was written. ── */
  function renderDataFields(box, F, S){
    var D = F.data, keep = dtables(D), cols = colsOf;
    dhead(box, F, D, keep, "schema",
      "the columns themselves, named — " + chanWords() + ". The channel is the TABLE's: the feed knows which tables this endpoint reads and writes, never which column.");
    if (!keep.length) { chanEmpty(box, D, S); COV.mark("ACCESSES", "data"); return; }
    var body = E("div", { class: "fbody" });
    var grid = E("div", { class: "fgrid" });
    sortTables(keep).forEach(function(t){
      var fkSet = {}; (t.fks || []).forEach(function(f){ fkSet[Array.isArray(f) ? f[0] : f] = (Array.isArray(f) && f[1]) ? f[1] : true; });
      var uqSet = {}; (t.uqs || []).forEach(function(u){ (Array.isArray(u) ? u : [u]).forEach(function(c){ uqSet[c] = 1; }); });
      var fc = E("div", { class: "fcard rw-" + t.rw, style: "--ec:" + (t.entity_color || "#888") });
      fc.dataset.table = t.table; tg(fc, "tables-touched");
      var fh = E("div", { class: "fhd" }, '<i class="pdot" style="background:' + (t.entity_color || "#888") + '"></i>',
        rwChip(t.rw), E("b", null, esc(t.table)), E("span", { class: "tc" }, String(t.cols.length)));
      bind(fh, card({ title: t.table, icon: "model", color: S.KINDCOL.model, sub: "model " + t.model + " · entity " + t.entity,
        rows: [["here", t.rw === "rw" ? "reads + writes" : t.rw === "w" ? "writes" : "reads", RWC[t.rw]],
               ["columns", String(t.cols.length)], ["file", String(t.file || "—")]],
        body: "the channel is this TABLE's — the feed does not record which of its columns the endpoint wrote.",
        station: t.id }));
      fc.append(fh); tg(fh.querySelector(".jdrw"), "operation-per-table");
      var list = E("div", { class: "flds" });
      t.cols.forEach(function(c){ var isFk = fkSet[c[0]], isUq = uqSet[c[0]];
        var f = E("div", { class: "fld" + (isFk ? " fk" : "") + (isUq ? " uq" : "") },
          E("span", { class: "fn" }, esc(c[0])), fkMarks(t, c[0]), E("span", { class: "ft" }, esc(c[1] || "—")));
        bind(f, card({ title: c[0], sub: String(c[1] || "—"), icon: isFk ? "key" : "table", color: t.entity_color,
          rows: [["in", t.table], ["the endpoint", t.rw === "rw" ? "reads and writes this table" : t.rw === "w" ? "writes this table" : "reads this table", RWC[t.rw]],
                 isFk ? ["points at", "→ " + (isFk === true ? "another table" : isFk)] : null,
                 fkIn(t, c[0]).length ? ["pointed at by", fkIn(t, c[0]).join(" · ") + " — among the tables this endpoint touches"] : null,
                 isUq ? ["unique", "the DB refuses a second row with this value"] : null],
          body: "per-COLUMN direction is not in the feed — this field carries its table's channel, said out loud rather than guessed." }));
        list.append(f); });
      if (t.cols_more) list.append(E("div", { class: "fld more" }, E("span", { class: "fn" }, "+" + t.cols_more + " more"), E("span", { class: "ft" }, "not in the feed")));
      fc.append(list); grid.append(fc); });
    body.append(grid); box.append(body);
    var cm = E("div", { class: "commit" + (D.commits ? " on" : " off") }, ico("key", 13, S.OPC.write), E("b", null, "DB COMMIT"),
      E("span", { class: "cnote" }, "one transaction · " + D.writes.length + " writes become permanent"), E("i", { class: "pulse" }));
    bind(cm, card({ title: "the DB transaction commits", icon: "key", color: S.OPC.write, sub: "access.commits — never a git commit",
      rows: [["writes", String(D.writes.length)], ["idempotency", F.security.idempotent ? "guarded by " + F.security.idempotency_table : "none"]] }));
    box.append(cm);
    var foot = E("div", { class: "pfoot" });
    foot.append(E("div", { class: "kv flt" }, ico("schema", 13), E("span", { class: "k" }, "showing"),
      E("span", { class: "v" }, chanWords() + " — " + keep.length + " of " + D.tables.length + " tables, " + cols(keep) + " fields")));
    foot.append(legend([
      { t: "reads", swatch: "background:" + RWC.r }, { t: "writes", swatch: "background:" + RWC.w }, { t: "both", swatch: "background:" + RWC.rw },
      { t: "fk", swatch: "background:" + S.KINDCOL.external + ";height:2px;width:16px", tip: card({ title: "foreign key", sub: "a column that points out", body: "the name is drawn in the external colour — the table leans on another table." }) },
      { t: "unique", swatch: "background:transparent;border:1px dashed " + S.OPC.gate + ";height:5px;width:16px", tip: card({ title: "unique", sub: "a latch on the column", body: "the DB refuses a second row with this value." }) }]));
    box.append(foot);
    COV.mark("ACCESSES", "data"); COV.mark("PAYLOAD", "data"); COV.mark("CONNECTIONS", "data");
  }

  /* ── DATA · E "blocks" — one ROW per table: everything the feed knows about it on a single line, and
     what is INSIDE it as a run of little squares, one per field, coloured by the kind of field
     (operator 2026-09-12). Without clicking you read: which table, whose entity, how many fields and
     what kinds. Click the row and every field is named at once.
     THE CLASS IS READ FROM THE DECLARED TYPE, nothing is guessed: `uuid.UUID` → id, `str` → text,
     `int`/`float`/`Decimal` → number, `bool` → flag, `datetime`/`date` → time, `list[…]`/`dict` → list,
     anything else → other, said as "other" rather than filed under a guess. A ` | None` suffix makes
     the square paler — the column accepts nothing, which is not one of law G's three certainties. ── */
  /* A KIND CAN BE DRAWN FOUR WAYS (operator 2026-09-13): as colour, as a character, as a shape, or as a
     symbol. The colour rule stays its own dial, so shape · character · symbol still work when every
     square is one colour — which is the only encoding a reader with no colour vision can follow. */
  var TYPEC = [
    { key: "id",    word: "id",      col: function(S){ return S.KINDCOL.model; },  rx: /^uuid|UUID/,
      ch: "#", sym: "key",    shape: "circle",   plain: "a key — the row's own name, or another row's" },
    { key: "text",  word: "text",    col: function(S){ return S.KINDCOL.route; },  rx: /^str\b|^Text|^EmailStr/,
      ch: "A", sym: "doc",    shape: "square",   plain: "words — anything the user or the system typed" },
    { key: "num",   word: "number",  col: function(S){ return S.OPC.schema; },     rx: /^int\b|^float|^Decimal/,
      ch: "1", sym: "angle",  shape: "diamond",  plain: "a number you can count or add up" },
    { key: "flag",  word: "flag",    col: function(S){ return S.KINDCOL.entity; }, rx: /^bool/,
      ch: "Y", sym: "test",   shape: "triangle", plain: "yes or no — one bit, nothing in between" },
    { key: "time",  word: "time",    col: function(S){ return S.KINDCOL.screen; }, rx: /^datetime|^date\b|^time/,
      ch: "T", sym: "journey", shape: "ring",    plain: "a moment — when it happened" },
    { key: "list",  word: "list",    col: function(S){ return S.KINDCOL.store; },  rx: /^list|^dict|^Json|^JSON/,
      ch: "\u2261", sym: "layers", shape: "bars", plain: "many values in one column, not one" },
    { key: "other", word: "other",   col: function(S){ return S.KINDCOL.type; },   rx: null,
      ch: "?", sym: "alert",  shape: "cross",    plain: "a type this rule does not name — said out loud instead of filed under a guess" } ];
  var SQENC = {
    colour: { word: "colour", plain: "the mark is a filled square and its HUE is the kind" },
    char:   { word: "a character", plain: "the mark is a letter — # a key, A words, 1 a number, Y yes-or-no, T a moment, \u2261 many, ? unnamed" },
    shape:  { word: "a shape", plain: "the mark's FORM is the kind — a circle, a square, a diamond, a triangle, a ring, bars, a cross" },
    symbol: { word: "a symbol", plain: "the mark is the station's own glyph for that kind" } };
  /* THE LOOK a renderer reads (operator 2026-09-13): Data's, unless the open part keeps its own copy (Schemas, looks own) */
  function lookCfg(){ var pn = document.getElementById("panel"), tab = pn && pn.dataset.tab;
    var C = tab === "schemas" ? window.SCHCFG : tab === "functions" ? window.FNCFG : null;
    return C && C.map && C.map.looks === "own" && C.look ? C.look : (window.DATACFG || {}); }
  window.LOOKCFG = lookCfg;
  function sqEnc(){ return (lookCfg().sqEnc) || "colour"; }
  /* ONE field mark, everywhere a field is drawn — the blocks, the opened list, the portrait's cells */
  function sqNode(c, t, S, cls){
    var tc = typeOf(c[1]), col = sqCol(t, c, S), enc = sqEnc();
    var q = E("i", { class: "sq e-" + enc + " t-" + tc.key + (isOpt(c[1]) ? " opt" : "") + (cls ? " " + cls : "") });
    q.style.setProperty("--fc", col);
    if (enc === "char") q.textContent = tc.ch;
    else if (enc === "symbol") q.innerHTML = ico(tc.sym, null, "currentColor");
    return q; }
  window.SQNODE = sqNode;
  function kindMark(tc, S, col){ var enc = sqEnc();
    var q = E("i", { class: "sq e-" + enc + " t-" + tc.key + " lgm" });
    q.style.setProperty("--fc", col || tc.col(S));
    if (enc === "char") q.textContent = tc.ch;
    else if (enc === "symbol") q.innerHTML = ico(tc.sym, null, "currentColor");
    return q; }
  function typeOf(t){ var base = String(t || "").replace(/\s*\|\s*None\s*$/, "").trim();
    for (var i = 0; i < TYPEC.length - 1; i++) if (TYPEC[i].rx.test(base)) return TYPEC[i];
    return TYPEC[TYPEC.length - 1]; }
  function isOpt(t){ return /\|\s*None\s*$/.test(String(t || "")); }
  function sqCol(t, c, S){ var DC = lookCfg(), pal = DC.sqPal || "type";
    return pal === "channel" ? RWC[t.rw] : pal === "entity" ? (t.entity_color || "#888")
      : pal === "mono" ? "var(--muted)" : typeOf(c[1]).col(S); }
  /* THE BLOCK TITLE is configurable part by part (operator 2026-09-12): an icon can stand in for a word,
     a count can shrink to a badge, and anything can go. The MODEL is the Python class that maps to this
     table — said here once, because the operator asked what "Location" was. */
  var BKDEF = { form: "row", icon: 1, rw: 1, name: 1, ent: "word", count: "words", model: "word",
    iconCol: "model", sel: "icon",
    rows: [{ l: ["icon", "rw", "name", "ent", "count", "model"], r: [] }, { l: [], r: [] }, { l: [], r: [] }],
    size: { icon: 13, rw: 12, name: 13, ent: 12, count: 12, model: 12 } };
  function bkcfg(){ var c = (window.DATACFG || {}).bk || {}, o = {};
    Object.keys(BKDEF).forEach(function(k){ o[k] = c[k] == null ? BKDEF[k] : c[k]; }); return o; }
  /* THE GLYPH'S COLOUR IS A SETTING, NOT THE ENTITY'S (operator 2026-09-12): the drum took pantry's
     colour on one row and settings' on the next, which made ONE kind of thing look like six. It now
     takes one colour for every table by default — the graph's own colour for a model — and the entity
     stays readable in its own part of the line. */
  var BKICOL = {
    model: { word: "the model colour", get: function(t, S){ return S.KINDCOL.model; },
      plain: "one colour for every table — the graph's own colour for a model" },
    ink: { word: "ink", get: function(){ return "var(--ink)"; }, plain: "one colour for every table — the page's own text colour" },
    muted: { word: "quiet", get: function(){ return "var(--muted)"; }, plain: "one colour for every table, quiet enough to recede" },
    entity: { word: "the entity", get: function(t){ return t.entity_color || "#888"; },
      plain: "the glyph takes its entity's colour — one kind of thing drawn in many colours" },
    channel: { word: "the channel", get: function(t){ return RWC[t.rw]; },
      plain: "the glyph takes its channel — read green, write orange, both amber" } };
  function bkIconCol(t, S){ var B = bkcfg(); return (BKICOL[B.iconCol] || BKICOL.model).get(t, S); }
  window.BKICOL = BKICOL;
  /* EVERY PART of a table's title line is built the same way, so its ORDER, its LINE and its SIZE are
     all data the operator drags and drives (operator 2026-09-12, the head-bar registry applied here) */
  var BKPART = [
    { key: "icon", word: "the table glyph", ico: "model", note: "the DB drum — the same glyph the universe graph draws for a model" },
    { key: "rw", word: "the channel chip", ico: "role", note: "R · W · RW — which way the data moves through this table" },
    { key: "name", word: "the table name", ico: "doc", note: "the table as the database names it" },
    { key: "ent", word: "the entity", ico: "entity", note: "which entity claims the table — word, glyph or both" },
    { key: "count", word: "the field count", ico: "info", note: "how many columns — in words or as a badge" },
    { key: "model", word: "the class", ico: "schema", note: "the Python class that maps to this table" } ];
  window.BKPART = BKPART;
  function bkPart(key, t, S, B){ var ec = t.entity_color || "#888", z = (B.size || {})[key] || 12;
    if (key === "icon") return B.icon ? '<span class="bki">' + ico("model", z, bkIconCol(t, S)) + '</span>' : null;
    if (key === "rw") return B.rw ? '<span class="bkrw">' + rwChip(t.rw) + '</span>' : null;   /* size: --rw-fs */
    if (key === "name") return B.name ? E("b", { style: "font-size:" + z + "px" }, esc(t.table)) : null;
    if (key === "ent") { if (B.ent === "off") return null;
      var e = E("span", { class: "bke", style: "color:" + ec + ";font-size:" + z + "px" });
      if (B.ent === "icon" || B.ent === "both") e.insertAdjacentHTML("beforeend", ico("entity", z, ec));
      if (B.ent === "word" || B.ent === "both") e.append(E("span", null, esc(t.entity || "—")));
      return e; }
    if (key === "count") { if (B.count === "off") return null;
      return E("span", { class: "bkn" + (B.count === "badge" ? " badge" : "") },   /* size: --cnt-fs */
        B.count === "badge" ? String(t.cols.length) : t.cols.length + " fields"); }
    if (key === "model") { if (B.model === "off") return null;
      var m = E("span", { class: "bkm", style: "font-size:" + z + "px" });
      if (B.model === "icon" || B.model === "both") m.insertAdjacentHTML("beforeend", ico("doc", z, S.KINDCOL.schema));
      if (B.model === "word" || B.model === "both") m.append(E("span", null, esc(t.model)));
      return m; }
    return null; }
  /* the title is LINES, and a line has TWO COLUMNS (operator 2026-09-12): what sits left is pushed
     left, what sits right is pushed right. A line with nothing in it is not drawn. */
  function bkLines(t, S){ var B = bkcfg(), out = [];
    (B.rows || []).forEach(function(row){
      var L = [], R = [];
      ((row && row.l) || []).forEach(function(k){ var n = bkPart(k, t, S, B); if (n) L.push(n); });
      ((row && row.r) || []).forEach(function(k){ var n = bkPart(k, t, S, B); if (n) R.push(n); });
      if (L.length || R.length) out.push({ l: L, r: R }); });
    return out; }
  /* ══ FOREIGN KEYS ON EVERY LIST OF FIELDS (operator 2026-09-13) — a field row says what it POINTS AT (→ the
     referenced table.column, from the feed's own keys) and, when another table's key points at it, HOW MANY do. The
     inbound side is derived from the keys of the tables this door touches, so it is exact for those and silent about
     the rest of the database, which the feed does not carry — the card says so. ══ */
  var FKIN = null;
  function fkIn(t, col){
    if (!FKIN) { FKIN = {};
      (((window.LABEP || {}).data || {}).tables || []).forEach(function(o){
        (o.fks || []).forEach(function(f){ if (Array.isArray(f) && f[1]) (FKIN[String(f[1])] = FKIN[String(f[1])] || []).push(o.table + "." + f[0]); }); }); }
    return FKIN[t.table + "." + col] || []; }
  function fkOut(t, col){ var out = null;
    (t.fks || []).forEach(function(f){ var c = Array.isArray(f) ? f[0] : f; if (c === col) out = Array.isArray(f) && f[1] ? String(f[1]) : "another table"; });
    return out; }
  function fkMarks(t, col){ var out = fkOut(t, col), inb = fkIn(t, col), h = "";
    if (out) h += '<span class="fkx out" data-fk="out">' + ico("key", 12, S.KINDCOL.external) + "<span>→ " + esc(out) + "</span></span>";
    if (inb.length) h += '<span class="fkx in" data-fk="in">' + SVGI('<path d="M21 12H8M12 8l-4 4 4 4"/><path d="M4 5v14"/>', 12) + "<span>" + inb.length + "</span></span>";
    return h; }
  window.FKMARKS = fkMarks;

  /* ══ THE BLOCK CARD (operator 2026-09-13) — the hover mirrors the block it came from, in the block's own colours:
     the table name in ink behind the table glyph · the entity with its glyph and colour · the class · the file ·
     then the channel as the block's own chip with the words inside · the field count in the fields pill, followed by
     what the fields are made of in the marks already chosen · and a quiet footer. Every look is READ from the live
     settings, so changing a pill, a chip or an encoding changes the card too. ══ */
  function pillLook(key, S){ var c = lookCfg(), col = kindColOf({ key: key }, S), a = c.pillAlpha == null ? 100 : c.pillAlpha;
    var ink = { white: "#fff", ink: "var(--ink)", kind: col, accent: "var(--accent)", muted: "var(--muted)" }[c.pillInk || "white"];
    var ground = { accent: "var(--accent)", kind: col, chip: "var(--chip-bg)", panel: "var(--panel)", ink: "var(--ink)", none: "transparent" }[c.pillBg || "accent"];
    var radius = { pill: "999px", round: "7px", rect: "3px", square: "0" }[c.pillShape || "pill"];
    return "color:" + ink + ";background:color-mix(in srgb, " + ground + " " + a + "%, transparent);border-color:color-mix(in srgb, " + ground + " 55%, transparent);border-radius:" + radius; }
  function chipLook(rw, S){ return chipLookOf(RWC[rw]); }
  /* the chip's look for ANY colour — Schemas' IN · OUT chip wears the same box, fill and size as Data's channel chip */
  function chipLookOf(col){ var B = lookCfg().bk || {}, a = B.rwA == null ? 100 : B.rwA, box = B.rwBox || "tag";
    var clear = box === "outline" || box === "bare";
    var radius = { pill: "999px", tag: "3px", square: "0", outline: "3px", bare: "0" }[box];
    return "--rwc:" + col + ";color:" + (clear || a < 50 ? col : "#0b0e13") + ";background:" + (clear ? "transparent" : "color-mix(in srgb, " + col + " " + a + "%, transparent)")
      + ";border-color:" + (box === "outline" ? col : "transparent") + ";border-radius:" + radius + (box === "bare" ? ";padding:0" : ""); }
  function blockCard(t, S){
    var ec = t.entity_color || "#888", portOn = (window.FRAME || {}).portW > 0, pal = lookCfg().sqPal || "type";
    var mix = {}; t.cols.forEach(function(c){ var k = typeOf(c[1]).key; mix[k] = (mix[k] || 0) + 1; });
    var h = '<div class="bchd"><span class="bci">' + ico("model", 16, bkIconCol(t, S)) + "</span><b>" + esc(t.table) + "</b></div>";
    h += '<div class="bcln" data-ln="entity"><span class="bci">' + ico("entity", 14, ec) + '</span><span class="bcent" style="color:' + ec + '">' + esc(t.entity || "—") + "</span></div>";
    h += '<div class="bcln" data-ln="model"><span class="bci">' + ico("doc", 14, S.KINDCOL.schema) + '</span><span class="bcmodel">' + esc(t.model) + "</span></div>";
    h += '<div class="bcln" data-ln="file"><span class="bci">' + ico("file", 14, "var(--muted)") + '</span><span class="bcfile">' + esc(t.file || "—") + "</span></div>";
    h += '<div class="bcsep"></div>';
    h += '<div class="bcrow" data-row="channel"><span class="bci">' + ico("role", 14, S.OPC.call) + '</span><i class="bcchip" style="' + chipLook(t.rw, S) + '">'
      + (t.rw === "rw" ? "reads + writes" : t.rw === "w" ? "writes" : "reads") + "</i></div>";
    var marks = TYPEC.filter(function(x){ return mix[x.key]; }).map(function(x){
      return '<span class="mx" data-kind="' + x.key + '">' + kindMark(x, S, pal === "type" ? null : "var(--muted)").outerHTML + "<b>" + mix[x.key] + "</b></span>"; }).join("");
    h += '<div class="bcrow" data-row="fields"><span class="bci">' + ico("table", 14, S.KINDCOL.schema) + '</span><span class="bcfp" style="' + pillLook("fields", S) + '">'
      + t.cols.length + '</span><span class="bcmix">' + marks + "</span></div>";
    h += '<div class="bcfoot"><span class="bci">' + ico("info", 13, "currentColor") + "</span><span>"
      + (portOn ? "click to open its whole record in the portrait" : "click to name every field here") + "</span></div>";
    return h; }
  window.BLOCKCARD = blockCard;

  /* ══ THE FOOTER ROW'S PARTS (operator 2026-09-13) ══ */
  var FOOTDEF = { l: ["hint"], r: ["id", "text", "num", "flag", "time", "list", "other", "opt"] };
  function footCfg(){ var c = window.DATACFG || {}, f = c.foot || FOOTDEF;
    return { l: (f.l || []).slice(), r: (f.r || []).slice(), show: Array.isArray(c.footShow) ? c.footShow : ["icon", "text", "count"] }; }
  /* a part is up to three pieces — icon · label · count — each switched on its own by the row's fs-* classes */
  function footPart(key, iconHtml, wordsHtml, countText, cardFn){
    var p = E("span", { class: "ftp", "data-part": key });
    p.innerHTML = '<span class="fti">' + iconHtml + '</span><span class="ftw">' + wordsHtml + "</span>"
      + (countText === "" ? "" : '<span class="ftn">' + countText + "</span>");
    bind(p, cardFn); return p; }
  /* the mark exactly as the blocks draw it right now — encoding AND colour rule */
  function kindMarkShown(x, S){ var pal = lookCfg().sqPal || "type"; return kindMark(x, S, pal === "type" ? null : "var(--muted)"); }
  function footKindCard(x, n, total, S){
    var pal = lookCfg().sqPal || "type", carries = pal === "type", enc = sqEnc(), m = kindMarkShown(x, S);
    m.style.setProperty("--sq", "15px");
    var how = enc === "char" ? "a character — “" + x.ch + "”" : enc === "shape" ? "a shape — a " + x.shape : enc === "symbol" ? "the station's own " + x.word + " glyph" : "a filled mark";
    return window.hcard({ title: x.word, value: n + " of " + total + " fields", iconHtml: '<span class="cpmark">' + m.outerHTML + "</span>",
      color: carries ? x.col(S) : "var(--ink)",
      rows: [["drawn as", how], ["colour", carries ? "the kind's own colour" : "the " + pal + " — the kind is carried by the mark alone"],
             ["read from", "each column's declared type, never its name"]],
      plain: x.plain }); }
  /* the rail draws a kind's SYMBOL whatever the encoding, so its buttons always obey the icon rule */
  window.KINDICON = function(key, z){ var x = TYPEC.filter(function(t){ return t.key === key; })[0]; return x ? ico(x.sym, z || 14, x.col(S)) : ""; };
  window.FOOTDEF = FOOTDEF;

  /* ══ THE BLOCK (operator 2026-09-17: "for data we worked super hard on the BLOCKS layout — the blocks
     are the perfect representation of each table; we keep that"). ONE builder, so any distribution that
     wants blocks draws the SAME thing: the title lines the rail arranged, the field marks at their set
     size and opacity, the entity edge, one hover card and one click into the portrait. `extra` rides the
     first title line's right column — a count, a fate chip — and is the only thing a caller may add. ══ */
  function dataBlockNode(t, F, S, extra){
    var sel = (window.SEL || {}).data, portOn = (window.FRAME || {}).portW > 0;
    var fkSet = {}; (t.fks || []).forEach(function(f){ fkSet[Array.isArray(f) ? f[0] : f] = (Array.isArray(f) && f[1]) ? f[1] : true; });
    var uqSet = {}; (t.uqs || []).forEach(function(u){ (Array.isArray(u) ? u : [u]).forEach(function(c){ uqSet[c] = 1; }); });
    var blk = E("div", { class: "blk rw-" + t.rw + (sel === t.table ? " sel" : ""), style: "--ec:" + (t.entity_color || "#888") });
    blk.dataset.table = t.table; tg(blk, "tables-touched");
    var hd = E("div", { class: "bkhd" }), ti = E("div", { class: "bkti" });
    bkLines(t, S).forEach(function(line){ var ln = E("div", { class: "bkln" });
      function put(into, ns){ ns.forEach(function(n){ if (typeof n === "string") into.insertAdjacentHTML("beforeend", n); else into.append(n); }); }
      var L = E("div", { class: "bkcol l" }), R = E("div", { class: "bkcol r" });
      put(L, line.l); put(R, line.r); ln.append(L, R); ti.append(ln); });
    tg(ti.querySelector(".bkrw"), "operation-per-table");
    if (extra && extra.length) { var host = ti.querySelector(".bkln .bkcol.r") || ti;
      extra.forEach(function(n){ if (n) host.append(n); }); }
    hd.append(ti);
    var sqs = E("div", { class: "sqs" });
    t.cols.forEach(function(c){ var isFk = fkSet[c[0]], isUq = uqSet[c[0]];
      /* no card of its own — the whole block carries ONE card (operator 2026-09-13) */
      sqs.append(sqNode(c, t, S, (isFk ? "fk" : "") + (isUq ? " uq" : ""))); });
    hd.append(sqs);
    blk.append(hd);
    var list = E("div", { class: "flds bkfl" });
    t.cols.forEach(function(c){ var isFk = fkSet[c[0]], isUq = uqSet[c[0]];
      list.append(E("div", { class: "fld" + (isFk ? " fk" : "") + (isUq ? " uq" : "") },
        sqNode(c, t, S), E("span", { class: "fn" }, esc(c[0])), fkMarks(t, c[0]), E("span", { class: "ft" }, esc(c[1] || "—")))); });
    blk.append(list);
    /* ONE hover and ONE click for the WHOLE block (operator 2026-09-13): no dead corners, and no field
       mark with a card of its own competing with the table's */
    bind(blk, function(){ return blockCard(t, S); });
    blk.addEventListener("click", function(){
      if (portOn) { window.selectIn("data", t.table); }
      else blk.classList.toggle("open"); });
    return blk; }

  function renderDataBlocks(box, F, S){
    var D = F.data, TS = dtables(D), DC = window.DATACFG || {}, B = bkcfg();
    var sel = (window.SEL || {}).data, portOn = (window.FRAME || {}).portW > 0;
    dhead(box, F, D, TS, "layers",
      "one " + (B.form === "block" ? "block" : "row") + " per table — whose entity, how many fields and what kinds, without opening anything. Each square is one field, coloured by the kind of value it holds; click "
      + (portOn ? "a table and its whole record opens in the portrait beside this panel." : "a table to name every field at once (the portrait is off, so it opens in place)."));
    if (!TS.length) { chanEmpty(box, D, S); COV.mark("ACCESSES", "data"); return; }
    var body = E("div", { class: "bkbody form-" + B.form });
    sortTables(TS).forEach(function(t){ body.append(dataBlockNode(t, F, S)); });
    box.append(body);
    var mixAll = {}; TS.forEach(function(t){ t.cols.forEach(function(c){ var k = typeOf(c[1]).key; mixAll[k] = (mixAll[k] || 0) + 1; }); });
    /* THE FOOTER ROW (operator 2026-09-13) — one row of parts with a LEFT and a RIGHT column, ordered by drag like the
       title lines; each part drawn as its icon, its words, or both; and every kind's card shows the mark ACTUALLY drawn */
    var FT = footCfg(), total = colsOf(TS), parts = {};
    /* the hint is ONE grey phrase behind the info glyph (operator 2026-09-13) — the totals already sit in the title's pills */
    parts.hint = footPart("hint", ico("info", 13, "currentColor"),
      portOn ? "click a table to open its record in the portrait" : "click a table to list its fields here", "",
      function(){ return window.hcard({ title: "click a table", icon: "info", color: "var(--muted)",
        rows: [["opens", portOn ? "its whole record, in the portrait beside this panel" : "every field of it, here"], ["counts", total + " fields across " + TS.length + " tables"]],
        plain: "a block is a table — click one to read all of it" }); });
    TYPEC.forEach(function(x){ if (!mixAll[x.key]) return;
      parts[x.key] = footPart(x.key, kindMarkShown(x, S).outerHTML, x.word, String(mixAll[x.key]), function(){ return footKindCard(x, mixAll[x.key], total, S); }); });
    var optN = TS.reduce(function(n, t){ return n + t.cols.filter(function(c){ return isOpt(c[1]); }).length; }, 0);
    parts.opt = footPart("opt", '<i class="sq e-colour lgm ftopt" style="--fc:var(--muted)"></i>', "optional", String(optN),
      function(){ return window.hcard({ title: "optional", value: optN + " of " + total + " fields", iconHtml: '<span class="cpmark"><i class="sq e-colour ftopt" style="--fc:var(--muted);--sq:14px"></i></span>',
        color: "var(--muted)", rows: [["means", "the column accepts None"], ["drawn", "paler — not one of law G's three marks (dashed inferred · hatched unmeasured · hollow measured-zero)"]],
        plain: "a column that is allowed to be empty" }); });
    var foot = E("div", { class: "pfoot bkfoot" + FT.show.map(function(k){ return " fs-" + k; }).join("") });
    var FL = E("div", { class: "ftcol l" }), FR = E("div", { class: "ftcol r" });
    FT.l.forEach(function(k){ if (parts[k]) FL.append(parts[k]); });
    FT.r.forEach(function(k){ if (parts[k]) FR.append(parts[k]); });
    foot.append(FL, FR);
    box.append(foot);
    COV.mark("ACCESSES", "data"); COV.mark("PAYLOAD", "data"); COV.mark("CONNECTIONS", "data");
  }

  /* ══ DATA · F "stages" — the topic laid across the door's STANDARD dimension ═══════════════════
     endpoint-stages.md (operator 2026-09-17): every API door has the same spine, whatever it does —
     EDGE · GATE · INPUT · HANDLER · EFFECTS · ANSWER, with the UNCAUGHT bay beside it and the CLIENT
     screen after it. The endings are LABELS: choose one in the command panel and every topic can be
     read through it. This is the FIRST topic on that spine — the tables.

     Lifted from the WHEN card of data-atlas.html (lanes · axis · touches · fates · the transaction
     rail) and re-read on the lab's own facts. Two things are deliberately different:
       · no motion. The lab has ONE clock and the bead already belongs to Functions, so the frame is
         drawn FINISHED — the artifact's walk is its own.
       · the columns are the STAGES, not the FastAPI phases the forms feed names. A step the effects
         arm marks `dependency` happened at the GATE; every other step is the HANDLER's own. EDGE and
         INPUT touch no table by construction; the bay and the screen are not drawn at all, and the
         axis says so in one line instead of drawing two columns nobody can read.               ══ */
  var DSTG = [
    { key: "EDGE", holds: "no table — the app band refuses or lets through, it stores nothing",
      plain: "the checks every request meets before it even reaches this endpoint" },
    { key: "GATE", holds: "every read and write the endpoint's dependencies made before the body was read",
      plain: "the login check on the endpoint — who may knock, and what the gate sets up on the way in" },
    { key: "INPUT", holds: "no table — the body is read and shape-checked, never stored",
      plain: "the body — can it be read at all, and does it fit the shape the endpoint declares" },
    { key: "HANDLER", holds: "every step the handler runs itself, in the order it runs them",
      plain: "the endpoint's own work — its guards, the functions it calls, the arms it takes" },
    { key: "EFFECTS", holds: "one marker per fate a write landed in on this ending",
      plain: "the writes the endpoint leaves behind — and which of them survive the way it ended" },
    { key: "ANSWER", holds: "the status this ending answers with",
      plain: "the reply the caller gets" } ];
  var DSTGBUCK = ["committed", "maybe_committed", "rolled_back", "uncommitted"];
  function stgCfg(){ var C = window.DATACFG || {};
    return C.stages || { axis: "rows", union: "counts", fate: "station", rail: "shown", placement: "every", empty: "shown" }; }
  /* the stage a step happened at — the effects arm's own `dependency` flag, nothing guessed */
  function stgOf(st){ return st.dependency ? "GATE" : "HANDLER"; }
  function stgPaths(F){ var fm = FRM(F); return fm ? (fm.paths || []) : []; }
  /* the fate palette — read from the station, never pasted; `mono` drops the colour and the FORM
     still parts the four buckets (fill · dashed · slashed · outline) */
  function stgFates(S){ var mono = stgCfg().fate === "mono";
    return { committed:       { col: mono ? "var(--muted)" : S.OPC.read, form: "fill",  word: "committed",
                                plain: "the change is permanent — the transaction closed" },
             maybe_committed: { col: mono ? "var(--muted)" : S.OPC.read, form: "dash",  word: "maybe",
                                plain: "the change may or may not have closed — this ending cannot say" },
             rolled_back:     { col: mono ? "var(--muted)" : (S.BADGE_COL.role || {}).accessor, form: "slash", word: "rolled back",
                                plain: "the change was undone — the transaction went back" },
             uncommitted:     { col: mono ? "var(--muted)" : S.OPC.write, form: "ring", word: "uncommitted",
                                plain: "the change never closed a transaction — it is gone when the request ends" } }; }
  /* the ROWS: the tables the panel draws (the channel filter still rules), then the tables only the
     effects arm knows — drawn HOLLOW, the way the atlas draws them, with the reason on the card */
  function stgRows(F){
    var keep = dtables(F.data), have = {}, rows = [];
    sortTables(keep).forEach(function(t){ have[t.table] = 1; rows.push({ table: t.table, t: t, hollow: false }); });
    stgPaths(F).forEach(function(p){ ((p.effects || {}).steps || []).forEach(function(s){
      if (s.table && !have[s.table]) { have[s.table] = 1; rows.push({ table: s.table, t: null, hollow: true }); } }); });
    return rows; }
  /* every touch, indexed once: per path (the label read) and across paths (the union read) */
  function stgIndex(F){
    var idx = { per: {}, union: {}, uBucket: {}, uStatus: {}, tx: {}, uTx: {}, groups: 0 };
    stgPaths(F).forEach(function(p){
      var per = idx.per[p.id] = { t: {}, tx: {}, bucket: {}, status: p.status }, seen = {};
      ((p.effects || {}).steps || []).forEach(function(s){ var g = stgOf(s);
        if (!s.table) { (per.tx[g] = per.tx[g] || []).push(s); return; }
        var byT = per.t[s.table] = per.t[s.table] || {};
        (byT[g] = byT[g] || []).push(s);
        /* the FATE is counted per STATEMENT, not per pass: a walk that crosses the same write twice
           wrote once. This is the rule the bucket chips already use (onPath), so the two agree. */
        if (s.bucket) { var k2 = s.table + "/" + s.bucket + "/" + s.step; if (seen[k2]) return; seen[k2] = 1;
          var b = per.bucket[s.table] = per.bucket[s.table] || {}; b[s.bucket] = (b[s.bucket] || 0) + 1; } });
      Object.keys(per.t).forEach(function(k){ var u = idx.union[k] = idx.union[k] || {};
        Object.keys(per.t[k]).forEach(function(g){ (u[g] = u[g] || []).push(p); idx.groups++; });
        var st = idx.uStatus[k] = idx.uStatus[k] || {}; st[p.status] = (st[p.status] || 0) + 1; });
      Object.keys(per.bucket).forEach(function(k){ var ub = idx.uBucket[k] = idx.uBucket[k] || {};
        Object.keys(per.bucket[k]).forEach(function(b){ ub[b] = (ub[b] || 0) + 1; }); });
      Object.keys(per.tx).forEach(function(g){ (idx.uTx[g] = idx.uTx[g] || []).push(p); }); });
    return idx; }
  window.STGINDEX = stgIndex;
  /* one touch = one dot: a read is a small filled dot, a write a ring in its fate, a conditional
     write dashed, a transaction step a square (commit filled · flush small · savepoint outline ·
     rollback in the refusal colour) */
  function stgDot(s, FA, S){
    var isTx = !s.table, fa = s.bucket ? FA[s.bucket] : null;
    var d = E("i", { class: "dsd dk-" + (isTx ? "tx" : s.op === "read" ? "read" : "write") + (s.cond ? " cond" : "") + (s.race ? " race" : "") });
    d.dataset.op = s.op;
    if (isTx) d.classList.add("op-" + s.op);
    d.style.setProperty("--fc", fa ? fa.col : (isTx && s.op === "rollback" ? (S.BADGE_COL.role || {}).accessor : "var(--muted)"));
    if (fa) d.classList.add("fm-" + fa.form);
    if (s.table) tg(d, "the-moment-a-table-is-touched"); if (fa) tg(d, "fate-of-the-writes-per-ending"); if (s.race) tg(d, "race-on-a-unique-key", true);
    bind(d, function(){ return cmdc({ title: s.table || "transaction", value: s.op, icon: s.table ? "table" : "key",
      color: fa ? fa.col : "var(--muted)",
      rows: [["stage", stgOf(s)], ["fate", fa ? fa.word : "a read leaves nothing behind"],
             ["in", String(s.fn || "—").split("::").pop()], ["at", String(s.at || "—")],
             s.cond ? ["conditional", "this step only runs on one arm"] : null,
             ["whose", s.dependency ? "the gate's — a check that runs before the handler" : "this endpoint's own code"],
             s.race ? ["race", "a second request can insert the same key first — " + (s.race.state || "") + (s.dependency ? " · the gate's insert, the same on almost every endpoint" : " · this endpoint's own insert")] : null],
      plain: s.table ? "one thing the endpoint did to a table, at the point it did it" : "one transaction move — the writes before it are what it decides on" }); });
    return d; }
  function stgCount(n, cls, card2){ var i = E("i", { class: "dsn" + (cls ? " " + cls : "") }, esc(String(n)));
    if (card2) bind(i, card2); return i; }
  function renderDataStages(box, F, S){
    var D = F.data, fm = FRM(F), C = stgCfg(), FA = stgFates(S);
    var p = pathById(F, (window.SEL || {}).path);
    var keep = dtables(D);
    dhead(box, F, D, keep, "journey",
      "the tables laid across the endpoint's stages — where each one is touched, and the fate of the write at the end. "
      + (p ? "Reading the " + pathWord(p) + " ending: only what that path did." : "No ending is chosen, so every cell counts the endings that touch it — pick one in the command panel to read a single path."));
    if (!keep.length) { chanEmpty(box, D, S); COV.mark("ACCESSES", "data"); return; }
    if (!fm) { box.append(E("div", { class: "pempty" }, ico("journey", 15, "var(--muted)"),
      E("b", null, "the forms feed is " + ((F.forms || {}).state || "absent")),
      E("span", null, "the stages are read from the element forms — the paths, their steps and the fate of each write. Without that feed there is nothing to lay across them."))); COV.mark("ACCESSES", "data"); return; }
    var rows = stgRows(F), idx = stgIndex(F), per = p ? idx.per[p.id] : null;
    var nPaths = stgPaths(F).length;
    var wrap = E("div", { class: "dstg" }); wrap.dataset.axis = C.axis === "rows" ? "rows" : "cols";
    var grid = E("div", { class: "dsg" });
    grid.style.setProperty("--dsn", String(rows.length + (C.rail === "shown" ? 1 : 0)));

    /* ── the CORNER: the axis itself, and what it does NOT draw ── */
    var corner = E("span", { class: "dsc dscorner" }, E("i", null, esc(C.axis === "rows" ? "stage ↓" : "table ↓")));
    bind(corner, function(){ return cmdc({ title: "the endpoint's stages", value: DSTG.length + " of 8", icon: "journey", color: S.KINDCOL.model,
      rows: DSTG.map(function(s){ return [s.key, s.holds]; })
        .concat([["UNCAUGHT", "the bay — not drawn here: a 500 leaves from wherever it was raised, and touches no table of its own"],
                 ["CLIENT", "the screen — not drawn here: it reads the answer, it never touches a table"]]),
      plain: "the six stages of the eight every endpoint has — the 500 bay and the client screen touch no table, so they are not drawn here" }); });

    /* ── the two HEAD rosters, one per orientation ── */
    function stageHead(s){ var h = E("span", { class: "dsh dsst" }, E("i", null, esc(s.key)));
      h.dataset.stage = s.key; tg(h, "expected-slots-at-this-stage", true);
      bind(h, function(){ return cmdc({ title: s.key, value: s.key === "EDGE" || s.key === "INPUT" ? "no table" : "drawn", icon: "journey", color: S.KINDCOL.model,
        rows: [["holds", s.holds], ["the spine", DSTG.map(function(x){ return x.key; }).join(" → ")]],
        plain: s.plain }); });
      return h; }
    function tableHead(r){ var h = E("span", { class: "dsh dstb" + (r.hollow ? " hollow" : "") }, E("i", null, esc(r.table)));
      h.dataset.table = r.table; tg(h, "tables-touched");
      bind(h, function(){ return stgRowCard(r); });
      return h; }
    function stgRowCard(r){ var t = r.t, u = idx.union[r.table] || {}, ub = idx.uBucket[r.table] || {};
      return cmdc({ title: r.table, value: r.hollow ? "not in the Data panel" : (t.rw === "rw" ? "reads + writes" : t.rw === "w" ? "writes" : "reads"),
        icon: "table", color: r.hollow ? "var(--muted)" : (t.entity_color || "#888"),
        rows: (r.hollow ? [["hollow", "the effects arm touches it, the panel's own table list does not carry it — drawn with a dashed lane so the gap is visible, never hidden"]]
                        : [["entity", String(t.entity || "—")], ["model", String(t.model || "—")], ["columns", String((t.cols || []).length)]])
          .concat([["at the GATE", (u.GATE || []).length + " of " + nPaths + " endings"], ["in the HANDLER", (u.HANDLER || []).length + " of " + nPaths + " endings"]])
          .concat(DSTGBUCK.filter(function(b){ return ub[b]; }).map(function(b){ return [FA[b].word, ub[b] + " ending(s)"]; })),
        plain: r.hollow ? "a table this endpoint writes that the Data panel never draws — the stage picture shows it anyway" : "one table, and everywhere on the spine this endpoint meets it" }); }

    /* ── the CELLS, built once and laid out in whichever orientation the axis pick asks for ── */
    function touchCell(r, s){ var cell = E("span", { class: "dsc dst-" + s.key });
      cell.dataset.stage = s.key; cell.dataset.tbl = r.table;
      if (s.key === "EDGE" || s.key === "INPUT") { cell.classList.add("none"); return cell; }
      if (s.key === "EFFECTS") return effCell(r, cell);
      if (s.key === "ANSWER") return ansCell(r, cell);
      if (per) { var list = ((per.t[r.table] || {})[s.key]) || [];
        if (!list.length) return cell;
        cell.dataset.n = String(list.length);
        list.forEach(function(st){ cell.append(stgDot(st, FA, S)); });
        return cell; }
      var ps = (idx.union[r.table] || {})[s.key] || [];
      if (!ps.length) return cell;
      cell.dataset.n = String(ps.length);
      if (C.union === "dots") ps.forEach(function(q){ var d = tg(E("i", { class: "dsu" }), "the-moment-a-table-is-touched");
        d.style.setProperty("--fc", pathCol(q, F, S));
        bind(d, function(){ return cmdc({ title: pathWord(q), value: q.status + " · " + s.key, icon: (CMDKIND[q.kind] || {}).ico || "info", color: pathCol(q, F, S),
          rows: [["touches", r.table + " at " + s.key], ["steps", String((((idx.per[q.id] || {}).t || {})[r.table] || {})[s.key].length)]],
          plain: "one ending that meets this table here" }); });
        cell.append(d); });
      else cell.append(tg(stgCount(ps.length, null, function(){ return cmdc({ title: r.table + " · " + s.key, value: ps.length + " of " + nPaths + " endings", icon: "journey", color: S.KINDCOL.model,
        rows: ps.map(function(q){ return [String(q.status), pathWord(q)]; }),
        plain: "how many of this endpoint's endings touch this table here" }); }), "the-moment-a-table-is-touched"));
      return cell; }
    function effCell(r, cell){
      if (per) { var b = per.bucket[r.table] || {};
        DSTGBUCK.forEach(function(k){ var n = b[k]; if (!n) return;
          var fa = FA[k], m = tg(E("i", { class: "dsf bk-" + k + " fm-" + fa.form }, esc("×" + n)), "fate-of-the-writes-per-ending");
          m.style.setProperty("--fc", fa.col);
          bind(m, function(){ return cmdc({ title: r.table, value: fa.word + " ×" + n, icon: "table", color: fa.col,
            rows: [["on", pathWord(p)], ["writes in this bucket", n + " — counted per statement: a walk that crosses the same write twice wrote once"],
                   ["every bucket here", DSTGBUCK.filter(function(x){ return b[x]; }).map(function(x){ return FA[x].word + " " + b[x]; }).join(" · ")]],
            plain: fa.plain }); });
          cell.append(m); });
        return cell; }
      var ub = idx.uBucket[r.table] || {};
      [["committed", "cm"], ["rolled_back", "rb"]].forEach(function(pair){ var n = ub[pair[0]]; if (!n) return;
        var fa = FA[pair[0]], m = stgCount(n, "u-" + pair[1] + " fm-" + fa.form, function(){ return cmdc({ title: r.table, value: n + " of " + nPaths + " endings", icon: "table", color: fa.col,
          rows: [["bucket", fa.word], ["the other buckets", DSTGBUCK.filter(function(x){ return ub[x] && x !== pair[0]; }).map(function(x){ return FA[x].word + " " + ub[x]; }).join(" · ") || "none"]],
          plain: "how many endings leave this table's write in this state" }); });
        m.style.setProperty("--fc", fa.col); cell.append(tg(m, "fate-of-the-writes-per-ending")); });
      return cell; }
    function ansCell(r, cell){
      if (per) { if (!per.t[r.table]) return cell;
        var chip = tg(E("i", { class: "dsa" }, esc(String(p.status))), "status-code-per-ending");
        chip.style.setProperty("--fc", pathCol(p, F, S));
        bind(chip, function(){ return cmdc({ title: pathWord(p), value: String(p.status), icon: (CMDKIND[p.kind] || {}).ico || "info", color: pathCol(p, F, S),
          rows: [["ends at", p.phase], ["this table", (((per.t[r.table] || {}).GATE || []).length + ((per.t[r.table] || {}).HANDLER || []).length) + " step(s)"],
                 ["fate", DSTGBUCK.filter(function(x){ return (per.bucket[r.table] || {})[x]; }).map(function(x){ return FA[x].word; }).join(" · ") || "read only"]],
          plain: "the answer the caller gets on the ending this row was read through" }); });
        cell.append(chip); return cell; }
      var st = idx.uStatus[r.table] || {}, keys = Object.keys(st).sort();
      keys.forEach(function(k){ var chip = tg(E("i", { class: "dsa u" }, esc(k)), "status-code-per-ending");
        bind(chip, function(){ return cmdc({ title: r.table + " · " + k, value: st[k] + " ending(s)", icon: "journey", color: S.KINDCOL.model,
          rows: keys.map(function(x){ return [x, st[x] + " ending(s)"]; }),
          plain: "the answers the caller can get on an ending that touched this table" }); });
        cell.append(chip); });
      return cell; }
    /* the TRANSACTION rail — the commit, flush, savepoint and rollback moves that carry no table */
    function railCell(s){ var cell = E("span", { class: "dsc dst-" + s.key + " dsrailc" });
      cell.dataset.stage = s.key; cell.dataset.rail = "1";
      if (s.key === "EDGE" || s.key === "INPUT") { cell.classList.add("none"); return cell; }
      if (s.key === "EFFECTS" || s.key === "ANSWER") return cell;
      if (per) { (per.tx[s.key] || []).forEach(function(st){ cell.append(stgDot(st, FA, S)); }); return cell; }
      var ps = (idx.uTx[s.key] || []);
      if (!ps.length) return cell;
      cell.dataset.txn = String(ps.length);
      cell.append(stgCount(ps.length, "tx", function(){ return cmdc({ title: "transaction · " + s.key, value: ps.length + " of " + nPaths + " endings", icon: "key", color: S.OPC.write,
        rows: [["moves", "commit · flush · savepoint · rollback"], ["drawn", "one square per move when an ending is chosen"]],
        plain: "how many endings make a transaction move here" }); }));
      return cell; }
    function railLabel(){ var l = E("span", { class: "dsl dsrl" }, E("i", { class: "dsw tx" }), E("b", null, "transaction"));
      bind(l, function(){ return cmdc({ title: "the transaction", value: (D.commits ? "one commit" : "reads only"), icon: "key", color: S.OPC.write,
        rows: [["moves", "commit · flush · savepoint · rollback"], ["why it is a lane", "the writes above it are decided HERE — a commit makes them permanent, a rollback undoes them"],
               ["commit", "one DB transaction — never a git commit"]],
        plain: "the rail that decides what every write above it is worth" }); });
      return l; }
    function rowLabel(r){ var l = E("span", { class: "dsl" + (r.hollow ? " hollow" : "") + ((window.SEL || {}).data === r.table ? " sel" : "") });
      l.dataset.table = r.table; tg(l, "tables-touched");
      var sw = E("i", { class: "dsw" }); sw.style.background = r.hollow ? "transparent" : (r.t.entity_color || "#888");
      l.append(sw, E("b", null, esc(r.table)));
      bind(l, function(){ return stgRowCard(r); });
      l.addEventListener("click", function(ev){ ev.stopPropagation(); window.selectIn("data", r.table); });
      return l; }

    var lines = [];
    if (C.rail === "shown") lines.push({ label: railLabel, cell: railCell, rail: true });
    rows.forEach(function(r){ lines.push({ label: function(){ return rowLabel(r); }, cell: function(s){ return touchCell(r, s); }, head: function(){ return tableHead(r); }, r: r }); });

    grid.append(corner);
    if (C.axis === "rows") {
      lines.forEach(function(L){ grid.append(L.rail ? E("span", { class: "dsh dstb tx" }, E("i", null, "transaction")) : L.head()); });
      DSTG.forEach(function(s){ grid.append(stageHead(s));
        lines.forEach(function(L){ grid.append(L.cell(s)); }); }); }
    else {
      DSTG.forEach(function(s){ grid.append(stageHead(s)); });
      lines.forEach(function(L){ grid.append(L.label());
        DSTG.forEach(function(s){ grid.append(L.cell(s)); }); }); }
    wrap.append(grid);
    box.append(wrap);

    var foot = E("div", { class: "pfoot" });
    foot.append(legend(DSTGBUCK.map(function(b){ return { t: FA[b].word, swatch: "background:" + (FA[b].form === "ring" ? "transparent" : FA[b].col) + ";border:1.5px solid " + FA[b].col + (FA[b].form === "dash" ? ";border-style:dashed" : "") }; })
      .concat([{ t: "read", swatch: "background:var(--muted)" }, { t: "not in the Data panel", swatch: "background:transparent;border:1px dashed var(--muted)" }])));
    box.append(foot);
    COV.mark("ACCESSES", "data"); COV.mark("CONNECTIONS", "data");
  }

  /* ══ DATA · G "stage blocks" — the BLOCKS, grouped under the stage that touches them ══════════════
     operator 2026-09-17: "for data we worked super hard on the BLOCKS layout — the blocks are the perfect
     representation of each table; we keep that. The endpoint has stages: show the tables throughout those
     stages, and when I hover a stage the information is NOT diagnostic — only what should be there in that
     stage for this topic."
     So: the same block, the same card, the same marks — `dataBlockNode` builds every one of them — laid in
     bands (or columns) on the standard spine. The bucketing is the `stages` grid's own (`stgIndex`), so the
     two distributions can never disagree about where a table is touched. A stage's header card states the
     EXPECTATION for this topic, and one measured row beside it; it never grades what it found.        ══ */
  var STAGE_EXPECT = window.STAGE_EXPECT = { data: {
    EDGE:    "no table — the app band checks the request before any data is touched",
    GATE:    "the rows the login check reads or creates to know who is calling",
    INPUT:   "no table — the body is read and checked against its shape, not against the database",
    HANDLER: "the reads and writes the endpoint's own code makes — every table it touches, in the order it touches them",
    EFFECTS: "the fate of each write, committed, still open or rolled back — decided by the ending",
    ANSWER:  "no table — the reply is built from what was already read; nothing is touched here" },
  /* leftovers piece 2 — the norm for the OTHER five topics, one line per stage: what a stage holds for this KIND of element,
     never a grade of this one. Authored; generating them from the slot registry (_a3_forms.KINDS) is a later step. */
  schemas: {
    EDGE:    "no shape — the app band reads headers and the address, never the body",
    GATE:    "the credential the login check expects — the header it rides on and the scheme it follows",
    INPUT:   "the request shape — every field the body must carry, and the rules that refuse it",
    HANDLER: "the shapes the endpoint's own code builds on the way — the values it hands to the functions it calls",
    EFFECTS: "the table shapes behind each write — the model a saved row has to fit",
    ANSWER:  "the response shape of each ending — the body a success returns, the detail a refusal returns" },
  functions: {
    EDGE:    "the app-wide steps — the middleware every request runs through, in the order it runs",
    GATE:    "the functions that give context — who is calling, the database session, the settings",
    INPUT:   "the framework's own reader — it parses the body and checks it against the shape",
    HANDLER: "the handler and the functions it calls — the ones that decide an ending, the ones that touch the data",
    EFFECTS: "the functions that settle a write — the commit, the rollback, the savepoint",
    ANSWER:  "the function that builds the reply — it turns what was read into the response shape" },
  tests: {
    EDGE:    "a test for each app-wide refusal — the rate limit answering before the endpoint is reached",
    GATE:    "a test for each way the login check says no — no credential, an invalid credential",
    INPUT:   "a test for each rule on the body — a missing field, a value out of range",
    HANDLER: "a test for each guard and each fork — one per ending the endpoint's own code can choose",
    EFFECTS: "a test that reads the database back — the row saved on success, the row absent after a refusal",
    ANSWER:  "a test of the reply itself — the status, the fields of the body, the headers" },
  widening: {
    EDGE:    "the address the client calls — the method, the path, and the wrapper that sends it",
    GATE:    "the credential the client attaches — and the screen's move when the login check refuses it",
    INPUT:   "the form the screen fills — the fields it collects before it calls",
    HANDLER: "no client piece — the endpoint's own work is invisible to the screen",
    EFFECTS: "the cached answers the screen drops or refills once the writes are done",
    ANSWER:  "the branch of the screen each ending reaches — the message, the redirect, the retry" },
  security: {
    EDGE:    "the app-wide checks — the rate limit and the origin rules; a repeat key where the app reads one",
    GATE:    "the login scheme and the function that checks it — with the rows it may create on the way in",
    INPUT:   "the rules a body has to pass — sizes, ranges, allowed values",
    HANDLER: "the guards the endpoint's own code adds — whose row this is, whether this caller may do this",
    EFFECTS: "the writes a refusal leaves behind — what is undone when the endpoint says no, what is kept",
    ANSWER:  "the detail each refusal gives the caller, and the headers the reply sends" } };
  /* which tables belong under which stage — the ONE rule, read by both stage distributions */
  function stgPlacement(F){ var C = stgCfg(), idx = stgIndex(F), p = pathById(F, (window.SEL || {}).path);
    var per = p ? idx.per[p.id] : null, out = {}, first = {};
    DSTG.forEach(function(s){ out[s.key] = []; });
    var known = {}; dtables(F.data).forEach(function(t){ known[t.table] = t; });
    function add(stage, table, n){ out[stage].push({ table: table, t: known[table] || null, n: n }); }
    /* GATE and HANDLER: the touches themselves */
    ["GATE", "HANDLER"].forEach(function(g){
      stgRows(F).forEach(function(r){
        if (per) { var list = (per.t[r.table] || {})[g] || []; if (list.length) add(g, r.table, list.length); }
        else { var ps = (idx.union[r.table] || {})[g] || []; if (ps.length) add(g, r.table, ps.length); } }); });
    /* EFFECTS: the tables whose writes have a FATE — the ending decides it */
    stgRows(F).forEach(function(r){
      var b = per ? (per.bucket[r.table] || null) : (idx.uBucket[r.table] || null);
      if (b && Object.keys(b).length) add("EFFECTS", r.table, b); });
    /* `first touch`: one block per table, under the earliest stage it appears at, with ticks for the rest */
    if (C.placement === "first") { var seen = {};
      DSTG.forEach(function(s){ out[s.key] = out[s.key].filter(function(c){
        if (seen[c.table]) { first[c.table].push(s.key); return false; }
        seen[c.table] = s.key; first[c.table] = []; return true; }); }); }
    return { at: out, ticks: first, per: per, idx: idx, path: p }; }
  function stgHeadNode(s, n, F, S, place){
    var h = E("div", { class: "sbhd" }); h.dataset.stage = s.key;
    h.append(E("i", { class: "sbord" }, esc(String(DSTG.indexOf(s) + 1))),
             E("b", null, esc(s.key)),
             E("span", { class: "sbn" }, esc(n ? String(n) : "—")));
    var nT = 0, nP = 0;
    (place.at[s.key] || []).forEach(function(c){ nT++; nP += typeof c.n === "number" ? c.n : 0; });
    var fact = !nT ? "none — and none is expected"
      : (place.path ? nT + " table(s) on " + pathWord(place.path) : nT + " table(s), " + nP + " touch(es) across every ending");
    var prov = s.key === "GATE" ? (((FRM(F) || {}).auth || {}).provisions || []) : [];
    tg(h, "the-moment-a-table-is-touched"); tg(h, "expected-slots-at-this-stage", true); if (prov.length) tg(h, "provisions", true);
    tipBind(h, function(){ return cmdc({ title: s.key, value: "data", icon: "journey", color: S.KINDCOL.model,
      rows: [["on this endpoint", fact]].concat(prov.map(function(v){ return ["provisioned here", "a " + v.table + " row is " + (v.op === "add" ? "added" : v.op) + " by this check before the handler runs — " + v.state + " whatever the ending"]; })),
      plain: (STAGE_EXPECT.data || {})[s.key] }); }, function(){ return esc(s.key + " · " + fact); });
    return h; }
  function stgTickNode(keys, S){ var t = E("span", { class: "sbtick" });
    keys.forEach(function(k){ t.append(E("i", null, esc(k.charAt(0)))); });
    bind(t, function(){ return cmdc({ title: "also at", value: keys.join(" · "), icon: "journey", color: "var(--muted)",
      rows: keys.map(function(k){ return [k, (STAGE_EXPECT.data || {})[k]]; }),
      plain: "the other stages that touch this table — the block is drawn once, under the first of them" }); });
    return t; }
  function renderDataStageBlocks(box, F, S){
    var D = F.data, C = stgCfg(), fm = FRM(F), TS = dtables(D), FA = stgFates(S);
    var p = pathById(F, (window.SEL || {}).path);
    dhead(box, F, D, TS, "layers",
      "the same block per table, grouped under the stage that touches it. "
      + (p ? "Reading the " + pathWord(p) + " ending: only what that path did."
           : "No ending is chosen, so a block sits under every stage any ending touches it at — the number on its title line counts them."));
    if (!TS.length) { chanEmpty(box, D, S); COV.mark("ACCESSES", "data"); return; }
    if (!fm) { box.append(E("div", { class: "pempty" }, ico("journey", 15, "var(--muted)"),
      E("b", null, "the forms feed is " + ((F.forms || {}).state || "absent")),
      E("span", null, "the stages are read from the element forms; without that feed there is nothing to group the blocks under."))); COV.mark("ACCESSES", "data"); return; }
    var place = stgPlacement(F);
    var wrap = E("div", { class: "sbwrap" });
    wrap.dataset.axis = C.axis === "cols" ? "cols" : "rows";
    DSTG.forEach(function(s){
      var cells = place.at[s.key] || [];
      if (!cells.length && C.empty === "hidden") return;
      var g = E("div", { class: "sbgrp" + (cells.length ? "" : " open") }); g.dataset.stage = s.key;
      g.append(stgHeadNode(s, cells.length, F, S, place));
      var body = E("div", { class: "sbbody bkbody form-" + bkcfg().form });
      cells.forEach(function(c){
        if (!c.t) { /* a table the effects arm touches that the panel's own list does not carry */
          var ho = E("div", { class: "blk hollow" }); ho.dataset.table = c.table; tg(ho, "tables-touched");
          ho.append(E("div", { class: "bkhd" }, E("div", { class: "bkti" }, E("div", { class: "bkln" },
            E("div", { class: "bkcol l" }, E("b", null, esc(c.table))), E("div", { class: "bkcol r" })))));
          bind(ho, function(){ return cmdc({ title: c.table, value: "not in the Data panel", icon: "table", color: "var(--muted)",
            rows: [["stage", s.key], ["hollow", "the effects arm touches it, the panel's own table list does not carry it — drawn anyway so the gap is visible"]],
            plain: "a table this endpoint touches that the Data panel never draws" }); });
          body.append(ho); return; }
        var extra = [];
        if (s.key === "EFFECTS") { var b = c.n;
          DSTGBUCK.forEach(function(k){ var nb = b[k]; if (!nb) return; var fa = FA[k];
            /* `fchip`, not `bchip`: the projection sweeps every .bchip off the panel before it marks it,
               and this chip is the PICTURE's own, drawn at EFFECTS where the fate belongs */
            var chip = tg(E("i", { class: "fchip bk-" + k }, esc(fa.word + " ×" + nb)), "fate-of-the-writes-per-ending");
            chip.style.setProperty("--bc", fa.col);
            bind(chip, function(){ return cmdc({ title: c.table, value: fa.word + " ×" + nb, icon: "table", color: fa.col,
              rows: [["on", place.path ? pathWord(place.path) : "every ending that writes it"],
                     ["stage", "EFFECTS — the ending decides the fate"]],
              plain: fa.plain }); });
            extra.push(chip); }); }
        else if (!place.path && typeof c.n === "number") { var pill = E("i", { class: "bkxp", style: pillLook("num", S) }, esc(String(c.n)));
          bind(pill, function(){ return cmdc({ title: c.table, value: c.n + " of " + (fm.paths || []).length + " endings", icon: "journey", color: S.KINDCOL.model,
            rows: [["stage", s.key], ["counts", "the endings that touch this table here"]],
            plain: "how many of this endpoint's endings meet this table at this stage" }); });
          extra.push(pill); }
        var node = dataBlockNode(c.t, F, S, extra);
        node.dataset.stage = s.key;
        if (C.placement === "first" && (place.ticks[c.table] || []).length)
          node.querySelector(".bkhd").append(stgTickNode(place.ticks[c.table], S));
        body.append(node); });
      if (!cells.length) body.append(tg(E("div", { class: "sbnone" }, esc((STAGE_EXPECT.data || {})[s.key])), "expected-slots-at-this-stage"));
      g.append(body); wrap.append(g); });
    box.append(wrap);
    var foot = E("div", { class: "pfoot" });
    foot.append(legend(DSTG.map(function(s){ return { t: s.key.toLowerCase(), swatch: (place.at[s.key] || []).length
      ? "background:color-mix(in srgb, " + S.KINDCOL.model + " 45%, transparent)" : "background:transparent;border:1px dashed var(--muted)" }; })));
    box.append(foot);
    COV.mark("ACCESSES", "data"); COV.mark("PAYLOAD", "data"); COV.mark("CONNECTIONS", "data");
  }

  /* ── THE DATA PORTRAIT — whatever table you clicked, at full detail, beside the picture ── */
  /* the table the middle panel selected, or null — every representation starts here */
  function selTable(F){ var sel = (window.SEL || {}).data;
    return F.data.tables.filter(function(x){ return x.table === sel; })[0] || null; }
  function ptIdle(box, what){ box.append(E("div", { class: "ptidle" }, E("b", null, "nothing selected"),
    E("span", null, "click a table in the middle panel and " + what))); }
  function dataPortrait(box, F, S){
    var D = F.data, t = selTable(F);
    if (!t) { ptIdle(box, "its whole record opens here: which entity claims it, the class that maps to it, the file it lives in, and every field with its kind."); return; }
    var ec = t.entity_color || "#888";
    var fkSet = {}; (t.fks || []).forEach(function(f){ fkSet[Array.isArray(f) ? f[0] : f] = (Array.isArray(f) && f[1]) ? f[1] : true; });
    var uqSet = {}; (t.uqs || []).forEach(function(u){ (Array.isArray(u) ? u : [u]).forEach(function(c){ uqSet[c] = 1; }); });
    /* THE RECORD (operator 2026-09-13) — the block card with room for more: the table glyph and its name; then one row
       per fact, each led by its icon and its label (the class explains itself on an info icon, not in words); then every
       field in a table with named columns — fields · foreign keys · data type — drawn in the field marks set for the
       blocks: their size, the optional stop, the unique corners. What the table is made of is not repeated above it,
       and neither are its keys or its unique columns: the table below carries all three. */
    var b = E("div", { class: "ptbody ptrec" });
    b.append(tg(E("div", { class: "rchd" }, E("span", { class: "rci" }, ico("model", 18, bkIconCol(t, S))), E("b", null, esc(t.table))), "tables-touched"));
    var DROW = { file: "file-line", channel: "operation-per-table", "found by": "how-this-table-was-found" };
    function row(key, icon, value, info){
      var r = E("div", { class: "rcrow", "data-row": key }, E("span", { class: "rci" }, icon), E("span", { class: "k" }, key), value);
      if (info) { var i = E("span", { class: "rcinfo" }, ico("info", 13, "currentColor")); bind(i, info); r.append(i); }
      if (DROW[key]) tg(r, DROW[key]);
      b.append(r); }
    row("entity", ico("entity", 14, ec), E("span", { class: "v", style: "color:" + ec }, esc(t.entity || "—")));
    row("model", ico("doc", 14, S.KINDCOL.schema), E("span", { class: "v" }, esc(t.model)),
      card({ title: t.model, icon: "doc", color: S.KINDCOL.schema, sub: "the model",
        rows: [["maps", "the table " + t.table], ["lives in", String(t.at || t.file || "—")]].concat(tableRuleRows(t)),
        body: "the Python class that maps to this table — each row of the table is one instance of it." }));
    row("file", ico("file", 14, "var(--muted)"), E("span", { class: "v" }, esc(t.at || t.file || "—")));
    row("channel", ico("role", 14, S.OPC.call),
      E("span", { class: "v" }, E("i", { class: "rcchip", style: chipLook(t.rw, S) }, t.rw === "rw" ? "reads + writes" : t.rw === "w" ? "writes" : "reads")));
    /* leftovers piece 4 — how this table was found: the map's access edge, the steps of a route, or both.
       D-017 (2026-09-20): a fact about the MAP, not about the table — hidden unless "more information" is on. The switch has no control yet; it is built with the display step. */
    if (t.found && window.MOREINFO) row("found by", ico("link", 14, "var(--muted)"),
      E("span", { class: "v" }, esc(t.found === "both" ? "the map's edge and a route's steps" : t.found === "map edge" ? "the map's edge only" : "a route's steps only")),
      card({ title: "found by", icon: "link", sub: t.found,
        rows: [["the map's access edge", t.found === "route effects" ? "does not carry this table" : "carries it"], ["the steps of a route", t.found === "map edge" ? "none touches it" : "touch it"]]
          .concat(t.found_why ? [["why", t.found_why]] : []),
        plain: "the source that says this endpoint touches the table" }));
    var list = E("div", { class: "flds rctab", style: "--ec:" + ec });
    list.append(E("div", { class: "rcth" },
      E("span", { class: "c-f" }, "fields", E("i", { class: "rcfp", style: pillLook("fields", S) }, String(t.cols.length))),
      E("span", { class: "c-k" }, "foreign keys"), E("span", { class: "c-t" }, "data type")));
    t.cols.forEach(function(c){ var tc = typeOf(c[1]), isFk = fkSet[c[0]], isUq = uqSet[c[0]];
      var f = E("div", { class: "fld" + (isFk ? " fk" : "") + (isUq ? " uq" : "") },
        E("span", { class: "c-f" }, sqNode(c, t, S, (isFk ? "fk" : "") + (isUq ? " uq" : "")), E("span", { class: "fn" }, esc(c[0]))),
        E("span", { class: "c-k" }, fkMarks(t, c[0])),
        E("span", { class: "c-t ft" }, esc(c[1] || "—")));
      bind(f, card({ title: c[0], sub: String(c[1] || "—"), icon: isFk ? "key" : "table", color: tc.col(S),
        rows: [["kind", tc.word + " — " + tc.plain], ["in", t.table],
               isFk ? ["points at", "→ " + (isFk === true ? "another table" : isFk)] : null,
               fkIn(t, c[0]).length ? ["pointed at by", fkIn(t, c[0]).join(" · ") + " — among the tables this endpoint touches"] : null,
               isUq ? ["unique", "the DB refuses a second row with this value"] : null].concat(columnRuleRows(t, c[0])) }));
      f.dataset.col = c[0];
      list.append(f); });
    b.append(list);
    if (t.cols_more) b.append(E("div", { class: "ptsec" }, "+" + t.cols_more + " more the feed did not carry"));
    box.append(b);
    COV.mark("PAYLOAD", "data");
  }
  /* ── THE SHAPE — the table as the graph draws it: the drum, and every field a cell under it. The
     square room is used for SIZE, so a wide table looks wide and a deep one deep. ── */
  function dataShape(box, F, S){
    var t = selTable(F);
    if (!t) { ptIdle(box, "it is drawn here as the graph draws it — the drum, with every field a cell beneath it."); return; }
    var ec = t.entity_color || "#888";
    var fkSet = {}; (t.fks || []).forEach(function(f){ fkSet[Array.isArray(f) ? f[0] : f] = (Array.isArray(f) && f[1]) ? f[1] : true; });
    var uqSet = {}; (t.uqs || []).forEach(function(u){ (Array.isArray(u) ? u : [u]).forEach(function(c){ uqSet[c] = 1; }); });
    var b = tg(E("div", { class: "ptbody shp" }), "tables-touched");
    var drum = E("div", { class: "shdrum" }, ico("model", 58, ec), E("b", null, esc(t.table)),
      E("span", null, esc(t.entity || "—") + " · " + t.cols.length + " fields"));
    bind(drum, card({ title: t.table, icon: "model", color: ec, sub: "the graph's own model glyph",
      rows: [["entity", t.entity || "—"], ["class", t.model], ["channel", t.rw === "rw" ? "read + write" : t.rw === "w" ? "write" : "read", RWC[t.rw]]],
      body: "this is the node you would click in the universe graph." }));
    b.append(drum);
    var grid = E("div", { class: "shgrid" });
    t.cols.forEach(function(c){ var tc = typeOf(c[1]), isFk = fkSet[c[0]], isUq = uqSet[c[0]];
      var cell = E("div", { class: "shcell" + (isOpt(c[1]) ? " opt" : "") + (isFk ? " fk" : "") + (isUq ? " uq" : ""),
        style: "--fc:" + tc.col(S) },
        E("i", { class: "shsw" }), E("span", { class: "fn" }, esc(c[0])), fkMarks(t, c[0]), E("span", { class: "ft" }, esc(c[1] || "—")));
      bind(cell, card({ title: c[0], sub: String(c[1] || "—"), icon: isFk ? "key" : "table", color: tc.col(S),
        rows: [["kind", tc.word + " — " + tc.plain], ["in", t.table],
               isFk ? ["points at", "→ " + (isFk === true ? "another table" : isFk)] : null,
               fkIn(t, c[0]).length ? ["pointed at by", fkIn(t, c[0]).join(" · ") + " — among the tables this endpoint touches"] : null,
               isUq ? ["unique", "the DB refuses a second row with this value"] : null] }));
      grid.append(cell); });
    b.append(grid);
    if (t.cols_more) b.append(E("div", { class: "ptsec" }, "+" + t.cols_more + " more the feed did not carry"));
    box.append(b); }

  /* ── THE WHEEL — the same fields laid round the drum, so the MIX is the picture: a table that is
     mostly time reads as violet, one that is mostly keys reads teal. Drawn, never listed. ── */
  function dataWheel(box, F, S){
    var t = selTable(F);
    if (!t) { ptIdle(box, "its fields are laid in a ring around it, so what the table is MADE OF reads at a glance."); return; }
    var ec = t.entity_color || "#888", n = t.cols.length, R = 118, r0 = 62;
    var fkSet = {}; (t.fks || []).forEach(function(f){ fkSet[Array.isArray(f) ? f[0] : f] = true; });
    var uqSet = {}; (t.uqs || []).forEach(function(u){ (Array.isArray(u) ? u : [u]).forEach(function(c){ uqSet[c] = 1; }); });
    var b = tg(E("div", { class: "ptbody whl" }), "tables-touched");
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 300 300"); svg.setAttribute("class", "wsvg");
    function seg(i){ var a0 = (i / n) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2, g = 0.012;
      a0 += g; a1 -= g;
      var p = document.createElementNS(NS, "path");
      var x0 = 150 + R * Math.cos(a0), y0 = 150 + R * Math.sin(a0), x1 = 150 + R * Math.cos(a1), y1 = 150 + R * Math.sin(a1);
      var x2 = 150 + r0 * Math.cos(a1), y2 = 150 + r0 * Math.sin(a1), x3 = 150 + r0 * Math.cos(a0), y3 = 150 + r0 * Math.sin(a0);
      p.setAttribute("d", "M" + x0 + " " + y0 + "A" + R + " " + R + " 0 0 1 " + x1 + " " + y1
        + "L" + x2 + " " + y2 + "A" + r0 + " " + r0 + " 0 0 0 " + x3 + " " + y3 + "Z");
      return p; }
    t.cols.forEach(function(c, i){ var tc = typeOf(c[1]), isFk = fkSet[c[0]], isUq = uqSet[c[0]];
      var p = seg(i); p.setAttribute("fill", tc.col(S));
      p.setAttribute("fill-opacity", isOpt(c[1]) ? ".42" : ".92");
      if (isFk) { p.setAttribute("stroke", S.KINDCOL.external); p.setAttribute("stroke-width", "2"); }
      if (isUq) { p.setAttribute("stroke", S.OPC.gate); p.setAttribute("stroke-width", "1.5"); p.setAttribute("stroke-dasharray", "3 2"); }
      p.setAttribute("class", "wseg");
      bind(p, card({ title: c[0], sub: String(c[1] || "—"), icon: isFk ? "key" : "table", color: tc.col(S),
        rows: [["kind", tc.word + " — " + tc.plain], ["in", t.table], ["position", (i + 1) + " of " + n + " going clockwise from the top"],
               isOpt(c[1]) ? ["optional", "drawn paler — the column accepts None"] : null,
               isFk ? ["foreign key", "ringed in the external colour"] : null,
               isUq ? ["unique", "ringed in a dashed latch"] : null] }));
      svg.append(p); });
    b.append(E("div", { class: "wwrap" }, svg, E("div", { class: "whub" }, ico("model", 42, ec),
      E("b", null, String(n)), E("span", null, "fields"))));
    var mix = {}; t.cols.forEach(function(c){ var k = typeOf(c[1]).key; mix[k] = (mix[k] || 0) + 1; });
    b.append(E("div", { class: "wlgd" }, TYPEC.filter(function(x){ return mix[x.key]; }).map(function(x){
      var w = E("span", { class: "lg" }, E("i", { class: "sw", style: "background:" + x.col(S) }), x.word + " " + mix[x.key]);
      bind(w, card({ title: x.word, sub: mix[x.key] + " of " + n + " fields in " + t.table, body: x.plain })); return w; })));
    b.append(E("div", { class: "ptsec" }, esc(t.table) + " · " + esc(t.entity || "—")));
    box.append(b); }

  /* ── THE KEYS — what this table points at, and what points back. Outbound comes from the feed's own
     fks; inbound is DERIVED by reading every other table's fks, so it is exact for the tables this door
     touches and says so for the rest of the database, which the feed does not carry. ── */
  function dataKeys(box, F, S){
    var D = F.data, t = selTable(F);
    if (!t) { ptIdle(box, "what it points at and what points back is drawn here."); return; }
    var ec = t.entity_color || "#888";
    var out = (t.fks || []).map(function(f){ return Array.isArray(f) ? { col: f[0], to: f[1] } : { col: f, to: null }; });
    var inb = [];
    D.tables.forEach(function(o){ if (o.table === t.table) return;
      (o.fks || []).forEach(function(f){ var col = Array.isArray(f) ? f[0] : f, to = Array.isArray(f) ? f[1] : null;
        if (to && String(to).split(".")[0] === t.table) inb.push({ from: o.table, col: col, ec: o.entity_color, ent: o.entity }); }); });
    var b = tg(E("div", { class: "ptbody keys" }), "tables-touched");
    b.append(E("div", { class: "kcentre" }, ico("model", 34, ec), E("b", null, esc(t.table)),
      E("span", null, (t.uqs || []).length + " unique · " + out.length + " out · " + inb.length + " in")));
    function lane(title, rows, empty){
      b.append(E("div", { class: "ptsec" }, title));
      if (!rows.length) { b.append(E("div", { class: "kempty" }, empty)); return; }
      rows.forEach(function(r){ b.append(r); }); }
    lane("points at", out.map(function(o){
      var row = E("div", { class: "krow out" }, ico("key", 13, S.KINDCOL.external),
        E("span", { class: "kc" }, esc(o.col)), E("span", { class: "ka" }, "→"), E("span", { class: "kt" }, esc(o.to || "another table")));
      bind(row, card({ title: o.col, icon: "key", color: S.KINDCOL.external, sub: "a foreign key out of " + t.table,
        rows: [["points at", o.to || "another table — the feed did not carry which"],
               ["means", "a row here leans on a row there; deleting that one breaks this"]] }));
      return row; }), "this table points at nothing — it stands on its own");
    lane("pointed at by", inb.map(function(o){
      var row = E("div", { class: "krow in", style: "--ec:" + (o.ec || "#888") }, ico("key", 13, o.ec || "#888"),
        E("span", { class: "kt" }, esc(o.from)), E("span", { class: "ka" }, "→"), E("span", { class: "kc" }, esc(o.col)));
      bind(row, card({ title: o.from, icon: "model", color: o.ec, sub: "entity " + o.ent,
        rows: [["through", o.col], ["means", "that table leans on this one"],
               ["measured over", "the " + D.tables.length + " tables THIS ENDPOINT touches — the rest of the database is not in the feed"]] }));
      return row; }), "no table this endpoint touches points back — the rest of the database is not in the feed, so this is a floor, not a fact about the whole schema");
    lane("unique", (t.uqs || []).map(function(u){
      var cols = Array.isArray(u) ? u : [u];
      var row = E("div", { class: "krow uq" }, ico("key", 13, S.OPC.gate), E("span", { class: "kc" }, cols.join(" + ")));
      bind(row, card({ title: cols.join(" + "), icon: "key", color: S.OPC.gate, sub: "a unique latch",
        rows: [["means", cols.length > 1 ? "no two rows may share this COMBINATION" : "no two rows may share this value"]] }));
      return row; }), "nothing is latched unique on this table");
    box.append(b); }

  window.DATAPORTRAIT = dataPortrait;

  /* ══ DATA · THE CHANNEL (operator 2026-09-12) ═══════════════════════════════════════════════════
     An OP is one table on one channel. The operator asked what the title's "24 ops · 13 tables" meant:
     this door reads 13 tables and writes 11 of them, and 13 + 11 = 24. Two tables are read and never
     written; eleven are read AND written; none is written without being read. The four buttons in the
     panel's title row are that partition, and their counts make the arithmetic visible before a click.
     EXCLUSIVE by design — "only write" means written and not read, so a zero is a MEASUREMENT (law G),
     not a gap, and the empty state says so rather than looking broken. ══ */
  var CHAN = [
    { key: "w", word: "written only", icon: "key", col: function(S){ return S.RW.w; },
      plain: "tables this endpoint writes and never reads — it puts data there and never looks" },
    { key: "r", word: "read only", icon: "doc", col: function(S){ return S.RW.r; },
      plain: "tables this endpoint reads and never writes — it needs them to answer, it never changes them" },
    { key: "rw", word: "both", icon: "merge", col: function(S){ return S.RW.rw; },
      plain: "tables this endpoint both reads and writes — where a read and a write meet on one table" } ];
  /* THE CHANNELS ARE APPENDABLE (operator 2026-09-12): three independent switches, not four exclusive
     buttons. All three on IS "every table" — the old fourth button said nothing the other three did not,
     so it is gone. None on is allowed and draws the measurement, because refusing the click would hide
     a state the operator asked for. */
  function chanSet(){ var c = (window.DATACFG || {}).chan; return c || { w: 1, r: 1, rw: 1 }; }
  function chanOn(k){ return !!chanSet()[k]; }
  function chanWords(){ var on = CHAN.filter(function(c){ return chanOn(c.key); });
    return on.length === CHAN.length ? "every table this endpoint touches"
      : on.length ? on.map(function(c){ return c.word; }).join(" + ") : "no channel is switched on"; }
  function chanDef(k){ return CHAN.filter(function(c){ return c.key === k; })[0] || CHAN[0]; }
  /* every DATA distribution draws THIS list — the filter is the panel's, not one layout's */
  function dtables(D){ return D.tables.filter(function(t){ return chanOn(t.rw); }); }
  window.DTABLES = dtables;
  function opsOf(ts){ return ts.reduce(function(n, t){ return n + (t.rw === "rw" ? 2 : 1); }, 0); }
  function colsOf(ts){ return ts.reduce(function(n, t){ return n + t.cols.length; }, 0); }
  /* the count chip on the DATA title. The OPS half is OPTIONAL (operator 2026-09-12: the arithmetic is
     implicit in the channels, and saying it twice confused more than it explained) — the card still
     carries the definition for whoever wants it. */
  function opsCard(D, ts, S){
    var rd = D.tables.filter(function(t){ return t.rw !== "w"; }).length, wr = D.tables.filter(function(t){ return t.rw !== "r"; }).length;
    return card({ title: "what the title counts", icon: "model", color: S.KINDCOL.model,
      sub: ts.length + " of " + D.tables.length + " tables · " + colsOf(ts) + " of " + colsOf(D.tables) + " fields · one op = one table on one channel",
      rows: [["read ops", rd + " — the tables this endpoint reads", RWC.r],
             ["write ops", wr + " — the tables it writes", RWC.w],
             ["together", rd + " + " + wr + " = " + (rd + wr) + " ops"],
             ["over", D.tables.length + " distinct tables"],
             ["shown now", ts.length + " table(s) · " + opsOf(ts) + " op(s) · " + colsOf(ts) + " fields"]],
      body: "an op is an ACCESS, not a function and not a SQL statement: the archmap records that this handler reads a table, writes it, or both. A table on BOTH channels is two ops, which is why 13 tables come to 24." }); }
  /* the four filter buttons, in the panel's own title row, on the right (operator 2026-09-12) */
  function chanBar(D, S){
    var w = E("div", { class: "chbar" });
    CHAN.forEach(function(c){ var ts = D.tables.filter(function(t){ return t.rw === c.key; }), on = chanOn(c.key);
      var b = E("button", { class: "chb" + (on ? " on" : "") + (ts.length ? "" : " zero") });
      b.dataset.chan = c.key; b.dataset.on = on ? "1" : "0";
      b.innerHTML = ico(c.icon, 13, c.col(S)) + '<span class="chn">' + ts.length + '</span>';
      bind(b, card({ title: c.word, icon: c.icon, color: c.col(S),
        sub: ts.length + " of " + D.tables.length + " tables · " + colsOf(ts) + " fields · " + (on ? "ON" : "off"),
        rows: [["what it keeps", c.plain],
               ["click", on ? "switches this channel off, leaving the others as they are" : "adds this channel to what is already shown"],
               ts.length ? null : ["measured zero", "no table matches — this is what the feed says, not a gap in it"]],
        body: "the three switches are independent: any combination is legal, and all three on IS every table." }));
      b.onclick = function(ev){ ev.stopPropagation(); var st = window.DATACFG.chan;
        st[c.key] = st[c.key] ? 0 : 1;
        window.showTab("data"); if (window.drawDataCfg) window.drawDataCfg(); };
      w.append(b); });
    return w; }
  /* ══ SORT (operator 2026-09-13) — how the tables are laid out, chosen from the title row after a divider.
     Four orders plus a turn-around; every order breaks its ties by name, so the same settings always give
     the same picture. Blocks and Fields read it; the other distributions keep their own order. ══ */
  function SVGI(d, z){ return '<svg viewBox="0 0 24 24" width="' + (z || 13) + '" height="' + (z || 13) + '" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + d + "</svg>"; }
  var SORTS = [
    { key: "channel", word: "channel", d: '<path d="M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4"/>',
      plain: "tables the endpoint writes come first, then the ones it only reads — ties by size",
      cmp: function(a, b){ return (a.rw === "r") - (b.rw === "r") || b.cols.length - a.cols.length || a.table.localeCompare(b.table); } },
    { key: "size", word: "size", d: '<path d="M4 6h16M4 12h11M4 18h6"/>', plain: "the table with the most fields first",
      cmp: function(a, b){ return b.cols.length - a.cols.length || a.table.localeCompare(b.table); } },
    { key: "name", word: "name", d: '<path d="M3 18 7 6l4 12M4.5 14h5"/><path d="M14 6h6l-6 12h6"/>', plain: "alphabetical by table name",
      cmp: function(a, b){ return a.table.localeCompare(b.table); } },
    { key: "entity", word: "entity", d: null, plain: "grouped by the entity that claims each table, then by size",
      cmp: function(a, b){ return (a.entity || "").localeCompare(b.entity || "") || b.cols.length - a.cols.length || a.table.localeCompare(b.table); } } ];
  window.SORTICON = function(k, z){
    if (k === "rev-off") return SVGI('<path d="M12 5v14M6 13l6 6 6-6"/>', z);
    if (k === "rev-on") return SVGI('<path d="M12 19V5M6 11l6-6 6 6"/>', z);
    var o = SORTS.filter(function(x){ return x.key === k; })[0]; if (!o) return "";
    return o.d ? SVGI(o.d, z) : ico("entity", z || 13, "currentColor"); };
  function sortCfg(){ var c = window.DATACFG || {}; return { key: c.sort || "channel", rev: !!c.sortRev }; }
  function sortTables(ts){ var c = sortCfg(), o = SORTS.filter(function(x){ return x.key === c.key; })[0] || SORTS[0];
    var out = ts.slice().sort(o.cmp); return c.rev ? out.reverse() : out; }
  window.SORTTABLES = sortTables;
  function sortBar(){ var c = sortCfg(), w = E("div", { class: "sortbar" });
    SORTS.forEach(function(o){ var on = c.key === o.key;
      var b = E("button", { class: "srb" + (on ? " on" : ""), "data-sort": o.key });
      b.innerHTML = '<span class="sri">' + window.SORTICON(o.key, 13) + '</span><span class="srw">' + o.word + "</span>";
      bind(b, function(){ return window.hcard({ title: "sort by " + o.word, value: on ? (c.rev ? "on · reversed" : "on") : "off", icon: "layers",
        rows: [["order", o.plain], ["applies to", "the Blocks and Fields distributions"],
               ["click", on ? "already the order — the arrow beside it turns it around" : "lays the tables out this way"]],
        plain: "the order the tables are laid out in" }); });
      b.onclick = function(ev){ ev.stopPropagation(); window.DATACFG.sort = o.key; window.showTab("data"); if (window.drawDataCfg) window.drawDataCfg(); };
      w.append(b); });
    var r = E("button", { class: "srb rev" + (c.rev ? " on" : ""), "data-sort-rev": c.rev ? "1" : "0" });
    r.innerHTML = '<span class="sri">' + window.SORTICON(c.rev ? "rev-on" : "rev-off", 13) + '</span><span class="srw">' + (c.rev ? "reversed" : "as named") + "</span>";
    bind(r, function(){ return window.hcard({ title: c.rev ? "reversed" : "as named", value: "direction", icon: "layers",
      rows: [["now", c.rev ? "the order is turned around" : "the order reads as its name says"], ["click", "turns it around"]],
      plain: "which end of the order comes first" }); });
    r.onclick = function(ev){ ev.stopPropagation(); window.DATACFG.sortRev = window.DATACFG.sortRev ? 0 : 1; window.showTab("data"); if (window.drawDataCfg) window.drawDataCfg(); };
    w.append(r);
    return w; }

  /* ONE head for every DATA distribution: the title, the ops count (hoverable — it finally says what an
     op is), and the channel bar on the right of that same row. */
  /* THE TITLE COUNTS WHAT IS SHOWN (operator 2026-09-12): how many tables and how many FIELDS, both
     moving with the channel switches. Each can be a word or an icon, or go. */
  var DCOUNT = [
    { key: "tables", icon: "model", word: function(n){ return n + " table" + (n === 1 ? "" : "s"); },
      get: function(ts){ return ts.length; }, plain: "how many tables the channels you left on are showing" },
    { key: "fields", icon: "table", word: function(n){ return n + " field" + (n === 1 ? "" : "s"); },
      get: function(ts){ return colsOf(ts); }, plain: "how many columns those tables hold, added up" },
    { key: "ops", icon: "role", word: function(n){ return n + " op" + (n === 1 ? "" : "s"); },
      get: function(ts){ return opsOf(ts); }, plain: "one op is one table on one channel — a table on both is two" } ];
  function countMode(k){ var c = (window.DATACFG || {}).counts;
    if (typeof c === "string") return k === "tables" ? "word" : k === "ops" && c === "ops" ? "word" : "off";  /* the old string form */
    return (c || {})[k] || "off"; }
  /* THE COUNT PILLS (operator 2026-09-12/13): one pill or a pill each. Their COLOUR is three separate
     dials — the text, the ground, and how opaque the ground is — because the old single rule only moved
     the TEXT, and the station paints the chip's ground solid accent: accent text on an accent chip
     vanished, quiet text on it barely showed. Every pill carries its count's kind colour as `--k`, so
     "by what it counts" is pure CSS and a dragged opacity bar never has to redraw the panel. */
  function kindColOf(c, S){ return c.key === "tables" ? S.KINDCOL.model : c.key === "fields" ? S.KINDCOL.schema : S.OPC.call; }
  function dcountPills(ts, S, D){
    var cfg = window.DATACFG || {}, split = cfg.countPills === "each";
    var live = DCOUNT.filter(function(c){ return countMode(c.key) !== "off"; });
    if (!live.length) return null;
    /* a count is a NODE now, so each one can carry its own card; a word sits in .dct so it can be trimmed
       to its cap height like a number is (the pill text sat ~2px high: the line box added descender space) */
    function span(c){ var m = countMode(c.key), n = c.get(ts);
      var sp = E("span", { class: "dcn", "data-count": c.key });
      sp.style.setProperty("--k", kindColOf(c, S));
      sp.innerHTML = m === "icon" ? ico(c.icon, 13, "currentColor") + "<b>" + n + "</b>" : '<span class="dct">' + esc(c.word(n)) + "</span>";
      return sp; }
    var wrap = E("div", { class: "dcnts" + (split ? " each" : " one") });
    if (split) { live.forEach(function(c){
        var pill = E("span", { class: "cnt dcp", "data-pill": c.key }); pill.style.setProperty("--k", kindColOf(c, S));
        pill.append(span(c)); bind(pill, function(){ return pillCard(c.key, ts, D, S); }); wrap.append(pill); }); }
    else { var pill = E("span", { class: "cnt dcp", "data-pill": "all" });
      live.forEach(function(c, i){ if (i) pill.insertAdjacentHTML("beforeend", '<i class="dcsep">·</i>');
        var sp = span(c); bind(sp, function(){ return pillCard(c.key, ts, D, S); }); pill.append(sp); });
      wrap.append(pill); }
    return wrap; }
  /* THE PILL CARDS (operator 2026-09-13) — the head bar's hover law, the one the Conflict and Declares cards
     follow: the thing and its value · the factors that make it, as a list · this pill's own facts · the
     plain line, said once, at the end. Certainties only; every number counts what is SHOWN. */
  function pillCard(key, ts, D, S){ var H = window.hcard; if (!H) return opsCard(D, ts, S);
    var ents = {}; ts.forEach(function(t){ var e = t.entity || "—"; ents[e] = (ents[e] || 0) + 1; });
    var entLine = Object.keys(ents).sort(function(a, b){ return ents[b] - ents[a] || a.localeCompare(b); })
      .map(function(k){ return k + " " + ents[k]; }).join(" · ");
    if (key === "tables") {
      var big = ts.slice().sort(function(a, b){ return b.cols.length - a.cols.length; })[0];
      return H({ title: "tables", value: ts.length + " of " + D.tables.length, icon: "model", color: S.KINDCOL.model,
        factors: CHAN.map(function(c){ var n = D.tables.filter(function(t){ return t.rw === c.key; }).length, on = chanOn(c.key);
          return { state: on && n ? "ok" : "quiet", name: c.word, value: n + " table" + (n === 1 ? "" : "s") + (on ? "" : " · switched off"),
                   rule: c.plain, note: n === 0 ? "a measured zero — the feed records no table on this channel" : null }; }),
        factorLabel: "the three channels · a filled dot is switched on and holds tables",
        rows: [["by entity", entLine || "—"], big ? ["largest", big.table + " · " + big.cols.length + " fields"] : null].filter(Boolean),
        plain: "the tables this endpoint reads or writes — each one a place its data lives" }); }
    if (key === "fields") {
      var mix = {}, opt = 0, fk = 0, uq = 0;
      ts.forEach(function(t){
        t.cols.forEach(function(c){ var k = typeOf(c[1]).key; mix[k] = (mix[k] || 0) + 1; if (isOpt(c[1])) opt++; });
        fk += (t.fks || []).length;
        (t.uqs || []).forEach(function(u){ uq += Array.isArray(u) ? u.length : 1; }); });
      return H({ title: "fields", value: String(colsOf(ts)), icon: "table", color: S.KINDCOL.schema,
        factors: TYPEC.filter(function(x){ return mix[x.key]; }).map(function(x){
          return { state: "info", name: x.word, value: mix[x.key] + " field" + (mix[x.key] === 1 ? "" : "s"), rule: x.plain }; }),
        factorLabel: "what the fields are made of · read from each column's declared type",
        rows: [["optional", opt + " accept None"], ["foreign keys", fk + " point at another table"],
               ["unique", uq + " column" + (uq === 1 ? "" : "s") + " latched unique"],
               ["across", ts.length + " table" + (ts.length === 1 ? "" : "s")]],
        plain: "the columns inside those tables — the pieces of data each row carries" }); }
    var rd = ts.filter(function(t){ return t.rw !== "w"; }).length, wr = ts.filter(function(t){ return t.rw !== "r"; }).length,
        both = ts.filter(function(t){ return t.rw === "rw"; }).length;
    return H({ title: "ops", value: String(rd + wr), icon: "role", color: S.OPC.call,
      factors: [{ state: "info", name: "read ops", value: String(rd), rule: "one for every table the endpoint reads" },
                { state: "info", name: "write ops", value: String(wr), rule: "one for every table the endpoint writes" }],
      factorLabel: "what adds up to " + (rd + wr),
      rows: [["both channels", both + " table" + (both === 1 ? "" : "s") + " — two ops each"],
             ["commit", D.commits ? "one transaction makes the " + wr + " write" + (wr === 1 ? "" : "s") + " permanent" : "none — this endpoint only reads"]],
      plain: "one op is one table on one channel — a read or a write the endpoint performs" }); }
  window.PILLCARD = pillCard;
  function dhead(box, F, D, ts, icon, note){
    var h = head(box, icon || "table", "Data", "—", note);
    var sh = h.querySelector(".sechd");
    if (sh) { var cnt = sh.querySelector(".cnt"); if (cnt) cnt.remove();
      var pills = dcountPills(ts, S, D); if (pills) sh.append(pills);
      sh.append(chanBar(D, S));
      /* a divider, then the sort — only where the tables are one flat list the sort can order */
      var lv = window.PANELVAR ? window.PANELVAR("data") : null;
      if (lv === "blocks" || lv === "fields") { sh.append(E("i", { class: "chdiv", "aria-hidden": "true" })); sh.append(sortBar()); } }
    return h; }
  /* an empty result is a RESULT — say what was measured instead of drawing nothing */
  function chanEmpty(box, D, S){
    var on = CHAN.filter(function(c){ return chanOn(c.key); });
    box.append(E("div", { class: "pempty" }, ico("table", 15, "var(--muted)"),
      E("b", null, on.length ? "no table is " + on.map(function(c){ return c.word; }).join(" or ") : "no channel is switched on"),
      E("span", null, on.length
        ? "of the " + D.tables.length + " tables this endpoint touches, none sits on the channel(s) you left on. Each button carried its count before you clicked it — this is the measurement, not a gap."
        : "all three switches are off, so there is nothing to draw. Switch one on in the title row, or in the rail.")));
    return box; }

  /* ── FUNCTIONS · B "chain" — the walk as ONE horizontal spine; the level you pick opens below ── */
  function renderFnChain(box, F, S){
    var FN = F.functions, h = FN.handler, RC = S.BADGE_COL.role || {};
    head(box, "function", "Functions", FN.behind.fns + " behind",
      "the spine reads left to right in time: the handler, then each hop · click a hop to open it below · the bead runs the whole chain");
    var body = E("div", { class: "fcbody" });
    var spine = E("div", { class: "spine2" });
    var nodes = [{ name: h.name || "handler", n: 1, role: h.role, lvl: -1 }].concat(FN.walk.map(function(l, i){
      return { name: "L" + (i + 1), n: l.length, lvl: i, commits: l.filter(function(f){ return f.commits; }).length, inf: l.filter(function(f){ return f.conf === "inferred"; }).length }; }));
    var openLvl = 1, detail = E("div", { class: "fcdetail" });
    function drawDetail(i){ detail.innerHTML = "";
      var lvl = FN.walk[i] || []; detail.append(E("div", { class: "fchd" }, sechd("layers", "level " + (i + 1), lvl.length, false)));
      var lst = E("div", { class: "fclist" });
      lvl.forEach(function(f){ var chip = E("span", { class: "fchip" + (f.conf === "inferred" ? " inf" : "") + (f.god ? " god" : ""), style: "border-left-color:" + (RC[f.role] || "#8794ab") },
          E("b", null, esc(f.name)), f.lines ? E("span", { class: "ln" }, f.lines + "L") : null, f.commits ? E("i", { class: "cdot" }) : null);
        chip.dataset.fn = f.name; tg(chip, doesIds(F, String(f.id || "").replace("#", "::")));
        bind(chip, card({ title: f.name, icon: "function", color: RC[f.role] || S.KINDCOL["function"], sub: (f.role || "—") + " · " + (f.entity || "—") + " · " + f.conf + " hop",
          rows: [["file", f.file], ["lines", f.lines != null ? String(f.lines) : "—"], ["reached by", f.via || h.name], ["commits", f.commits ? "yes" : "no"],
                 f.ops && f.ops.length ? ["tables", f.ops.map(function(o){ return o.rw + ":" + o.table; }).join(" · ")] : null], station: f.id }));
        lst.append(chip); });
      detail.append(lst); }
    nodes.forEach(function(nd, i){
      var el = E("button", { class: "snode" + (nd.lvl === openLvl ? " on" : "") + (nd.lvl < 0 ? " root" : "") },
        E("b", null, esc(nd.name)), E("span", { class: "sn" }, String(nd.n)),
        nd.commits ? E("i", { class: "cdot" }) : null);
      if (nd.lvl < 0) { el.dataset.fn = h.name || ""; tg(el, doesIds(F, String(h.id || "").replace("#", "::"), true).concat(["signature"])); }
      else tg(el, "functions-behind-walk-levels");
      if (nd.lvl >= 0) { el.onclick = function(ev){ ev.stopPropagation(); openLvl = nd.lvl; [].forEach.call(spine.querySelectorAll(".snode"), function(x){ x.classList.remove("on"); }); el.classList.add("on"); drawDetail(nd.lvl); }; }
      bind(el, nd.lvl < 0
        ? card({ title: h.name, icon: "function", color: S.KINDCOL["function"], sub: "the handler · " + (h.role || "—"),
            rows: [["body", ((F.identity.sig || {}).lines || "?") + " lines"], ["returns", (F.identity.sig || {}).returns || "—"], ["docstring", F.identity.doc ? "present" : "— none"]], body: "<code>" + esc(F.identity.gsig || "") + "</code>" })
        : card({ title: "hop " + (nd.lvl + 1), icon: "layers", sub: nd.n + " function(s)", rows: [["inferred", String(nd.inf)], ["commit here", String(nd.commits)]], body: "click to open this hop below." }));
      spine.append(el);
      if (i < nodes.length - 1) spine.append(E("i", { class: "sarr", html: ico("drill", 13, "var(--muted)") })); });
    spine.append(E("i", { class: "bead" }));
    body.append(spine); drawDetail(openLvl); body.append(detail); box.append(body);
    var foot = E("div", { class: "pfoot" });
    foot.append(E("div", { class: "kv" }, ico("layers", 13), E("span", { class: "k" }, "code behind"), E("span", { class: "v" }, FN.behind.fns + " behind · reach " + FN.behind.depth + " · the walk sees " + FN.walk_total)));
    foot.append(legend([{ t: "accessor", swatch: "background:" + (RC.accessor || "#ef4444") }, { t: "caller", swatch: "background:" + (RC.caller || "#3b82f6") },
      { t: "gate", swatch: "background:" + (RC.gate || "#eab308") }, { t: "commits", swatch: "background:" + S.OPC.write + ";border-radius:50%;width:7px;height:7px" }]));
    box.append(foot);
    COV.mark("CODE BEHIND", "functions"); COV.mark("SIGNATURE", "functions"); COV.mark("DOCSTRING", "functions");
  }

  /* ── FUNCTIONS · C "ledger" — one row per function in the walk, every column the feed knows ── */
  function renderFnLedger(box, F, S){
    var FN = F.functions, RC = S.BADGE_COL.role || {}, all = [];
    FN.walk.forEach(function(l, i){ l.forEach(function(f){ all.push(dictLevel(f, i + 1)); }); });
    function dictLevel(f, lv){ f = Object.assign({}, f); f.__lv = lv; return f; }
    head(box, "function", "Functions", FN.behind.fns + " behind",
      "every function the walk reaches, one per row · hop · role · size · confidence · whether it ends a transaction · what it touches");
    var body = E("div", { class: "lbody" });
    var hrow = E("div", { class: "lschm" }, ico("function", 13, S.KINDCOL["function"]), E("b", null, esc(FN.handler.name)),
      E("span", { class: "ls" }, "the handler · " + (FN.handler.role || "—") + " · " + ((F.identity.sig || {}).lines || "?") + " lines · → " + ((F.identity.sig || {}).returns || "—") + " · " + (F.identity.doc ? "documented" : "no docstring")));
    hrow.dataset.fn = FN.handler.name; tg(hrow, doesIds(F, String(FN.handler.id || "").replace("#", "::"), true).concat(["signature"]));
    bind(hrow, card({ title: FN.handler.name, icon: "function", color: S.KINDCOL["function"], sub: "the handler", body: "<code>" + esc(F.identity.gsig || "") + "</code>" }));
    body.append(hrow);
    var rows = all.map(function(f){
      return { cls: f.conf === "inferred" ? "inf" : "", fa: doesIds(F, String(f.id || "").replace("#", "::")).concat(["functions-behind-walk-levels"]), tag: { fn: f.name }, cells: ["L" + f.__lv, "<b>" + esc(f.name) + "</b>",
          '<i class="rdot" style="background:' + (RC[f.role] || "#8794ab") + '"></i>' + esc(f.role || "—"),
          f.lines != null ? f.lines + "L" : "—", f.conf === "inferred" ? '<span class="ttag inferred">inferred</span>' : '<span class="ttag structural">extracted</span>',
          f.commits ? '<i class="cdot"></i>' : "—", esc((f.ops || []).map(function(o){ return o.rw + ":" + o.table; }).join(" · ") || "—")],
        card: card({ title: f.name, icon: "function", color: RC[f.role] || S.KINDCOL["function"], sub: (f.role || "—") + " · hop " + f.__lv + " · " + f.conf,
          rows: [["file", f.file], ["reached by", f.via || FN.handler.name], ["god", f.god ? "yes — over the 50-line flag" : "no"]], station: f.id }) }; });
    ledger(body, ["hop", "function", "role", "size", "how sure", "commit", "tables"], rows, { grid: "44px 1fr 116px 52px 92px 56px 1.2fr" });
    box.append(body);
    var foot = E("div", { class: "pfoot" });
    foot.append(E("div", { class: "kv" }, ico("layers", 13), E("span", { class: "k" }, "code behind"), E("span", { class: "v" }, FN.behind.fns + " behind · reach " + FN.behind.depth + " · " + FN.walk_total + " on the walk · " + FN.behind.names.length + " named")));
    box.append(foot);
    COV.mark("CODE BEHIND", "functions"); COV.mark("SIGNATURE", "functions"); COV.mark("DOCSTRING", "functions");
  }

  /* ── TESTS · B "ledger" — every case as a row; the journeys ride a compact strip beside ── */
  function renderTestsLedger(box, F, S){
    var T = F.tests;
    head(box, "test", "Tests", T.cases.length + " + " + T.case_files.length + " file",
      "every case, one per row · the status its NAME asserts · its corpus · its state — sorted by status");
    var body = E("div", { class: "tlbody" });
    var left = E("div", { class: "lbody" });
    var rows = T.cases.slice().sort(function(a, b){ return (a.status || "zzz").localeCompare(b.status || "zzz") || a.cid.localeCompare(b.cid); }).map(function(c){
      return { fa: "cases", tag: { "case": c.cid }, cells: ["<b>" + esc(c.cid) + "</b>", c.status ? '<span class="stc" style="color:' + (c.status[0] === "2" ? S.OPC.read : c.status[0] === "4" ? S.OPC.gate : S.OPC.write) + '">' + c.status + "</span>" : "—",
          esc(c.corpus || "api"), '<span class="pchip st-' + (c.state || "unknown") + '">' + ico(c.state === "pass" ? "test" : "info", 11) + (c.state || "unknown") + "</span>", esc(c.name || "—")],
        card: card({ title: c.cid, icon: "test", sub: (c.corpus || "api") + " · " + (c.state || "unknown"), rows: [["name", c.name || "—"], ["asserts", c.status ? "HTTP " + c.status : "no status in the name"]] }) }; });
    T.case_files.forEach(function(f){ rows.push({ cls: "filecov", cells: ["<b>" + esc(f.name) + "</b>", "—", esc(f.corpus || "web"), '<span class="pchip filecov">' + ico("file", 11) + "file coverage</span>", "reaches the endpoint, names no case"],
      card: card({ title: f.name, icon: "file", sub: "file coverage", body: "measured but not attributed — the web corpus tests the screen, not the endpoint by name." }) }); });
    ledger(left, ["case", "status", "corpus", "state", "name"], rows, { grid: "78px 58px 62px 106px 1fr" });
    body.append(left);
    var jr = E("div", { class: "jrn" });
    jr.append(E("div", { class: "jhd" }, sechd("journey", "Journeys", T.journeys.length + (T.journeys_more ? "+" + T.journeys_more : ""), false)));
    var jl = E("div", { class: "jlist" });
    T.journeys.forEach(function(j){
      var row = E("div", { class: "jmeta" + (/^C\d/.test(j.cid) ? "" : " jagg") }, E("span", { class: "jcid" }, esc(j.cid)), E("span", { class: "corp" }, esc(j.corpus)), E("span", { class: "ncomp" }, (j.comp || 0) + " comp"));
      var faces = E("div", { class: "jfaces" });
      (j.entities || []).forEach(function(ent){ var hh = 0; for (var i = 0; i < ent.length; i++) hh = (hh * 31 + ent.charCodeAt(i)) >>> 0;
        faces.append(E("span", { class: "face" + (ent === F.identity.entity ? " fhome" : ""), title: ent, style: "color:hsl(" + (hh % 360) + " 55% 62%)" }, ico("entity", 13))); });
      var cell = E("div", { class: "jcell" }, row, faces);
      bind(cell, card({ title: j.cid, icon: "journey", sub: j.corpus + " · " + (j.entities || []).length + " entities", rows: [["entities", (j.entities || []).join(" · ")]] }));
      jl.append(cell); });
    jr.append(jl); body.append(jr); box.append(body);
    var foot = E("div", { class: "pfoot" });
    if (T.workflows.length) T.workflows.forEach(function(w){ var wr = E("div", { class: "kv" }, ico("journey", 13, "var(--accent)"), E("span", { class: "k" }, "workflow"), E("span", { class: "v" }, esc(w.name) + " — step " + (w.step_index[0] + 1) + " of " + w.steps.length));
      bind(wr, card({ title: w.name, icon: "journey", sub: "curated · level " + w.level, fields: w.steps })); foot.append(tg(wr, "workflow-step")); });
    foot.append(legend([{ t: "declared " + T.declared_status, swatch: "background:" + S.OPC.read }, { t: "4xx", swatch: "background:" + S.OPC.gate }, { t: "file coverage", swatch: "background:transparent;border:1px dashed var(--muted);height:6px;width:16px" }]));
    box.append(foot);
    COV.mark("TESTS", "tests"); COV.mark("JOURNEYS", "tests");
  }

  /* ── WIDENING · B "flow" — the reach laid on ONE horizontal axis, the journey rail above ── */
  function renderWideFlow(box, F, S){
    var W = F.widening, I = F.identity, KC = S.KINDCOL;
    head(box, "globe", "Widening", (W.fetched_by.length + W.chain.reduce(function(s, l){ return s + l.length; }, 0)) + " reached",
      "left to right: the app, down through what renders what, into the endpoint — and what the answer feeds");
    var body = E("div", { class: "wfbody" });
    if (W.steps_around.length) { var rail = E("div", { class: "wrail" });
      W.steps_around.forEach(function(st){ rail.append(E("span", { class: "wrl" }, ico("journey", 12, "var(--accent)"), esc(st.workflow)));
        [[st.prev, "before"], [I.label, "here"], [st.next, "after"]].forEach(function(pair, i){ if (!pair[0]) return;
          var el = E("span", { class: "step" + (pair[1] === "here" ? " here" : "") }, ico("endpoint", 11, pair[1] === "here" ? KC.endpoint : "var(--muted)"), esc(pair[0]));
          bind(el, card({ title: pair[0], icon: "endpoint", sub: "the step " + pair[1], rows: [["workflow", st.workflow]] }));
          rail.append(tg(el, "workflow-step")); if (i < 2) rail.append(E("i", { class: "sarr", html: ico("drill", 11, "var(--muted)") })); }); });
      body.append(rail); }
    var flow = E("div", { class: "wflow" });
    var stations = [];
    W.chain.slice().reverse().forEach(function(level){ level.forEach(function(p){ stations.push({ kind: p.kind, name: p.name, sub: p.rel + " → " + p.to, col: KC[p.kind] || KC.component, id: p.id, home: p.home, feClass: p.feClass }); }); });
    W.fetched_by.forEach(function(p){ stations.push({ kind: "hook", name: p.name, sub: (p.hrole || "hook") + (p.cache ? " · cached" : ""), col: KC.hook, id: p.id, home: p.home }); });
    stations.push({ kind: "endpoint", name: I.path, sub: I.method + " · " + I.entity, col: KC.endpoint, self: true });
    stations.forEach(function(st, i){
      var el = E("div", { class: "wst" + (st.self ? " self" : ""), style: "--rc:" + st.col },
        E("span", { class: "wi", html: ico(st.kind === "endpoint" ? "endpoint" : st.kind === "route" ? "nav" : st.kind === "hook" ? "merge" : "web", 16, st.col) }),
        E("b", null, esc(st.name)), E("span", { class: "ws" }, esc(st.sub)));
      el.dataset.rung = st.name; el.dataset.rkind = st.kind; tg(el, st.self ? "method-path" : "who-fetches-it");
      bind(el, card({ title: st.name, icon: st.kind === "endpoint" ? "endpoint" : "web", color: st.col, sub: st.kind + (st.home ? " · home " + st.home : ""),
        rows: [["relation", st.sub], st.feClass ? ["class", st.feClass] : null, st.id ? ["file", String(st.id).replace(/^fe:/, "")] : null], station: st.id }));
      flow.append(el);
      if (i < stations.length - 1) flow.append(E("i", { class: "sarr", html: ico("drill", 14, "var(--muted)") })); });
    body.append(flow);
    var tail = E("div", { class: "wtail" });
    var ub = E("div", { class: "uwrap" }, sechd("merge", "Usage", ((I.usage || {}).api || 0) + ((I.usage || {}).internal || 0), false),
      E("div", { class: "ubar" }, E("div", { class: "ufill", style: "width:" + Math.min(100, (((I.usage || {}).api || 0) + ((I.usage || {}).internal || 0)) * 9) + "%" })),
      E("div", { class: "sublbl" }, ico("link", 12), ((I.usage || {}).api || 0) + " api · " + ((I.usage || {}).internal || 0) + " internal · fan-in " + I.fanin + " · entity " + I.entity + " · layer " + I.layer));
    bind(ub, card({ title: "usage", icon: "merge", sub: "in-degree", rows: [["api", String((I.usage || {}).api)], ["internal", String((I.usage || {}).internal)], ["fan-in", String(I.fanin)], ["layer", I.layer]] }));
    tail.append(ub);
    if (W.response_consumers.length) { var rc = E("div", { class: "kv" }, ico("schema", 13, KC.schema), E("span", { class: "k" }, "shared out"), E("span", { class: "v" }, W.response_consumers.length + " other endpoint(s) return " + F.data.schemas.response.name));
      bind(rc, card({ title: "the response is shared", icon: "schema", fields: W.response_consumers })); tail.append(rc); }
    body.append(tail); box.append(body);
    var foot = E("div", { class: "pfoot" });
    foot.append(legend([{ t: "the endpoint", icon: "endpoint", col: KC.endpoint }, { t: "hook", icon: "merge", col: KC.hook }, { t: "screen · route", icon: "web", col: KC.component }]));
    box.append(foot);
    COV.mark("USAGE", "widening"); COV.mark("IDENTITY", "widening"); COV.mark("CONNECTIONS", "widening");
  }

  /* ── SECURITY · B "gauntlet" — everything between the request and the answer, on one line ── */
  function renderSecGauntlet(box, F, S){
    var SEC = F.security, FW = F.feedwide;
    head(box, "key", "Security", SEC.guards.length + " deps · " + SEC.asgi.length + " app",
      "the request runs the gauntlet left to right: the app band, this endpoint's deps, the body, the commit — then the answer");
    var body = E("div", { class: "sgbody" });
    var lane = E("div", { class: "gaunt" });
    function stop(o){ var el = E("div", { class: "gst " + (o.cls || ""), style: o.col ? "--gc:" + o.col : "" },
        E("span", { class: "gi", html: ico(o.icon, 16, o.col || "var(--muted)") }), E("b", null, esc(o.title)),
        E("span", { class: "gs" }, esc(o.sub)));
      if (o.lane) el.dataset.lane = o.lane;
      if (o.dep) el.dataset.dep = o.dep;
      if (o.fa) tg(el, o.fa);
      if (o.card) bind(el, o.card); lane.append(el); return el; }
    stop({ fa: "method-path", icon: "down", title: "request", sub: F.identity.method + " " + F.identity.path, col: S.OPC.read,
      card: card({ title: "the request arrives", icon: "down", sub: F.identity.method + " " + F.identity.path, rows: [["body", (F.data.schemas.request.name || "—") + " · " + (F.data.schemas.request.cols || []).length + " fields"]] }) });
    lane.append(E("i", { class: "sarr", html: ico("drill", 13, "var(--muted)") }));
    SEC.asgi.forEach(function(m){ stop({ lane: m.name, fa: "app-band", icon: "shield", title: m.name.replace(/Middleware$/, ""), sub: "app · " + runsWord(m) + " · " + m.gates + " gated", col: S.OPC.gate, cls: "app",
      card: card({ title: m.name, icon: "shield", color: S.OPC.gate, sub: "ASGI middleware · scope " + m.scope,
        rows: [["runs", runsWord(m)], ["gates", m.gates + " of " + FW.endpoints + " endpoints"], ["file", m.file + ":" + m.line], ["tie to this endpoint", "— measured at APP scope only"]] }) });
      lane.append(E("i", { class: "sarr", html: ico("drill", 13, "var(--muted)") })); });
    SEC.guards.forEach(function(g){ stop({ dep: g.name, fa: g.gate ? ["auth-scheme-gate", "context-giving-functions"] : "context-giving-functions", icon: g.gate ? "key" : "link", title: g.name, sub: g.via + (g.gate ? " · GATE" : " · resource") + " · " + Math.round(100 * g.feedwide / FW.endpoints) + "% of endpoints" + (g.resolved ? " · resolved " + ordinal(g.resolved.order) + " of " + g.resolved.of : ""), col: g.gate ? S.OPC.gate : "var(--muted)", cls: g.gate ? "gate" : "",
      card: card({ title: g.name, icon: g.gate ? "key" : "link", color: g.gate ? S.OPC.gate : null, sub: g.via,
        rows: [["decides", g.gate ? "yes — it can refuse" : "no — it supplies"], ["feed-wide", g.feedwide + " of " + FW.endpoints], g.fn_rec ? ["function", g.fn_rec.name + " · " + (g.fn_rec.role || "—")] : null] }) });
      lane.append(E("i", { class: "sarr", html: ico("drill", 13, "var(--muted)") })); });
    stop({ icon: "function", title: "the body", sub: (F.identity.sig || {}).lines + " lines · " + F.functions.behind.fns + " behind", col: S.KINDCOL["function"],
      card: card({ title: "the handler body", icon: "function", color: S.KINDCOL["function"], rows: [["lines", String((F.identity.sig || {}).lines)], ["behind", String(F.functions.behind.fns)]] }) });
    lane.append(E("i", { class: "sarr", html: ico("drill", 13, "var(--muted)") }));
    stop({ icon: "key", title: "commit", sub: SEC.commits ? F.data.writes.length + " writes made permanent" : "no commit", col: S.OPC.write, cls: "commitst",
      card: card({ title: "the DB transaction", icon: "key", color: S.OPC.write, sub: "never a git commit", rows: [["writes", String(F.data.writes.length)], ["idempotency", SEC.idempotent ? SEC.idempotency_table : "none"]] }) });
    lane.append(E("i", { class: "sarr", html: ico("drill", 13, "var(--muted)") }));
    stop({ fa: "declared-status", icon: "up", title: "answer " + SEC.status.declared, sub: (F.data.schemas.response.name || "—") + " · " + ((F.identity.payload || {}).n || 0) + " fields", col: S.OPC.read,
      card: card({ title: "the answer", icon: "up", sub: "declared " + SEC.status.declared, rows: [["schema", F.data.schemas.response.name], ["cases assert", Object.keys(SEC.status.observed).filter(function(k){ return /^\d/.test(k); }).join(" · ")]] }) });
    body.append(lane);
    var facts = E("div", { class: "sfacts" });
    [["flag walls", SEC.walls.length ? SEC.walls.length + " wall(s)" : "none — no feature flag can close this endpoint", !SEC.walls.length, "swords"],
     ["idempotency", SEC.idempotent ? "guarded — writes " + SEC.idempotency_table : "none", !SEC.idempotent, "target"],
     ["delivery", SEC.stream ? "streams to the client" : "one response, whole — this endpoint does not stream", !SEC.stream, "wave"],
     ["status contract", "declares " + SEC.status.declared + " · the cases assert " + Object.keys(SEC.status.observed).filter(function(k){ return /^\d/.test(k); }).join(" · "), false, "info"]
    ].forEach(function(f){ var r = E("div", { class: "sfact" + (f[2] ? " hollow" : "") }, ico(f[3], 13, f[2] ? "var(--muted)" : S.OPC.gate), E("b", null, f[0]), E("span", { class: "sv" }, f[1]));
      tg(r, ({ "flag walls": "switches", idempotency: "idempotency-claim", delivery: "delivery", "status contract": "declared-status" })[f[0]]);
      bind(r, card({ title: f[0], icon: f[3], sub: f[2] ? "measured zero" : "measured", body: f[2] ? "HOLLOW means the emitter looked and found nothing — unmeasured would be hatched and would say so." : "" }));
      facts.append(r); });
    body.append(facts); box.append(body);
    var foot = E("div", { class: "pfoot" });
    foot.append(E("div", { class: "kv" }, ico("shield", 13, S.OPC.gate), E("span", { class: "k" }, "app band"), E("span", { class: "v" }, "gates " + (SEC.app_middleware || {}).gates_endpoints + " of " + FW.endpoints + " endpoints" + ((SEC.app_middleware || {}).saturated ? " — saturated: it separates nothing" : ""))));
    foot.append(legend([{ t: "gate", swatch: "background:" + S.OPC.gate }, { t: "resource dep", swatch: "background:var(--muted)" }, { t: "hollow = measured zero", swatch: "background:transparent;border:1px solid var(--line);height:9px;width:14px" }]));
    box.append(foot);
    COV.mark("GUARDS", "security"); COV.mark("DELIVERY", "security");
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════
     SCHEMAS · BLOCKS (operator 2026-09-13: "let's give it a try and redo the schemas section") — the Panel Pattern
     Book applied to a second part. The THING is a shape: the request body, the response body and every shape nested
     inside them. Its PIECES are fields, drawn with the same field marks as a table's columns. The looks the two parts
     share — pill colour, chip box/fill/size, field marks, the block edge — are READ from DATACFG, so a look set for
     Data is the look of Schemas too; what is Schemas' own lives in SCHCFG.
     ══════════════════════════════════════════════════════════════════════════════════════ */
  var SHAPEK = { key: "shape", word: "shape", col: function(S){ return S.KINDCOL.schema; }, rx: null,
    ch: "{", sym: "schema", shape: "hexagon", plain: "a whole shape inside this one — a field whose value has fields of its own" };
  /* a field's kind is read from its declared type: a type that NAMES a shape is a shape; everything else follows the
     table rule. Typing words (Any · Literal · …) are never mistaken for a shape. */
  var NOTSHAPE = /^(Any|Literal|Enum|Dict|List|Optional|Union|Annotated|Sequence|Mapping|Set|Tuple)$/;
  function schBase(t){ var b = String(t || "").replace(/\s*\|\s*None\s*$/, "").trim(), m;
    while ((m = /^(list|List|Optional|Sequence|set|Set|tuple|Tuple)\[(.*)\]$/.exec(b))) b = m[2].trim();
    return b; }
  function schIsShape(c){ var b = schBase(c[1]);
    return /^[A-Z][A-Za-z0-9_]*$/.test(b) && !NOTSHAPE.test(b) && !TYPEC.slice(0, -1).some(function(x){ return x.rx.test(b); }); }
  /* THE SCHEMA MAP (operator 2026-09-13: "build them all and have them as options to choose in the left panel") — every
     choice made when Schemas was carried over is a setting: blocks all|bodies · nested kind shape|other · direction colour
     rw|schema|neutral · looks shared|own. Detecting a nested field never changes; only how it is DRAWN does. */
  function schMap(){ var m = schCfg().map || {};
    return { blocks: m.blocks || "all", nestKind: m.nestKind || "shape", dirCol: m.dirCol || "rw", looks: m.looks || "shared" }; }
  function schKind(c){ return schIsShape(c) && schMap().nestKind === "shape" ? SHAPEK : typeOf(c[1]); }
  var SCHKINDS = TYPEC.slice(0, -1).concat([SHAPEK, TYPEC[TYPEC.length - 1]]);
  /* the two directions take the channel slot: the request travels IN (the door reads it — read green), the response
     travels OUT (the door writes it — write orange) */
  var SCHDIR = {
    in: { key: "in", word: "in", long: "the request", chip: "IN", icon: "down", col: function(S){ return S.OPC.read; },
      plain: "the body the caller sends in — the endpoint reads it" },
    out: { key: "out", word: "out", long: "the response", chip: "OUT", icon: "up", col: function(S){ return S.OPC.write; },
      plain: "the body the endpoint sends back — it writes it" } };
  function schCfg(){ return window.SCHCFG || {}; }
  function schDirOn(d){ var c = schCfg().dir || { in: 1, out: 1 }; return !!c[d]; }
  /* every shape, flat: each body, then the shapes it carries in the order its fields name them */
  var SCHS = null;
  function schShapes(F){ if (SCHS) return SCHS; var D = F.data.schemas, out = [], seq = 0;
    [["in", D.request], ["out", D.response]].forEach(function(p){ var dir = p[0], sc = p[1]; if (!sc || !sc.present) return;
      function firstVia(name){ var i = (sc.cols || []).findIndex(function(c){ return schBase(c[1]) === name; }); return i < 0 ? 999 : i; }
      out.push(shapeRec(sc, dir, null, [], seq++));
      (sc.nested || []).slice().sort(function(a, b){ return firstVia(a.name) - firstVia(b.name); }).forEach(function(n){
        out.push(shapeRec(n, dir, sc.name, (sc.cols || []).filter(function(c){ return schBase(c[1]) === n.name; }).map(function(c){ return c[0]; }), seq++)); }); });
    SCHS = out; return out; }
  function shapeRec(sc, dir, parent, via, seq){ return { name: sc.name, dir: dir, top: !parent, parent: parent, via: via, seq: seq,
    entity: sc.entity || "—", entity_color: sc.entity_color || "#888", file: sc.file, flines: sc.flines, doc: sc.doc || "",
    cols: sc.cols || [], cols_more: sc.cols_more || 0, at: sc.at || null, rules: sc.rules || null, rules_why: sc.rules_why || null, extra: sc.extra || null }; }
  function schByName(F, n){ return schShapes(F).filter(function(s){ return s.name === n; })[0] || null; }
  function schShown(F){ return schShapes(F).filter(function(s){ return schDirOn(s.dir); }); }
  function schFields(list){ return list.reduce(function(n, s){ return n + s.cols.length; }, 0); }
  function schNestN(list){ return list.reduce(function(n, s){ return n + s.cols.filter(function(c){ return schIsShape(c); }).length; }, 0); }
  window.SCHSHAPES = function(){ return schShapes(window.LABEP); };
  window.SCHKIND = function(t){ return schKind(["", t]).key; };
  /* ONE field mark, the table's own — only the colour rule's CHANNEL reads the direction here */
  function schNode(c, s, S, cls){ var tc = schKind(c), enc = sqEnc(), pal = lookCfg().sqPal || "type";
    var col = pal === "channel" ? dirCol(s.dir, S) : pal === "entity" ? s.entity_color : pal === "mono" ? "var(--muted)" : tc.col(S);
    var q = E("i", { class: "sq e-" + enc + " t-" + tc.key + (isOpt(c[1]) ? " opt" : "") + (cls ? " " + cls : "") });
    q.style.setProperty("--fc", col);
    if (enc === "char") q.textContent = tc.ch; else if (enc === "symbol") q.innerHTML = ico(tc.sym, null, "currentColor");
    return q; }
  /* where a field's shape goes — the TYPE already names it, so this says what is behind the name, never the name twice */
  function schNest(F, c){ if (!schIsShape(c)) return ""; var n = schByName(F, schBase(c[1]));
    return n ? '<span class="fkx out" data-nest="in-feed">' + ico("schema", 12, S.KINDCOL.schema) + "<span>→ " + n.cols.length + " field" + (n.cols.length === 1 ? "" : "s") + "</span></span>"
      : '<span class="fkx out nest-nf" data-nest="not-in-feed">' + ico("schema", 12, "var(--muted)") + "<span>—</span></span>"; }   /* the row's card says the feed does not carry it */

  /* the title, part by part — the block title's registry, for a shape */
  var SCHBKDEF = { form: "block", icon: 1, dir: 1, name: 1, ent: "both", count: "badge", via: "both",
    rows: [{ l: ["icon", "name"], r: [] }, { l: ["ent"], r: ["count", "dir"] }, { l: ["via"], r: [] }],
    size: { icon: 13, name: 13, ent: 12, via: 12 }, sel: "icon" };
  function schBk(){ var c = schCfg().bk || {}, o = {}; Object.keys(SCHBKDEF).forEach(function(k){ o[k] = c[k] == null ? SCHBKDEF[k] : c[k]; }); return o; }
  var SCHPART = [
    { key: "icon", word: "the shape glyph", ico: "schema", note: "the station's schema glyph — the same one the graph draws" },
    { key: "dir", word: "the direction chip", ico: "role", note: "IN · OUT — whether the shape travels in the request or the response" },
    { key: "name", word: "the shape name", ico: "doc", note: "the class that defines the shape" },
    { key: "ent", word: "the entity", ico: "entity", note: "which entity claims the file the shape lives in" },
    { key: "count", word: "the field count", ico: "info", note: "how many fields the shape holds — in words or as a badge" },
    { key: "via", word: "where it sits", ico: "link", note: "a body, or the parent shape and the field that carries it" } ];
  window.SCHPART = SCHPART;
  function schIconCol(s, S){ var ic = (lookCfg().bk || {}).iconCol || "model";
    return ic === "ink" ? "var(--ink)" : ic === "muted" ? "var(--muted)" : ic === "entity" ? s.entity_color : ic === "channel" ? dirCol(s.dir, S) : S.KINDCOL.schema; }
  /* the direction's colour is a map choice: read/write (IN green · OUT orange) · the schema colour for both · a quiet grey */
  function dirCol(d, S){ var m = schMap().dirCol; return m === "schema" ? S.KINDCOL.schema : m === "neutral" ? "#8794ab" : SCHDIR[d].col(S); }
  function dirLook(dir, S){ return chipLookOf(dirCol(dir, S)); }
  function viaWords(s){ return s.top ? (s.dir === "in" ? "request body" : "response body") : s.parent + (s.via.length ? " · " + s.via.join(", ") : ""); }
  function schPart(key, s, S, B){ var z = (B.size || {})[key] || 12;
    if (key === "icon") return B.icon ? '<span class="bki">' + ico("schema", z, schIconCol(s, S)) + "</span>" : null;
    if (key === "dir") return B.dir ? '<span class="bkrw"><i class="jdrw sdir" style="--rwc:' + dirCol(s.dir, S) + '">' + SCHDIR[s.dir].chip + "</i></span>" : null;   /* size: --rw-fs, Data's */
    if (key === "name") return B.name ? E("b", { style: "font-size:" + z + "px" }, esc(s.name)) : null;
    if (key === "ent") { if (B.ent === "off") return null;
      var e = E("span", { class: "bke", style: "color:" + s.entity_color + ";font-size:" + z + "px" });
      if (B.ent === "icon" || B.ent === "both") e.insertAdjacentHTML("beforeend", ico("entity", z, s.entity_color));
      if (B.ent === "word" || B.ent === "both") e.append(E("span", null, esc(s.entity)));
      return e; }
    if (key === "count") { if (B.count === "off") return null;
      return E("span", { class: "bkn" + (B.count === "badge" ? " badge" : "") }, B.count === "badge" ? String(s.cols.length) : s.cols.length + " fields"); }
    if (key === "via") { if (B.via === "off") return null;
      var v = E("span", { class: "bkm bkv", style: "font-size:" + z + "px" });
      if (B.via === "icon" || B.via === "both") v.insertAdjacentHTML("beforeend", ico(s.top ? SCHDIR[s.dir].icon : "link", z, "var(--muted)"));
      /* on the block the FIELD leads — the parent is the block just before it in tree order, and a cut belongs to the parent */
      if (B.via === "word" || B.via === "both") v.append(E("span", null, esc(s.top ? viaWords(s) : s.via.join(", ") + " · " + s.parent)));
      return v; }
    return null; }
  function schLines(s, S){ var B = schBk(), out = [];
    (B.rows || []).forEach(function(row){ var L = [], R = [];
      ((row && row.l) || []).forEach(function(k){ var n = schPart(k, s, S, B); if (n) L.push(n); });
      ((row && row.r) || []).forEach(function(k){ var n = schPart(k, s, S, B); if (n) R.push(n); });
      if (L.length || R.length) out.push({ l: L, r: R }); });
    return out; }

  /* the title row: count pills · the direction switches · a divider · the sort */
  var SCHCOUNT = [
    { key: "shapes", icon: "schema", col: function(S){ return S.KINDCOL.schema; }, word: function(n){ return n + " shape" + (n === 1 ? "" : "s"); }, get: function(l){ return l.length; } },
    { key: "fields", icon: "table", col: function(S){ return S.KINDCOL.route; }, word: function(n){ return n + " field" + (n === 1 ? "" : "s"); }, get: schFields },
    { key: "nested", icon: "link", col: function(S){ return S.KINDCOL.component; }, word: function(n){ return n + " nested"; }, get: schNestN } ];
  function schCountMode(k){ return ((schCfg().counts || {})[k]) || "off"; }
  function schPills(list, F, S){ var split = lookCfg().countPills === "each";
    var live = SCHCOUNT.filter(function(c){ return schCountMode(c.key) !== "off"; }); if (!live.length) return null;
    function span(c){ var m = schCountMode(c.key), n = c.get(list), sp = E("span", { class: "dcn", "data-count": c.key });
      sp.style.setProperty("--k", c.col(S));
      sp.innerHTML = m === "icon" ? ico(c.icon, 13, "currentColor") + "<b>" + n + "</b>" : '<span class="dct">' + esc(c.word(n)) + "</span>";
      return sp; }
    var wrap = E("div", { class: "dcnts" + (split ? " each" : " one") });
    if (split) live.forEach(function(c){ var pill = E("span", { class: "cnt dcp", "data-pill": c.key }); pill.style.setProperty("--k", c.col(S));
      pill.append(span(c)); bind(pill, function(){ return schPillCard(c.key, list, F, S); }); wrap.append(pill); });
    else { var one = E("span", { class: "cnt dcp", "data-pill": "all" });
      live.forEach(function(c, i){ if (i) one.insertAdjacentHTML("beforeend", '<i class="dcsep">·</i>');
        var sp = span(c); bind(sp, function(){ return schPillCard(c.key, list, F, S); }); one.append(sp); });
      wrap.append(one); }
    return wrap; }
  function schPillCard(key, list, F, S){ var H = window.hcard, all = schShapes(F);
    function pl(n, w){ return n + " " + w + (n === 1 ? "" : "s"); }
    if (key === "shapes") return H({ title: "shapes", value: list.length + " of " + all.length, icon: "schema", color: S.KINDCOL.schema,
      factors: ["in", "out"].map(function(d){ var n = all.filter(function(s){ return s.dir === d; }).length, on = schDirOn(d);
        return { state: on && n ? "ok" : "quiet", name: SCHDIR[d].long, value: pl(n, "shape") + (on ? "" : " · switched off"), rule: SCHDIR[d].plain }; }),
      factorLabel: "the two directions · a filled dot is switched on and holds shapes",
      rows: [["bodies", String(list.filter(function(s){ return s.top; }).length)], ["nested", String(list.filter(function(s){ return !s.top; }).length)]],
      plain: "the shapes that cross this endpoint — a body and every shape nested inside it" });
    if (key === "fields") { var mix = {}, opt = 0;
      list.forEach(function(s){ s.cols.forEach(function(c){ var k = schKind(c).key; mix[k] = (mix[k] || 0) + 1; if (isOpt(c[1])) opt++; }); });
      return H({ title: "fields", value: String(schFields(list)), icon: "table", color: S.KINDCOL.route,
        factors: SCHKINDS.filter(function(x){ return mix[x.key]; }).map(function(x){ return { state: "info", name: x.word, value: pl(mix[x.key], "field"), rule: x.plain }; }),
        factorLabel: "what the fields are made of · read from each field's declared type",
        rows: [["optional", opt + " accept None"], ["across", pl(list.length, "shape")]],
        plain: "the fields inside those shapes — the values that travel in and out" }); }
    var res = 0, nf = 0;
    list.forEach(function(s){ s.cols.forEach(function(c){ if (!schIsShape(c)) return; if (schByName(F, schBase(c[1]))) res++; else nf++; }); });
    return H({ title: "nested", value: String(res + nf), icon: "link", color: S.KINDCOL.component,
      factors: [{ state: res ? "ok" : "quiet", name: "drawn here", value: String(res), rule: "the shape it names is in the feed, with a block of its own" },
                { state: "quiet", name: "not in the feed", value: String(nf), rule: "the shape is named, but the feed does not carry its fields" }],
      factorLabel: "what adds up to " + (res + nf),
      rows: [["carried by", pl(list.filter(function(s){ return s.cols.some(function(c){ return schIsShape(c); }); }).length, "shape")]],
      plain: "a field whose value is a whole shape of its own" }); }
  window.SCHPILLCARD = schPillCard;
  function schDirBar(F, S){ var w = E("div", { class: "chbar" }), all = schShapes(F);
    ["in", "out"].forEach(function(d){ var D = SCHDIR[d], mine = all.filter(function(s){ return s.dir === d; }), on = schDirOn(d);
      var b = E("button", { class: "chb" + (on ? " on" : "") + (mine.length ? "" : " zero") });
      b.dataset.schDir = d; b.dataset.on = on ? "1" : "0";
      b.innerHTML = ico(D.icon, 13, dirCol(d, S)) + '<span class="chn">' + mine.length + "</span>";
      bind(b, function(){ return window.hcard({ title: D.long, value: mine.length + " shape" + (mine.length === 1 ? "" : "s") + " · " + (on ? "on" : "off"), icon: D.icon, color: dirCol(d, S),
        rows: [["fields", String(schFields(mine))], ["click", on ? "switches it off, leaving the other as it is" : "adds it to what is shown"]],
        plain: D.plain }); });
      b.onclick = function(ev){ ev.stopPropagation(); var st = window.SCHCFG.dir; st[d] = st[d] ? 0 : 1; window.showTab("schemas"); if (window.drawSchCfg) window.drawSchCfg(); };
      w.append(b); });
    return w; }
  var SCHSORTS = [
    { key: "tree", word: "tree", d: '<path d="M5 4v16M5 8h8M5 15h8"/><circle cx="16.5" cy="8" r="2.2"/><circle cx="16.5" cy="15" r="2.2"/>',
      plain: "each body first, then the shapes it carries in the order its fields name them — the order a reader follows",
      cmp: function(a, b){ return a.seq - b.seq; } },
    { key: "size", word: "size", d: '<path d="M4 6h16M4 12h11M4 18h6"/>', plain: "the shape with the most fields first",
      cmp: function(a, b){ return b.cols.length - a.cols.length || a.name.localeCompare(b.name); } },
    { key: "name", word: "name", d: '<path d="M3 18 7 6l4 12M4.5 14h5"/><path d="M14 6h6l-6 12h6"/>', plain: "alphabetical by shape name",
      cmp: function(a, b){ return a.name.localeCompare(b.name); } },
    { key: "entity", word: "entity", d: null, plain: "grouped by the entity that claims each shape, then by size",
      cmp: function(a, b){ return a.entity.localeCompare(b.entity) || b.cols.length - a.cols.length || a.name.localeCompare(b.name); } } ];
  window.SCHSORTS = SCHSORTS;
  window.SCHSORTICON = function(k, z){ var o = SCHSORTS.filter(function(x){ return x.key === k; })[0];
    return o ? (o.d ? SVGI(o.d, z) : ico("entity", z || 13, "currentColor")) : window.SORTICON(k, z); };
  function schSorted(list){ var c = schCfg(), o = SCHSORTS.filter(function(x){ return x.key === (c.sort || "tree"); })[0] || SCHSORTS[0];
    var out = list.slice().sort(o.cmp); return c.sortRev ? out.reverse() : out; }
  function schSortBar(){ var c = schCfg(), key = c.sort || "tree", rev = !!c.sortRev, w = E("div", { class: "sortbar" });
    SCHSORTS.forEach(function(o){ var on = key === o.key;
      var b = E("button", { class: "srb" + (on ? " on" : ""), "data-sch-sort": o.key });
      b.innerHTML = '<span class="sri">' + window.SCHSORTICON(o.key, 13) + '</span><span class="srw">' + o.word + "</span>";
      bind(b, function(){ return window.hcard({ title: "sort by " + o.word, value: on ? (rev ? "on · reversed" : "on") : "off", icon: "layers",
        rows: [["order", o.plain], ["click", on ? "already the order — the arrow beside it turns it around" : "lays the shapes out this way"]],
        plain: "the order the shapes are laid out in" }); });
      b.onclick = function(ev){ ev.stopPropagation(); window.SCHCFG.sort = o.key; window.showTab("schemas"); if (window.drawSchCfg) window.drawSchCfg(); };
      w.append(b); });
    var r = E("button", { class: "srb rev" + (rev ? " on" : ""), "data-sch-sort-rev": rev ? "1" : "0" });
    r.innerHTML = '<span class="sri">' + window.SORTICON(rev ? "rev-on" : "rev-off", 13) + '</span><span class="srw">' + (rev ? "reversed" : "as named") + "</span>";
    bind(r, function(){ return window.hcard({ title: rev ? "reversed" : "as named", value: "direction", icon: "layers",
      rows: [["click", "turns the order around"]], plain: "which end of the order comes first" }); });
    r.onclick = function(ev){ ev.stopPropagation(); window.SCHCFG.sortRev = window.SCHCFG.sortRev ? 0 : 1; window.showTab("schemas"); if (window.drawSchCfg) window.drawSchCfg(); };
    w.append(r); return w; }
  function schHead(box, F, S, list){
    var h = head(box, "schema", "Schemas", "—", "one block per shape — the request and response bodies and every shape nested inside them. Each mark is one field, its kind read from the declared type; a field whose type is another shape wears the shape mark.");
    var sh = h.querySelector(".sechd");
    if (sh) { var cnt = sh.querySelector(".cnt"); if (cnt) cnt.remove();
      var pills = schPills(list, F, S); if (pills) sh.append(pills);
      sh.append(schDirBar(F, S)); sh.append(E("i", { class: "chdiv", "aria-hidden": "true" })); sh.append(schSortBar()); }
    return h; }

  /* the shape's card mirrors its block: glyph + name · entity · where it sits · file (· who else returns it) · the
     direction as the block's own chip · the fields pill with what they are made of · a quiet footer */
  function schCard(s, F, S){ var mix = {}, pal = lookCfg().sqPal || "type", portOn = (window.FRAME || {}).portW > 0;
    s.cols.forEach(function(c){ var k = schKind(c).key; mix[k] = (mix[k] || 0) + 1; });
    var h = '<div class="bchd"><span class="bci">' + ico("schema", 16, schIconCol(s, S)) + "</span><b>" + esc(s.name) + "</b></div>";
    h += '<div class="bcln" data-ln="entity"><span class="bci">' + ico("entity", 14, s.entity_color) + '</span><span class="bcent" style="color:' + s.entity_color + '">' + esc(s.entity) + "</span></div>";
    h += '<div class="bcln" data-ln="via"><span class="bci">' + ico(s.top ? SCHDIR[s.dir].icon : "link", 14, "var(--muted)") + '</span><span class="bcmodel">' + esc(viaWords(s)) + "</span></div>";
    h += '<div class="bcln" data-ln="file"><span class="bci">' + ico("file", 14, "var(--muted)") + '</span><span class="bcfile">' + esc(s.at || s.file || "—") + "</span></div>";
    if (s.top && s.dir === "out") { var cons = (F.widening || {}).response_consumers || [];
      h += '<div class="bcln" data-ln="shared"><span class="bci">' + ico("globe", 14, "var(--muted)") + '</span><span class="bcmodel">' + (cons.length ? "also returned by " + esc(cons.join(" · ")) : "returned by this endpoint alone") + "</span></div>"; }
    h += '<div class="bcsep"></div>';
    h += '<div class="bcrow" data-row="direction"><span class="bci">' + ico("role", 14, S.OPC.call) + '</span><i class="bcchip" style="' + dirLook(s.dir, S) + '">'
      + SCHDIR[s.dir].word + " — " + SCHDIR[s.dir].long + "</i></div>";
    var marks = SCHKINDS.filter(function(x){ return mix[x.key]; }).map(function(x){
      return '<span class="mx" data-kind="' + x.key + '">' + kindMark(x, S, pal === "type" ? null : "var(--muted)").outerHTML + "<b>" + mix[x.key] + "</b></span>"; }).join("");
    h += '<div class="bcrow" data-row="fields"><span class="bci">' + ico("table", 14, S.KINDCOL.schema) + '</span><span class="bcfp" style="' + pillLook("fields", S) + '">'
      + s.cols.length + '</span><span class="bcmix">' + marks + "</span></div>";
    h += '<div class="bcfoot"><span class="bci">' + ico("info", 13, "currentColor") + "</span><span>"
      + (portOn ? "click to open its record in the portrait" : "click to name every field here") + "</span></div>";
    return h; }
  window.SCHCARD = function(name){ return schCard(schByName(window.LABEP, name), window.LABEP, S); };

  function renderSchemaBlocks(box, F, S){
    var list = schShown(F), B = schBk(), sel = (window.SEL || {}).schemas, portOn = (window.FRAME || {}).portW > 0;
    schHead(box, F, S, list);
    if (!list.length) { box.append(E("div", { class: "pempty" }, ico("schema", 15, "var(--muted)"), E("b", null, "both directions are switched off"),
        E("span", null, "there is nothing to draw — switch IN or OUT back on in the title row, or in the rail.")));
      COV.mark("PAYLOAD", "schemas"); return; }
    var body = E("div", { class: "bkbody form-" + B.form });
    var bodiesOnly = schMap().blocks === "bodies";
    schSorted(bodiesOnly ? list.filter(function(x){ return x.top; }) : list).forEach(function(s){
      var blk = E("div", { class: "blk sch dir-" + s.dir + (sel === s.name ? " sel" : ""), style: "--ec:" + s.entity_color });
      blk.dataset.table = s.name; blk.dataset.schema = s.name; tg(blk, s.dir === "in" ? "request-shape" : "response-shape-per-ending");
      var hd = E("div", { class: "bkhd" }), ti = E("div", { class: "bkti" });
      schLines(s, S).forEach(function(line){ var ln = E("div", { class: "bkln" }), L = E("div", { class: "bkcol l" }), R = E("div", { class: "bkcol r" });
        function put(into, ns){ ns.forEach(function(n){ if (typeof n === "string") into.insertAdjacentHTML("beforeend", n); else into.append(n); }); }
        put(L, line.l); put(R, line.r); ln.append(L, R); ti.append(ln); });
      hd.append(ti);
      var sqs = E("div", { class: "sqs" });
      s.cols.forEach(function(c){ sqs.append(schNode(c, s, S, schIsShape(c) ? "nest" : "")); });
      hd.append(sqs); blk.append(hd);
      /* BODIES ONLY: each nested shape is a chip inside its body — a drawn shape of its own, so it keeps its own card
         and its own click into the record */
      if (bodiesOnly && s.top) { var kids = list.filter(function(x){ return x.parent === s.name; }).sort(function(a, b){ return a.seq - b.seq; });
        if (kids.length) { var nr = E("div", { class: "snest" });
          kids.forEach(function(k){ var ch = E("span", { class: "snc" + (sel === k.name ? " sel" : "") }, ico("schema", 12, schIconCol(k, S)), E("b", null, esc(k.name)), E("span", { class: "n" }, String(k.cols.length)));
            ch.dataset.table = k.name; ch.dataset.schema = k.name; tg(ch, k.dir === "in" ? "request-shape" : "response-shape-per-ending");
            bind(ch, function(){ return schCard(k, F, S); });
            ch.addEventListener("click", function(ev){ ev.stopPropagation(); if (portOn) window.selectIn("schemas", k.name); });
            nr.append(ch); });
          blk.append(nr); } }
      var fl = E("div", { class: "flds bkfl" });
      s.cols.forEach(function(c){ var fr = E("div", { class: "fld" }, schNode(c, s, S), E("span", { class: "fn" }, esc(c[0])), schNest(F, c), E("span", { class: "ft" }, esc(c[1] || "—")));
        fr.dataset.field = c[0]; fl.append(fr); });
      blk.append(fl);
      /* ONE hover and ONE click for the whole block, as in Data */
      bind(blk, function(){ return schCard(s, F, S); });
      blk.addEventListener("click", function(){ if (portOn) window.selectIn("schemas", s.name); else blk.classList.toggle("open"); });
      body.append(blk); });
    box.append(body);
    /* the footer: the hint, then the kinds these shapes are made of, each with its count */
    var FS = schCfg().footShow || ["icon", "count"], total = schFields(list), mixAll = {};
    list.forEach(function(s){ s.cols.forEach(function(c){ var k = schKind(c).key; mixAll[k] = (mixAll[k] || 0) + 1; }); });
    var foot = E("div", { class: "pfoot bkfoot" + FS.map(function(k){ return " fs-" + k; }).join("") });
    var FL = E("div", { class: "ftcol l" }), FR = E("div", { class: "ftcol r" });
    FL.append(footPart("hint", ico("info", 13, "currentColor"), portOn ? "click a shape to open its record in the portrait" : "click a shape to list its fields here", "",
      function(){ return window.hcard({ title: "click a shape", icon: "info", color: "var(--muted)",
        rows: [["opens", portOn ? "its record, in the portrait beside this panel" : "every field of it, here"], ["counts", total + " fields across " + list.length + " shapes"]],
        plain: "a block is a shape — click one to read all of it" }); }));
    SCHKINDS.forEach(function(x){ if (!mixAll[x.key]) return;
      FR.append(footPart(x.key, kindMarkShown(x, S).outerHTML, x.word, String(mixAll[x.key]), function(){ return footKindCard(x, mixAll[x.key], total, S); })); });
    var optN = list.reduce(function(n, s){ return n + s.cols.filter(function(c){ return isOpt(c[1]); }).length; }, 0);
    FR.append(footPart("opt", '<i class="sq e-colour lgm ftopt" style="--fc:var(--muted)"></i>', "optional", String(optN),
      function(){ return window.hcard({ title: "optional", value: optN + " of " + total + " fields", iconHtml: '<span class="cpmark"><i class="sq e-colour ftopt" style="--fc:var(--muted);--sq:14px"></i></span>',
        color: "var(--muted)", rows: [["means", "the field accepts None"]], plain: "a field that is allowed to be empty" }); }));
    foot.append(FL, FR); box.append(foot);
    COV.mark("PAYLOAD", "schemas"); }

  /* THE SCHEMA RECORD — the data record's pattern: glyph + name (the docstring on an info icon), icon · label · value
     rows, then the fields as a table with named columns — fields · nested shape · data type */
  function schSel(F){ var n = (window.SEL || {}).schemas; return n ? schByName(F, n) : null; }
  function schRecord(box, F, S){
    var s = schSel(F);
    if (!s) { ptIdle(box, "its record opens here: which way it travels, where it sits, the file it lives in, and every field with its kind."); return; }
    var b = E("div", { class: "ptbody ptrec" });
    var hd = E("div", { class: "rchd" }, E("span", { class: "rci" }, ico("schema", 18, schIconCol(s, S))), E("b", null, esc(s.name)));
    if (s.doc) { var di = E("span", { class: "rcinfo" }, ico("info", 13, "currentColor"));
      bind(di, card({ title: s.name, icon: "schema", color: S.KINDCOL.schema, sub: "its docstring", body: esc(s.doc) })); hd.append(di); }
    b.append(hd);
    function row(key, icon, value, info){
      var r = E("div", { class: "rcrow", "data-row": key }, E("span", { class: "rci" }, icon), E("span", { class: "k" }, key), value);
      if (info) { var i = E("span", { class: "rcinfo" }, ico("info", 13, "currentColor")); bind(i, info); r.append(i); }
      b.append(r); }
    row("channel", ico("role", 14, S.OPC.call), E("span", { class: "v" }, E("i", { class: "rcchip", style: dirLook(s.dir, S) }, SCHDIR[s.dir].word + " — " + SCHDIR[s.dir].long)));
    tg(b.lastChild, s.dir === "in" ? "request-shape" : "response-shape-per-ending");
    row("entity", ico("entity", 14, s.entity_color), E("span", { class: "v", style: "color:" + s.entity_color }, esc(s.entity)));
    row(s.top ? "body" : "parent", ico(s.top ? SCHDIR[s.dir].icon : "link", 14, "var(--muted)"), E("span", { class: "v" }, esc(viaWords(s))));
    row("file", tg(E("span", null, ico("file", 14, "var(--muted)")), "file-line"), E("span", { class: "v" }, esc(s.at || s.file || "—")),
      card({ title: s.name, icon: "file", sub: s.at ? "where it is declared" : "its file — the feed reads no line for it",
        rows: [["declared at", s.at || "—"], s.flines ? ["the file", s.flines + " lines long"] : null,
               ["a field nobody declared", s.extra && s.extra.policy ? (s.extra.policy === "forbid" ? "is refused" : s.extra.policy === "ignore" ? "is ignored" : "is kept") + " (extra = " + s.extra.policy + (s.extra.at ? " · " + shortAt(s.extra.at) : " · the default") + ")" : "not read"]],
        plain: "the line this shape is written at — and what it does with a field it does not know" }));
    if (s.top && s.dir === "out") { var cons = (F.widening || {}).response_consumers || [], pn = (F.identity.payload || {}).n;
      row("shared", ico("globe", 14, "var(--muted)"), E("span", { class: "v" }, cons.length ? esc(cons.join(" · ")) : "this endpoint alone"),
        card({ title: "payload", icon: "down", color: S.OPC.write, sub: "the response contract",
          rows: [["fields", String(pn != null ? pn : s.cols.length)], ["also returned by", cons.join(" · ") || "— this endpoint alone"]],
          body: "what the endpoint hands back — the graph's cargo shuttle scales with this field count." })); }
    /* a shape's type can be a 28-letter class name: it breaks at its WORD boundaries and wraps rather than running past the
       portrait — never cut, never mid-word */
    function typeWbr(t){ return esc(t || "—").replace(/([a-z0-9])([A-Z])/g, "$1<wbr>$2").replace(/ \| /g, " | <wbr>"); }
    var tab = E("div", { class: "flds rctab sch", style: "--ec:" + s.entity_color });
    tab.append(E("div", { class: "rcth" },
      E("span", { class: "c-f" }, "fields", E("i", { class: "rcfp", style: pillLook("fields", S) }, String(s.cols.length))),
      E("span", { class: "c-k" }, "nested shape"), E("span", { class: "c-t" }, "data type")));
    s.cols.forEach(function(c){ var tc = schKind(c), isS = schIsShape(c), nb = isS ? schByName(F, schBase(c[1])) : null;
      var f = E("div", { class: "fld" + (isS ? " nest" : "") },
        E("span", { class: "c-f" }, schNode(c, s, S), E("span", { class: "fn" }, esc(c[0]))),
        E("span", { class: "c-k" }, schNest(F, c)),
        E("span", { class: "c-t ft" }, typeWbr(c[1])));
      bind(f, card({ title: c[0], sub: String(c[1] || "—"), icon: isS ? "schema" : "table", color: tc.col(S),
        rows: [["kind", tc.word + " — " + tc.plain], ["in", s.name], isOpt(c[1]) ? ["optional", "accepts None"] : null,
               isS ? ["the shape", nb ? nb.name + " · " + nb.cols.length + " fields, with a block of its own" : schBase(c[1]) + " — named, but the feed does not carry its fields"] : null]
          .concat(fieldRuleRows(s, c[0])) }));
      f.dataset.field = c[0];
      if (s.dir === "in" && fieldRuleRows(s, c[0]).length) tg(f, "field-rules-of-the-request-body", true);
      tab.append(f); });
    b.append(tab);
    if (s.cols_more) b.append(E("div", { class: "ptsec" }, "+" + s.cols_more + " more the feed did not carry"));
    box.append(b);
    COV.mark("PAYLOAD", "schemas"); }

  /* ── PART KIT (2026-09-13) — the title-row pieces every carried-over part shares: count pills, a sort bar, a sorted list ── */
  function countPillsOf(list, S, defs, modeOf, cardOf){ var split = lookCfg().countPills === "each";
    var live = defs.filter(function(c){ return modeOf(c.key) !== "off"; }); if (!live.length) return null;
    function span(c){ var m = modeOf(c.key), n = c.get(list), sp = E("span", { class: "dcn", "data-count": c.key });
      sp.style.setProperty("--k", c.col(S));
      sp.innerHTML = m === "icon" ? ico(c.icon, 13, "currentColor") + "<b>" + n + "</b>" : '<span class="dct">' + esc(c.word(n)) + "</span>";
      return sp; }
    var wrap = E("div", { class: "dcnts" + (split ? " each" : " one") });
    if (split) live.forEach(function(c){ var pill = E("span", { class: "cnt dcp", "data-pill": c.key }); pill.style.setProperty("--k", c.col(S));
      pill.append(span(c)); bind(pill, function(){ return cardOf(c.key); }); wrap.append(pill); });
    else { var one = E("span", { class: "cnt dcp", "data-pill": "all" });
      live.forEach(function(c, i){ if (i) one.insertAdjacentHTML("beforeend", '<i class="dcsep">·</i>');
        var sp = span(c); bind(sp, function(){ return cardOf(c.key); }); one.append(sp); });
      wrap.append(one); }
    return wrap; }
  function sortedOf(list, SORTS, key, rev){ var o = SORTS.filter(function(x){ return x.key === key; })[0] || SORTS[0];
    var out = list.slice().sort(o.cmp); return rev ? out.reverse() : out; }
  function sortBarOf(SORTS, key, rev, attr, what, setKey, flipRev){ var w = E("div", { class: "sortbar" });
    SORTS.forEach(function(o){ var on = key === o.key, b = E("button", { class: "srb" + (on ? " on" : "") });
      b.setAttribute("data-" + attr, o.key);
      b.innerHTML = '<span class="sri">' + (o.d ? SVGI(o.d, 13) : ico("entity", 13, "currentColor")) + '</span><span class="srw">' + o.word + "</span>";
      bind(b, function(){ return window.hcard({ title: "sort by " + o.word, value: on ? (rev ? "on · reversed" : "on") : "off", icon: "layers",
        rows: [["order", o.plain], ["click", on ? "already the order — the arrow beside it turns it around" : "lays the " + what + " out this way"]], plain: "the order the " + what + " are laid out in" }); });
      b.onclick = function(ev){ ev.stopPropagation(); setKey(o.key); }; w.append(b); });
    var r = E("button", { class: "srb rev" + (rev ? " on" : "") }); r.setAttribute("data-" + attr + "-rev", rev ? "1" : "0");
    r.innerHTML = '<span class="sri">' + window.SORTICON(rev ? "rev-on" : "rev-off", 13) + '</span><span class="srw">' + (rev ? "reversed" : "as named") + "</span>";
    bind(r, function(){ return window.hcard({ title: rev ? "reversed" : "as named", value: "direction", icon: "layers", rows: [["click", "turns the order around"]], plain: "which end of the order comes first" }); });
    r.onclick = function(ev){ ev.stopPropagation(); flipRev(); }; w.append(r); return w; }
  function camelWbr(t){ return esc(t == null ? "—" : t).replace(/([a-z0-9])([A-Z])/g, "$1<wbr>$2").replace(/, /g, ", <wbr>").replace(/ \| /g, " | <wbr>"); }

  /* ══════════════════════════════════════════════════════════════════════════════════════
     FUNCTIONS · BLOCKS (operator 2026-09-13: "let's do another section following the conventions — next one is
     functions") — the Panel Pattern Book's second carry-over. The THING is a function: the handler at L0 and every
     function the walk reaches. Its PIECES are what it touches (the tables it reads and writes) or what it calls.
     Every choice made here is a rail option from the start — the operator's rule from the schema map.
     ══════════════════════════════════════════════════════════════════════════════════════ */
  var FNROLES = ["accessor", "caller", "gate", "pure"];
  var ROLECHIP = { accessor: "ACC", caller: "CALL", gate: "GATE", pure: "PURE" };
  var ROLEICO = { accessor: "model", caller: "merge", gate: "shield", pure: "target" };
  window.ROLEICO = ROLEICO;
  function fnCfg(){ return window.FNCFG || {}; }
  function fnMap(){ var m = fnCfg().map || {};
    return { pieces: m.pieces || "tables", handler: m.handler || "block", roleCol: m.roleCol || "station", inferred: m.inferred || "dashed", looks: m.looks || "shared" }; }
  function roleCol(r, S){ var m = fnMap().roleCol; return m === "function" ? S.KINDCOL["function"] : m === "mono" ? "#8794ab" : ((S.BADGE_COL.role || {})[r] || "#8794ab"); }
  var ENTCOL = null;
  function entColOf(F, e){ if (!ENTCOL) { ENTCOL = {};
      (F.data.tables || []).forEach(function(t){ if (t.entity && t.entity_color) ENTCOL[t.entity] = t.entity_color; });
      var sc = F.data.schemas || {}; [sc.request, sc.response].forEach(function(s){ [s].concat((s && s.nested) || []).forEach(function(x){ if (x && x.entity && x.entity_color && !ENTCOL[x.entity]) ENTCOL[x.entity] = x.entity_color; }); }); }
    return ENTCOL[e] || "#888"; }
  var FNS = null;
  function fnAll(F){ if (FNS) return FNS; var FN = F.functions, out = [], seq = 0;
    function rec(f, lv, handler){ return { id: f.id, name: f.name, file: f.file, role: f.role || "pure", entity: f.entity || "—", entity_color: entColOf(F, f.entity),
      level: lv, via: handler ? null : f.via, seq: seq++, handler: handler, lines: f.lines, async: !!f.async, returns: f.returns || "—", god: !!f.god,
      commits: !!f.commits, conf: handler ? "extracted" : (f.conf || "extracted"), ops: f.ops || [], calls: [],
      key: String(f.id || "").replace("#", "::"), insight: f.insight || null, at: f.at || null, at_why: f.at_why || null }; }
    out.push(rec(FN.handler, 0, true));
    FN.walk.forEach(function(level, i){ level.forEach(function(f){ out.push(rec(f, i + 1, false)); }); });
    out.forEach(function(x){ x.calls = out.filter(function(y){ return !y.handler && y.via === x.name; }); });
    FNS = out; return out; }
  function fnByName(F, n){ return fnAll(F).filter(function(x){ return x.name === n; })[0] || null; }
  function fnRoleOn(r){ var c = fnCfg().role || {}; return c[r] == null ? true : !!c[r]; }
  function fnPool(F){ var off = fnMap().handler === "off"; return fnAll(F).filter(function(x){ return !(x.handler && off); }); }
  function fnShown(F){ return fnPool(F).filter(function(x){ return fnRoleOn(x.role); }); }
  window.FNALL = function(){ return fnAll(window.LABEP); };
  window.FNNAMES = function(){ return fnAll(window.LABEP).map(function(x){ return x.name; }); };
  /* the pieces: a table touch is a READ or a WRITE; a call takes its callee's ROLE */
  function opKind(rw, S){ return rw === "w" ? { key: "write", word: "write", col: S.OPC.write, ch: "W", sym: "model", plain: "a table this function writes" }
                                             : { key: "read", word: "read", col: S.OPC.read, ch: "R", sym: "model", plain: "a table this function reads" }; }
  function callKind(r, S){ return { key: r, word: r, col: roleCol(r, S), ch: r.charAt(0).toUpperCase(), sym: "function", plain: (S.LRDEF || {})["role:" + r] || r }; }
  function pieceNode(k, x, S, cls){ var enc = sqEnc(), pal = lookCfg().sqPal || "type";
    var col = pal === "mono" ? "var(--muted)" : pal === "entity" ? x.entity_color : pal === "channel" ? roleCol(x.role, S) : k.col;
    var q = E("i", { class: "sq e-" + enc + " t-" + k.key + (cls ? " " + cls : "") }); q.style.setProperty("--fc", col);
    if (enc === "char") q.textContent = k.ch; else if (enc === "symbol") q.innerHTML = ico(k.sym, null, "currentColor");
    return q; }
  function fnPieces(x, S){ var m = fnMap().pieces, out = [];
    if (m !== "calls") x.ops.forEach(function(o){ out.push({ k: opKind(o.rw, S), op: o }); });
    if (m !== "tables") x.calls.forEach(function(c){ out.push({ k: callKind(c.role, S), call: c }); });
    return out; }

  /* the title, part by part */
  var FNBKDEF = { form: "block", icon: 1, role: 1, name: 1, file: "both", count: "badge", via: "both",
    rows: [{ l: ["icon", "name"], r: ["commit"] }, { l: ["file"], r: ["count", "role"] }, { l: ["via"], r: [] }],
    size: { icon: 13, name: 13, file: 12, via: 12 }, sel: "icon" };
  function fnBk(){ var c = fnCfg().bk || {}, o = {}; Object.keys(FNBKDEF).forEach(function(k){ o[k] = c[k] == null ? FNBKDEF[k] : c[k]; }); return o; }
  var FNPART = [
    { key: "icon", word: "the function glyph", ico: "function", note: "the station's function glyph — the same one the graph draws" },
    { key: "role", word: "the role chip", ico: "role", note: "ACC · CALL · GATE · PURE — what the function does with the store" },
    { key: "name", word: "the function name", ico: "doc", note: "the function as its file names it" },
    { key: "commit", word: "the commit pulse", ico: "key", note: "a pulsing dot when the function ends a DB transaction" },
    { key: "file", word: "the file", ico: "file", note: "the file it lives in — its last two folders" },
    { key: "count", word: "its size", ico: "info", note: "how many lines its body runs — ringed red over the 50-line flag" },
    { key: "via", word: "where it sits", ico: "link", note: "the handler, or its hop on the walk and the function that calls it" } ];
  window.FNPART = FNPART;
  function fnIconCol(x, S){ var ic = (lookCfg().bk || {}).iconCol || "model";
    return ic === "ink" ? "var(--ink)" : ic === "muted" ? "var(--muted)" : ic === "entity" ? x.entity_color : ic === "channel" ? roleCol(x.role, S) : S.KINDCOL["function"]; }
  function shortFile(f){ return String(f || "—").split("/").slice(-2).join("/"); }
  function fnViaWords(x){ return x.handler ? "the handler" : "L" + x.level + " · " + x.via; }
  function fnPart(key, x, S, B){ var z = (B.size || {})[key] || 12;
    if (key === "icon") return B.icon ? '<span class="bki">' + ico("function", z, fnIconCol(x, S)) + "</span>" : null;
    if (key === "role") return B.role ? '<span class="bkrw"><i class="jdrw frole" style="--rwc:' + roleCol(x.role, S) + '">' + ROLECHIP[x.role] + "</i></span>" : null;   /* size: --rw-fs */
    if (key === "name") return B.name ? E("b", { style: "font-size:" + z + "px" }, esc(x.name)) : null;
    if (key === "commit") return x.commits ? '<i class="cdot" aria-label="commits"></i>' : null;
    if (key === "file") { if (B.file === "off") return null;
      var e = E("span", { class: "bkm bkf", style: "font-size:" + z + "px" });
      if (B.file === "icon" || B.file === "both") e.insertAdjacentHTML("beforeend", ico("file", z, "var(--muted)"));
      if (B.file === "word" || B.file === "both") e.append(E("span", null, esc(shortFile(x.file))));
      return e; }
    if (key === "count") { if (B.count === "off") return null; var n = x.lines == null ? "?" : String(x.lines);
      return E("span", { class: "bkn" + (B.count === "badge" ? " badge" : "") + (x.god ? " god" : "") }, B.count === "badge" ? n : n + " lines"); }
    if (key === "via") { if (B.via === "off") return null;
      var v = E("span", { class: "bkm bkv", style: "font-size:" + z + "px" });
      if (B.via === "icon" || B.via === "both") v.insertAdjacentHTML("beforeend", ico(x.handler ? "target" : "link", z, "var(--muted)"));
      if (B.via === "word" || B.via === "both") v.append(E("span", null, esc(fnViaWords(x))));
      return v; }
    return null; }
  function fnLines(x, S){ var B = fnBk(), out = [];
    (B.rows || []).forEach(function(row){ var L = [], R = [];
      ((row && row.l) || []).forEach(function(k){ var n = fnPart(k, x, S, B); if (n) L.push(n); });
      ((row && row.r) || []).forEach(function(k){ var n = fnPart(k, x, S, B); if (n) R.push(n); });
      if (L.length || R.length) out.push({ l: L, r: R }); });
    if (fnMap().inferred === "tag" && x.conf === "inferred" && out.length) out[0].r.push('<i class="ftag" data-conf="inferred">⌁ inferred</i>');
    return out; }

  /* the title row */
  var FNCOUNT = [
    { key: "functions", icon: "function", col: function(S){ return S.KINDCOL["function"]; }, word: function(n){ return n + " function" + (n === 1 ? "" : "s"); }, get: function(l){ return l.length; } },
    { key: "levels", icon: "layers", col: function(S){ return S.KINDCOL.route; }, word: function(n){ return n + " level" + (n === 1 ? "" : "s"); },
      get: function(l){ return l.reduce(function(m, x){ return Math.max(m, x.level); }, 0); } },
    { key: "commits", icon: "key", col: function(S){ return S.OPC.write; }, word: function(n){ return n + " commit" + (n === 1 ? "" : "s"); },
      get: function(l){ return l.filter(function(x){ return x.commits; }).length; } } ];
  function fnCountMode(k){ return ((fnCfg().counts || {})[k]) || "off"; }
  function fnPillCard(key, list, F, S){ var H = window.hcard, FN = F.functions, pool = fnPool(F);
    function pl(n, w){ return n + " " + w + (n === 1 ? "" : "s"); }
    var inf = list.filter(function(x){ return x.conf === "inferred"; }).length;
    if (key === "functions") return H({ title: "functions", value: list.length + " of " + pool.length, icon: "function", color: S.KINDCOL["function"],
      factors: FNROLES.map(function(r){ var n = pool.filter(function(x){ return x.role === r; }).length, on = fnRoleOn(r);
        return { state: on && n ? "ok" : "quiet", name: r, value: pl(n, "function") + (on ? "" : " · switched off"), rule: (S.LRDEF || {})["role:" + r] || r }; }),
      factorLabel: "the four roles · a filled dot is switched on and holds functions",
      rows: [["code behind", FN.behind.fns + " functions · reach " + FN.behind.depth + " — graft sees " + (FN.behind.fns - FN.walk_total) + " the walk cannot"],
             ["inferred hops", String(inf)]],
      plain: "the handler and every function the walk reaches — the code behind this endpoint" });
    if (key === "levels") { var byL = {}; list.forEach(function(x){ byL[x.level] = (byL[x.level] || 0) + 1; });
      return H({ title: "levels", value: String(FNCOUNT[1].get(list)), icon: "layers", color: S.KINDCOL.route,
        factors: Object.keys(byL).sort(function(a, b){ return a - b; }).map(function(l){ return { state: "info", name: +l === 0 ? "L0 · the handler" : "L" + l, value: pl(byL[l], "function"), rule: +l === 0 ? "the endpoint's own function" : "reached in " + l + " hop" + (+l === 1 ? "" : "s") }; }),
        factorLabel: "how many functions each hop reaches", rows: [["the walk", FN.walk_levels.join(" · ") + " = " + FN.walk_total]],
        plain: "how many hops deep the walk goes from the handler" }); }
    var cm = list.filter(function(x){ return x.commits; }), wr = list.reduce(function(n, x){ return n + x.ops.filter(function(o){ return o.rw === "w"; }).length; }, 0);
    return H({ title: "commits", value: String(cm.length), icon: "key", color: S.OPC.write,
      factors: FNROLES.map(function(r){ var n = cm.filter(function(x){ return x.role === r; }).length; return { state: n ? "ok" : "quiet", name: r, value: pl(n, "function"), rule: (S.LRDEF || {})["role:" + r] || r }; }),
      factorLabel: "who commits, by role", rows: [["writes", pl(wr, "table write")]],
      plain: "the functions that end a DB transaction — where the writes become permanent" }); }
  window.FNPILLCARD = fnPillCard;
  function fnRoleBar(F, S){ var w = E("div", { class: "chbar" }), pool = fnPool(F);
    FNROLES.forEach(function(r){ var mine = pool.filter(function(x){ return x.role === r; }), on = fnRoleOn(r);
      var b = E("button", { class: "chb" + (on ? " on" : "") + (mine.length ? "" : " zero") }); b.dataset.fnRole = r; b.dataset.on = on ? "1" : "0";
      b.innerHTML = ico(ROLEICO[r], 13, roleCol(r, S)) + '<span class="chn">' + mine.length + "</span>";
      bind(b, function(){ return window.hcard({ title: r, value: mine.length + " function" + (mine.length === 1 ? "" : "s") + " · " + (on ? "on" : "off"), icon: ROLEICO[r], color: roleCol(r, S),
        rows: [["click", on ? "switches this role off, leaving the others as they are" : "adds this role to what is shown"]], plain: (S.LRDEF || {})["role:" + r] || r }); });
      b.onclick = function(ev){ ev.stopPropagation(); var st = window.FNCFG.role; st[r] = st[r] ? 0 : 1; window.showTab("functions"); if (window.drawFnCfg) window.drawFnCfg(); };
      w.append(b); });
    return w; }
  var FNSORTS = [
    { key: "walk", word: "walk", d: '<path d="M4 6h6l3 6h7M13 12l-3 6H4"/>', plain: "the handler first, then each hop in the order the walk reaches it",
      cmp: function(a, b){ return a.seq - b.seq; } },
    { key: "size", word: "size", d: '<path d="M4 6h16M4 12h11M4 18h6"/>', plain: "the longest body first",
      cmp: function(a, b){ return (b.lines || 0) - (a.lines || 0) || a.seq - b.seq; } },
    { key: "name", word: "name", d: '<path d="M3 18 7 6l4 12M4.5 14h5"/><path d="M14 6h6l-6 12h6"/>', plain: "alphabetical by function name",
      cmp: function(a, b){ return a.name.localeCompare(b.name); } },
    { key: "file", word: "file", d: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/>', plain: "grouped by the file each function lives in, then by the walk",
      cmp: function(a, b){ return String(a.file).localeCompare(String(b.file)) || a.seq - b.seq; } } ];
  window.FNSORTS = FNSORTS;
  window.FNSORTICON = function(k, z){ var o = FNSORTS.filter(function(x){ return x.key === k; })[0]; return o && o.d ? SVGI(o.d, z) : ico("entity", z || 13, "currentColor"); };
  function fnHead(box, F, S, list){ var FN = F.functions;
    var h = head(box, "function", "Functions", "—", "one block per function — the handler and every function the walk reaches, hop by hop (" + FN.walk_levels.join(" · ") + "). Each mark is a table the function reads or writes, or a function it calls.");
    var sh = h.querySelector(".sechd"), C = fnCfg();
    if (sh) { var cnt = sh.querySelector(".cnt"); if (cnt) cnt.remove();
      var pills = countPillsOf(list, S, FNCOUNT, fnCountMode, function(k){ return fnPillCard(k, list, F, S); }); if (pills) sh.append(pills);
      sh.append(fnRoleBar(F, S)); sh.append(E("i", { class: "chdiv", "aria-hidden": "true" }));
      sh.append(sortBarOf(FNSORTS, C.sort || "walk", !!C.sortRev, "fn-sort", "functions",
        function(k){ window.FNCFG.sort = k; window.showTab("functions"); if (window.drawFnCfg) window.drawFnCfg(); },
        function(){ window.FNCFG.sortRev = window.FNCFG.sortRev ? 0 : 1; window.showTab("functions"); if (window.drawFnCfg) window.drawFnCfg(); })); }
    return h; }

  /* the card mirrors the block */
  function fnCard(x, F, S){ var portOn = (window.FRAME || {}).portW > 0, I = F.identity, ps = fnPieces(x, S), ops = ps.filter(function(p){ return p.op; }), calls = ps.filter(function(p){ return p.call; });
    function mixRow(row, icon, items){ var mix = {}, kinds = {};
      items.forEach(function(p){ mix[p.k.key] = (mix[p.k.key] || 0) + 1; kinds[p.k.key] = p.k; });
      var marks = Object.keys(mix).map(function(k){ return '<span class="mx" data-kind="' + k + '">' + pieceNode(kinds[k], x, S).outerHTML + "<b>" + mix[k] + "</b></span>"; }).join("");
      return '<div class="bcrow" data-row="' + row + '"><span class="bci">' + ico(icon, 14, S.KINDCOL["function"]) + '</span><span class="bcfp" style="' + pillLook("fields", S) + '">'
        + items.length + '</span><span class="bcmix">' + marks + "</span></div>"; }
    var h = '<div class="bchd"><span class="bci">' + ico("function", 16, fnIconCol(x, S)) + "</span><b>" + esc(x.name) + "</b>" + (x.commits ? '<i class="cdot"></i>' : "") + "</div>";
    h += '<div class="bcln" data-ln="entity"><span class="bci">' + ico("entity", 14, x.entity_color) + '</span><span class="bcent" style="color:' + x.entity_color + '">' + esc(x.entity) + "</span></div>";
    h += '<div class="bcln" data-ln="via"><span class="bci">' + ico(x.handler ? "target" : "link", 14, "var(--muted)") + '</span><span class="bcmodel">' + esc(fnViaWords(x)) + (x.conf === "inferred" ? " · an inferred hop" : "") + "</span></div>";
    h += '<div class="bcln" data-ln="file"><span class="bci">' + ico("file", 14, "var(--muted)") + '</span><span class="bcfile">' + esc(x.at || x.file) + "</span></div>";
    h += '<div class="bcln" data-ln="size"><span class="bci">' + ico("info", 14, "var(--muted)") + '</span><span class="bcmodel">' + (x.lines == null ? "?" : x.lines) + " lines" + (x.async ? " · async" : "") + " · → " + camelWbr(x.returns) + "</span></div>";
    if (x.handler) h += '<div class="bcln" data-ln="signature"><span class="bci">' + ico("doc", 14, "var(--muted)") + '</span><span class="bcfile">' + esc(String(I.gsig || "—").slice(0, 70)) + "…</span></div>"
      + '<div class="bcln" data-ln="doc"><span class="bci">' + ico("doc", 14, "var(--muted)") + '</span><span class="bcmodel">' + (I.doc ? esc(I.doc.slice(0, 70)) : "no docstring in the feed") + "</span></div>";
    var dz = doesOf(F, x.key);
    if (dz) h += '<div class="bcln" data-ln="does"><span class="bci">' + ico("target", 14, "var(--muted)") + '</span><span class="bcmodel">' + esc(dz.does.length ? dz.does.join(" · ") : "none of the four shows in its own code") + "</span></div>";
    h += '<div class="bcsep"></div>';
    h += '<div class="bcrow" data-row="role"><span class="bci">' + ico(ROLEICO[x.role], 14, roleCol(x.role, S)) + '</span><i class="bcchip" style="' + chipLookOf(roleCol(x.role, S)) + '">' + x.role + "</i></div>";
    if (fnMap().pieces !== "calls") h += mixRow("tables", "model", ops);
    if (fnMap().pieces !== "tables") h += mixRow("calls", "merge", calls);
    h += '<div class="bcfoot"><span class="bci">' + ico("info", 13, "currentColor") + "</span><span>" + (portOn ? "click to open its record in the portrait" : "click to name every piece here") + "</span></div>";
    return h; }

  function renderFnBlocks(box, F, S){
    var list = fnShown(F), B = fnBk(), C = fnCfg(), M = fnMap(), sel = (window.SEL || {}).functions, portOn = (window.FRAME || {}).portW > 0;
    fnHead(box, F, S, list);
    if (!list.length) { box.append(E("div", { class: "pempty" }, ico("function", 15, "var(--muted)"), E("b", null, "every role is switched off"),
        E("span", null, "there is nothing to draw — switch a role back on in the title row, or in the rail.")));
      COV.mark("CODE BEHIND", "functions"); COV.mark("SIGNATURE", "functions"); COV.mark("DOCSTRING", "functions"); return; }
    var body = E("div", { class: "bkbody form-" + B.form });
    sortedOf(list, FNSORTS, C.sort || "walk", !!C.sortRev).forEach(function(x){
      var blk = E("div", { class: "blk fn role-" + x.role + (x.conf === "inferred" && M.inferred === "dashed" ? " dashed" : "") + (sel === x.name ? " sel" : ""), style: "--ec:" + x.entity_color });
      blk.dataset.table = x.name; blk.dataset.fn = x.name; blk.dataset.conf = x.conf;
      /* the FACE shows the name, the file, the length and the graph role; what the function DOES (the feed's `does`
         words behind the four role fields) and the handler's signature ride only its hover card */
      if (x.handler) tg(blk, "the-handler");
      tg(blk, doesIds(F, x.key, false).concat(x.handler ? ["signature"] : []), true);
      var hd = E("div", { class: "bkhd" }), ti = E("div", { class: "bkti" });
      fnLines(x, S).forEach(function(line){ var ln = E("div", { class: "bkln" }), L = E("div", { class: "bkcol l" }), R = E("div", { class: "bkcol r" });
        function put(into, ns){ ns.forEach(function(n){ if (typeof n === "string") into.insertAdjacentHTML("beforeend", n); else into.append(n); }); }
        put(L, line.l); put(R, line.r); ln.append(L, R); ti.append(ln); });
      var fFile = ti.querySelector(".bkf"), fLen = ti.querySelector(".bkn");
      if (fFile) tg(fFile, "file-line"); else tg(blk, "file-line", true);
      if (fLen) tg(fLen, "signature"); else tg(blk, "signature", true);
      hd.append(ti);
      var ps = fnPieces(x, S), sqs = E("div", { class: "sqs" });
      ps.forEach(function(p){ sqs.append(pieceNode(p.k, x, S, p.call ? "call" : "op")); });
      hd.append(sqs); blk.append(hd);
      var fl = E("div", { class: "flds bkfl" });
      ps.forEach(function(p){ fl.append(E("div", { class: "fld" }, pieceNode(p.k, x, S), E("span", { class: "fn" }, esc(p.op ? p.op.table : p.call.name)),
        E("span", { class: "ft" }, esc(p.op ? (p.op.rw === "w" ? "writes " : "reads ") + p.op.model : p.call.role)))); });
      blk.append(fl);
      bind(blk, function(){ return fnCard(x, F, S); });
      blk.addEventListener("click", function(){ if (portOn) window.selectIn("functions", x.name); else blk.classList.toggle("open"); });
      body.append(blk); });
    box.append(body);
    /* the footer: the hint, then what the marks are and how many, the commits and the inferred hops */
    var FS = C.footShow || ["icon", "count"], mix = {}, kinds = {}, order = [];
    list.forEach(function(x){ fnPieces(x, S).forEach(function(p){ if (!mix[p.k.key]) { order.push(p.k.key); kinds[p.k.key] = p.k; } mix[p.k.key] = (mix[p.k.key] || 0) + 1; }); });
    var RANK = ["read", "write", "accessor", "caller", "gate", "pure"]; order.sort(function(a, b){ return RANK.indexOf(a) - RANK.indexOf(b); });
    var foot = E("div", { class: "pfoot bkfoot" + FS.map(function(k){ return " fs-" + k; }).join("") });
    var FL = E("div", { class: "ftcol l" }), FR = E("div", { class: "ftcol r" }), total = list.length;
    var pills = box.querySelector('.phd .dcn[data-count="levels"]'); if (pills) tg(pills, "functions-behind-walk-levels");
    FL.append(footPart("hint", ico("info", 13, "currentColor"), portOn ? "click a function to open its record in the portrait" : "click a function to list its pieces here", "",
      function(){ return window.hcard({ title: "click a function", icon: "info", color: "var(--muted)",
        rows: [["opens", portOn ? "its record, in the portrait beside this panel" : "every piece of it, here"], ["counts", total + " functions over " + FNCOUNT[1].get(list) + " levels"]],
        plain: "a block is a function — click one to read all of it" }); }));
    order.forEach(function(k){ var kd = kinds[k], hx = list[0];
      FR.append(footPart(k, pieceNode(kd, hx, S).outerHTML, kd.word, String(mix[k]), function(){
        return window.hcard({ title: kd.word, value: mix[k] + (k === "read" || k === "write" ? " table touch" : " call") + (mix[k] === 1 ? "" : "es"),
          iconHtml: '<span class="cpmark">' + pieceNode(kd, hx, S).outerHTML + "</span>", color: kd.col, plain: kd.plain }); })); });
    var cmN = list.filter(function(x){ return x.commits; }).length, infN = list.filter(function(x){ return x.conf === "inferred"; }).length;
    FR.append(footPart("commit", '<i class="cdot"></i>', "commits", String(cmN), function(){ return window.hcard({ title: "commits", value: cmN + " of " + total + " functions", icon: "key", color: S.OPC.write,
      plain: "the function ends a DB transaction — its writes become permanent there" }); }));
    FR.append(footPart("inferred", '<i class="infsw"></i>', "inferred", String(infN), function(){ return window.hcard({ title: "inferred hops", value: infN + " of " + total, icon: "layers",
      rows: [["drawn as", M.inferred === "dashed" ? "a dashed block" : M.inferred === "tag" ? "a tag on the title" : "not marked on the block"]],
      plain: "a hop graft resolved and the scanner did not prove — a floor, never a census" }); }));
    foot.append(FL, FR); box.append(foot);
    COV.mark("CODE BEHIND", "functions"); COV.mark("SIGNATURE", "functions"); COV.mark("DOCSTRING", "functions"); }

  /* THE FUNCTION RECORD — rows, then two tables: the tables it touches, the functions it calls (a call row walks the record on) */
  function fnSel(F){ var n = (window.SEL || {}).functions; return n ? fnByName(F, n) : null; }
  function fnRecord(box, F, S){ var x = fnSel(F), I = F.identity, FN = F.functions;
    if (!x) { ptIdle(box, "its record opens here: what it does with the store, where it sits on the walk, its size, every table it touches and every function it calls."); return; }
    var b = E("div", { class: "ptbody ptrec" });
    var hd = E("div", { class: "rchd" }, E("span", { class: "rci" }, ico("function", 18, fnIconCol(x, S))), E("b", null, esc(x.name)));
    if (x.commits) hd.append(E("i", { class: "cdot" }));
    if (x.handler) tg(hd, "the-handler");
    b.append(hd);
    var FROW = { level: "functions-behind-walk-levels", file: "file-line", size: "signature", signature: "signature", behind: "functions-behind-walk-levels",
                 does: "roles-per-function", inside: "the-predicate-per-decision-point" };
    function row(key, icon, value, info){
      var r = E("div", { class: "rcrow", "data-row": key }, E("span", { class: "rci" }, icon), E("span", { class: "k" }, key), value);
      if (info) { var i = E("span", { class: "rcinfo" }, ico("info", 13, "currentColor")); bind(i, info); r.append(i); }
      if (key === "does") tg(r, doesIds(F, x.key, false)); else if (FROW[key]) tg(r, FROW[key], key === "inside");   /* inside: the conditions are on its info card */
      b.append(r); }
    row("role", ico(ROLEICO[x.role], 14, roleCol(x.role, S)), E("span", { class: "v" }, E("i", { class: "rcchip", style: chipLookOf(roleCol(x.role, S)) }, x.role)),
      card({ title: x.role, icon: ROLEICO[x.role], color: roleCol(x.role, S), sub: "its role", body: esc((S.LRDEF || {})["role:" + x.role] || "") }));
    row("entity", ico("entity", 14, x.entity_color), E("span", { class: "v", style: "color:" + x.entity_color }, esc(x.entity)));
    row("level", ico(x.handler ? "target" : "link", 14, "var(--muted)"), E("span", { class: "v" }, esc(x.handler ? "L0 · the endpoint's own function" : "L" + x.level + " · called by " + x.via)),
      x.handler ? null : card({ title: "hop " + x.level, icon: "layers", sub: x.conf === "inferred" ? "an inferred hop" : "an extracted hop",
        body: x.conf === "inferred" ? "graft resolved this call; the scanner did not prove it — a floor, never a census." : "proven by the suite's own AST pass." }));
    row("file", ico("file", 14, "var(--muted)"), E("span", { class: "v" }, esc(x.at || x.file)),
      x.at ? null : card({ title: x.name, icon: "file", sub: "opens at its file", body: esc(x.at_why || "no feed carries this function's line") }));
    row("size", ico("info", 14, "var(--muted)"), E("span", { class: "v" }, (x.lines == null ? "?" : x.lines) + " lines" + (x.async ? " · async" : "") + " · → " + camelWbr(x.returns)),
      x.god ? card({ title: "over the size flag", icon: "alert", sub: "god-object", body: "its body runs past 50 lines — the station's size flag." }) : null);
    if (x.commits) row("commits", ico("key", 14, S.OPC.write), E("span", { class: "v" }, "ends a DB transaction"));
    /* leftovers piece 6 — what its own code shows it doing here, what sits inside it, and what the map read of it */
    var dz = doesOf(F, x.key), DZ = FN.does;
    if (dz) { var dv = E("span", { class: "v" });
      if (dz.does.length) dz.does.forEach(function(w){ dv.append(E("i", { class: "rcchip", style: chipLookOf("#8794ab") }, w)); }); else dv.textContent = "— none of the four shows in its own code";
      if (dz.does.length >= 2) dv.append(E("i", { class: "rctwo" }, "holds " + dz.does.length));
      row("does", ico("target", 14, "var(--muted)"), dv, card({ title: "what it does here", icon: "target", sub: dz.does.length ? dz.does.join(" · ") : "none of the four",
        rows: dz.does.map(function(w){ return [w, (dz.why[w] || []).join(" · ")]; }).concat([["on this endpoint", DZ.two_or_more + " of " + DZ.of + " hold two or more · " + DZ.none + " show none"]]),
        body: esc(DZ.rule) })); }
    var inf = insideFn(F, x.key);
    if (inf) { var n6 = { raises: inf.raises.length, refusals: inf.refusals.length, commits: inf.commits.length, savepoints: inf.savepoints.length, swallows: inf.swallows.length };
      row("inside", ico("alert", 14, "var(--muted)"), E("span", { class: "v" }, esc(insideCount(n6) || "— nothing that can end or save")),
        card({ title: "inside " + x.name, icon: "alert", sub: inf.depth ? nWord(inf.depth, "call") + " below the handler" : "the handler itself",
          rows: inf.raises.map(function(r){ return [r.cls || "raise", (r.pred ? "when " + r.pred + " · " : "") + shortAt(r.at) + " → " + becomesWords(r)]; })
            .concat(inf.refusals.map(function(r){ return [String(r.status), (r.pred ? "when " + r.pred + " · " : "") + shortAt(r.at)]; }))
            .concat(inf.commits.map(function(k){ return [k.op || "commit", shortAt(k.at)]; }))
            .concat(inf.savepoints.map(function(a){ return ["savepoint", shortAt(a)]; }))
            .concat(inf.also_reached_by ? [["also reached from", nWord(inf.also_reached_by, "other endpoint")]] : []),
          body: esc((insideAll(F) || {}).reading || "") })); }
    if (!x.handler) { var g6 = x.insight;
      row("map facts", ico("doc", 14, "var(--muted)"), E("span", { class: "v" }, esc(g6 ? (g6.calls_nothing_else ? "calls no other project function" : "calls other project functions") + " · " + (g6.tables ? "touches " + nWord(g6.tables, "table") : "touches no table itself") : "— no facts for this function")),
        g6 ? card({ title: x.name, icon: "doc", sub: "what the map read of it",
          rows: [["lines", String(g6.lines == null ? "?" : g6.lines)], ["returns", g6.returns || "—"], ["used by", nWord(g6.used_by_api_files || 0, "route file") + " · " + nWord(g6.used_by_other_files || 0, "other file")],
                 ["its own words", g6.doc || "— it has no description in the code"]] }) : null); }
    if (x.handler) {
      row("signature", ico("doc", 14, "var(--muted)"), E("span", { class: "v" }, esc(String(I.gsig || "—").replace(/^async def /, "").slice(0, 34)) + "…"),
        card({ title: "signature", icon: "doc", sub: (I.sig || {}).async ? "async" : "sync", body: "<code>" + esc(I.gsig || "") + "</code>" }));
      row("doc", ico("doc", 14, "var(--muted)"), E("span", { class: "v" }, I.doc ? esc(I.doc.slice(0, 60)) : "— none in the feed"));
      row("behind", ico("layers", 14, "var(--muted)"), E("span", { class: "v" }, FN.behind.fns + " functions · reach " + FN.behind.depth),
        card({ title: "code behind", icon: "layers", sub: "every function the endpoint reaches",
          rows: [["the walk", FN.walk_levels.join(" · ") + " = " + FN.walk_total], ["graft sees", (FN.behind.fns - FN.walk_total) + " more the walk cannot"]],
          fields: FN.behind.names, body: esc(FN.walk_note) })); }
    if (x.ops.length) { var tt = tg(E("div", { class: "flds rctab wrapt", style: "--ec:" + x.entity_color }), "data-touching-functions");
      tt.append(E("div", { class: "rcth" }, E("span", { class: "c-f" }, "tables", E("i", { class: "rcfp", style: pillLook("fields", S) }, String(x.ops.length))),
        E("span", { class: "c-k" }, "channel"), E("span", { class: "c-t" }, "model")));
      x.ops.forEach(function(o){ var k = opKind(o.rw, S);
        var f = E("div", { class: "fld", "data-op": o.rw }, E("span", { class: "c-f" }, pieceNode(k, x, S), E("span", { class: "fn" }, esc(o.table))),
          E("span", { class: "c-k" }, '<i class="jdrw" style="--rwc:' + RWC[o.rw === "w" ? "w" : "r"] + '">' + (o.rw === "w" ? "W" : "R") + "</i>"),
          E("span", { class: "c-t ft" }, camelWbr(o.model)));
        bind(f, card({ title: o.table, icon: "model", color: k.col, sub: (o.rw === "w" ? "written" : "read") + " by " + x.name, rows: [["model", o.model]] }));
        tt.append(f); });
      b.append(tt); }
    if (x.calls.length) { var ct = E("div", { class: "flds rctab wrapt", style: "--ec:" + x.entity_color });
      ct.append(E("div", { class: "rcth" }, E("span", { class: "c-f" }, "calls", E("i", { class: "rcfp", style: pillLook("fields", S) }, String(x.calls.length))),
        E("span", { class: "c-k" }, "role"), E("span", { class: "c-t" }, "lines")));
      x.calls.forEach(function(c){ var k = callKind(c.role, S);
        var f = E("div", { class: "fld fcall", "data-call": c.name }, E("span", { class: "c-f" }, pieceNode(k, x, S), E("span", { class: "fn" }, esc(c.name))),
          E("span", { class: "c-k" }, '<i class="jdrw" style="--rwc:' + roleCol(c.role, S) + '">' + ROLECHIP[c.role] + "</i>"),
          E("span", { class: "c-t ft" }, c.lines == null ? "?" : String(c.lines)));
        bind(f, card({ title: c.name, icon: "function", color: roleCol(c.role, S), sub: c.role + " · L" + c.level, rows: [["file", c.file]], body: "click to open its record" }));
        f.addEventListener("click", function(){ window.selectIn("functions", c.name); });
        ct.append(f); });
      b.append(ct); }
    box.append(b);
    COV.mark("CODE BEHIND", "functions"); COV.mark("SIGNATURE", "functions"); COV.mark("DOCSTRING", "functions"); }

  /* ══════════════════════════════════════════════════════════════════════════════════════
     THE COMMAND PANEL (Phase 6 slice 1, 2026-09-17) — the console's ACT half.

     THE THING IS A PATH: one way a request through this door ends. Its pieces are its chain
     steps; its facts are status · kind · phase · the effect buckets · the tests that prove it ·
     the switches it crossed. The second thing is an EXIT (the row an ending lands on), the
     third a TEST CASE (a case that proves an exit).

     Four LAYOUTS are built, not chosen (operator 2026-09-14: "I want to be able to see all of
     them and then decide"): card · strip · ladder · matrix. Every §6 choice is a rail pick in
     blk-command. Nothing here is typed by hand — every count, name, status and colour is read
     from F.forms or window.STATION.
     ══════════════════════════════════════════════════════════════════════════════════════ */
  function cmdCfg(){ return window.CMD || {}; }
  /* the shell's hcard carries the PLAIN LINE last (the card law) but escapes nothing and draws no
     field list — this wrapper escapes every value and renders the fields in the local card's markup */
  function fieldsHtml(list){ return '<div class="cpsep"></div><div class="cpf">'
    + list.map(function(f){ return '<div class="cpfn2">' + esc(f) + "</div>"; }).join("") + "</div>"; }
  function cmdc(o){ var q = {}, k;
    for (k in o) if (k !== "fields") q[k] = o[k];
    q.title = esc(o.title == null ? "" : o.title);
    if (o.value != null) q.value = esc(o.value);
    if (o.sub) q.sub = esc(o.sub);
    q.rows = (o.rows || []).filter(Boolean).map(function(r){ return [esc(r[0]), esc(r[1]), r[2]]; });
    if (o.fields && o.fields.length) q.body = (o.body || "") + fieldsHtml(o.fields);
    return window.hcard(q); }
  function FRM(F){ var f = F && F.forms; return f && f.state === "present" ? f : null; }
  /* the five path KINDS — glyph, word and the reader-side line, one place */
  var CMDKIND = {
    success:    { ico: "target",   word: "success",    plain: "the way the endpoint answers when the work went right" },
    refusal:    { ico: "shield",   word: "refusal",    plain: "the endpoint says no on purpose — code someone wrote to stop this request" },
    framework:  { ico: "external", word: "framework",  plain: "FastAPI answered before your code ran" },
    validation: { ico: "schema",   word: "validation", plain: "the body did not match the shape the endpoint declares" },
    uncaught:   { ico: "alert",    word: "uncaught",   plain: "something raised and nothing caught it — the caller gets a 500" } };
  /* COLOUR IS READ, NEVER PASTED: the five kind colours are station tokens (ep-brief.md) */
  function kindCol(k, S){ return k === "success" ? S.OPC.read : k === "refusal" ? S.OPC.gate
    : k === "framework" ? S.KINDCOL.external : k === "validation" ? S.OPC.schema
    : k === "uncaught" ? (S.BADGE_COL.role || {}).accessor : "var(--muted)"; }
  function statusCol(st, S){ var d = String(st).charAt(0); return d === "2" ? S.OPC.read : d === "4" ? S.OPC.gate : S.OPC.write; }
  function hexTriple(c){ var h = String(c).replace("#", "");
    if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0]; }
  function mixHex(a, b, t){ var A = hexTriple(a), B = hexTriple(b);
    return "#" + [0, 1, 2].map(function(i){ var v = Math.round(A[i] + (B[i] - A[i]) * t).toString(16); return v.length < 2 ? "0" + v : v; }).join(""); }
  /* the PHASE ramp: one interpolation between two station tokens — early (route blue) to late (write orange) */
  function phaseCol(ph, F, S){ var PH = (FRM(F) || {}).phases || [], i = PH.indexOf(ph);
    if (i < 0) return "var(--muted)"; return mixHex(S.KINDCOL.route, S.OPC.write, PH.length > 1 ? i / (PH.length - 1) : 0); }
  function pathCol(p, F, S){ var C = cmdCfg();
    return C.colour === "mono" ? "var(--muted)" : C.colour === "status" ? statusCol(p.status, S)
      : C.colour === "phase" ? phaseCol(p.phase, F, S) : kindCol(p.kind, S); }
  /* choice 5 — all four names ride path.names; a name the feed does not carry is drawn as a dash,
     never invented, and the card says which name is missing */
  function pathName(p){ var C = cmdCfg(), N = p.names || {};
    var v = C.names === "detail" ? N.detail : C.names === "exception" ? N.exception
      : C.names === "phase" ? N.phase_status : N.drawn;
    return v == null || String(v) === "" ? null : String(v); }
  function pathWord(p){ return pathName(p) || (p.names || {}).drawn || p.id; }

  /* ── the CELLS the walk draws: choice 6 (success shown/hidden) · 7 (split/merged) · 4 (grouping) ── */
  function pathCells(F){ var C = cmdCfg(), fm = FRM(F); if (!fm) return [];
    var all = (fm.paths || []).slice();
    if (C.success === "hidden") all = all.filter(function(p){ return p.kind !== "success"; });
    var cells;
    if (C.sub === "merged") { var by = {}, ord = [];
      all.forEach(function(p){ var k = p.kind + "|" + p.status; if (!by[k]) { by[k] = []; ord.push(k); } by[k].push(p); });
      cells = ord.map(function(k){ return { lead: by[k][0], members: by[k], id: by[k][0].id }; }); }
    else cells = all.map(function(p){ return { lead: p, members: [p], id: p.id }; });
    var PH = fm.phases || [], kinds = [];
    (fm.paths || []).forEach(function(p){ if (kinds.indexOf(p.kind) < 0) kinds.push(p.kind); });
    function grp(c){ return C.group === "kind" ? kinds.indexOf(c.lead.kind) : C.group === "status" ? c.lead.status : 0; }
    cells.sort(function(a, b){
      var d = grp(a) - grp(b); if (d) return d;
      d = PH.indexOf(a.lead.phase) - PH.indexOf(b.lead.phase); if (d) return d;
      d = ((a.lead.n || {}).steps || 0) - ((b.lead.n || {}).steps || 0); if (d) return d;
      return String(a.id).localeCompare(String(b.id)); });
    return cells; }
  function pathById(F, id){ var fm = FRM(F); if (!fm) return null;
    return (fm.paths || []).filter(function(p){ return p.id === id; })[0] || null; }
  function exitById(F, id){ var fm = FRM(F); if (!fm) return null;
    return (fm.exits || []).filter(function(e){ return e.id === id; })[0] || null; }
  function selPath(F){ return pathById(F, (window.SEL || {}).path); }
  function selExit(F){ var S0 = window.SEL || {}; if (S0.exit) return exitById(F, S0.exit);
    var p = selPath(F); return p ? p.exit : null; }

  /* ── WHAT IS ON THE PATH, per part — the one place the projection's rule lives ── */
  function onPath(F, p){
    var out = { table: {}, schema: {}, field: {}, fieldIn: {}, fn: {}, "case": {}, rung: {}, lane: {}, dep: {}, bucket: {}, gate: {}, sw: {} };
    if (!p) return out;
    (p.effects.tables || []).forEach(function(t){ out.table[t] = 1; });
    var seenStep = {};
    (p.effects.steps || []).forEach(function(s){ if (!s.table || !s.bucket) return;
      var key = s.table + "/" + s.bucket + "/" + s.step; if (seenStep[key]) return; seenStep[key] = 1;
      var b = out.bucket[s.table] || (out.bucket[s.table] = {}); b[s.bucket] = (b[s.bucket] || 0) + 1; });
    var ex = p.exit || {}, resp = ex.response || {};
    if (resp.model) { out.schema[resp.model] = 1; var fi = out.fieldIn[resp.model] = {};
      (resp.fields || []).forEach(function(f){ out.field[f] = 1; fi[f] = 1; }); }
    /* the request shape rides every path that PASSED the validation gate */
    var passedVal = (p.chain || []).some(function(c){ return c.phase === "validation" && c.kind === "gate" && c.hit === false; });
    var req = ((F.data || {}).schemas || {}).request;
    if (passedVal && req && req.name) out.schema[req.name] = 1;
    /* the handler is on the path only when the request REACHED it — a middleware 429 or a validation
       422 never ran a line of it, and marking it there would be a lie the picture tells every time */
    var ranHandler = (p.chain || []).some(function(c){ return c.kind === "call" || c.kind === "collapsed"
      || c.kind === "branch" || (c.kind === "gate" && c.phase === "handler"); });
    var HN = ((F.functions || {}).handler || {}).name; if (HN && ranHandler) out.fn[HN] = "handler";
    (p.chain || []).forEach(function(c){
      if (c.fn && (c.kind === "call" || c.kind === "collapsed" || c.kind === "catch")) out.fn[String(c.fn).split("::").pop()] = c.kind === "catch" ? (c.catch_kind || "catch") : c.kind;
      if (c.kind === "gate") { out.gate[c.ref || c.i] = c.hit === true ? "fired" : "passed";
        if (c.sub) { out.dep[String(c.sub).replace(/^except\s+/, "")] = c.hit === true ? "fired" : "passed"; out.lane[String(c.sub)] = c.hit === true ? "fired" : "passed"; } }
      if (c.kind === "step" && c.sub === "middleware") out.lane[c.label] = "passed";
      if (c.kind === "switch") out.sw[c.ref] = c.switch_kind || "switch"; });
    /* the door's own deps: a gate the chain crossed names its dependency by the `sub` it carries */
    var G = ((F.security || {}).guards || []);
    G.forEach(function(g){ if (out.dep[g.name] || out.dep[g.via]) out.dep[g.name] = out.dep[g.name] || out.dep[g.via]; });
    if ((p.effects || {}).dependency === "ran") G.forEach(function(g){ if (!out.dep[g.name]) out.dep[g.name] = "passed"; });
    var J = cmdCfg().join || "exact";
    if (J === "exact") (p.tests || []).forEach(function(t){ out["case"][t.case] = t.conf || "joined"; });
    else if (J === "parsed") (((F.tests || {}).by_status || {})[String(p.status)] || []).forEach(function(cid){ out["case"][cid] = "name-parsed"; });
    /* WIDENING: the hook fetches on every path; a reason site whose value is this status is the
       client branch that reads it; the guard's 401 effects ride a 401 */
    var FE = ((FRM(F) || {}).frontend) || {};
    if (FE.hook && FE.hook.piece) out.rung[String(FE.hook.piece).split("#").pop()] = "fetches";
    (FE.reason_sites || []).forEach(function(r){ if (String(r.value) === String(p.status)) out.rung[String(r.piece).split("/").pop().replace(/\.tsx?#.*$/, "").replace(/#.*$/, "")] = "reads";
      if (String(r.value) === String(p.status)) out.rung[String(r.piece).split("#").pop()] = "reads"; });
    if (String(p.status) === "401") (FE.guards || (FE.guard ? [FE.guard] : [])).forEach(function(g){ (g.effects || []).forEach(function(e){ out.rung[e.call] = "effect"; }); });
    return out; }

  /* what this path gives each PART — the matrix's fill and the "on this path" strip read the same rule */
  function partFacts(F, p, part){
    var o = onPath(F, p), fm = FRM(F) || {}, FE = fm.frontend || {}, n = 0, words = [];
    if (part === "data") { n = (p.effects.tables || []).length;
      words = [(p.effects.n.committed || 0) + " committed", (p.effects.n.rolled_back || 0) + " rolled back", (p.effects.n.uncommitted || 0) + " uncommitted", (p.effects.n.maybe_committed || 0) + " maybe"]
        .filter(function(w){ return w.charAt(0) !== "0"; }); }
    else if (part === "schemas") { var r = (p.exit || {}).response || {}; n = (r.model ? 1 : 0) + (Object.keys(o.schema).length - (r.model ? 1 : 0));
      n = Object.keys(o.schema).length; words = Object.keys(o.schema); }
    else if (part === "functions") { n = Object.keys(o.fn).length; words = Object.keys(o.fn); }
    else if (part === "tests") { n = Object.keys(o["case"]).length; words = Object.keys(o["case"]).map(function(c){ return c + " · " + o["case"][c]; }); }
    else if (part === "widening") { var sites = (FE.reason_sites || []).filter(function(r2){ return String(r2.value) === String(p.status); });
      var gEff = (FE.guards || (FE.guard ? [FE.guard] : [])).reduce(function(a, g){ return a.concat(g.effects || []); }, []);   /* every tied guard, not one typed name (leftovers piece 10) */
      var eff = String(p.status) === "401" ? gEff.length : 0;
      n = sites.length + eff; words = sites.map(function(s){ return String(s.piece).split("#").pop() + " reads " + s.reads; })
        .concat(eff ? gEff.map(function(e){ return e.call; }) : []);
      if (cmdCfg().matrix === "hook") { n += FE.hook ? 1 : 0; if (FE.hook) words.push(String(FE.hook.piece).split("#").pop() + " fetches"); } }
    else if (part === "security") { n = (p.n.gates || 0) + (p.switches || []).length;
      words = [(p.n.gates || 0) + " gate(s) crossed", (p.switches || []).length + " switch(es)"]; }
    return { n: n, words: words }; }

  /* ── THE CELL: a station glyph · the hotkey letter · a count badge. The verb lives on the card. ── */
  var GRIDKEYS = "QWERTASDFGZXCVB";
  function hotLetters(list){ var C = cmdCfg(), used = {}, out = [];
    list.forEach(function(o, i){
      if (C.keys === "off") { out.push(null); return; }
      if (C.keys !== "mnemonic") { out.push(GRIDKEYS.charAt(i) || null); return; }
      var m = String(o.verb || "").toUpperCase().replace(/[^A-Z]/g, ""), pick = null;
      for (var j = 0; j < m.length; j++) if (!used[m.charAt(j)]) { pick = m.charAt(j); break; }
      if (pick) used[pick] = 1; out.push(pick); });
    return out; }
  function tipBind(el, cardFn, capFn){ var C = cmdCfg();
    if (C.tip === "hover" || !C.tip) { bind(el, cardFn); return el; }
    el.addEventListener("mouseenter", function(){ var host = document.querySelector("#cmd .cmdtip"); if (!host) return;
      host.innerHTML = C.tip === "caption" ? '<span class="capl">' + (capFn ? capFn() : "") + "</span>" : cardFn(); });
    el.addEventListener("focus", function(){ var host = document.querySelector("#cmd .cmdtip"); if (!host) return;
      host.innerHTML = C.tip === "caption" ? '<span class="capl">' + (capFn ? capFn() : "") + "</span>" : cardFn(); });
    return el; }
  function cellNode(o, F, S){ var C = cmdCfg(), z = C.size || 64;
    var el = E("button", { class: "cmdcell sc2f face-" + (C.face || "valley") + " st-" + (o.state || "lit") + (o.on ? " on" : "") });
    el.style.setProperty("--tc", o.col || "var(--muted)");
    el.style.setProperty("--cz", z + "px");
    if (o.cmd) el.dataset.cmd = o.cmd;
    if (o.path) el.dataset.path = o.path;
    if (o.exit) el.dataset.exit = o.exit;
    if (o.state === "blank") { el.setAttribute("aria-hidden", "true"); el.disabled = true; return el; }
    el.insertAdjacentHTML("beforeend", '<i class="cgh">' + ico(o.ico, Math.round(z * 1.9), "currentColor") + "</i>");
    el.insertAdjacentHTML("beforeend", '<span class="cg">' + ico(o.ico, Math.round(z * 0.30), "currentColor") + "</span>");
    if (o.hot) el.append(E("i", { class: "chot" }, esc(o.hot)));
    if (o.badge != null) el.append(E("span", { class: "cbadge" }, esc(String(o.badge))));
    if (o.label && z >= 64) el.append(E("span", { class: "clbl" }, esc(o.label)));
    if (o.flag) { var fg = E("i", { class: "cflag" }); fg.insertAdjacentHTML("beforeend", ico("swords", 11, "currentColor"));
      bind(fg, function(){ return flagCard(o.flag, F, S); }); el.classList.add("hasflag"); el.append(tg(fg, "switches")); }
    /* an empty cell says WHY it is empty — before the plain line, which stays last (the hover-card law) */
    var why = (o.state === "hollow" || o.state === "hatched") && o.card ? slotWhy(F, o.state, o.arm) : null;
    el.dataset.slot = o.state || "lit";
    if (o.fa) tg(el, o.fa);
    if (why) tg(el, "why-this-slot-is-empty", true);
    tipBind(el, why ? function(){ var h = o.card(), note = '<div class="cpnote slotwhy">' + esc(why) + "</div>", i = h.indexOf('<div class="cpend">');
      return i < 0 ? h + note : h.slice(0, i) + note + h.slice(i); } : o.card, o.cap);
    if (o.act) el.addEventListener("click", function(ev){ ev.stopPropagation(); o.act(); });
    return el; }

  /* ── WHAT AN EMPTY SLOT MEANS (leftovers piece 2). A slot is LIT when it holds facts · HOLLOW when the reading that fills it
     RAN here and found none (a measured zero) · HATCHED when that reading did not run on this feed (a zero would be a guess) ·
     BLANK when this kind of element has no such slot. `arm` is the reading that fills the slot; null = the endpoint pass itself. ── */
  var PART_ARM = { data: "effects", schemas: "short", functions: "kinds", tests: "tests", widening: "frontend", security: "contract" };
  function armsOn(F){ var fm = (F && F.forms) || {}; return fm.state === "present" ? (((fm.source || {}).arms_on) || []) : null; }
  function slotState(F, n, arm, notApplicable){
    if (notApplicable) return "blank";
    if (n) return "lit";
    var on = armsOn(F); if (!on) return "hatched";
    return !arm || on.indexOf(arm) >= 0 ? "hollow" : "hatched"; }
  function slotWhy(F, state, arm){
    return state === "hatched" ? (armsOn(F) ? "the " + arm + " reading did not run on this feed — a zero here would be a guess" : "this feed carries no form for the endpoint — nothing was read")
      : state === "hollow" ? "the reading ran and found none — a measured zero" : state === "blank" ? "this kind of element has no such slot" : null; }
  window.slotState = slotState; window.slotWhy = slotWhy;
  /* ── PROOF YOU CAN OPEN (leftovers piece 5): why a test came to this endpoint, and what it really asked for ── */
  var ROLEWORD = { act: "tests this endpoint", arranged: "calls it to set something else up", "service-raises": "proves an ending from the service side, without calling the endpoint",
                   "helper-arranged": "reaches it only through a shared helper", "named-only": "listed by the map, makes no call here" };
  /* leftovers piece 10 (the lab half) — what the client does with one ending, from the feed's own routing: its own branch or the general case,
     whether the call is tried again, and — on a success — what is refreshed and which guards read it */
  /* leftovers piece 10 (the generation's carry, Slice 11e) — what the client's own branch DOES with an ending: one short phrase per row of the
     feed's does[], in the order the code runs them. What happens in the code is said; where a name came from (`from`, `by`) is about the map and stays out (D-017). */
  var DOESWORD = {
    navigate: function(d){ return d.to ? "goes to “" + d.to + "”" : "goes to another page"; },
    "throw":  function(d){ return "throws " + (d.callee ? "a " + d.callee : "an error") + (d.args && typeof d.args[0] === "string" ? " — “" + d.args[0] + "”" : ""); },
    render:   function(d){ return "shows a “" + (d.tag || "block") + "” on screen"; },
    "return": function(d){ return d.bare ? "stops here" : d["null"] ? "hands back nothing" : d.literal != null ? "hands back the text “" + d.literal + "”"
                : (d.reads || []).length ? "hands back the server’s " + d.reads.join(" and ") : "hands back a value"; },
    retry:    function(){ return "sends the same request again"; },
    refresh:  function(d){ var k = d.key ? "“" + [].concat(d.key).join(" · ") + "”" : "the data it had"; return d.how === "write" ? "rewrites its saved copy of " + k : "asks the server again for " + k; },
    request:  function(d){ return d.method && d.path ? "calls " + d.method + " " + d.path : "makes another request"; },
    message:  function(d){ return d.key ? "looks up the text “" + d.key + "”" : "looks up a text"; },
    surface:  function(d){ return "shows a pop-up message" + (d.level ? " (" + d.level + ")" : ""); },
    state:    function(d){ return d.how === "store" ? "changes the shared store" : d.how === "storage" ? "writes to the browser’s storage" : "changes what the screen remembers"; },
    log:      function(){ return "writes a line to the console"; },
    other:    function(d){ var a = d.args && typeof d.args[0] === "string" ? "“" + d.args[0] + "”" : "", c = String(d.callee || "a function").replace(/\s+/g, "");
                return d.returned ? "hands back what " + c + "(" + a + ") gives" : "calls " + c + "(" + a + ")"; } };
  var DOESSTATE = { "no-rows": "nothing of its own — the check only picks a value", "beyond one level": "whoever calls this function decides",
                    empty: "it only sets values — nothing is called, shown or handed back", unread: "not read — the condition is too long to read" };
  function doesWords(rt){
    if (!rt || rt.does_state == null) return "not read — this feed does not say what a branch does";
    var ds = rt.does || [];
    if (!ds.length) return DOESSTATE[rt.does_state] || String(rt.does_state);
    var more = ds.length - 3 + (rt.does_more || 0);
    return ds.slice(0, 3).map(function(d){ return (DOESWORD[d["class"]] || DOESWORD.other)(d); }).join(" · then ")
      + (more > 0 ? " · and " + more + " more" : "") + (rt.does_state === "mixed" ? " — two checks on one line share these" : ""); }
  window.doesWords = doesWords;
  function clientRows(F, e){ var FE = ((FRM(F) || {}).frontend) || {}, out = [];
    if (!FE.present) return [["the client", "not read — the frontend reading is off"]];
    var rd = (FE.readers || [])[0], rt = rd ? (rd.routes || []).filter(function(r){ return r.exit === e.id; })[0] : null;
    if (e.kind === "success") {
      var ref = (FE.after_success || []).filter(function(x){ return x.how === "refetched"; }), fil = (FE.after_success || []).filter(function(x){ return x.how !== "refetched"; });
      out.push(["then refetched", ref.length ? ref.map(function(x){ return "“" + (x.key || []).join(" · ") + "”"; }).join(" and ") + " · " + shortAt(ref[0].at) : "nothing"]);
      if (fil.length) out.push(["filled in at once", fil.map(function(x){ return "“" + (x.key || []).join(" · ") + "”"; }).join(" and ") + " · " + shortAt(fil[0].at)]);
      if ((FE.guards || []).length) out.push(["guards that read it", FE.guards.map(function(g){ return String(g.piece).split("#").pop(); }).join(" · ")]); }
    else if (rt) out.push(["its branch", rt.own_branch ? "its own, at " + shortAt(rt.at) + " — it reads the " + (rt.reads || "status") + " only"
        + ((rd.shared || []).some(function(sh){ return sh.exits.indexOf(e.id) >= 0; }) ? ", so " + (rd.shared.filter(function(sh){ return sh.exits.indexOf(e.id) >= 0; })[0].exits.length) + " endings share it" : "")
      : "none of its own — it falls to the general case, as " + rd.n.general + " of the " + rd.n.routed + " routed endings do"]);
    else out.push(["its branch", rd ? "the client's reading routes no branch to this ending" : "no client code reads this endpoint's failures"]);
    if (rt && rt.own_branch) out.push(["what it does", doesWords(rt)]);
    var ry = FE.retry || {};
    if (e.kind !== "success") out.push(["tried again", ry.state === "defined" || ry.state === "default" ? (ry.value === false || ry.value === 0 ? "never — retry is off for this kind of call" : "yes — " + String(ry.value) + " (" + ry.state + ")") : "not read"]);
    return out; }
  /* leftovers piece 8 — the rule on a field or a column, in words, from the feed's own reading of the declaration */
  var LIMITW = { min_length: "at least {v} characters", max_length: "at most {v} characters", ge: "{v} or more", gt: "more than {v}", le: "{v} or less", lt: "less than {v}",
                 pattern: "must match {v}", multiple_of: "a multiple of {v}", min_items: "at least {v} items", max_items: "at most {v} items" };
  function limitWords(cs){ return Object.keys(cs || {}).sort().map(function(k){ var v = cs[k]; v = (v && typeof v === "object") ? JSON.stringify(v) : String(v);
    return (LIMITW[k] ? LIMITW[k].replace("{v}", v) : k.replace(/_/g, " ") + " " + v).replace(/\b1 (character|item)s\b/, "1 $1"); }); }
  function fieldRuleRows(sc, name){ if (!sc) return [];
    if (!sc.rules) return sc.rules_why ? [["its rule", "not read — " + sc.rules_why]] : [];
    var r = sc.rules[name]; if (!r) return [["its rule", "the feed reads no declaration for this field"]];
    var lim = limitWords(r.constraints), out = [["must be sent", r.required ? "yes — a body without it is refused" : "no — it has a default"]];
    out.push(["its limits", lim.length ? lim.join(" · ") : "none declared"]);
    (r.validators || []).forEach(function(v){ out.push(["also checked by", v.name + (v.normalises.length ? " — it " + v.normalises.join(", ") + "s the value first" : "")
      + (v.rules.length ? " · refuses when " + v.rules.map(function(x){ return x.pred + (x.msg ? " (“" + x.msg + "”)" : ""); }).join(" · ") : "")]); });
    out.push(["declared at", r.at || "—"]); return out; }
  var ONDEL = { CASCADE: "deleting that row deletes this one", "SET NULL": "deleting that row empties this column", RESTRICT: "that row cannot be deleted while this one points at it",
                "NO ACTION": "that row cannot be deleted while this one points at it", "SET DEFAULT": "deleting that row resets this column" };
  function columnRuleRows(t, name){ if (!t) return [];
    if (!t.rules) return t.rules_why ? [["its rule", "not read — " + t.rules_why]] : [];
    var c = (t.rules.columns || {})[name]; if (!c) return [["its rule", "the feed reads no declaration for this column"]];
    var out = [["may be empty", c.nullable === true ? "yes" : c.nullable === false ? "no" : "not read"]];
    out.push(["when nobody sets it", c.server_default != null ? "the database writes " + c.server_default : c.default != null ? "the code writes " + c.default : "nothing fills it"]);
    if (c.fk) out.push(["if the row it points at is deleted", c.fk.ondelete ? (ONDEL[String(c.fk.ondelete).toUpperCase()] || c.fk.ondelete) : "no rule declared"]);
    if (c.type) out.push(["database type", c.type]);
    if (c.db_name) out.push(["in the database", "the column is named " + c.db_name]);
    out.push(["declared at", c.at || "—"]); return out; }
  function tableRuleRows(t){ if (!t || !t.rules) return [];
    var R = t.rules, out = [];
    (R.uniques || []).forEach(function(u){ out.push(["unique", u.cols.join(" + ") + " · " + (u.at || "—")]); });
    (R.checks || []).forEach(function(k){ out.push(["check", (k.name || "unnamed") + " · " + (k.at || "—")]); });
    if (!out.length) out.push(["table rules", "no unique or check rule declared"]);
    return out; }
  /* leftovers piece 7 — how common a piece is: its count in this app and in the other apps read, as two card rows */
  function commonPiece(F, key){ var P = (F.feedwide || {}).pieces; if (!P) return null; return (P.rows || []).filter(function(r){ return r.key === key; })[0] || null; }
  function commonRows(F, key){ var r = commonPiece(F, key); if (!r) return [];
    var out = [["in this app", r.words + " — " + r.n + " of " + r.of + " endpoints · " + r.word]];
    var el = (r.elsewhere || []).slice().sort(function(a, b){ return (a.state === "present" ? 0 : 1) - (b.state === "present" ? 0 : 1); });   /* the apps that were read first, the one that could not be last */
    var ew = el.map(function(e){ return e.app + " " + (e.state === "present" ? e.n + " of " + e.of : "not measured"); });
    if (ew.length) out.push(["in the other apps", ew.join(" · ")]);
    return out; }
  function rateRows(F){ var P = (F.feedwide || {}).pieces; if (!P) return []; var mine = (P.rows || []).filter(function(r){ return r.family === "rate"; })[0]; if (!mine) return [];
    return [["rate tier", mine.words + " · " + mine.n + " of " + mine.of + " endpoints"],
            ["the other tiers", (P.rate_tiers || []).filter(function(t){ return "rate:" + t.tier !== mine.key; }).map(function(t){ return t.n + (t.tier === "none" ? " with no limit read" : " on " + t.tier.replace(/\+/g, " and ")); }).join(" · ") || "—"]]; }
  function ordinalSpan(a, b){ return a === b ? ordinal(a) : ordinal(a) + " to " + ordinal(b); }
  function proofRows(F){ var Q = (F.feedwide || {}).proof; if (!Q) return [];
    return [["a test names", Q.tested + " of its " + Q.produced + " endings · " + ordinalSpan(Q.rank, Q.rank_to) + " of " + Q.of + (Q.ties > 1 ? " — " + Q.ties + " endpoints tie" : "")],
            ["in this app", Q.app.tested + " of " + Q.app.produced + " endings · " + Q.none + " endpoints name none · the middle endpoint names " + Q.median_tested]]; }
  /* leftovers piece 6 — inside the calls: the feed's function rows this endpoint reaches, joined to a chain row by `file::fn` */
  function insideAll(F){ var I = (FRM(F) || {}).inside; return I && I.state === "present" ? I : null; }
  function insideCall(F, fn){ var I = insideAll(F); return I ? ((I.calls || {})[fn] || null) : null; }
  function insideFn(F, key){ var I = insideAll(F); if (!I) return null; return (I.functions || []).filter(function(r){ return r.fn === key; })[0] || null; }
  function shortAt(at){ return String(at || "—").split("/").slice(-2).join("/"); }
  function nWord(n, one, many){ return n + " " + (n === 1 ? one : (many || one + "s")); }
  function insideCount(n){ var out = [];
    if (n.raises) out.push(nWord(n.raises, "failure")); if (n.refusals) out.push(nWord(n.refusals, "refusal"));
    if (n.commits) out.push(nWord(n.commits, "save")); if (n.savepoints) out.push(nWord(n.savepoints, "savepoint")); if (n.swallows) out.push(nWord(n.swallows, "swallowed failure"));
    return out.join(" · "); }
  function insightWords(g){ if (!g) return "the map read no facts for it";
    return (g.lines == null ? "?" : g.lines) + " lines · → " + (g.returns || "—") + " · " + (g.calls_nothing_else ? "calls no other project function" : "calls other project functions")
      + " · " + (g.tables ? "touches " + nWord(g.tables, "table") : "touches no table itself"); }
  function becomesWords(x){ return x.here.length ? "the " + x.here.map(function(h){ return h.status + " at " + shortAt(h.at); }).join(" · ")
    : x.uncaught_here.length ? "nothing here catches it — it leaves as the " + x.uncaught_here.map(function(h){ return h.status; }).join(" · ")
    : x.here_word === "beyond one level" ? "not read — the reading stops one call down"
    : x.here_word === "not joined" ? "not joined — the reading found no ending of this endpoint that carries it"
    : x.here_word === "after the response line" ? "no status can carry it — the answer had already started"
    : String(x.here_word || "unknown"); }
  function lineOf(at){ var m = /:(\d+)$/.exec(String(at || "")); return m ? ":" + m[1] : "—"; }
  function becomesShort(x){ return x.here.length ? x.here.map(function(h){ return h.status; }).join(" · ") : x.uncaught_here.length ? "uncaught " + x.uncaught_here.map(function(h){ return h.status; }).join(" · ")
    : x.here_word === "beyond one level" ? "not read" : String(x.here_word || "unknown"); }
  function doesOf(F, key){ var D = (F.functions || {}).does; if (!D) return null; return (D.rows || []).filter(function(r){ return r.fn === key; })[0] || null; }
  function rosterOf(F, cid){ return ((F.tests || {}).roster || []).filter(function(r){ return r.cid === cid; })[0] || null; }
  function assertWords(a){ if (!a) return null; var out = [];
    Object.keys(a).forEach(function(k){ var v = a[k]; out.push(k + " " + (Array.isArray(v) ? v.join(" · ") : String(v))); }); return out.join(" · ") || null; }
  window.rosterOf = rosterOf;

  /* ── the 15 VERBS of the kind card (path-map-status.md §6, the entity command card) ── */
  function cmdVerbs(F, S){
    var fm = FRM(F), C = cmdCfg(), sel = selPath(F), ex = selExit(F), cells = pathCells(F);
    var paths = (fm.paths || []), exits = (fm.exits || []);
    var refus = paths.filter(function(p){ return p.kind === "refusal"; }), succ = paths.filter(function(p){ return p.kind === "success"; });
    var untested = exits.filter(function(e){ return !(e.tests || []).length; });
    var writes = sel ? (sel.effects.writes || []) : uniq(paths.reduce(function(a, p){ return a.concat(p.effects.writes || []); }, []));
    var gateN = sel ? (sel.n.gates || 0) : uniq(paths.reduce(function(a, p){ return a.concat((p.chain || []).filter(function(c){ return c.kind === "gate"; }).map(function(c){ return c.ref; })); }, [])).length;
    var testN = ex ? uniq((ex.tests || []).map(function(t){ return t.case; })).length : uniq(exits.reduce(function(a, e){ return a.concat((e.tests || []).map(function(t){ return t.case; })); }, [])).length;
    var K1 = (fm.slots || {}).K1 || {}, U7 = (fm.slots || {}).U7 || {};
    function go(part, id){ return function(){ if (part) window.showTab(part); if (id) window.selectIn(part, id); }; }
    var L = [];
    L.push({ cmd: "walk", ico: "journey", verb: "Walk a path", state: "lit", badge: cells.length, col: "var(--accent)",
      card: function(){ return cmdc({ title: "Walk a path ▸", value: cells.length + " of " + paths.length, icon: "journey", color: "var(--accent)",
        rows: [["swaps", "the grid to one cell per path"], ["shown", cells.length + (C.sub === "merged" ? " merged cells" : " paths")],
               ["grouped by", C.group], ["named by", C.names]],
        plain: "one cell per way a request through this endpoint can end — pick one and the whole console follows it" }); },
      cap: function(){ return "walk a path — " + cells.length + " ways this endpoint can end"; },
      act: function(){ window.CMD.mode = window.CMD.mode === "path" ? "cmd" : "path"; window.drawCmd(); } });
    L.push({ cmd: "prev", ico: "up", verb: "Previous exit", state: slotState(F, exits.length, null), arm: null,
      card: function(){ return cmdc({ title: "previous exit", value: ex ? ex.status + " · " + ex.phase : "none open", icon: "up",
        rows: [["order", "request order — " + (fm.stages || []).length + " stages"], ["now", ex ? ex.id : "—"]],
        plain: "step back one ending, the way the request meets them" }); },
      cap: function(){ return "previous exit in request order"; }, act: function(){ window.stepExit(-1); } });
    L.push({ cmd: "next", ico: "down", verb: "Next exit", state: slotState(F, exits.length, null), arm: null,
      card: function(){ return cmdc({ title: "next exit", value: exits.length + " exits", icon: "down",
        rows: [["order", "request order"], ["now", ex ? ex.id : "—"]],
        plain: "step forward one ending, the way the request meets them" }); },
      cap: function(){ return "next exit in request order"; }, act: function(){ window.stepExit(1); } });
    L.push({ cmd: "refusals", ico: "shield", verb: "Show refusals", state: slotState(F, refus.length, "paths"), arm: "paths", badge: refus.length, col: kindCol("refusal", S),
      card: function(){ return cmdc({ title: "show refusals", value: refus.length, icon: "shield", color: kindCol("refusal", S),
        rows: [["written refusals", String(refus.length)], ["framework", String(paths.filter(function(p){ return p.kind === "framework"; }).length) + " — FastAPI answered first"],
               ["validation", String(paths.filter(function(p){ return p.kind === "validation"; }).length)], ["uncaught", String(paths.filter(function(p){ return p.kind === "uncaught"; }).length) + " — shown apart, it is not a refusal"],
               ["U7 rows", String(U7.rows == null ? "unknown" : U7.rows)]],
        plain: "every ending someone wrote on purpose to stop the request" }); },
      cap: function(){ return refus.length + " written refusals · the 500 is counted apart"; },
      act: function(){ window.CMD.mode = "path"; window.CMD.only = window.CMD.only === "refusal" ? null : "refusal"; window.drawCmd(); } });
    L.push({ cmd: "success", ico: "target", verb: "Show success", state: slotState(F, succ.length, "paths"), arm: "paths", badge: succ.length, col: kindCol("success", S),
      card: function(){ return cmdc({ title: "show success", value: succ.length, icon: "target", color: kindCol("success", S),
        rows: [["paths", succ.map(function(p){ return p.names.drawn; }).join(" · ")], ["all", "GENERATED — the drawn-by-hand source is gone"],
               ["declared", (fm.declared || {}).response_model ? fm.declared.response_model.name + " · " + fm.declared.success.status : "—"]],
        plain: "the ways the work finished — all three come from the feed now, none is drawn by hand" }); },
      cap: function(){ return succ.length + " success paths, all generated"; },
      act: function(){ window.CMD.mode = "path"; window.CMD.only = window.CMD.only === "success" ? null : "success"; window.drawCmd(); } });
    L.push({ cmd: "writes", ico: "table", verb: "Show writes", state: slotState(F, writes.length, "effects"), arm: "effects", badge: writes.length, col: S.OPC.write,
      card: function(){ return cmdc({ title: "show writes", value: writes.length + " table(s)", icon: "table", color: S.OPC.write,
        rows: [["scope", sel ? "this path — " + pathWord(sel) : "every path"],
               sel ? ["committed", String(sel.effects.n.committed)] : null,
               sel ? ["rolled back", String(sel.effects.n.rolled_back)] : null,
               sel ? ["uncommitted", String(sel.effects.n.uncommitted)] : null,
               ["commit", "one DB transaction — never a git commit"]],
        fields: writes, plain: "the tables this ending changes, and whether the change survived" }); },
      cap: function(){ return writes.length + " tables written" + (sel ? " on " + pathWord(sel) : " across every path"); },
      act: go("data", writes[0] || null) });
    L.push({ cmd: "pre", ico: "angle", verb: "Show preconditions", state: slotState(F, (fm.preconditions || []).length, null), arm: null, badge: (fm.preconditions || []).length, col: S.OPC.gate,
      card: function(){ return cmdc({ title: "show preconditions", value: (fm.preconditions || []).length, icon: "angle", color: S.OPC.gate,
        rows: (fm.preconditions || []).map(function(x){ return [String(x.status), x.pred]; }),
        plain: "the tests the handler runs before it will do the work" }); },
      cap: function(){ return (fm.preconditions || []).length + " preconditions before the work runs"; },
      act: go("security", null) });
    L.push({ cmd: "gates", ico: "key", verb: "Show gates", state: slotState(F, gateN, "paths"), arm: "paths", badge: gateN, col: S.OPC.gate,
      card: function(){ return cmdc({ title: "show gates", value: gateN, icon: "key", color: S.OPC.gate,
        rows: [["scope", sel ? "crossed on " + pathWord(sel) : "every gate in the feed"],
               ["deps", ((F.security || {}).guards || []).length + " · " + ((F.security || {}).gates || []).length + " can refuse"],
               ["app band", ((F.security || {}).asgi || []).length + " ASGI lanes, app scope"]],
        plain: "every check the request has to get past before the work runs" }); },
      cap: function(){ return gateN + " gates" + (sel ? " on this path" : " in the feed"); }, act: go("security", null) });
    L.push({ cmd: "findings", ico: "alert", verb: "Show findings", state: slotState(F, (fm.findings || []).length, null), arm: null, badge: (fm.findings || []).length, col: (S.BADGE_COL.role || {}).accessor,
      card: function(){ return cmdc({ title: "show findings", value: (fm.findings || []).length, icon: "alert", color: (S.BADGE_COL.role || {}).accessor,
        rows: (fm.findings || []).map(function(f){ return [f.id, f.slot + (f.status ? " · " + f.status : "") + (f.n ? " · " + f.n : "")]; }),
        plain: "the faults the forms pass found in the way this endpoint answers" }); },
      cap: function(){ return (fm.findings || []).map(function(f){ return f.id; }).join(" · "); }, act: go("security", null) });
    L.push({ cmd: "declared", ico: "info", verb: "Declared vs produced", state: slotState(F, (K1.produced || []).length, null), arm: null, badge: (K1.produced || []).length,
      card: function(){ return cmdc({ title: "declared vs produced", value: (K1.declared || []).length + " declared · " + (K1.produced || []).length + " produced", icon: "info",
        rows: [["declares", ((fm.declared || {}).success || {}).status ? String(fm.declared.success.status) : "—"],
               ["declares refusals", (fm.declared || {}).refusals && fm.declared.refusals.length ? fm.declared.refusals.join(" · ") : "none"],
               ["produces", (K1.produced || []).join(" · ")], ["K1", String(K1.state)]],
        plain: "the endpoint's promise beside what it actually answers — the gap a client cannot plan for" }); },
      cap: function(){ return "declares " + (((fm.declared || {}).success || {}).status || "—") + " · produces " + (K1.produced || []).join(" · "); },
      act: go("tests", null) });
    L.push({ cmd: "tests", ico: "test", verb: "Tests for this exit", state: slotState(F, testN, "tests"), arm: "tests", badge: testN, col: testCol(),
      card: function(){ return cmdc({ title: "tests for this exit", value: testN + " case(s)", icon: "test", color: testCol(),
        rows: [["exit", ex ? ex.status + " · " + ex.phase : "no exit open — counting every exit"],
               ["join", C.join === "exact" ? "exact — the forms tests arm" : C.join === "parsed" ? "name-parsed, dashed" : "off"]],
        fields: ex ? (ex.tests || []).map(function(t){ return t.case + " · " + t.conf; }) : null,
        plain: "the cases that prove this ending — and how sure the join is" }); },
      cap: function(){ return testN + " cases prove " + (ex ? ex.status : "the exits"); }, act: go("tests", null) });
    L.push({ cmd: "untested", ico: "swords", verb: "Untested exits", state: slotState(F, untested.length, "tests"), arm: "tests", badge: untested.length, col: (S.BADGE_COL.role || {}).accessor,
      card: function(){ return cmdc({ title: "untested exits", value: untested.length + " of " + exits.length, icon: "swords", color: (S.BADGE_COL.role || {}).accessor,
        rows: untested.map(function(e){ return [String(e.status), e.phase + (e.via ? " · " + e.via : "")]; }).concat(proofRows(F)),
        plain: "endings no case has ever asserted — nothing proves the client sees what the endpoint sends" }); },
      cap: function(){ return untested.length + " exits no case asserts"; }, act: go("tests", null) });
    L.push({ cmd: "handler", ico: "file", verb: "Open the handler", state: "lit",
      card: function(){ return cmdc({ title: "open the handler", value: (F.functions.handler || {}).name, icon: "file",
        rows: [["file", F.identity.at || F.identity.file], ["lines", String((F.identity.sig || {}).lines)], ["in the lab", "opens Functions with the handler selected"]],
        plain: "the file and line this endpoint is written at — where you go to change it" }); },
      cap: function(){ return F.identity.at || F.identity.file; },
      act: go("functions", (F.functions.handler || {}).name) });
    L.push({ cmd: "up", ico: "layers", verb: "Up to entity", state: "hatched",
      card: function(){ return cmdc({ title: "up to entity", value: (F.identity.above || []).length + " levels", icon: "layers",
        rows: (F.identity.above || []).map(function(a){ return [a.kind, a.label]; }).concat([["hatched", "the console transports to those levels in the graph — the lab has no graph to walk to"]]),
        plain: "one step out of this endpoint — the three levels above it are named here" }); },
      cap: function(){ return (F.identity.above || []).map(function(a){ return a.label; }).join(" ↑ ") + " — hatched, the lab has no graph"; },
      act: null });
    L.push(clearDef());
    return L; }
  /* the CORNER cells — bottom-right, in every mode of the card (path-map-status.md §6: SC2's cancel corner,
     "two screen edges, the largest target, the highest click frequency"; operator 2026-09-17 on first look:
     the card had dropped it in its own sub-menu). Clear on the verb and entity cards; Back on the path grid. */
  function clearDef(){ return { cmd: "clear", ico: "skip", verb: "Clear", state: "lit", col: "var(--accent)",
      card: function(){ return cmdc({ title: "clear", value: "Esc", icon: "skip", color: "var(--accent)",
        rows: [["clears", "the path, the exit and the case"], ["key", "Esc, or B"], ["place", "bottom-right — the corner keeps its place in every mode of the card"]],
        plain: "put everything back — no path in force, every part unmarked" }); },
      cap: function(){ return "clear the selection — Esc"; }, act: function(){ window.clearPath(); } }; }
  function backDef(){ return { cmd: "back", ico: "up", verb: "Back", state: "lit", col: "var(--accent)",
      card: function(){ return cmdc({ title: "back", value: "B", icon: "up", color: "var(--accent)",
        rows: [["returns to", "the fifteen verbs"], ["keeps", "the path in force — Esc is what clears it"], ["place", "bottom-right — the corner keeps its place in every mode of the card"]],
        plain: "one level up — the verb card again, nothing cleared" }); },
      cap: function(){ return "back to the verbs — B (Esc clears)"; },
      act: function(){ window.CMD.mode = "cmd"; window.CMD.only = null; window.drawCmd(); } }; }
  /* lift the clear cell out of a verb list so the grid can pin it to the corner; a list without one gets one */
  function cornerOf(list){ for (var i = 0; i < list.length; i++) if (list[i].cmd === "clear") return list.splice(i, 1)[0]; return clearDef(); }

  /* ══ THE VERB GROUPINGS — the `verbs` pick (operator 2026-09-17: "build both, selectable on
     command panel on the left"). Both groupings are drawn on the REAL card; neither is a ruling.

       rows · the card as it was first built — fifteen verbs in three unnamed rows. Nothing moves.
       g1   · command-map.html §6 G1: the SAME fifteen cells in the same places, with each row NAMED.
              The name is drawn as a caption strip ACROSS the row (grid-column 1 / -1), never as a
              column beside the grid: the five-column template is untouched, so every square keeps
              its column, its width and its order. Depth stays 2.
       g2   · §6 G2: the same verbs folded into five GROUPS, one per part. Level 1 = the groups,
              level 2 = that group's verbs, level 3 = the paths. Depth never passes 3 — the ceiling
              the operator named. The verb defs are REUSED, never retyped; a group's badge is the
              badge one of its own verbs already carries.                                        ══ */
  var G1ROWS = [
    { key: "choose", name: "CHOOSE", ico: "journey", plain: "pick the one ending the rest of the console then follows" },
    { key: "show", name: "SHOW", ico: "shape", plain: "put a fact on the middle panel — the card itself stays where it is" },
    { key: "go", name: "GO", ico: "external", plain: "leave the card — open the part, or the level above this endpoint" } ];
  /* LEVEL 1 IS THE TOPIC ROSTER (operator 2026-09-17, endpoint-stages.md: "in the command panel, when
     we are positioned for data, we see the stages in the middle panel"). The card navigates the TOPIC
     and the LABEL; the middle SHOWS the topic. So level 1 is PATHS — the label axis — followed by the
     six part buttons in their own order, and pressing one both opens that part in the middle and drops
     to its own level 2: its DISTRIBUTIONS first, then whatever verbs it carries.
     Everything about a topic cell is READ from window.PANELS — the word, the glyph, the colour and the
     count; only PATHS, which is no part, carries a word and a glyph of its own. */
  var G2VERBS = { data: ["writes"], schemas: [], functions: ["handler", "up"],
                  tests: ["tests", "untested", "declared"], widening: [], security: ["pre", "gates", "findings"] };
  var G2PLAIN = {
    data: "every table this endpoint reads or writes, and where on its stages it touches them",
    schemas: "the shapes that cross this endpoint — what comes in, and what goes back",
    functions: "the handler this endpoint runs, and everything it calls behind it",
    tests: "the cases that prove this endpoint answers the way it says it does",
    widening: "how far this endpoint reaches — the screens that fetch it and the journeys around it",
    security: "everything the request has to get past before the body ever runs" };
  function G2GROUPS(){
    var out = [{ key: "paths", word: "PATHS", part: null, ico: "journey", verbs: ["walk", "refusals", "success", "prev", "next"],
      plain: "every way a request through this endpoint can end — pick one and every topic is read through it" }];
    (window.PARTORDER || []).forEach(function(k){
      if (window.PANELS[k]) out.push({ key: k, part: k, verbs: G2VERBS[k] || [], plain: G2PLAIN[k] }); });
    return out; }
  function g2Group(k){ var g = G2GROUPS(); for (var i = 0; i < g.length; i++) if (g[i].key === k) return g[i]; return null; }
  function g2Word(g){ return g.word || String(window.PANELS[g.part].word).toUpperCase(); }
  function g2Col(g){ return g.part ? window.PANELS[g.part].col : "var(--accent)"; }
  function g2Ico(g){ return g.ico || (g.part ? window.PANELS[g.part].icon : "info"); }
  /* the BADGE is the part's own count — the same number its button carries. PATHS counts the cells the
     card would draw if you pressed it, which is the walk verb's own badge. */
  function g2Badge(g, F){ if (!g.part) return pathCells(F).length;
    var P = window.PANELS[g.part]; try { return P.count(F); } catch (e) { return null; } }
  function g2Dists(k){ return ((window.PANELS[k] || {}).variants || []); }
  /* a TOPIC cell — pressing it opens that topic in the MIDDLE and drops the card to its level 2 */
  function groupCellDef(g, byCmd, F, S){
    var held = g.verbs.map(function(c){ return byCmd[c]; }).filter(function(x){ return !!x; });
    var col = g2Col(g), ic = g2Ico(g), P = g.part ? window.PANELS[g.part] : null, w = g2Word(g);
    var dists = g.part ? g2Dists(g.part) : [];
    return { cmd: "grp-" + g.key, ico: ic, verb: w, label: w, state: "lit", col: col, badge: g2Badge(g, F),
      on: !!(g.part && window.PANELS[g.part] && document.getElementById("panel") && document.getElementById("panel").dataset.tab === g.part),
      card: function(){ return cmdc({ title: w + " ▸", value: P ? P.count(F) + " inside" : held.length + " verbs", icon: ic, color: col,
        rows: (P ? [["opens", "this topic in the middle panel, and its own verbs one level down"],
                    ["distributions", dists.map(function(v){ return v.label; }).join(" · ")]] : [["opens", "one level down — these verbs, then the paths"]])
          .concat(held.length ? [["verbs", held.map(function(v){ return v.verb; }).join(" · ")]] : P ? [["verbs", "none — this topic is read, not acted on"]] : []),
        plain: g.plain }); },
      cap: function(){ return w + " · " + (P ? dists.length + " distributions" : held.length + " verbs") + ", one level down"; },
      act: function(){ window.CMD.grp = g.key;
        if (g.part) window.showTab(g.part);   /* positioned for the topic: the middle opens it */
        window.drawCmd(); } }; }
  /* a DISTRIBUTION cell — the same rosters the part bars offer, on the card. Pressing one re-renders
     the middle and leaves the card exactly where it is, with that cell lit. */
  function distCellDef(k, v, F, S){ var P = window.PANELS[k];
    var ic = (window.VARICO || {})[v.key] || "shape";
    var live = (window.PANELVAR ? window.PANELVAR(k) : null) === v.key;
    return { cmd: "var-" + k + "-" + v.key, ico: ic, verb: v.label, label: v.label, state: "lit", col: P.col, on: live,
      card: function(){ return cmdc({ title: v.label, value: "a distribution of " + P.word, icon: ic, color: P.col,
        rows: [["the middle", live ? "this is what it is drawing now" : "press it and the middle draws this instead"],
               ["of", g2Dists(k).length + " distributions of " + P.word]],
        plain: v.hint }); },
      cap: function(){ return P.word + " · " + v.label + (live ? " — drawn now" : ""); },
      act: function(){ window.showVariant(k, v.key); window.drawCmd(); } }; }
  /* G2's level-2 corner: Back to the topic roster. The PATH grid's Back (backDef) leaves CMD.grp alone,
     so level 3 → level 2 lands on the group that opened it, and B again lands on level 1. */
  function backGroupDef(g){ var n = G2GROUPS().length;
    return { cmd: "back", ico: "up", verb: "Back", state: "lit", col: "var(--accent)",
      card: function(){ return cmdc({ title: "back", value: "B", icon: "up", color: "var(--accent)",
        rows: [["returns to", "the " + n + " topics"], ["leaving", g2Word(g)],
               ["keeps", "whatever is in force — Esc is what clears it"],
               ["place", "bottom-right — the corner keeps its place in every mode of the card"]],
        plain: "one level up — the topics again, nothing cleared" }); },
      cap: function(){ return "back to the topics — B (Esc clears)"; },
      act: function(){ window.CMD.grp = null; window.drawCmd(); } }; }
  /* a G1 ROW NAME: small caps in the muted ink, at the 12px floor, spanning the row */
  function rowNameNode(rn, members, F, S){
    var el = E("div", { class: "cmdrow" });
    el.dataset.row = rn.key;
    el.append(E("span", { class: "cmdrowl" }, esc(rn.name)));
    var held = members.filter(function(x){ return !!x; });
    tipBind(el, function(){ return cmdc({ title: rn.name, value: held.length + " verbs", icon: rn.ico, color: "var(--muted)",
      rows: held.map(function(v){ return [v.verb, v.badge == null ? "—" : String(v.badge)]; }),
      plain: rn.plain }); }, function(){ return esc(rn.name + " · " + held.map(function(v){ return v.verb; }).join(" · ")); });
    return el; }

  function uniq(a){ var o = {}, r = []; a.forEach(function(x){ if (x != null && !o[x]) { o[x] = 1; r.push(x); } }); return r; }

  /* ── LAYOUT 1 · the CARD: a 3×5 grid of SC2 command squares ── */
  function cmdGrid(host, list, F, S, corner, rowNames){ var C = cmdCfg(), COLS = 5, SLOTS = 15;
    var g = E("div", { class: "cmdgrid" + (rowNames ? " named" : "") });
    g.style.setProperty("--cz", (C.size || 64) + "px");
    var need = list.length + (corner ? 1 : 0);
    /* `collapsed` drops empty ROWS; it never moves the corner off the bottom-right */
    var n = C.wrong === "collapsed" ? Math.max(COLS, Math.ceil(need / COLS) * COLS) : Math.max(SLOTS, Math.ceil(need / SLOTS) * SLOTS);
    var hots = hotLetters(list), last = n - 1;
    for (var i = 0; i < n; i++) { var o = list[i], d;
      /* G1's row name rides the row as a caption spanning all five columns — the template, and so
         every square's column and width, is exactly what it is without it */
      if (rowNames && i % COLS === 0 && rowNames[i / COLS]) g.append(rowNameNode(rowNames[i / COLS], list.slice(i, i + COLS).concat(i + COLS > last && corner ? [corner] : []), F, S));
      if (corner && i === last) { d = {}; for (var kc in corner) d[kc] = corner[kc]; d.hot = C.keys === "off" ? null : "B"; g.append(cellNode(d, F, S)); }
      else if (o && i < last) { d = {}; for (var k in o) d[k] = o[k]; d.hot = (corner && hots[i] === "B") ? null : hots[i]; g.append(cellNode(d, F, S)); }
      else g.append(cellNode({ state: "blank", ico: "info" }, F, S)); }
    host.append(g); return g; }
  function renderCmdCard(host, F, S){ var C = cmdCfg(), fm = FRM(F);
    var mode = C.mode === "path" ? "path" : "cmd";
    /* THE CARD IS THE ENDPOINT KIND'S, full stop (operator 2026-09-17: "we are working just on the
       setup for this API endpoint — the entity one we will work on separately, a completely different
       setup"). The entity roster and its `scope` pick were deleted, not hidden. */
    var V = C.verbs || "rows";
    var grp = V === "g2" ? g2Group(C.grp) : null;
    var list, corner, rowNames = null, right;
    if (mode === "path") { var cells = pathCells(F);
      if (C.only) cells = cells.filter(function(c){ return c.lead.kind === C.only; });
      list = cells.map(function(c){ return pathCellDef(c, F, S); }); corner = backDef();
      right = V === "g2" ? (list.length + " PATHS") : (list.length + " paths"); }
    else if (V === "g2") { var all = cmdVerbs(F, S), byCmd = {};
      all.forEach(function(o){ if (o.cmd) byCmd[o.cmd] = o; });
      if (grp) { var vb = grp.verbs.map(function(c){ return byCmd[c]; }).filter(function(x){ return !!x; });
        if (grp.part) { var ds = g2Dists(grp.part).map(function(v){ return distCellDef(grp.part, v, F, S); });
          list = ds.concat(vb);
          right = g2Word(grp) + " · " + ds.length + (ds.length === 1 ? " DISTRIBUTION" : " DISTRIBUTIONS")
            + " · " + vb.length + (vb.length === 1 ? " VERB" : " VERBS"); }
        else { list = vb; right = g2Word(grp) + " · " + vb.length + " VERBS"; }
        corner = backGroupDef(grp); }
      else { list = G2GROUPS().map(function(g){ return groupCellDef(g, byCmd, F, S); });
        corner = clearDef(); right = list.length + " TOPICS"; } }
    else { list = cmdVerbs(F, S); corner = cornerOf(list);
      if (V === "g1") rowNames = G1ROWS;
      right = (list.length + 1) + " verbs"; }
    cmdHead(host, F, S, right);
    cmdGrid(host, list, F, S, corner, rowNames);
    cmdTip(host, F, S); }
  /* the FLAG a path's own exit is gated by — never every switch it crossed, or the chip would ride
     all fourteen cells; the switch's own `refs` name the two exits the rate limiter can produce */
  function flagOf(p){ return (p.switches || []).filter(function(s){
    return s.kind === "flag" && (s.refs || []).indexOf((p.exit || {}).id) >= 0; })[0] || null; }
  function flagCard(sw, F, S){ var st = sw.settings || {};
    return cmdc({ title: "rate limit", value: "flag", icon: "swords", color: S.OPC.gate,
      rows: Object.keys(st).map(function(k){ return [k, st[k].default + " · " + st[k].env]; })
        .concat([["when", sw.expr || "—"], ["caveat", "ACTIVE only when rate_limit_enabled is true or the app is production — the measured default is False"]]),
      plain: "a setting decides whether this refusal can happen at all — off by default here" }); }
  function pathCellDef(c, F, S){ var p = c.lead, C = cmdCfg(), K = CMDKIND[p.kind] || { ico: "info", word: p.kind, plain: p.kind };
    var sel = (window.SEL || {}).path, nm = pathName(p);
    return { cmd: null, path: p.id, exit: (p.exit || {}).id, ico: K.ico, verb: pathWord(p), label: nm || "—", flag: C.flag === "shown" ? flagOf(p) : null,
      fa: ["the-endings", "kinds-of-ending", "status-code-per-ending"],
      col: pathCol(p, F, S), badge: p.status, state: p.partial ? "dashed" : "lit", on: sel === p.id || c.members.some(function(m){ return m.id === sel; }),
      card: function(){ return pathCard(c, F, S); },
      cap: function(){ return esc(pathWord(p) + " · " + p.names.phase_status + " · " + p.n.steps + " steps"); },
      act: function(){ window.selectPath(p.id); } }; }
  function pathCard(c, F, S){ var p = c.lead, K = CMDKIND[p.kind] || {}, C = cmdCfg();
    var rows = [["status", String(p.status)], ["kind", K.word || p.kind], ["stage", p.phase],
      ["steps", String(p.n.steps) + " · " + p.n.gates + " gates · " + p.n.calls + " calls · " + p.n.catches + " catches"],
      ["writes", p.effects.tables.length ? p.effects.tables.length + " table(s) touched · " + p.effects.n.committed + " committed" : "none"],
      ["tests", (p.tests || []).length ? uniq(p.tests.map(function(t){ return t.case; })).join(" · ") : "none"]];
    if (C.names !== "drawn") rows.unshift(["drawn name", p.names.drawn]);
    if (c.members.length > 1) rows.push(["merged", c.members.length + " sub-paths: " + c.members.map(function(m){ return m.names.drawn; }).join(" · ")]);
    if (C.names === "exception" && !p.names.exception) rows.push(["exception", "— none: this refusal is raised inline, not as a class"]);
    return cmdc({ title: pathWord(p), value: p.names.phase_status, icon: K.ico, color: pathCol(p, F, S),
      rows: rows, plain: K.plain }); }
  function cmdHead(host, F, S, right){ var C = cmdCfg(), fm = FRM(F);
    if (!C.show || C.show.title === 0) return;
    var h = E("div", { class: "cmdhd" }, sechd("shape", "Command", right, false, "var(--accent)"));
    var src = fm ? (fm.counts.paths + " paths · " + fm.counts.exits + " exits") : "the forms feed is " + ((F.forms || {}).state || "absent");
    h.append(E("span", { class: "cmdsrc" }, esc(src)));
    bind(h, function(){ return cmdc({ title: "the command panel", value: C.layout, icon: "shape", color: "var(--accent)",
      rows: [["layout", C.layout], ["paths", String((fm || {}).counts ? fm.counts.paths : 0)], ["exits", String((fm || {}).counts ? fm.counts.exits : 0)],
             ["source", (fm && fm.source ? fm.source.path : "—")]],
      plain: "the half of the console you ACT with — one cell per thing you can do to this endpoint" }); });
    host.append(h); }
  function cmdTip(host, F, S){ var C = cmdCfg();
    var t = E("div", { class: "cmdtip tip-" + (C.tip || "hover") });
    if (C.tip === "caption") t.append(E("span", { class: "capl" }, esc("hover a cell — its one line lands here")));
    host.append(t); }

  /* ── LAYOUT 2 · the STRIP: one cell per path, under the part buttons, inside the bench ── */
  function renderCmdStrip(host, F, S){ var C = cmdCfg(), cells = pathCells(F);
    if (C.only) cells = cells.filter(function(c){ return c.lead.kind === C.only; });
    var sel = (window.SEL || {}).path;
    var wrap = E("div", { class: "pstrip" });
    cells.forEach(function(c){ var p = c.lead, K = CMDKIND[p.kind] || {}, nm = pathName(p);
      var el = E("button", { class: "pscell" + (sel === p.id || c.members.some(function(m){ return m.id === sel; }) ? " on" : "") + " st-" + (p.partial ? "dashed" : "lit") });
      el.style.setProperty("--tc", pathCol(p, F, S));
      el.dataset.path = p.id; tg(el, ["the-endings", "kinds-of-ending", "status-code-per-ending"]);
      var hd = E("div", { class: "pshd" });
      hd.insertAdjacentHTML("beforeend", '<span class="psi">' + ico(K.ico || "info", 15, "currentColor") + "</span>");
      hd.append(E("b", null, esc(String(p.status))));
      var sw = cmdCfg().flag === "shown" ? flagOf(p) : null;
      if (sw) { var fg = E("i", { class: "cflag" }); fg.insertAdjacentHTML("beforeend", ico("swords", 11, "currentColor"));
        bind(fg, function(){ return flagCard(sw, F, S); }); hd.append(tg(fg, "switches")); }
      el.append(hd);
      el.append(E("span", { class: "psn" }, esc(nm || "—")));
      tipBind(el, function(){ return pathCard(c, F, S); }, function(){ return esc(pathWord(p)); });
      el.addEventListener("click", function(ev){ ev.stopPropagation(); window.selectPath(p.id); });
      wrap.append(el); });
    host.append(wrap); return wrap; }

  /* ── LAYOUT 3 · the EXIT LADDER: the stages in request order, the return at the foot ── */
  function renderCmdLadder(host, F, S){ var fm = FRM(F), C = cmdCfg();
    cmdHead(host, F, S, (fm ? (fm.stages || []).length : 0) + " stages");
    if (!fm) { host.append(E("div", { class: "cmdempty" }, esc("the forms feed is " + ((F.forms || {}).state || "absent")))); return; }
    var selEx = (window.SEL || {}).exit, byId = {};
    (fm.exits || []).forEach(function(e){ byId[e.id] = e; });
    var rungs = (fm.stages || []).map(function(st){ return { phase: st.phase, exits: (st.exits || []).map(function(id){ return byId[id]; }).filter(function(e){ return e && e.row !== "return"; }) }; });
    var foot = (fm.exits || []).filter(function(e){ return e.row === "return"; });
    var all = rungs.concat([{ phase: "return", exits: foot, foot: true }]);
    var at = -1;
    all.forEach(function(r, i){ if (r.exits.some(function(e){ return e.id === selEx; })) at = i; });
    var lad = E("div", { class: "exlad" });
    all.forEach(function(r, i){
      var cls = "exrung" + (r.foot ? " foot" : "") + (at < 0 ? "" : i < at ? " above" : i > at ? " below" : " here");
      var rr = E("div", { class: cls });
      rr.dataset.rung = r.phase; tg(rr, "the-stage-an-ending-leaves-from");
      rr.style.setProperty("--tc", r.foot ? S.OPC.read : phaseCol(r.phase, F, S));
      rr.append(E("span", { class: "exn" }, esc(String(i + 1))));
      rr.append(E("b", null, esc(r.phase)));
      var hold = E("div", { class: "exhold" });
      r.exits.forEach(function(e){
        var el = E("button", { class: "excell" + (selEx === e.id ? " on" : "") + " st-" + (e.state === "default" ? "dashed" : "lit") });
        el.dataset.exit = e.id; tg(el, ["the-endings", "kinds-of-ending", "status-code-per-ending"]);
        el.style.setProperty("--tc", C.colour === "mono" ? "var(--muted)" : C.colour === "phase" ? phaseCol(e.phase, F, S) : C.colour === "status" ? statusCol(e.status, S) : kindCol(e.kind, S));
        el.insertAdjacentHTML("beforeend", ico((CMDKIND[e.kind] || {}).ico || "info", 13, "currentColor"));
        el.append(E("b", null, esc(String(e.status))));
        if ((e.tests || []).length) el.append(tg(E("i", { class: "extst" }, esc(String(uniq(e.tests.map(function(t){ return t.case; })).length))), "coverage-per-condition"));
        tipBind(el, function(){ return exitCard(e, F, S); }, function(){ return esc(e.status + " " + (e.detail || e.kind)); });
        el.addEventListener("click", function(ev){ ev.stopPropagation(); window.selectExit(e.id); });
        hold.append(el); });
      if (!r.exits.length) hold.append(E("i", { class: "exnone" }, esc("— nothing leaves here")));   /* the empty slot itself, not why it is empty (that is about the map, D-017) */
      rr.append(hold);
      bind(rr, function(){ return cmdc({ title: r.phase, value: r.exits.length + " exit(s)", icon: "layers", color: rr.style.getPropertyValue("--tc"),
        rows: [["stage", r.foot ? "the success return, at the foot" : "stage " + (i + 1) + " of " + (fm.stages || []).length],
               ["leaves here", r.exits.map(function(e){ return String(e.status); }).join(" · ") || "nothing"]],
        plain: r.foot ? "where the work finishes and the answer goes back" : "one step of the request — everything that can end it here" }); });
      lad.append(rr); });
    if (C.walk === "replay") lad.append(E("i", { class: "cmdbead" }));
    else if (at >= 0) lad.append(E("i", { class: "cmdbead static", style: "top:calc(" + at + " * var(--rungh, 24px))" }));
    host.append(lad); cmdTip(host, F, S); }
  function exitCard(e, F, S){ var r = e.response || {};
    return cmdc({ title: String(e.status) + (e.detail ? " " + e.detail : ""), value: e.kind, icon: (CMDKIND[e.kind] || {}).ico || "info", color: kindCol(e.kind, S),
      rows: [["stage", e.phase], ["row", e.row], ["via", e.via || "—"], ["pred", e.pred || "—"], ["state", e.state],
             ["response", (r.media || "—") + (r.model ? " · " + r.model : "")],
             ["paths", (e.paths || []).length + " end here"], ["tests", (e.tests || []).length ? uniq(e.tests.map(function(t){ return t.case; })).join(" · ") : "none"]],
      plain: (CMDKIND[e.kind] || {}).plain || "one way the request ends" }); }

  /* ── LAYOUT 4 · the MATRIX: path × part, one 28px cell each ── */
  var CMDPARTS = ["data", "schemas", "functions", "tests", "widening", "security"];
  function renderCmdMatrix(host, F, S){ var fm = FRM(F), C = cmdCfg();
    var cells = pathCells(F); if (C.only) cells = cells.filter(function(c){ return c.lead.kind === C.only; });
    cmdHead(host, F, S, cells.length + " × " + CMDPARTS.length);
    if (!fm) { host.append(E("div", { class: "cmdempty" }, esc("the forms feed is absent"))); return; }
    var m = E("div", { class: "cmx" });
    var hd = E("div", { class: "cmxrow cmxhd" }, E("span", { class: "cmxl" }, ""));
    CMDPARTS.forEach(function(k){ var P = window.PANELS[k];
      var c = E("span", { class: "cmxh" }); c.dataset.part = k;
      c.insertAdjacentHTML("beforeend", ico(P.icon, 13, P.col));
      bind(c, function(){ return cmdc({ title: P.word, value: "one column", icon: P.icon, color: P.col,
        rows: [["lit", "the part has facts for that path"], ["hollow", "measured, and the path gives it nothing"]],
        plain: "one part's knowledge of one way the request ends" }); });
      hd.append(c); });
    m.append(hd);
    var sel = (window.SEL || {}).path;
    cells.forEach(function(cl){ var p = cl.lead, K = CMDKIND[p.kind] || {};
      var row = E("div", { class: "cmxrow" + (sel === p.id ? " on" : "") }); row.dataset.path = p.id;
      var lb = tg(E("span", { class: "cmxl" }), ["the-endings", "kinds-of-ending", "status-code-per-ending"]);
      lb.insertAdjacentHTML("beforeend", ico(K.ico || "info", 12, pathCol(p, F, S)));
      lb.append(E("b", null, esc(String(p.status))), E("span", null, esc(pathName(p) || "—")));
      tipBind(lb, function(){ return pathCard(cl, F, S); }, function(){ return esc(pathWord(p)); });
      lb.addEventListener("click", function(ev){ ev.stopPropagation(); window.selectPath(p.id); });
      row.append(lb);
      CMDPARTS.forEach(function(k){ var f = partFacts(F, p, k);
        var cell = E("span", { class: "cmxc st-" + slotState(F, f.n, PART_ARM[k]) });
        cell.dataset.part = k; cell.dataset.path = p.id;
        if (!f.n) tg(cell, "why-this-slot-is-empty", true);
        cell.style.setProperty("--tc", window.PANELS[k].col);
        if (f.n) cell.append(E("i", null, esc(String(f.n))));
        tipBind(cell, function(){ return cmdc({ title: window.PANELS[k].word, value: f.n ? f.n + " on this path" : "measured zero", icon: window.PANELS[k].icon, color: window.PANELS[k].col,
          rows: [["path", pathWord(p)], ["state", f.n ? "lit — the part has facts" : "hollow — measured, and this path gives it nothing"]],
          fields: f.words.length ? f.words : null,
          plain: "how much this part has to say about this one ending" }); }, function(){ return esc(window.PANELS[k].word + " · " + (f.n || "nothing") + " on " + pathWord(p)); });
        cell.addEventListener("click", function(ev){ ev.stopPropagation(); window.selectPath(p.id); window.showTab(k); });
        row.append(cell); });
      m.append(row); });
    host.append(m); cmdTip(host, F, S); }

  /* ══ THE PROJECTION — what a chosen path does to the middle panel (choice 8) ══════════════
     A post-render pass: mark what is ON the path, and treat the rest per the pick — dim .28 ·
     filter (display:none) · outline (only the path is ringed, the rest untouched). ══ */
  var PROJKEY = { data: "table", schemas: "schema", functions: "fn", tests: "case", widening: "rung", security: "dep" };
  /* the projection ADDS to the middle's drawing, so what it draws is registered with the field layer as an addition
     (DRAWN.more) — the chips it takes off go out of the registry with them */
  function applyPath(panelEl, part, p){ if (window.DRAWN && window.DRAWN.more) return window.DRAWN.more("middle", function(){ applyPath0(panelEl, part, p); });
    return applyPath0(panelEl, part, p); }
  function applyPath0(panelEl, part, p){
    if (!panelEl) return;
    if (!part) p = null;
    [].forEach.call(panelEl.querySelectorAll(".onpath, .offpath"), function(e){ e.classList.remove("onpath", "offpath"); });
    [].forEach.call(panelEl.querySelectorAll(".bchip, .opstrip, .gatemark"), function(e){ e.remove(); });
    panelEl.classList.remove("proj-dim", "proj-filter", "proj-outline", "join-parsed");
    if (!p) return;
    var C = cmdCfg(), S = window.STATION, F = window.LABEP, o = onPath(F, p);
    panelEl.classList.add("proj-" + (C.middle || "dim"));
    panelEl.classList.toggle("join-parsed", part === "tests" && C.join === "parsed");
    var keys = part === "security" ? ["dep", "lane"] : [PROJKEY[part]];
    keys.forEach(function(key){
      [].forEach.call(panelEl.querySelectorAll("[data-" + key + "]"), function(e){
        var v = e.getAttribute("data-" + key);
        e.classList.add(o[key][v] ? "onpath" : "offpath"); }); });
    if (part === "schemas") [].forEach.call(panelEl.querySelectorAll("[data-field]"), function(e){
      var host = e.closest("[data-schema]"), sc = host ? host.getAttribute("data-schema") : null;
      var mine = sc ? (o.fieldIn[sc] || {})[e.getAttribute("data-field")] : o.field[e.getAttribute("data-field")];
      e.classList.add(mine ? "onpath" : "offpath"); });
    /* DATA — a written table wears its BUCKET chip. The Stages distribution draws the fate at its own
       EFFECTS column, so the chip would say the same thing twice: a card mirrors its thing and never
       repeats a fact another line carries (the pattern book). The dimming above still applies. */
    if (part === "data" && ["stages", "stageblocks"].indexOf(window.PANELVAR ? window.PANELVAR("data") : null) >= 0) { /* the picture already says it */ }
    else if (part === "data") { var BK = { committed: S.OPC.read, maybe_committed: S.OPC.gate, rolled_back: (S.BADGE_COL.role || {}).accessor, uncommitted: "transparent" };
      var BW = { committed: "committed", maybe_committed: "maybe", rolled_back: "rolled back", uncommitted: "uncommitted" };
      var ORD = ["committed", "maybe_committed", "rolled_back", "uncommitted"];
      [].forEach.call(panelEl.querySelectorAll("[data-table].onpath"), function(e){
        var t = e.getAttribute("data-table"), b = o.bucket[t]; if (!b) return;
        ORD.forEach(function(k){ var n = b[k]; if (!n) return;
          var chip = tg(E("i", { class: "bchip bk-" + k }, esc(BW[k] + " ×" + n)), "fate-of-the-writes-per-ending");
          chip.style.setProperty("--bc", BK[k] || "var(--muted)");
          bind(chip, function(){ return cmdc({ title: t, value: BW[k] + " ×" + n, icon: "table", color: BK[k],
            rows: [["on", pathWord(p)], ["writes in this bucket", String(n)],
                   ["the table's buckets", ORD.filter(function(x){ return b[x]; }).map(function(x){ return BW[x] + " " + b[x]; }).join(" · ")]],
            plain: k === "committed" ? "the change is permanent — the transaction closed" : k === "rolled_back" ? "the change was undone — the transaction went back"
              : k === "uncommitted" ? "the change never closed a transaction — it is gone when the request ends" : "the change may or may not have closed — the path cannot say" }); });
          e.append(chip); }); }); }
    /* SECURITY — a gate that FIRED is lit in the refusal colour; a gate the path passed reads as passed */
    if (part === "security") [].forEach.call(panelEl.querySelectorAll("[data-dep], [data-lane]"), function(e){
      var v = e.getAttribute("data-dep") || e.getAttribute("data-lane"), st = o.dep[v] || o.lane[v]; if (!st) return;
      var mk = tg(E("i", { class: "gatemark gm-" + st }, esc(st === "fired" ? "fired" : "passed")), "the-checks-met-in-run-order");
      mk.style.setProperty("--bc", st === "fired" ? kindCol("refusal", S) : "var(--muted)");
      e.append(mk); });
    /* choice 2 — each part ALSO draws a one-line "on this path" strip under its title */
    if (C.rows === "parts" || C.rows === "both") {
      var f = partFacts(F, p, part);
      var strip = tg(E("div", { class: "opstrip" }), "the-endings");
      strip.insertAdjacentHTML("beforeend", ico((CMDKIND[p.kind] || {}).ico || "info", 12, pathCol(p, F, S)));
      strip.append(E("b", null, esc(pathWord(p))), E("span", { class: "opn" }, esc(f.n + " on this path")),
        E("span", { class: "opw" }, esc(f.words.join(" · ") || "nothing")));
      bind(strip, function(){ return cmdc({ title: "on this path", value: f.n, icon: (CMDKIND[p.kind] || {}).ico, color: pathCol(p, F, S),
        rows: [["path", pathWord(p)], ["part", window.PANELS[part].word], ["middle", C.middle]],
        fields: f.words.length ? f.words : null,
        plain: "one part's facts for the one ending you picked" }); });
      var hd = panelEl.querySelector(".phd");
      if (hd && hd.nextSibling) panelEl.insertBefore(strip, hd.nextSibling); else panelEl.insertBefore(strip, panelEl.firstChild); } }

  /* ══ THE THREE PORTRAITS — Path · Exit · Case, on the card law (a record mirrors its thing) ══ */
  /* an app-wide step's place is the order it RUNS in (the feed's middleware order); the registration index is the reverse and is never shown as "order" */
  function ordinal(n){ var s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function runsNo(m){ return m.runs == null ? "?" : String(m.runs + 1); }
  function runsWord(m){ return m.runs == null ? "run order not read (the kinds reading is off)" : "runs " + ordinal(m.runs + 1) + " of " + m.of; }
  function ptRow(k, v, col, ids){ return '<div class="ptrow"' + (String(v) === "—" ? "" : fa(ids)) + '><span class="k">' + esc(k) + '</span><span class="v"' + (col ? ' style="color:' + col + '"' : "") + ">" + esc(v) + "</span></div>"; }
  function ptSec(t, ids){ return '<div class="ptsec"' + fa(ids) + '>' + esc(t) + "</div>"; }
  /* what sits inside one call of the chain: every failure, save and savepoint of the functions it opens, each a chain row set one step in */
  function insideRows(F, S, p, c, ins){ var out = [];
    function stepOf(exitId){ var hit = (p.chain || []).filter(function(k){ return k.ref === exitId; })[0]; return hit ? hit.i : null; }
    function add(kind, icon, fnRec, label, sub, cardFn){
      var r = E("div", { class: "ptcr k-inside" }); r.dataset.inside = kind; r.dataset.fn = fnRec.name; r.dataset.depth = String(fnRec.depth);
      if (kind === "raise" || kind === "refusal") tg(r, "the-predicate-per-decision-point", true);   /* "raised when" / "refused when" is on the hover card */
      else tg(r, kind === "swallow" ? "catches" : "data-touching-functions");
      r.insertAdjacentHTML("beforeend", '<span class="ptci">' + (fnRec.depth > 1 ? "↳↳" : "↳") + "</span>");
      r.insertAdjacentHTML("beforeend", '<span class="ptcg">' + ico(icon, 12, "var(--muted)") + "</span>");
      r.append(E("b", null, esc(label))); r.append(E("span", { class: "ptcs" }, esc(sub)));
      bind(r, cardFn); out.push(r); }
    ins.opens.forEach(function(key){ var f = insideFn(F, key); if (!f) return;
      var where = f.fn === c.fn ? "" : "in " + f.name + " ";
      f.raises.forEach(function(x){ var st = x.here.length ? stepOf(x.here[0].exit) : null;
        add("raise", "alert", f, x.cls || "raise", where + lineOf(x.at) + " → " + becomesShort(x), function(){ return cmdc({ title: x.cls || "raise", value: x.here_word, icon: "alert",
          rows: [["raised in", f.name + (f.depth > 1 ? " · " + f.depth + " calls down" : " · one call down")], ["raised when", x.pred || "—"], x.msg ? ["message", x.msg] : null, ["at", x.at || "—"],
                 ["becomes", becomesWords(x)], st != null ? ["on this route", "step " + st + " — the check that raises it"] : null,
                 x.through.length ? ["passes through", x.through.map(function(t){ return (t.op || "a catch") + " at " + shortAt(t.at); }).join(" · ")] : null,
                 x.on_other_endpoints ? ["elsewhere", nWord(x.on_other_endpoints, "other endpoint") + " reach the same failure"] : null],
          plain: x.here.length ? "a failure raised inside the call — this endpoint catches it and answers with its own status"
            : x.uncaught_here.length ? "a failure raised inside the call that nothing here catches — it leaves as a server error"
            : x.here_word === "beyond one level" ? "a failure raised deeper than the reading follows — which answer it becomes is not known"
            : "a failure raised inside the call — the reading could not tie it to an ending here" }); }); });
      f.refusals.forEach(function(x){ if (f.fn === c.fn && (p.chain || []).some(function(k){ return k.ref === x.exit; })) return;   /* already a check of this route */
        add("refusal", "shield", f, String(x.status), where + lineOf(x.at), function(){ return cmdc({ title: String(x.status), value: f.name, icon: "shield",
          rows: [["refused in", f.name], ["refused when", x.pred || "—"], ["at", x.at || "—"]], plain: "a refusal written inside the call — the request ends there with this status" }); }); });
      f.commits.forEach(function(k){ add("commit", "key", f, k.op || "commit", where + lineOf(k.at), function(){ return cmdc({ title: k.op || "commit", value: f.name, icon: "key",
        rows: [["in", f.name], ["at", k.at || "—"], ["step", k.step]], plain: "where the work so far is saved for good — a DB transaction ends here" }); }); });
      f.savepoints.forEach(function(at){ add("savepoint", "layers", f, "savepoint", where + lineOf(at), function(){ return cmdc({ title: "savepoint", value: f.name, icon: "layers",
        rows: [["in", f.name], ["at", at]], plain: "a mark inside the transaction — a failure after it undoes only what came after the mark" }); }); });
      f.swallows.forEach(function(w){ var at = typeof w === "string" ? w : (w.at || "—"); add("swallow", "skip", f, "swallowed failure", where + lineOf(at), function(){ return cmdc({ title: "swallowed failure", value: f.name, icon: "skip",
        rows: [["in", f.name], ["at", at]], plain: "a broad catch that lets the request go on as if nothing failed" }); }); }); });
    return out; }
  function pathPortrait(box, F, S){ var p = selPath(F);
    if (!p) { box.append(E("div", { class: "ptidle" }, E("b", null, "no path in force"), E("span", null, "pick a cell in the command panel and this becomes its record."))); return; }
    var K = CMDKIND[p.kind] || {}, col = pathCol(p, F, S), b = E("div", { class: "ptbody ptrec" });
    b.insertAdjacentHTML("beforeend", '<div class="ptttl"' + fa("the-endings") + '>' + ico(K.ico || "info", 15, col) + "<b>" + esc(pathWord(p)) + "</b></div>");
    b.insertAdjacentHTML("beforeend", ptRow("status", String(p.status), col, "status-code-per-ending") + ptRow("kind", K.word || p.kind, null, "kinds-of-ending") + ptRow("stage", p.phase, null, "the-stage-an-ending-leaves-from")
      + ptRow("exit", (p.exit || {}).detail || (p.exit || {}).kind || "—") + ptRow("via", (p.exit || {}).via || "—")
      + ptRow("at", (p.exit || {}).at || "—", null, "file-line")
      + ptRow("checks", p.n.passed + " passed · " + p.n.fired + " fired", null, "the-checks-met-in-run-order")
      + (F.forms.through && F.forms.through.id === p.id ? ptRow("route", "passes every check — the route that gets through", null, "the-route-that-passes-every-check")
        : F.forms.through && (F.forms.through.tie || []).some(function(x){ return x.id === p.id; }) ? ptRow("route", "ties with " + F.forms.through.tie.filter(function(x){ return x.id !== p.id; }).map(function(x){ return x.name; }).join(" and ") + " for the most checks passed — no route is named", null, "the-route-that-passes-every-check") : ""));
    b.insertAdjacentHTML("beforeend", ptSec("the chain · " + p.n.steps + " steps", "the-ordered-chain-per-ending"));
    var tb = E("div", { class: "ptchain" });
    (p.chain || []).forEach(function(c){
      var ci = c.kind === "gate" ? "shield" : c.kind === "call" ? "function" : c.kind === "collapsed" ? "merge" : c.kind === "catch" ? "skip"
        : c.kind === "switch" ? "layers" : c.kind === "branch" ? "angle" : c.kind === "exit" ? "up" : "drill";
      var r = E("div", { class: "ptcr k-" + c.kind + (c.hit === true ? " hit" : "") });
      r.dataset.step = String(c.i);
      /* a chain row is the chain; its kind says which of the card's rows it also draws, and its hover what it carries */
      tg(r, ["the-ordered-chain-per-ending"].concat(({ branch: ["deciding-branches"], "catch": ["catches"], "switch": ["switches"], gate: c.hit === true ? [] : ["the-checks-met-in-run-order"] })[c.kind] || []));
      if (c.cond || c.pred) tg(r, "the-predicate-per-decision-point", true);
      if (c.kind === "gate" && ((FRM(F) || {}).preconditions || []).some(function(g){ return g.exit === c.ref; })) tg(r, "own-guards");   /* the handler's own check */
      if (c.kind === "gate" && c.status === 429 && rateRows(F).length) tg(r, "rate-tier", true);
      if ((c.kind === "switch" ? commonRows(F, "switch:" + (c.switch_kind || c.label)) : c.kind === "catch" ? commonRows(F, "catch:" + c.catch_kind)
           : (c.kind === "gate" || c.kind === "exit") && c.status != null && c.status !== 429 ? commonRows(F, "status:" + c.status) : []).length) tg(r, "how-common-this-piece-is", true);
      r.insertAdjacentHTML("beforeend", '<span class="ptci">' + String(c.i) + "</span>");
      r.insertAdjacentHTML("beforeend", '<span class="ptcg">' + ico(ci, 12, c.hit === true ? kindCol("refusal", S) : "var(--muted)") + "</span>");
      r.append(E("b", null, esc(String(c.label || c.kind))));
      r.append(E("span", { class: "ptcs" }, esc(String(c.sub || ""))));
      if (c.hit === true) r.append(E("i", { class: "ptcf" }, "fired"));
      var ins = (c.kind === "call" || c.kind === "collapsed") ? insideCall(F, c.fn) : null;
      if (ins) { r.dataset.opens = String(ins.opens.length); r.append(E("i", { class: "ptcin" }, esc(ins.opens.length ? insideCount(ins.n) : insightWords(ins.insight)))); }
      bind(r, function(){ return cmdc({ title: String(c.label || c.kind), value: c.kind, icon: ci,
        rows: [["step", String(c.i)], ["stage", c.phase || "—"], ["at", c.at || "—"], c.hit != null ? ["fired", c.hit ? "yes — this is the one that ended it" : "no — the request passed it"] : null,
               (c.cond || c.pred) ? ["condition", String(c.cond || c.pred).slice(0, 160)] : null, c.fn ? ["function", String(c.fn)] : null,
               ins && ins.opens.length ? ["inside", insideCount(ins.n) + " over " + nWord(ins.opens.length, "function")] : null,
               ins ? ["the map read", insightWords(ins.insight)] : null]
          .concat(c.kind === "switch" ? commonRows(F, "switch:" + (c.switch_kind || c.label)) : c.kind === "catch" ? commonRows(F, "catch:" + c.catch_kind)
            : (c.kind === "gate" && c.status === 429) ? rateRows(F) : (c.kind === "gate" || c.kind === "exit") && c.status != null ? commonRows(F, "status:" + c.status) : []),
        plain: c.kind === "gate" ? "a check that can end the request right here" : c.kind === "switch" ? "a setting or a binding that changes what happens next"
          : c.kind === "branch" ? "a fork in the handler — this path took one arm" : c.kind === "catch" ? "where the raise was caught and turned into an answer"
          : c.kind === "exit" ? "the ending itself" : "one step the request runs through" }); });
      tb.append(r);
      /* what sits inside a call: always open · closed until clicked · closed — a rail pick (CMD.inside), ruled an option 2026-09-20 */
      var insMode = cmdCfg().inside || "open";
      if (ins && ins.opens.length && insMode !== "closed") { var kids = insideRows(F, S, p, c, ins); r.dataset.inside = insMode;
        kids.forEach(function(n){ if (insMode === "click") n.hidden = true; tb.append(n); });
        if (insMode === "click") { r.classList.add("opens"); r.setAttribute("aria-expanded", "false");
          r.addEventListener("click", function(){ var open = r.getAttribute("aria-expanded") !== "true"; r.setAttribute("aria-expanded", String(open)); kids.forEach(function(n){ n.hidden = !open; }); }); } } });
    b.append(tb);
    var eff = p.effects, n = eff.n;
    b.insertAdjacentHTML("beforeend", ptSec("effects · " + (eff.tables || []).length + " tables"));
    var bl = tg(E("div", { class: "ptbk" }), "fate-of-the-writes-per-ending");
    [["committed", n.committed, S.OPC.read], ["maybe", n.maybe_committed, S.OPC.gate], ["rolled back", n.rolled_back, (S.BADGE_COL.role || {}).accessor], ["uncommitted", n.uncommitted, "var(--muted)"]]
      .forEach(function(x){ var c = E("span", { class: "ptbc" + (x[1] ? "" : " zero") }, esc(x[0] + " " + x[1]));
        c.style.setProperty("--bc", x[2]); bl.append(c); });
    b.append(bl);
    b.insertAdjacentHTML("beforeend", '<div class="pttbl">' + (eff.tables || []).map(function(t){ return '<i data-table="' + esc(t) + '"' + fa("tables-touched") + '>' + esc(t) + "</i>"; }).join("") + "</div>");
    b.insertAdjacentHTML("beforeend", ptSec("tests · " + uniq((p.tests || []).map(function(t){ return t.case; })).length, "coverage-per-condition"));
    var tl = E("div", { class: "pttests" });
    uniq((p.tests || []).map(function(t){ return t.case; })).forEach(function(cid){
      var t = (p.tests || []).filter(function(x){ return x.case === cid; })[0];
      var c = E("button", { class: "ptcase" }, esc(cid + " · " + t.conf));
      c.dataset["case"] = cid; tg(c, "cases");
      c.addEventListener("click", function(ev){ ev.stopPropagation(); window.selectCase(cid); });
      bind(c, function(){ return cmdc({ title: cid, value: t.conf, icon: "test", rows: [["name", t.name], ["file", t.file + ":" + t.line], ["state", t.state]],
        plain: "a case that proves this ending — and how sure the join is" }); });
      tl.append(c); });
    if (!(p.tests || []).length) tl.append(tg(E("i", { class: "ptnone" }, "— no case asserts this ending"), "coverage-per-condition"));
    b.append(tl);
    if ((p.switches || []).length) { b.insertAdjacentHTML("beforeend", ptSec("switches · " + p.switches.length));
      var sw = E("div", { class: "ptsw" });
      p.switches.forEach(function(s){ var c = tg(E("span", { class: "ptswc" }, esc(s.kind + " · " + (s.via || s.port || s.fn || "—"))), "switches");
        bind(c, function(){ return cmdc({ title: s.kind + " switch", value: s.via || s.port || "—", icon: "layers",
          rows: [["scope", s.scope || "—"], ["expr", s.expr || "—"], ["settings", Object.keys(s.settings || {}).join(" · ") || "—"]].concat(commonRows(F, "switch:" + s.kind)),
          plain: "something outside the code decides which way this goes" }); });
        sw.append(c); });
      b.append(sw); }
    inflightSec(b, F, S);
    box.append(claim(b)); }
  /* leftovers piece 11 (Slice 12) — what is ALIVE while this request runs, in request order: what it is called, where it is set
     and by what, where it is read, and whether it goes with the answer. Every word is the feed's own (the rule's `says`);
     the lifetime is the CHIP, because that is what the operator asked to see. Same components as the sections above. */
  var ALIVEW = { state: "kept on the request", contextvar: "a context value the code reads without passing it", "dependency-value": "handed to the handler by a dependency",
                 background: "queued to run after the answer", lock: "a lock this request holds", cache: "an answer kept from an earlier request",
                 "built-once": "built once when the app starts", "setting-once": "a setting read once when the app starts" };
  var ALIVEICO = { state: "endpoint", contextvar: "globe", "dependency-value": "link", background: "wave", lock: "key",
                   cache: "layers", "built-once": "entity", "setting-once": "role" };
  var ALIVETONE = { "with the answer": "read", "with the server process": "write", "unknown": "none" };
  function aliveWhere(r){
    if (!r.set_at || r.set_at === "unknown") return "where it is set — not read here";
    var by = r.set_by && r.set_by !== "unknown" ? String(r.set_by).split("::").pop().replace(/^middleware:/, "") : null;
    return shortAt(r.set_at) + (by ? " · " + by : "") + (r.set_fn ? " (one call down)" : "") + (r.set_cond ? " · only under a condition" : ""); }
  function aliveRead(r){
    var n = (r.read_at || []).length;
    if (!n) return r.reads === "found" ? "read, the site not named" : "not read anywhere this endpoint reaches";
    return shortAt(r.read_at[0].at) + (r.read_at[0].via ? " · through " + shortAt(r.read_at[0].via) : "")
      + (n > 1 ? " · and " + (n - 1 + (r.reads_more || 0)) + " more" : ""); }
  function inflightSec(b, F, S){ var f = (FRM(F) || {}).inflight; if (!f) return;
    if (f.state !== "present") { b.insertAdjacentHTML("beforeend", ptSec("alive during the request"));
      b.insertAdjacentHTML("beforeend", ptRow("not read", f.why || "this feed carries no in-flight reading")); return; }
    b.insertAdjacentHTML("beforeend", ptSec("alive during the request · " + f.n.rows));
    var l = E("div", { class: "pttbl" });
    (f.rows || []).forEach(function(r){
      var c = tg(E("div", { class: "ptcr" }), r.dies === "with the answer" ? ["in-flight-values", "request-scoped-state"] : "in-flight-values");
      c.style.setProperty("--tc", S.OPC[ALIVETONE[r.dies] || "none"] || "var(--muted)");
      c.insertAdjacentHTML("beforeend", '<span class="ptcg">' + ico(ALIVEICO[r.kind] || "info", 13, "currentColor") + "</span>");
      c.append(E("b", null, esc(r.name)));
      var w = E("i", { class: "ptcf" }, esc(r.dies === "with the answer" ? "with the answer" : r.dies === "with the server process" ? "with the server" : "how long — unknown"));
      w.style.color = S.OPC[ALIVETONE[r.dies] || "none"] || "var(--muted)";      // the lifetime IS the row's colour — the one thing he asked to see
      c.append(w);
      bind(c, function(){ return cmdc({ title: r.name, value: ALIVEW[r.kind] || r.kind, icon: "layers",
        rows: [["where it is set", aliveWhere(r)], ["where it is read", aliveRead(r)],
               ["how long it lasts", r.dies || "unknown"]]
          .concat(r.from ? [["its value comes from", (r.from.kind === "header" ? "the " + r.from.name + " header" : "the request's " + r.from.name) + (r.from.cond ? ", when the condition holds" : "")]] : [])
          .concat(r.ref ? [["shared with", (r.applies_to || 1) + " endpoint(s)"]] : [])
          .concat(r.would_be ? [["the rule it would take", r.would_be.says || r.would_be.id]] : []),
        plain: (r.rule && r.rule.says) || "something that lives through the request" }); });
      l.append(c); });
    b.append(l); }
  function exitPortrait(box, F, S){ var e = selExit(F);
    if (!e) { box.append(E("div", { class: "ptidle" }, E("b", null, "no exit in force"), E("span", null, "pick a rung's exit, or a path — its exit lands here."))); return; }
    var r = e.response || {}, b = E("div", { class: "ptbody ptrec" });
    b.insertAdjacentHTML("beforeend", '<div class="ptttl"' + fa(["the-endings", "kinds-of-ending", "status-code-per-ending"]) + '>' + ico((CMDKIND[e.kind] || {}).ico || "info", 15, kindCol(e.kind, S)) + "<b>" + esc(String(e.status) + (e.detail ? " " + e.detail : "")) + "</b></div>");
    b.insertAdjacentHTML("beforeend", ptRow("stage", e.phase, null, "the-stage-an-ending-leaves-from") + ptRow("row", e.row) + ptRow("code", e.code || "—") + ptRow("via", e.via || "—")
      + ptRow("pred", e.pred || "—", null, ["the-predicate-per-decision-point"].concat(((FRM(F) || {}).preconditions || []).some(function(g){ return g.exit === e.id; }) ? ["own-guards"] : [])) + ptRow("form", (e.form || "—") + " · " + e.state) + ptRow("at", e.at || "—", null, "file-line")
      + (e.status === 429 ? rateRows(F) : commonRows(F, "status:" + e.status)).map(function(r){ return ptRow(r[0], r[1], null, e.status === 429 ? "rate-tier" : "how-common-this-piece-is"); }).join(""));
    b.insertAdjacentHTML("beforeend", ptSec("response", "response-shape-per-ending"));
    b.insertAdjacentHTML("beforeend", ptRow("media", r.media || "—", null, "response-shape-per-ending") + ptRow("model", r.model || "—", null, "response-shape-per-ending")
      + ptRow("body", r.body ? Object.keys(r.body).join(" · ") : "—", null, "response-shape-per-ending") + ptRow("fields", (r.fields || []).join(" · ") || "—", null, "response-shape-per-ending")
      + ptRow("headers", r.headers && Object.keys(r.headers).length ? Object.keys(r.headers).map(function(k){ return k + (r.headers[k] && r.headers[k] !== "…" ? ": " + r.headers[k] : ""); }).join(" · ") : "— none beside the body", null, "response-headers-per-ending"));
    /* leftovers piece 3 — a validation ending lists the rules that produce it: the field, the kind of refusal, the rule, the line */
    if ((e.cases || []).length) {
      var byT = {}; e.cases.forEach(function(c){ byT[c.type] = (byT[c.type] || 0) + 1; });
      b.insertAdjacentHTML("beforeend", ptSec("the rules that refuse the body · " + e.cases.length, "validation-cases"));
      b.insertAdjacentHTML("beforeend", ptRow("kinds", Object.keys(byT).map(function(k){ return byT[k] + " " + k; }).join(" · ")));
      var cl = E("div", { class: "ptchain ptcases" });
      e.cases.forEach(function(c, i){ var r2 = tg(E("div", { class: "ptcr k-case" }), ["validation-cases", "field-rules-of-the-request-body"]); r2.dataset.caseType = c.type || "";
        r2.insertAdjacentHTML("beforeend", '<span class="ptci">' + String(i + 1) + "</span>");
        r2.insertAdjacentHTML("beforeend", '<span class="ptcg">' + ico("schema", 12, "var(--muted)") + "</span>");
        r2.append(E("b", null, esc(String(c.loc || c.param || "body"))));
        r2.append(E("span", { class: "ptcs" }, esc(String(c.type || "") + (c.rule ? " · " + c.rule : ""))));
        bind(r2, function(){ return cmdc({ title: String(c.loc || "body"), value: c.type, icon: "schema",
          rows: [["rule", c.rule || "—"], ["kind of refusal", c.type || "—"], ["at", c.at || "—"], ["shape", String(c.schema || "—").replace(/^schema:/, "")]],
          plain: "one rule on the body — break it and the request ends here with a 422" }); });
        cl.append(r2); });
      b.append(cl); }
    b.insertAdjacentHTML("beforeend", ptSec("on the client"));
    var CLFA = { "then refetched": "client-cache-effects", "filled in at once": "client-cache-effects", "its branch": "can-the-client-tell-the-endings-apart",
                 "what it does": "what-the-screen-does-on-this-ending", "tried again": "what-the-screen-does-on-this-ending" };   /* "guards that read it" names route guards — no field of the card */
    b.insertAdjacentHTML("beforeend", '<div class="ptclient">' + clientRows(F, e).map(function(r){ return ptRow(r[0], r[1], null, CLFA[r[0]]); }).join("") + "</div>");
    b.insertAdjacentHTML("beforeend", ptSec("paths that end here · " + (e.paths || []).length));
    var pl = E("div", { class: "pttbl" });
    (e.paths || []).forEach(function(id){ var p = pathById(F, id); if (!p) return;
      var c = tg(E("button", { class: "ptpath" }, esc(pathWord(p))), "the-endings");
      c.dataset.path = id;
      c.addEventListener("click", function(ev){ ev.stopPropagation(); window.selectPath(id); });
      pl.append(c); });
    b.append(pl);
    b.insertAdjacentHTML("beforeend", ptSec("tests · " + uniq((e.tests || []).map(function(t){ return t.case; })).length));
    var tl = E("div", { class: "pttests" });
    uniq((e.tests || []).map(function(t){ return t.case; })).forEach(function(cid){ var t = e.tests.filter(function(x){ return x.case === cid; })[0];
      var c = tg(E("button", { class: "ptcase" }, esc(cid + " · " + t.conf)), "cases"); c.dataset["case"] = cid;
      c.addEventListener("click", function(ev){ ev.stopPropagation(); window.selectCase(cid); }); tl.append(c); });
    if (!(e.tests || []).length) tl.append(tg(E("i", { class: "ptnone" }, "— no case asserts this exit"), "coverage-per-condition"));
    b.append(tl); box.append(claim(b)); }
  function caseRefs(F, cid){ var fm = FRM(F), out = []; if (!fm) return out;
    (fm.exits || []).forEach(function(e){ (e.tests || []).forEach(function(t){ if (t.case === cid) out.push({ exit: e, t: t }); }); });
    return out; }
  function casePortrait(box, F, S){ var cid = (window.SEL || {})["case"];
    if (!cid) { box.append(E("div", { class: "ptidle" }, E("b", null, "no case in force"), E("span", null, "click a C-id on the path or exit record."))); return; }
    var refs = caseRefs(F, cid), t = refs.length ? refs[0].t : null;
    var lab = (F.tests.cases || []).filter(function(c){ return c.cid === cid; })[0] || null;
    var b = E("div", { class: "ptbody ptrec" });
    b.insertAdjacentHTML("beforeend", '<div class="ptttl"' + fa("cases") + '>' + ico("test", 15, testCol()) + "<b>" + esc(cid) + "</b></div>");
    b.insertAdjacentHTML("beforeend", ptRow("name", (t && t.name) || (lab && lab.name) || "—") + ptRow("file", t ? t.file + ":" + t.line : "—")
      + ptRow("corpus", (t && t.corpus) || (lab && lab.corpus) || "—") + ptRow("state", (t && t.state) || (lab && lab.state) || "—"));
    var ro = rosterOf(F, cid);
    if (ro) b.insertAdjacentHTML("beforeend", ptRow("role", ROLEWORD[ro.role] || ro.role, null, "case-role-on-this-endpoint") + ptRow("asserts", assertWords(ro.asserts) || (ro.role === "act" ? "— nothing the reading could name" : "— it asserts nothing about this endpoint"), null, "what-the-case-asserts-on-this-condition")
      + (t && t.sends && t.sends.length ? ptRow("sends", t.sends.join(" · ")) : ""));
    b.insertAdjacentHTML("beforeend", ptSec("proves · " + refs.length + " exit(s)"));
    var l = E("div", { class: "pttbl" });
    refs.forEach(function(r){ var c = tg(E("button", { class: "ptpath" }, esc(r.exit.status + " " + (r.exit.detail || r.exit.kind) + " · " + r.t.conf)), "coverage-per-condition");
      c.dataset.exit = r.exit.id;
      c.addEventListener("click", function(ev){ ev.stopPropagation(); window.selectExit(r.exit.id); });
      bind(c, function(){ return exitCard(r.exit, F, S); }); l.append(c); });
    if (!refs.length) l.append(E("i", { class: "ptnone" }, "— the forms tests arm joins this case to no exit"));
    b.append(l); box.append(claim(b)); }

  window.CMDKIT = {
    render: function(host, F, S){ var C = cmdCfg(), L = C.layout || "card";
      host.innerHTML = "";
      if (L === "ladder") renderCmdLadder(host, F, S);
      else if (L === "matrix") renderCmdMatrix(host, F, S);
      else renderCmdCard(host, F, S); },
    strip: renderCmdStrip,
    applyPath: applyPath,
    paths: pathCells,
    pathById: pathById,
    exitById: exitById,
    pathWord: pathWord,
    pathName: pathName,
    pathCol: pathCol,
    kindCol: kindCol,
    kindIco: function(k){ return (CMDKIND[k] || {}).ico || "info"; },
    partFacts: partFacts,
    onPath: onPath,
    portraits: function(F){ var S0 = window.SEL || {}, out = [];
      if (S0.path) out.push({ key: "cmd-path", label: "Path", icon: "journey", hint: "one way the request ends, step by step — what it wrote, what proved it", render: pathPortrait });
      if (S0.path || S0.exit) out.push({ key: "cmd-exit", label: "Exit", icon: "up", hint: "the row an ending lands on — its response, the paths that reach it, its cases", render: exitPortrait });
      if (S0["case"]) out.push({ key: "cmd-case", label: "Case", icon: "test", hint: "one test — what it calls, and the exits it proves", render: casePortrait });
      return out; } };


  /* ── the registry — icons are STATION icons (words on hover), counts answer A ─────────── */
  window.PANELS = {
    data: { icon: "table", word: "Data", col: S.KINDCOL.model,
      defaultVariant: "stageblocks", /* the operator's model, 2026-09-17: the BLOCKS, grouped by stage */
      portraitSubject: function(F){ var t = selTable(F); return t ? t.table : null; },
      portraits: [ { key: "record", label: "Record", icon: "doc", hint: "everything the feed knows about the table, in rows — the densest honest reading", render: dataPortrait },
                   { key: "shape", label: "Shape", icon: "model", hint: "the drum as the graph draws it, with every field a cell beneath it", render: dataShape },
                   { key: "wheel", label: "Wheel", icon: "target", hint: "the fields laid in a ring, so what the table is MADE OF reads at a glance", render: dataWheel },
                   { key: "keys", label: "Keys", icon: "key", hint: "what this table points at, and what points back", render: dataKeys } ], hint: "every table this endpoint reads or writes, on the grounds of the entities that own them, one DB commit; each tile a stack whose height is its column count",
      count: function(F){ return F.data.tables.length; },
      variants: [ { key: "grounds", label: "Grounds", hint: "tables tiled on entity-coloured grounds; the shape stacks stand vertically. Reads by entity first.", render: renderData },
                  { key: "flow", label: "Flow", hint: "ONE left-to-right axis — request → the whole table field (writes first, entity by dot) → response. Uses the width.", render: renderDataFlow },
                  { key: "ledger", label: "Ledger", hint: "one row per table with every column the feed knows (entity · rw · shape · cols · fk · uq · model). The densest honest form.", render: renderDataLedger },
                  { key: "fields", label: "Fields", hint: "the columns THEMSELVES, named and typed, filtered by channel — written, read, or both. The one distribution where the fields ARE the picture instead of a stack of lines.", render: renderDataFields },
                  { key: "blocks", label: "Blocks", hint: "one ROW per table — whose entity, how many fields, what kinds — and each field a little coloured square. Click a row to name every field at once.", render: renderDataBlocks },
                  { key: "stages", label: "Stages", pathAware: true, hint: "the tables laid across the endpoint's stages — where each is touched, and the fate of the write at the end", render: renderDataStages },
                  { key: "stageblocks", label: "Stage blocks", pathAware: true, hint: "the same block per table, grouped under the stage that touches it — rows or columns of stages", render: renderDataStageBlocks } ] },
    schemas: { icon: "schema", word: "Schemas", col: S.KINDCOL.schema, hint: "the shapes that cross the endpoint — the request's 7 fields with 6 nested shapes in, the response's 6 with 5 nested out; drawn as lines, the exact fields on hover",
      count: function(F){ return (F.data.schemas.request.cols || []).length + (F.data.schemas.response.cols || []).length; },
      defaultVariant: "blocks",      /* the pattern book's first carry-over, 2026-09-13 */
      portraitSubject: function(F){ var s = schSel(F); return s ? s.name : null; }, portraitIcon: "schema",
      portraits: [ { key: "record", label: "Record", icon: "doc", hint: "everything the feed knows about the shape, in rows, then every field in a table", render: schRecord } ],
      variants: [ { key: "shapes", label: "Shapes", hint: "the two shapes side by side as stacks, each nested shape given its own stack below its parent.", render: renderSchemas },
                  { key: "fields", label: "Fields", hint: "every field of both shapes as rows, nested fields indented under the one that carries them.", render: renderSchemaFields },
                  { key: "blocks", label: "Blocks", hint: "one block per shape — the bodies and every nested shape — each field a mark, its kind read from the declared type. Click a block for its record.", render: renderSchemaBlocks } ] },
    functions: { icon: "function", word: "Functions", col: S.KINDCOL["function"], hint: "the handler and the call tree behind it — reach " + window.LABEP.functions.behind.depth + " · " + window.LABEP.functions.behind.fns + " behind; the levels walk " + window.LABEP.functions.walk_levels.join("·") + " with the confidence of each hop; ONE bead walks it",
      count: function(F){ return F.functions.behind.fns; },
      defaultVariant: "blocks",      /* the pattern book's second carry-over, 2026-09-13 */
      portraitSubject: function(F){ var x = fnSel(F); return x ? x.name : null; }, portraitIcon: "function",
      portraits: [ { key: "record", label: "Record", icon: "doc", hint: "what it does with the store and where it sits, then the tables it touches and the functions it calls", render: fnRecord } ],
      variants: [ { key: "levels", label: "Levels", hint: "one column per hop, every callee visible at once; the bead crosses the strip.", render: renderFunctions },
                  { key: "chain", label: "Chain", hint: "the walk as one horizontal spine; a hop opens below when you click it. Fits a short box.", render: renderFnChain },
                  { key: "ledger", label: "Ledger", hint: "one row per function — hop · role · size · confidence · commit · tables touched.", render: renderFnLedger },
                  { key: "blocks", label: "Blocks", hint: "one block per function — the handler and the walk — each mark a table it touches or a function it calls. Click a block for its record.", render: renderFnBlocks } ] },
    tests: { icon: "test", word: "Tests", col: "#4cbe83", hint: "the cases that reach this endpoint stacked by the status they assert (26 api, all passing · 15 web as file coverage) and the 6+21 cross-entity journeys",
      count: function(F){ return F.tests.cases.length + F.tests.case_files.length; },
      variants: [ { key: "status", label: "Status", hint: "a column per HTTP status the case names assert; the declared one is bordered.", render: renderTests },
                  { key: "ledger", label: "Ledger", hint: "one row per case — id · status · corpus · state · full name — with the journeys beside.", render: renderTestsLedger } ] },
    widening: { icon: "globe", word: "Widening", col: S.KINDCOL.screen || "#a855f7", hint: "how far the endpoint reaches: the ladder from the endpoint up to the app, and the workflow steps around it",
      count: function(F){ return F.widening.fetched_by.length + F.widening.chain.reduce(function(s, l){ return s + l.length; }, 0); },
      variants: [ { key: "ladder", label: "Ladder", hint: "the rungs stacked, the endpoint at the foot — reads bottom-up like a climb.", render: renderWidening },
                  { key: "flow", label: "Flow", hint: "the same reach on one horizontal axis with the journey rail above it. Uses the width.", render: renderWideFlow } ] },
    security: { icon: "key", word: "Security", col: "#eab308", hint: "what stands before the body runs: the app band (3, saturated), this endpoint's 3 deps with 1 gate, flag walls (none), the status contract, idempotency, the commit",
      count: function(F){ return F.security.guards.length + F.security.asgi.length; },
      variants: [ { key: "band", label: "Band", hint: "the app band over the endpoint's own deps, then the one-line facts. Reads top-down as layers.", render: renderSecurity },
                  { key: "gauntlet", label: "Gauntlet", hint: "the request runs left to right through every stop: band → deps → body → commit → answer.", render: renderSecGauntlet } ] },
  };
  window.EPKIT = { E: E, esc: esc, ico: ico, rwChip: rwChip, trust: trust, sechd: sechd, card: card, RWC: RWC };
})();
