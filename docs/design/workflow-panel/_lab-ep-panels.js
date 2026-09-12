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
  function rwChip(rw){ return '<i class="jdrw jdrw-' + rw + '" style="background:' + RWC[rw] + '">' + (rw === "rw" ? "RW" : rw.toUpperCase()) + '</i>'; }
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
  function head(box, icon, label, count, note, col){ var h = E("div", { class: "phd" }, sechd(icon, label, count, false, col));
    if (note) h.append(E("div", { class: "phdnote", html: note })); box.append(h); return h; }
  function legend(items){ var l = E("div", { class: "plgd" });
    items.forEach(function(it){ var s = E("span", { class: "lg" }, (it.swatch ? '<i class="sw" style="' + it.swatch + '"></i>' : it.icon ? ico(it.icon, 12, it.col) : ""), esc(it.t));
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
      "every table this door touches, grouped on its entity's ground — each tile a stack whose height is its column count");
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
      bind(gh, card({ title: ent, icon: "entity", color: ec, sub: "entity ground · " + ts.length + " table(s) this door touches",
        rows: [["writes", String(ts.filter(function(t){ return t.rw !== "r"; }).length)], ["reads", String(ts.filter(function(t){ return t.rw !== "w"; }).length)], ["own entity", ent === I.entity ? "yes — the door's own" : "no — the door reaches across"]],
        body: ent === I.entity ? "the door's own entity." : "a CROSS-ENTITY touch: this door writes into another entity's tables." }));
      g.append(gh);
      var tiles = E("div", { class: "tiles" });
      ts.sort(function(a, b){ return b.cols.length - a.cols.length; }).forEach(function(t){
        var fkSet = {}; (t.fks || []).forEach(function(f){ fkSet[Array.isArray(f) ? f[0] : f] = (Array.isArray(f) && f[1]) ? f[1] : true; });
        var uqSet = {}; (t.uqs || []).forEach(function(u){ (Array.isArray(u) ? u : [u]).forEach(function(c){ uqSet[c] = 1; }); });
        var tile = E("div", { class: "tile rw-" + t.rw });
        tile.append(E("div", { class: "tnm" }, rwChip(t.rw), E("b", null, esc(t.table)), E("span", { class: "tc" }, String(t.cols.length))));
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
      E("span", { class: "cnote" }, D.commits ? "the writes above become permanent in ONE transaction" : "this door only reads — access.commits is false"),
      E("i", { class: "pulse" }));
    bind(cm, card({ title: D.commits ? "the DB transaction commits" : "no DB commit", icon: "key", color: S.OPC.write,
      sub: "access.commits · the pulse means the transaction, NEVER a git commit",
      rows: [["writes", String(D.writes.length) + " ops"], ["tables written", String(D.tables.filter(function(t){ return t.rw !== "r"; }).length)], ["idempotency", F.security.idempotent ? "guarded by " + F.security.idempotency_table : "none"]],
      body: "git history is a different thing entirely — this door appears in " + (F.git_touches.commits.length) + " of the feed's " + F.feedwide.commits_on_feed + " recent git commits." }));
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
        body: "the FILE wins here — evidence only, nothing is re-homed. The data witness leans <b>settings</b> because 5 of the 13 tables this door writes belong to settings." }));
      foot.append(er); COV.mark("EVIDENCE", "data"); }
    var mh = I.models_home || {}; var mrow = E("div", { class: "kv mdl" }, ico("link", 13), E("span", { class: "k" }, "model"), E("span", { class: "v" }, "claim " + I.entity + (mh.seeded || mh.derived || mh.proposed ? " · a view re-homes it" : " · every entity model keeps it here (no delta)")));
    bind(mrow, card({ title: "entity model", icon: "link", sub: "claim is the join key; seeded · derived · proposed are views",
      rows: [["claim", I.entity], ["seeded", mh.seeded || "no delta"], ["derived", mh.derived || "no delta"], ["proposed", mh.proposed || "no delta"]],
      body: "the station is settled on <b>seeded</b>; a view moves a piece as a DELTA, nothing is re-homed on disk." }));
    foot.append(mrow); COV.mark("MODEL ROW", "data");
    foot.append(legend([
      { t: "reads", swatch: "background:" + RWC.r, tip: card({ title: "reads", sub: "the station's journey-matrix chip", body: "13 read ops. Colour inherited from <code>.jdrw-r</code>." }) },
      { t: "writes", swatch: "background:" + RWC.w, tip: card({ title: "writes", sub: "the station's journey-matrix chip", body: "11 write ops — J mutation." }) },
      { t: "both", swatch: "background:" + RWC.rw, tip: card({ title: "reads + writes", sub: "the same table on both channels", body: D.both.length + " of the 13 tables are read AND written by this one door." }) },
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
        bind(t, card({ title: n.name, icon: "schema", color: S.KINDCOL.schema, sub: "nested in " + sc.name + " · " + n.cols.length + " fields",
          fields: n.cols.map(function(c){ return c[0] + " · " + c[1]; }), station: "schema:" + n.name }));
        nb.append(t); });
      col.append(nb); }
    return col; }

  function renderSchemas(box, F, S){
    var D = F.data, I = F.identity, req = D.schemas.request, res = D.schemas.response;
    var nIn = (req.cols || []).length, nOut = (res.cols || []).length;
    head(box, "schema", "Schemas", nIn + " in · " + nOut + " out",
      "the shapes that cross the door, drawn as LINES — one line per field, its height the field count; the exact fields live on the hover cards");
    var body = E("div", { class: "scbody" });
    body.append(schemaBlock(req, "in", F, S));
    body.append(E("div", { class: "dfarrow" }, ico("drill", 15, "var(--muted)")));
    body.append(schemaBlock(res, "out", F, S));
    box.append(body);
    var foot = E("div", { class: "pfoot" });
    var pr = E("div", { class: "kv" }, ico("down", 13, S.OPC.write), E("span", { class: "k" }, "payload"), E("span", { class: "v" },
      ((I.payload || {}).n != null ? I.payload.n : nOut) + " fields ferried → " + (res.name || "—")
      + (F.widening.response_consumers.length ? " · also returned by " + F.widening.response_consumers.length + " other door(s)" : "")));
    bind(pr, card({ title: "payload", icon: "down", color: S.OPC.write, sub: "the response contract's field count",
      rows: [["schema", res.name || "—"], ["fields", String((I.payload || {}).n != null ? I.payload.n : nOut)],
             ["shared with", F.widening.response_consumers.join(" · ") || "— this door alone"]],
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
      bind(hd, card({ title: sc.name, icon: "schema", color: S.KINDCOL.schema, sub: dir === "in" ? "request body" : "response body",
        rows: [["file", String(sc.file || "—")]], fields: (sc.cols || []).map(function(c){ return c[0] + " · " + c[1]; }) }));
      body.append(hd);
      var nestOf = {}; (sc.nested || []).forEach(function(n){ nestOf[n.name] = n; });
      var rows = [];
      (sc.cols || []).forEach(function(c){
        var base = String(c[1]).replace(/\s*\|\s*None$/, "").replace(/^(list|List|Optional)\[(.*)\]$/, "$2");
        var n = nestOf[base];
        rows.push({ cells: [dir === "in" ? "→" : "←", "<b>" + esc(c[0]) + "</b>", esc(c[1]), n ? n.cols.length + " fields" : "—"],
          card: card({ title: c[0], icon: n ? "schema" : "table", color: n ? S.KINDCOL.schema : null, sub: String(c[1]),
            rows: [["in", sc.name], n ? ["a nested shape", n.name + " · " + n.cols.length + " fields"] : null],
            fields: n ? n.cols.map(function(x){ return x[0] + " · " + x[1]; }) : null }) });
        if (n) n.cols.forEach(function(x){ rows.push({ cls: "sub", cells: ["", "<span class='nsub'>" + esc(x[0]) + "</span>", esc(x[1]), ""],
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
    bind(hc, card({ title: h.name, icon: "function", color: S.KINDCOL["function"], sub: "the handler · role " + (h.role || "—") + " · entity " + (h.entity || "—"),
      rows: [["signature", (F.identity.sig || {}).async ? "async" : "sync"], ["body", ((F.identity.sig || {}).lines || "?") + " lines"], ["returns", (F.identity.sig || {}).returns || "—"],
             ["file", h.file + (F.identity.flines ? ":" + F.identity.flines : "")], ["fan-in", F.identity.fanin + " caller (graph in-degree)"], ["docstring", F.identity.doc ? "present" : "— none in the feed"]],
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
      col.append(lh);
      var list = E("div", { class: "flist" });
      level.slice(0, 9).forEach(function(f){
        var chip = E("span", { class: "fchip" + (f.conf === "inferred" ? " inf" : "") + (f.god ? " god" : ""), style: "border-left-color:" + (RC[f.role] || "#8794ab") },
          E("b", null, esc(f.name)), f.lines ? E("span", { class: "ln" }, f.lines + "L") : null, f.commits ? E("i", { class: "cdot" }) : null);
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
    foot.append(bn);
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
      "every case that names this door, stacked under the STATUS it asserts · the declared status is " + T.declared_status + " · " + (allPass ? "all measured cases pass" : "not every case passes"));
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
      col.append(ch);
      var stack = E("div", { class: "tstack" });
      cids.slice(0, 10).forEach(function(cid){ var c = T.cases.filter(function(x){ return x.cid === cid; })[0] || { cid: cid, state: "unknown" };
        var chip = E("span", { class: "pchip st-" + (c.state || "unknown") }, ico(c.state === "pass" ? "test" : c.state === "fail" ? "alert" : "info", 11), esc(cid));
        bind(chip, card({ title: cid, icon: "test", color: c.state === "pass" ? "var(--ok)" : "var(--muted)", sub: (c.corpus || "api") + " · " + (c.state === "pass" ? "passing" : c.state),
          rows: [["name", c.name || "—"], ["asserts", isCode ? "HTTP " + k : "no status in the name"], ["corpus", c.corpus || "api"]] }));
        stack.append(chip); });
      if (cids.length > 10) { var m = E("span", { class: "more" }, "+" + (cids.length - 10));
        bind(m, card({ title: k + " · the rest", fields: cids.slice(10) })); stack.append(m); }
      col.append(stack); cols.append(col); });
    /* the web corpus — file coverage, the honest weaker signal (hatched) */
    T.case_files.forEach(function(f){
      var col = E("div", { class: "tcol filecov" });
      var ch = E("div", { class: "thd" }, E("b", null, esc(f.corpus || "web")), E("span", { class: "n" }, esc(f.name)));
      bind(ch, card({ title: (f.corpus || "web") + " · file coverage", icon: "file", sub: "reaches this door, names no case id",
        rows: [["signal", f.name], ["strength", "weaker — the file reaches it, no case claims it"]],
        body: "G — how sure: hatched means MEASURED but not attributed. The web corpus tests the screen, not the door by name." }));
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
        body: "a cross-entity test: it starts or passes through this door and travels out." }));
      jl.append(cell); });
    if (T.journeys_more) { var jm = E("span", { class: "more" }, "+" + T.journeys_more + " more");
      bind(jm, card({ title: "+" + T.journeys_more + " journeys", sub: "beyond the loaded set", body: "the emitter caps the per-node journey list; the full ledger is the evidence matrix." })); jl.append(jm); }
    jr.append(jl); body.append(jr); box.append(body);

    var foot = E("div", { class: "pfoot" });
    if (T.workflows.length) T.workflows.forEach(function(w){
      var wr = E("div", { class: "kv" }, ico("journey", 13, "var(--accent)"), E("span", { class: "k" }, "workflow"), E("span", { class: "v" }, esc(w.name) + " — step " + (w.step_index[0] + 1) + " of " + w.steps.length));
      bind(wr, card({ title: w.name, icon: "journey", color: "var(--accent)", sub: "a CURATED user workflow · level " + w.level,
        fields: w.steps.map(function(s, i){ return (i === w.step_index[0] ? "▶ " : "  ") + s; }), body: esc(w.note || "") })); foot.append(wr); });
    foot.append(legend([
      { t: "passing", swatch: "background:var(--ok)", tip: card({ title: "passing", sub: "the case's recorded state", body: "all " + (F.tests.by_state.pass || 0) + " measured cases pass." }) },
      { t: "file coverage", swatch: "background:transparent;border:1px dashed var(--muted);height:6px;width:16px", tip: card({ title: "file coverage", sub: "G — measured, not attributed", body: "a test file reaches the door but names no case id." }) },
      { t: "declared status", swatch: "border:1px solid " + S.OPC.read + ";background:transparent;height:9px;width:9px", tip: card({ title: "the declared status", sub: T.declared_status, body: "the decorator declares it; the cases assert five different codes around it." }) },
      { t: "a face = an entity", icon: "entity", tip: card({ title: "journey faces", sub: "who the test touches", body: "one face per REAL entity the test spans; the ringed face is this door's own." }) }]));
    box.append(foot);
    COV.mark("TESTS", "tests"); COV.mark("JOURNEYS", "tests");
  }

  /* ══════════════════════════════════════════════════════════════════════════════════════
     4 · WIDENING — the STATIC sequence picture (D, the ladder): how far the door reaches.
     the workflow step before → the route → the screen → the hook that fetches → THE DOOR →
     what the response feeds. Plus usage and the door's place.
     ══════════════════════════════════════════════════════════════════════════════════════ */
  function renderWidening(box, F, S){
    var W = F.widening, I = F.identity, KC = S.KINDCOL;
    var reach = W.fetched_by.length + W.chain.reduce(function(s, l){ return s + l.length; }, 0);
    head(box, "globe", "Widening", reach + " reached",
      "the ladder reads OUTWARD from the door: who fetches it, what renders that, and where it sits in the user's journey");
    var body = E("div", { class: "wbody" });

    /* the ladder — the door at the bottom, the app at the top; each rung a real piece */
    var rungs = [];
    rungs.push({ kind: "endpoint", name: I.path, sub: I.method + " · " + I.entity, col: KC.endpoint, self: true,
      card: card({ title: I.label, icon: "endpoint", color: KC.endpoint, sub: "the door itself",
        rows: [["usage", (I.usage || {}).api + " api · " + (I.usage || {}).internal + " internal caller(s)"], ["fan-in", I.fanin + " (graph in-degree)"], ["entity", I.entity], ["layer", I.layer]] }) });
    W.fetched_by.forEach(function(p){ rungs.push({ kind: p.kind, name: p.name, sub: (p.hrole || p.kind) + (p.cache ? " · client-cached" : ""), col: S.KINDCOL.hook || "#10b981",
      card: card({ title: p.name, icon: "hook", color: S.KINDCOL.hook, sub: "the hook that fetches this door · home " + p.home,
        rows: [["role", p.hrole || "—"], ["cache", p.cache ? "yes — a server-cache sink (M, waiting)" : "no"], ["hops to a write", p.fed2w != null ? String(p.fed2w) : "—"], ["file", String(p.id || "").replace(/^fe:/, "")]],
        body: "the web→API bridge matched its fetch to this endpoint by method + path.", station: p.id }) }); });
    W.chain.forEach(function(level){ level.forEach(function(p){ rungs.push({ kind: p.kind, name: p.name, sub: p.rel + " → " + p.to + (p.feClass ? " · " + p.feClass : ""), col: KC[p.kind] || KC.component || "#2f7de1",
      card: card({ title: p.name, icon: p.kind === "route" ? "nav" : "web", color: KC[p.kind] || KC.component, sub: p.kind + " · home " + p.home,
        rows: [["relation", p.rel + " " + p.to], ["class", p.feClass || "—"], ["file", String(p.id || "").replace(/^fe:/, "")]], station: p.id }) }); }); });
    var ladder = E("div", { class: "ladder" });
    rungs.slice().reverse().forEach(function(r, i){
      var rr = E("div", { class: "rung" + (r.self ? " self" : "") , style: "--rc:" + r.col });
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
        bind(st, card({ title: pair[0], icon: "endpoint", sub: pair[1] === "here" ? "this door" : "the step " + pair[1], rows: [["workflow", s.workflow]] }));
        line.append(st); if (i < 2 && (i === 0 ? true : s.next)) line.append(E("i", { class: "arw", html: ico("drill", 11, "var(--muted)") })); });
      side.append(E("div", { class: "wname" }, esc(s.workflow)), line); });
    else side.append(E("div", { class: "wempty" }, "— no curated workflow names this door"));
    /* usage + the response's other consumers */
    var ub = E("div", { class: "ubar" }, E("div", { class: "ufill", style: "width:" + Math.min(100, ((I.usage || {}).api + (I.usage || {}).internal) * 9) + "%" }));
    var ur = E("div", { class: "uwrap" }, sechd("merge", "Usage", ((I.usage || {}).api || 0) + ((I.usage || {}).internal || 0), false), ub,
      E("div", { class: "sublbl" }, ico("link", 12), ((I.usage || {}).api || 0) + " api · " + ((I.usage || {}).internal || 0) + " internal caller(s)"));
    bind(ur, card({ title: "usage", icon: "merge", sub: "IN-DEGREE — how many elements depend on this one",
      rows: [["api", String((I.usage || {}).api)], ["internal", String((I.usage || {}).internal)], ["fan-in (graph)", String(I.fanin)], ["entity", I.entity], ["layer", I.layer]],
      body: "break it and this many are affected. In the graph: N satellites orbit the node." }));
    side.append(ur);
    if (W.response_consumers.length) { var rc = E("div", { class: "kv" }, ico("schema", 13, KC.schema), E("span", { class: "k" }, "shared out"), E("span", { class: "v" }, W.response_consumers.length + " other endpoint(s) return " + F.data.schemas.response.name));
      bind(rc, card({ title: "the response is shared", icon: "schema", color: KC.schema, sub: F.data.schemas.response.name + " leaves by more than one door", fields: W.response_consumers })); side.append(rc); }
    body.append(side); box.append(body);

    var foot = E("div", { class: "pfoot" });
    foot.append(legend([
      { t: "the door", icon: "endpoint", col: KC.endpoint, tip: card({ title: "the door", sub: "the rung the ladder stands on" }) },
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
  function renderSecurity(box, F, S){
    var SEC = F.security, FW = F.feedwide;
    head(box, "key", "Security", SEC.guards.length + " deps · " + SEC.asgi.length + " app",
      "read top to bottom: every request crosses the app band first, then this door's own deps, then the body runs");
    var body = E("div", { class: "sbody" });

    /* the ASGI band — app scope, ordered, saturated (it gates everything, so it separates nothing) */
    var band = E("div", { class: "band" });
    band.append(E("div", { class: "bhd" }, sechd("shield", "App band", SEC.asgi.length, false), E("span", { class: "bnote" }, "scope ALL · gates " + (SEC.app_middleware || {}).gates_endpoints + " of " + FW.endpoints + " endpoints" + ((SEC.app_middleware || {}).saturated ? " — saturated: it separates nothing" : ""))));
    var lanes = E("div", { class: "lanes" });
    SEC.asgi.forEach(function(m){
      var lane = E("div", { class: "lane" }, E("span", { class: "lo" }, String(m.order)), ico("shield", 13, S.OPC.gate), E("b", null, esc(m.name)), E("span", { class: "lg2" }, m.gates + " gated"));
      bind(lane, card({ title: m.name, icon: "shield", color: S.OPC.gate, sub: "ASGI middleware · order " + m.order + " · scope " + m.scope,
        rows: [["runs", "before every handler, in order " + m.order], ["gates", m.gates + " endpoints"], ["file", m.file + ":" + m.line], ["tie to this door", "— measured at APP scope only; no per-endpoint wire exists"]],
        body: "H — posture: the band is LIT because it is measured; the tie to this one door is not, so no wire is drawn." }));
      lanes.append(lane); });
    band.append(lanes); body.append(band);

    /* the door's own deps — the turnstile */
    var gates = E("div", { class: "gates" });
    gates.append(E("div", { class: "bhd" }, sechd("key", "This door's deps", SEC.guards.length, false), E("span", { class: "bnote" }, SEC.gates.length + " of " + SEC.guards.length + " decide whether the work proceeds")));
    var grow = E("div", { class: "grow" });
    SEC.guards.forEach(function(g){
      var isGate = !!g.gate, pct = Math.round(100 * g.feedwide / FW.endpoints);
      var t = E("div", { class: "turn" + (isGate ? " gate" : "") },
        ico(isGate ? "key" : "link", 14, isGate ? S.OPC.gate : "var(--muted)"),
        E("div", { class: "tt" }, E("b", null, esc(g.name)), E("span", { class: "ts" }, g.via + (isGate ? " · gate" : ""))),
        E("span", { class: "tw" }, pct + "%"));
      bind(t, card({ title: g.name, icon: isGate ? "key" : "link", color: isGate ? S.OPC.gate : null, sub: g.via + (isGate ? " · a GATE" : " · a dependency"),
        rows: [["runs", "before the handler body"], ["feed-wide", g.feedwide + " of " + FW.endpoints + " endpoints use it (" + pct + "%)"],
               g.fn_rec ? ["function", g.fn_rec.name + " · " + (g.fn_rec.role || "—") + (g.fn_rec.lines ? " · " + g.fn_rec.lines + " lines" : "")] : null,
               ["decides", isGate ? "yes — it can refuse the request" : "no — it supplies a resource"]],
        body: isGate ? "the turnstile: an unauthenticated request stops here." : "a resource dependency — a session, settings. It cannot refuse." }));
      grow.append(t); });
    gates.append(grow); body.append(gates);

    /* walls · contract · idempotency · commit — the four one-line facts, honest-empty where empty */
    var facts = E("div", { class: "sfacts" });
    var wallRow = E("div", { class: "sfact" + (SEC.walls.length ? "" : " hollow") }, ico("swords", 13, SEC.walls.length ? S.OPC.write : "var(--muted)"),
      E("b", null, "flag walls"), E("span", { class: "sv" }, SEC.walls.length ? SEC.walls.length + " — " + SEC.walls.map(function(w){ return w.flag; }).join(" · ") : "none — no feature flag can close this door"));
    bind(wallRow, card({ title: "flag walls", icon: "swords", sub: SEC.walls.length ? SEC.walls.length + " wall(s)" : "measured zero",
      rows: [["here", SEC.walls.length ? "walled" : "no wall"], ["feed-wide", SEC.flags_feedwide + " flag(s) exist, walling other doors"]],
      body: "G — HOLLOW means measured and empty: the emitter looked and found none. Not the same as unmeasured." }));
    facts.append(wallRow);
    var sc = SEC.status, obs = Object.keys(sc.observed).filter(function(k){ return /^\d/.test(k); });
    var scRow = E("div", { class: "sfact" }, ico("info", 13, S.OPC.read), E("b", null, "status contract"), E("span", { class: "sv" }, "declares " + sc.declared + (sc.declared_name ? " (" + sc.declared_name + ")" : "") + " · the cases assert " + obs.join(" · ")));
    bind(scRow, card({ title: "the status contract", icon: "info", sub: "what the door promises vs what the tests assert",
      rows: [["declared", String(sc.declared)], ["asserted", obs.join(" · ")], ["untyped cases", String((sc.observed["no code in name"] || []).length) + " name no code"]],
      body: "the decorator declares one code; the corpus proves five. Both are true — the others are failure paths." }));
    facts.append(scRow);
    var idRow = E("div", { class: "sfact" + (SEC.idempotent ? "" : " hollow") }, ico("target", 13, SEC.idempotent ? S.OPC.gate : "var(--muted)"), E("b", null, "idempotency"),
      E("span", { class: "sv" }, SEC.idempotent ? "guarded — writes " + SEC.idempotency_table + " (3 unique constraints)" : "none — a retry runs the work again"));
    bind(idRow, card({ title: "idempotency", icon: "target", sub: SEC.idempotent ? "the door claims a key before it works" : "unguarded",
      rows: [["table", SEC.idempotency_table || "—"], ["M — waiting", "a repeat request waits on the claim rather than doing the work twice"]],
      body: "the walk shows it: <code>claim</code> and <code>complete</code> both commit against this table." }));
    facts.append(idRow);
    var cRow = E("div", { class: "sfact" + (SEC.commits ? "" : " hollow") }, ico("key", 13, SEC.commits ? S.OPC.write : "var(--muted)"), E("b", null, "DB commit"),
      E("span", { class: "sv" }, SEC.commits ? "yes — one transaction makes the 11 writes permanent" : "no — this door only reads"), E("i", { class: "pulse" }));
    bind(cRow, card({ title: "the DB transaction", icon: "key", color: S.OPC.write, sub: "access.commits — never a git commit",
      rows: [["writes", String(F.data.writes.length) + " ops"], ["tables", String(F.data.tables.filter(function(t){ return t.rw !== "r"; }).length)]],
      body: "the same pulse beats on the DATA panel's baseline — one clock, one meaning." }));
    facts.append(cRow);
    var dRow = E("div", { class: "sfact" + (SEC.stream ? "" : " hollow") }, ico("wave", 13, SEC.stream ? S.KINDCOL.web : "var(--muted)"), E("b", null, "delivery"),
      E("span", { class: "sv" }, SEC.stream ? "streams to the client — pieces leave as they are made" : "one response, whole — this door does not stream"));
    bind(dRow, card({ title: "delivery", icon: "wave", sub: SEC.stream ? "streaming" : "not a stream",
      rows: [["stream", SEC.stream ? "yes (SSE / chunked)" : "no"], ["exported", SEC.exported ? "yes" : "no"]],
      body: "M — waiting: a stream keeps the connection open; this one answers once." }));
    facts.append(dRow);
    body.append(facts); box.append(body);

    var foot = E("div", { class: "pfoot" });
    foot.append(legend([
      { t: "gate", swatch: "background:" + S.OPC.gate, tip: card({ title: "a gate", sub: "it can refuse", body: "1 of this door's 3 deps decides whether the work proceeds." }) },
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
      r.cells.forEach(function(c){ row.append(typeof c === "string" ? E("span", { html: c }) : c); });
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
    var fhd = E("div", { class: "dfhd" }, sechd("key", "the door writes, then reads", TS.length, false),
      E("span", { class: "dfnote" }, D.writes.length + " write ops · " + D.reads.length + " read ops · " + D.entities.length + " entities · " + D.both.length + " tables on both channels"));
    field.append(fhd);
    var grid = E("div", { class: "dfgrid" });
    TS.slice().sort(function(a, b){ return (a.rw === "r") - (b.rw === "r") || b.cols.length - a.cols.length; }).forEach(function(t){
      var fkSet = {}; (t.fks || []).forEach(function(f){ fkSet[Array.isArray(f) ? f[0] : f] = true; });
      var uqSet = {}; (t.uqs || []).forEach(function(u){ (Array.isArray(u) ? u : [u]).forEach(function(c){ uqSet[c] = 1; }); });
      var tile = E("div", { class: "tile rw-" + t.rw, style: "--ec:" + (t.entity_color || "#888") },
        E("div", { class: "tnm" }, '<i class="pdot" style="background:' + (t.entity_color || "#888") + '"></i>', rwChip(t.rw), E("b", null, esc(t.table)), E("span", { class: "tc" }, String(t.cols.length))),
        shapeStack(t.table, t.cols, { color: t.entity_color, fkSet: fkSet, uqSet: uqSet, more: t.cols_more, cls: "tbars" }));
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
      return { cells: ['<i class="pdot" style="background:' + (t.entity_color || "#888") + '"></i>' + esc(t.entity || "—"), rwChip(t.rw), "<b>" + esc(t.table) + "</b>",
          shapeStack(t.table, t.cols, { color: t.entity_color, fkSet: fkSet, uqSet: uqSet, cls: "inline" }),
          String(t.cols.length), String((t.fks || []).length || "—"), String((t.uqs || []).length || "—"), esc(t.model)],
        card: card({ title: t.table, icon: "model", color: S.KINDCOL.model, sub: "model " + t.model + " · entity " + t.entity,
          rows: [["here", t.rw === "rw" ? "reads + writes" : t.rw === "w" ? "writes" : "reads", RWC[t.rw]], ["file", String(t.file || "—")]],
          fields: t.cols.map(function(c){ return c[0] + " · " + c[1] + (fkSet[c[0]] ? "  (fk)" : "") + (uqSet[c[0]] ? "  (unique)" : ""); }), station: t.id }) }; });
    ledger(body, ["entity", "rw", "table", "shape", "cols", "fk", "uq", "model"], rows, { grid: "104px 34px 1fr 128px 44px 34px 34px 150px" });
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
      "the columns themselves, named — " + chanWords() + ". The channel is the TABLE's: the feed knows which tables this door reads and writes, never which column.");
    if (!keep.length) { chanEmpty(box, D, S); COV.mark("ACCESSES", "data"); return; }
    var body = E("div", { class: "fbody" });
    var grid = E("div", { class: "fgrid" });
    keep.slice().sort(function(a, b){ return (a.rw === "r") - (b.rw === "r") || b.cols.length - a.cols.length; }).forEach(function(t){
      var fkSet = {}; (t.fks || []).forEach(function(f){ fkSet[Array.isArray(f) ? f[0] : f] = (Array.isArray(f) && f[1]) ? f[1] : true; });
      var uqSet = {}; (t.uqs || []).forEach(function(u){ (Array.isArray(u) ? u : [u]).forEach(function(c){ uqSet[c] = 1; }); });
      var fc = E("div", { class: "fcard rw-" + t.rw, style: "--ec:" + (t.entity_color || "#888") });
      var fh = E("div", { class: "fhd" }, '<i class="pdot" style="background:' + (t.entity_color || "#888") + '"></i>',
        rwChip(t.rw), E("b", null, esc(t.table)), E("span", { class: "tc" }, String(t.cols.length)));
      bind(fh, card({ title: t.table, icon: "model", color: S.KINDCOL.model, sub: "model " + t.model + " · entity " + t.entity,
        rows: [["here", t.rw === "rw" ? "reads + writes" : t.rw === "w" ? "writes" : "reads", RWC[t.rw]],
               ["columns", String(t.cols.length)], ["file", String(t.file || "—")]],
        body: "the channel is this TABLE's — the feed does not record which of its columns the door wrote.",
        station: t.id }));
      fc.append(fh);
      var list = E("div", { class: "flds" });
      t.cols.forEach(function(c){ var isFk = fkSet[c[0]], isUq = uqSet[c[0]];
        var f = E("div", { class: "fld" + (isFk ? " fk" : "") + (isUq ? " uq" : "") },
          E("span", { class: "fn" }, esc(c[0])), E("span", { class: "ft" }, esc(c[1] || "—")));
        bind(f, card({ title: c[0], sub: String(c[1] || "—"), icon: isFk ? "key" : "table", color: t.entity_color,
          rows: [["in", t.table], ["the door", t.rw === "rw" ? "reads and writes this table" : t.rw === "w" ? "writes this table" : "reads this table", RWC[t.rw]],
                 isFk ? ["foreign key", "→ " + (isFk === true ? "another table" : isFk)] : null,
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
  var TYPEC = [
    { key: "id",    word: "id",      col: function(S){ return S.KINDCOL.model; },  rx: /^uuid|UUID/,                  plain: "a key — the row's own name, or another row's" },
    { key: "text",  word: "text",    col: function(S){ return S.KINDCOL.route; },  rx: /^str\b|^Text|^EmailStr/,      plain: "words — anything the user or the system typed" },
    { key: "num",   word: "number",  col: function(S){ return S.OPC.schema; },     rx: /^int\b|^float|^Decimal/,      plain: "a number you can count or add up" },
    { key: "flag",  word: "flag",    col: function(S){ return S.KINDCOL.entity; }, rx: /^bool/,                       plain: "yes or no — one bit, nothing in between" },
    { key: "time",  word: "time",    col: function(S){ return S.KINDCOL.screen; }, rx: /^datetime|^date\b|^time/,     plain: "a moment — when it happened" },
    { key: "list",  word: "list",    col: function(S){ return S.KINDCOL.store; },  rx: /^list|^dict|^Json|^JSON/,     plain: "many values in one column, not one" },
    { key: "other", word: "other",   col: function(S){ return S.KINDCOL.type; },   rx: null,                          plain: "a type this rule does not name — said out loud instead of filed under a guess" } ];
  function typeOf(t){ var base = String(t || "").replace(/\s*\|\s*None\s*$/, "").trim();
    for (var i = 0; i < TYPEC.length - 1; i++) if (TYPEC[i].rx.test(base)) return TYPEC[i];
    return TYPEC[TYPEC.length - 1]; }
  function isOpt(t){ return /\|\s*None\s*$/.test(String(t || "")); }
  function sqCol(t, c, S){ var DC = window.DATACFG || {}, pal = DC.sqPal || "type";
    return pal === "channel" ? RWC[t.rw] : pal === "entity" ? (t.entity_color || "#888")
      : pal === "mono" ? "var(--muted)" : typeOf(c[1]).col(S); }
  /* THE BLOCK TITLE is configurable part by part (operator 2026-09-12): an icon can stand in for a word,
     a count can shrink to a badge, and anything can go. The MODEL is the Python class that maps to this
     table — said here once, because the operator asked what "Location" was. */
  function bkcfg(){ var c = (window.DATACFG || {}).bk || {}; return {
    form: c.form || "row", icon: c.icon == null ? 1 : c.icon, rw: c.rw == null ? 1 : c.rw,
    name: c.name == null ? 1 : c.name, ent: c.ent || "word", count: c.count || "words", model: c.model || "word" }; }
  function bkTitle(t, S, mix){ var B = bkcfg(), ec = t.entity_color || "#888", out = [];
    if (B.icon) out.push('<span class="bki">' + ico("table", 13, ec) + '</span>');
    if (B.rw) out.push(rwChip(t.rw));
    if (B.name) out.push(E("b", null, esc(t.table)));
    if (B.ent !== "off") { var e = E("span", { class: "bke" });
      if (B.ent === "icon" || B.ent === "both") e.insertAdjacentHTML("beforeend", ico("entity", 13, ec));
      if (B.ent === "word" || B.ent === "both") e.append(E("span", null, esc(t.entity || "—")));
      e.style.setProperty("color", ec); out.push(e); }
    if (B.count !== "off") out.push(E("span", { class: "bkn" + (B.count === "badge" ? " badge" : "") },
      B.count === "badge" ? String(t.cols.length) : t.cols.length + " fields"));
    if (B.model !== "off") { var m = E("span", { class: "bkm" });
      if (B.model === "icon" || B.model === "both") m.insertAdjacentHTML("beforeend", ico("model", 13, S.KINDCOL.model));
      if (B.model === "word" || B.model === "both") m.append(E("span", null, esc(t.model)));
      out.push(m); }
    return out; }
  function renderDataBlocks(box, F, S){
    var D = F.data, TS = dtables(D), DC = window.DATACFG || {}, B = bkcfg();
    var sel = (window.SEL || {}).data, portOn = (window.FRAME || {}).portW > 0;
    dhead(box, F, D, TS, "layers",
      "one " + (B.form === "block" ? "block" : "row") + " per table — whose entity, how many fields and what kinds, without opening anything. Each square is one field, coloured by the kind of value it holds; click "
      + (portOn ? "a table and its whole record opens in the portrait beside this panel." : "a table to name every field at once (the portrait is off, so it opens in place)."));
    if (!TS.length) { chanEmpty(box, D, S); COV.mark("ACCESSES", "data"); return; }
    var body = E("div", { class: "bkbody form-" + B.form });
    TS.slice().sort(function(a, b){ return (a.rw === "r") - (b.rw === "r") || b.cols.length - a.cols.length; }).forEach(function(t){
      var fkSet = {}; (t.fks || []).forEach(function(f){ fkSet[Array.isArray(f) ? f[0] : f] = (Array.isArray(f) && f[1]) ? f[1] : true; });
      var uqSet = {}; (t.uqs || []).forEach(function(u){ (Array.isArray(u) ? u : [u]).forEach(function(c){ uqSet[c] = 1; }); });
      var mix = {}; t.cols.forEach(function(c){ var k = typeOf(c[1]).key; mix[k] = (mix[k] || 0) + 1; });
      var blk = E("div", { class: "blk rw-" + t.rw + (sel === t.table ? " sel" : ""), style: "--ec:" + (t.entity_color || "#888") });
      blk.dataset.table = t.table;
      var hd = E("div", { class: "bkhd" }); bkTitle(t, S, mix).forEach(function(n){ if (typeof n === "string") hd.insertAdjacentHTML("beforeend", n); else hd.append(n); });
      var sqs = E("div", { class: "sqs" });
      t.cols.forEach(function(c){ var tc = typeOf(c[1]), opt = isOpt(c[1]), isFk = fkSet[c[0]], isUq = uqSet[c[0]];
        var q = E("i", { class: "sq t-" + tc.key + (opt ? " opt" : "") + (isFk ? " fk" : "") + (isUq ? " uq" : ""),
          style: "background:" + sqCol(t, c, S) });
        bind(q, card({ title: c[0], sub: String(c[1] || "—"), icon: isFk ? "key" : "table", color: sqCol(t, c, S),
          rows: [["kind", tc.word + " — " + tc.plain],
                 ["in", t.table + " · " + t.entity],
                 ["the door", t.rw === "rw" ? "reads and writes this table" : t.rw === "w" ? "writes this table" : "reads this table", RWC[t.rw]],
                 opt ? ["optional", "the column accepts None — the square is drawn paler"] : null,
                 isFk ? ["foreign key", "→ " + (isFk === true ? "another table" : isFk)] : null,
                 isUq ? ["unique", "the DB refuses a second row with this value"] : null],
          body: "the kind is read from the DECLARED type, never guessed from the name." }));
        sqs.append(q); });
      hd.append(sqs);
      bind(hd, card({ title: t.table, icon: "table", color: t.entity_color, sub: "entity " + t.entity + " · model " + t.model,
        rows: [["here", t.rw === "rw" ? "reads + writes" : t.rw === "w" ? "writes" : "reads", RWC[t.rw]],
               ["fields", String(t.cols.length) + (t.cols_more ? " (+" + t.cols_more + " the feed did not carry)" : "")],
               ["what is inside", TYPEC.filter(function(x){ return mix[x.key]; }).map(function(x){ return mix[x.key] + " " + x.word; }).join(" · ")],
               ["model", t.model + " — the Python class that maps to this table"],
               (t.fks || []).length ? ["foreign keys", String(t.fks.length)] : null,
               ["file", String(t.file || "—")]],
        body: portOn ? "click to open its whole record in the portrait." : "click to name every field here.", station: t.id }));
      blk.append(hd);
      var list = E("div", { class: "flds bkfl" });
      t.cols.forEach(function(c){ var tc = typeOf(c[1]), isFk = fkSet[c[0]], isUq = uqSet[c[0]];
        list.append(E("div", { class: "fld" + (isFk ? " fk" : "") + (isUq ? " uq" : "") },
          E("i", { class: "sq t-" + tc.key + (isOpt(c[1]) ? " opt" : ""), style: "background:" + sqCol(t, c, S) }),
          E("span", { class: "fn" }, esc(c[0])), E("span", { class: "ft" }, esc(c[1] || "—")))); });
      blk.append(list);
      hd.addEventListener("click", function(){
        if (portOn) { window.selectIn("data", t.table); }
        else blk.classList.toggle("open"); });
      body.append(blk); });
    box.append(body);
    var mixAll = {}; TS.forEach(function(t){ t.cols.forEach(function(c){ var k = typeOf(c[1]).key; mixAll[k] = (mixAll[k] || 0) + 1; }); });
    var foot = E("div", { class: "pfoot" });
    foot.append(E("div", { class: "kv" }, ico("layers", 13), E("span", { class: "k" }, "click a table"),
      E("span", { class: "v" }, (portOn ? "opens its whole record in the portrait" : "names every field of it here") + " — " + colsOf(TS) + " fields across " + TS.length + " tables")));
    foot.append(legend(TYPEC.filter(function(x){ return mixAll[x.key]; }).map(function(x){
      return { t: x.word + " " + mixAll[x.key], swatch: "background:" + x.col(S),
        tip: card({ title: x.word, sub: mixAll[x.key] + " of " + colsOf(TS) + " fields", body: x.plain + "<br><br>read from the declared type, never from the column's name." }) }; })
      .concat([{ t: "optional", swatch: "background:var(--muted);opacity:.45", tip: card({ title: "optional", sub: "the column accepts None", body: "drawn paler. Not one of law G's three marks — dashed means inferred, hatched unmeasured, hollow a measured zero." }) }])));
    box.append(foot);
    COV.mark("ACCESSES", "data"); COV.mark("PAYLOAD", "data"); COV.mark("CONNECTIONS", "data");
  }

  /* ── THE DATA PORTRAIT — whatever table you clicked, at full detail, beside the picture ── */
  function dataPortrait(box, F, S){
    var D = F.data, sel = (window.SEL || {}).data;
    var t = D.tables.filter(function(x){ return x.table === sel; })[0];
    if (!t) { box.append(E("div", { class: "ptidle" }, E("b", null, "nothing selected"),
      E("span", null, "click a table in the panel and its whole record opens here: which entity claims it, the class that maps to it, the file it lives in, and every field with its kind.")));
      return; }
    var ec = t.entity_color || "#888";
    var fkSet = {}; (t.fks || []).forEach(function(f){ fkSet[Array.isArray(f) ? f[0] : f] = (Array.isArray(f) && f[1]) ? f[1] : true; });
    var uqSet = {}; (t.uqs || []).forEach(function(u){ (Array.isArray(u) ? u : [u]).forEach(function(c){ uqSet[c] = 1; }); });
    var mix = {}; t.cols.forEach(function(c){ var k = typeOf(c[1]).key; mix[k] = (mix[k] || 0) + 1; });
    box.append(E("div", { class: "pthd" }, ico("table", 14, ec), E("span", null, esc(t.table)),
      E("span", { class: "ptn" }, t.cols.length + " fields")));
    var b = E("div", { class: "ptbody" });
    function row(k, v, col){ b.append(E("div", { class: "ptrow" }, E("span", { class: "k" }, k),
      E("span", { class: "v", style: col ? "color:" + col : null }, v))); }
    row("entity", t.entity || "—", ec);
    row("channel", t.rw === "rw" ? "read + write" : t.rw === "w" ? "write" : "read", RWC[t.rw]);
    row("model", t.model + " — the Python class that maps to this table");
    row("file", t.file || "—");
    row("inside", TYPEC.filter(function(x){ return mix[x.key]; }).map(function(x){ return mix[x.key] + " " + x.word; }).join(" · "));
    if ((t.fks || []).length) row("foreign keys", t.fks.map(function(f){ return Array.isArray(f) ? f[0] + " → " + f[1] : f; }).join(" · "));
    if ((t.uqs || []).length) row("unique", t.uqs.map(function(u){ return Array.isArray(u) ? u.join(" + ") : u; }).join(" · "));
    b.append(E("div", { class: "ptsec" }, "every field"));
    var list = E("div", { class: "flds" });
    t.cols.forEach(function(c){ var tc = typeOf(c[1]), isFk = fkSet[c[0]], isUq = uqSet[c[0]];
      var f = E("div", { class: "fld" + (isFk ? " fk" : "") + (isUq ? " uq" : "") },
        E("i", { class: "sq t-" + tc.key + (isOpt(c[1]) ? " opt" : ""), style: "background:" + tc.col(S) }),
        E("span", { class: "fn" }, esc(c[0])), E("span", { class: "ft" }, esc(c[1] || "—")));
      bind(f, card({ title: c[0], sub: String(c[1] || "—"), icon: isFk ? "key" : "table", color: tc.col(S),
        rows: [["kind", tc.word + " — " + tc.plain], ["in", t.table],
               isFk ? ["foreign key", "→ " + (isFk === true ? "another table" : isFk)] : null,
               isUq ? ["unique", "the DB refuses a second row with this value"] : null] }));
      list.append(f); });
    b.append(list);
    if (t.cols_more) b.append(E("div", { class: "ptsec" }, "+" + t.cols_more + " more the feed did not carry"));
    box.append(b);
    COV.mark("PAYLOAD", "data");
  }
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
      plain: "tables this door writes and never reads — it puts data there and never looks" },
    { key: "r", word: "read only", icon: "doc", col: function(S){ return S.RW.r; },
      plain: "tables this door reads and never writes — it needs them to answer, it never changes them" },
    { key: "rw", word: "both", icon: "merge", col: function(S){ return S.RW.rw; },
      plain: "tables this door both reads and writes — where a read and a write meet on one table" } ];
  /* THE CHANNELS ARE APPENDABLE (operator 2026-09-12): three independent switches, not four exclusive
     buttons. All three on IS "every table" — the old fourth button said nothing the other three did not,
     so it is gone. None on is allowed and draws the measurement, because refusing the click would hide
     a state the operator asked for. */
  function chanSet(){ var c = (window.DATACFG || {}).chan; return c || { w: 1, r: 1, rw: 1 }; }
  function chanOn(k){ return !!chanSet()[k]; }
  function chanWords(){ var on = CHAN.filter(function(c){ return chanOn(c.key); });
    return on.length === CHAN.length ? "every table this door touches"
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
    return card({ title: "ops", icon: "table", color: S.KINDCOL.model, sub: "one op = one table on one channel",
      rows: [["read ops", rd + " — the tables this door reads", RWC.r],
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
  /* ONE head for every DATA distribution: the title, the ops count (hoverable — it finally says what an
     op is), and the channel bar on the right of that same row. */
  function dhead(box, F, D, ts, icon, note){
    var showOps = (window.DATACFG || {}).counts === "ops";
    var h = head(box, icon || "table", "Data",
      (showOps ? opsOf(ts) + " ops · " : "") + ts.length + " table" + (ts.length === 1 ? "" : "s"), note);
    var sh = h.querySelector(".sechd");
    if (sh) { var cnt = sh.querySelector(".cnt"); if (cnt) bind(cnt, opsCard(D, ts, S));
      sh.append(chanBar(D, S)); }
    return h; }
  /* an empty result is a RESULT — say what was measured instead of drawing nothing */
  function chanEmpty(box, D, S){
    var on = CHAN.filter(function(c){ return chanOn(c.key); });
    box.append(E("div", { class: "pempty" }, ico("table", 15, "var(--muted)"),
      E("b", null, on.length ? "no table is " + on.map(function(c){ return c.word; }).join(" or ") : "no channel is switched on"),
      E("span", null, on.length
        ? "of the " + D.tables.length + " tables this door touches, none sits on the channel(s) you left on. Each button carried its count before you clicked it — this is the measurement, not a gap."
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
        bind(chip, card({ title: f.name, icon: "function", color: RC[f.role] || S.KINDCOL["function"], sub: (f.role || "—") + " · " + (f.entity || "—") + " · " + f.conf + " hop",
          rows: [["file", f.file], ["lines", f.lines != null ? String(f.lines) : "—"], ["reached by", f.via || h.name], ["commits", f.commits ? "yes" : "no"],
                 f.ops && f.ops.length ? ["tables", f.ops.map(function(o){ return o.rw + ":" + o.table; }).join(" · ")] : null], station: f.id }));
        lst.append(chip); });
      detail.append(lst); }
    nodes.forEach(function(nd, i){
      var el = E("button", { class: "snode" + (nd.lvl === openLvl ? " on" : "") + (nd.lvl < 0 ? " root" : "") },
        E("b", null, esc(nd.name)), E("span", { class: "sn" }, String(nd.n)),
        nd.commits ? E("i", { class: "cdot" }) : null);
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
    bind(hrow, card({ title: FN.handler.name, icon: "function", color: S.KINDCOL["function"], sub: "the handler", body: "<code>" + esc(F.identity.gsig || "") + "</code>" }));
    body.append(hrow);
    var rows = all.map(function(f){
      return { cls: f.conf === "inferred" ? "inf" : "", cells: ["L" + f.__lv, "<b>" + esc(f.name) + "</b>",
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
      return { cells: ["<b>" + esc(c.cid) + "</b>", c.status ? '<span class="stc" style="color:' + (c.status[0] === "2" ? S.OPC.read : c.status[0] === "4" ? S.OPC.gate : S.OPC.write) + '">' + c.status + "</span>" : "—",
          esc(c.corpus || "api"), '<span class="pchip st-' + (c.state || "unknown") + '">' + ico(c.state === "pass" ? "test" : "info", 11) + (c.state || "unknown") + "</span>", esc(c.name || "—")],
        card: card({ title: c.cid, icon: "test", sub: (c.corpus || "api") + " · " + (c.state || "unknown"), rows: [["name", c.name || "—"], ["asserts", c.status ? "HTTP " + c.status : "no status in the name"]] }) }; });
    T.case_files.forEach(function(f){ rows.push({ cls: "filecov", cells: ["<b>" + esc(f.name) + "</b>", "—", esc(f.corpus || "web"), '<span class="pchip filecov">' + ico("file", 11) + "file coverage</span>", "reaches the door, names no case"],
      card: card({ title: f.name, icon: "file", sub: "file coverage", body: "measured but not attributed — the web corpus tests the screen, not the door by name." }) }); });
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
      bind(wr, card({ title: w.name, icon: "journey", sub: "curated · level " + w.level, fields: w.steps })); foot.append(wr); });
    foot.append(legend([{ t: "declared " + T.declared_status, swatch: "background:" + S.OPC.read }, { t: "4xx", swatch: "background:" + S.OPC.gate }, { t: "file coverage", swatch: "background:transparent;border:1px dashed var(--muted);height:6px;width:16px" }]));
    box.append(foot);
    COV.mark("TESTS", "tests"); COV.mark("JOURNEYS", "tests");
  }

  /* ── WIDENING · B "flow" — the reach laid on ONE horizontal axis, the journey rail above ── */
  function renderWideFlow(box, F, S){
    var W = F.widening, I = F.identity, KC = S.KINDCOL;
    head(box, "globe", "Widening", (W.fetched_by.length + W.chain.reduce(function(s, l){ return s + l.length; }, 0)) + " reached",
      "left to right: the app, down through what renders what, into the door — and what the answer feeds");
    var body = E("div", { class: "wfbody" });
    if (W.steps_around.length) { var rail = E("div", { class: "wrail" });
      W.steps_around.forEach(function(st){ rail.append(E("span", { class: "wrl" }, ico("journey", 12, "var(--accent)"), esc(st.workflow)));
        [[st.prev, "before"], [I.label, "here"], [st.next, "after"]].forEach(function(pair, i){ if (!pair[0]) return;
          var el = E("span", { class: "step" + (pair[1] === "here" ? " here" : "") }, ico("endpoint", 11, pair[1] === "here" ? KC.endpoint : "var(--muted)"), esc(pair[0]));
          bind(el, card({ title: pair[0], icon: "endpoint", sub: "the step " + pair[1], rows: [["workflow", st.workflow]] }));
          rail.append(el); if (i < 2) rail.append(E("i", { class: "sarr", html: ico("drill", 11, "var(--muted)") })); }); });
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
    foot.append(legend([{ t: "the door", icon: "endpoint", col: KC.endpoint }, { t: "hook", icon: "merge", col: KC.hook }, { t: "screen · route", icon: "web", col: KC.component }]));
    box.append(foot);
    COV.mark("USAGE", "widening"); COV.mark("IDENTITY", "widening"); COV.mark("CONNECTIONS", "widening");
  }

  /* ── SECURITY · B "gauntlet" — everything between the request and the answer, on one line ── */
  function renderSecGauntlet(box, F, S){
    var SEC = F.security, FW = F.feedwide;
    head(box, "key", "Security", SEC.guards.length + " deps · " + SEC.asgi.length + " app",
      "the request runs the gauntlet left to right: the app band, this door's deps, the body, the commit — then the answer");
    var body = E("div", { class: "sgbody" });
    var lane = E("div", { class: "gaunt" });
    function stop(o){ var el = E("div", { class: "gst " + (o.cls || ""), style: o.col ? "--gc:" + o.col : "" },
        E("span", { class: "gi", html: ico(o.icon, 16, o.col || "var(--muted)") }), E("b", null, esc(o.title)),
        E("span", { class: "gs" }, esc(o.sub)));
      if (o.card) bind(el, o.card); lane.append(el); return el; }
    stop({ icon: "down", title: "request", sub: F.identity.method + " " + F.identity.path, col: S.OPC.read,
      card: card({ title: "the request arrives", icon: "down", sub: F.identity.method + " " + F.identity.path, rows: [["body", (F.data.schemas.request.name || "—") + " · " + (F.data.schemas.request.cols || []).length + " fields"]] }) });
    lane.append(E("i", { class: "sarr", html: ico("drill", 13, "var(--muted)") }));
    SEC.asgi.forEach(function(m){ stop({ icon: "shield", title: m.name.replace(/Middleware$/, ""), sub: "app · order " + m.order + " · " + m.gates + " gated", col: S.OPC.gate, cls: "app",
      card: card({ title: m.name, icon: "shield", color: S.OPC.gate, sub: "ASGI middleware · scope " + m.scope,
        rows: [["order", String(m.order)], ["gates", m.gates + " of " + FW.endpoints + " endpoints"], ["file", m.file + ":" + m.line], ["tie to this door", "— measured at APP scope only"]] }) });
      lane.append(E("i", { class: "sarr", html: ico("drill", 13, "var(--muted)") })); });
    SEC.guards.forEach(function(g){ stop({ icon: g.gate ? "key" : "link", title: g.name, sub: g.via + (g.gate ? " · GATE" : " · resource") + " · " + Math.round(100 * g.feedwide / FW.endpoints) + "% of doors", col: g.gate ? S.OPC.gate : "var(--muted)", cls: g.gate ? "gate" : "",
      card: card({ title: g.name, icon: g.gate ? "key" : "link", color: g.gate ? S.OPC.gate : null, sub: g.via,
        rows: [["decides", g.gate ? "yes — it can refuse" : "no — it supplies"], ["feed-wide", g.feedwide + " of " + FW.endpoints], g.fn_rec ? ["function", g.fn_rec.name + " · " + (g.fn_rec.role || "—")] : null] }) });
      lane.append(E("i", { class: "sarr", html: ico("drill", 13, "var(--muted)") })); });
    stop({ icon: "function", title: "the body", sub: (F.identity.sig || {}).lines + " lines · " + F.functions.behind.fns + " behind", col: S.KINDCOL["function"],
      card: card({ title: "the handler body", icon: "function", color: S.KINDCOL["function"], rows: [["lines", String((F.identity.sig || {}).lines)], ["behind", String(F.functions.behind.fns)]] }) });
    lane.append(E("i", { class: "sarr", html: ico("drill", 13, "var(--muted)") }));
    stop({ icon: "key", title: "commit", sub: SEC.commits ? F.data.writes.length + " writes made permanent" : "no commit", col: S.OPC.write, cls: "commitst",
      card: card({ title: "the DB transaction", icon: "key", color: S.OPC.write, sub: "never a git commit", rows: [["writes", String(F.data.writes.length)], ["idempotency", SEC.idempotent ? SEC.idempotency_table : "none"]] }) });
    lane.append(E("i", { class: "sarr", html: ico("drill", 13, "var(--muted)") }));
    stop({ icon: "up", title: "answer " + SEC.status.declared, sub: (F.data.schemas.response.name || "—") + " · " + ((F.identity.payload || {}).n || 0) + " fields", col: S.OPC.read,
      card: card({ title: "the answer", icon: "up", sub: "declared " + SEC.status.declared, rows: [["schema", F.data.schemas.response.name], ["cases assert", Object.keys(SEC.status.observed).filter(function(k){ return /^\d/.test(k); }).join(" · ")]] }) });
    body.append(lane);
    var facts = E("div", { class: "sfacts" });
    [["flag walls", SEC.walls.length ? SEC.walls.length + " wall(s)" : "none — no feature flag can close this door", !SEC.walls.length, "swords"],
     ["idempotency", SEC.idempotent ? "guarded — writes " + SEC.idempotency_table : "none", !SEC.idempotent, "target"],
     ["delivery", SEC.stream ? "streams to the client" : "one response, whole — this door does not stream", !SEC.stream, "wave"],
     ["status contract", "declares " + SEC.status.declared + " · the cases assert " + Object.keys(SEC.status.observed).filter(function(k){ return /^\d/.test(k); }).join(" · "), false, "info"]
    ].forEach(function(f){ var r = E("div", { class: "sfact" + (f[2] ? " hollow" : "") }, ico(f[3], 13, f[2] ? "var(--muted)" : S.OPC.gate), E("b", null, f[0]), E("span", { class: "sv" }, f[1]));
      bind(r, card({ title: f[0], icon: f[3], sub: f[2] ? "measured zero" : "measured", body: f[2] ? "HOLLOW means the emitter looked and found nothing — unmeasured would be hatched and would say so." : "" }));
      facts.append(r); });
    body.append(facts); box.append(body);
    var foot = E("div", { class: "pfoot" });
    foot.append(E("div", { class: "kv" }, ico("shield", 13, S.OPC.gate), E("span", { class: "k" }, "app band"), E("span", { class: "v" }, "gates " + (SEC.app_middleware || {}).gates_endpoints + " of " + FW.endpoints + " endpoints" + ((SEC.app_middleware || {}).saturated ? " — saturated: it separates nothing" : ""))));
    foot.append(legend([{ t: "gate", swatch: "background:" + S.OPC.gate }, { t: "resource dep", swatch: "background:var(--muted)" }, { t: "hollow = measured zero", swatch: "background:transparent;border:1px solid var(--line);height:9px;width:14px" }]));
    box.append(foot);
    COV.mark("GUARDS", "security"); COV.mark("DELIVERY", "security");
  }

  /* ── the registry — icons are STATION icons (words on hover), counts answer A ─────────── */
  window.PANELS = {
    data: { icon: "table", word: "Data", col: S.KINDCOL.model, portrait: dataPortrait, hint: "every table this door reads or writes — 13 of them on 5 entity grounds, one DB commit; each tile a stack whose height is its column count",
      count: function(F){ return F.data.tables.length; },
      variants: [ { key: "grounds", label: "Grounds", hint: "tables tiled on entity-coloured grounds; the shape stacks stand vertically. Reads by entity first.", render: renderData },
                  { key: "flow", label: "Flow", hint: "ONE left-to-right axis — request → the whole table field (writes first, entity by dot) → response. Uses the width.", render: renderDataFlow },
                  { key: "ledger", label: "Ledger", hint: "one row per table with every column the feed knows (entity · rw · shape · cols · fk · uq · model). The densest honest form.", render: renderDataLedger },
                  { key: "fields", label: "Fields", hint: "the columns THEMSELVES, named and typed, filtered by channel — written, read, or both. The one distribution where the fields ARE the picture instead of a stack of lines.", render: renderDataFields },
                  { key: "blocks", label: "Blocks", hint: "one ROW per table — whose entity, how many fields, what kinds — and each field a little coloured square. Click a row to name every field at once.", render: renderDataBlocks } ] },
    schemas: { icon: "schema", word: "Schemas", col: S.KINDCOL.schema, hint: "the shapes that cross the door — the request's 7 fields with 6 nested shapes in, the response's 6 with 5 nested out; drawn as lines, the exact fields on hover",
      count: function(F){ return (F.data.schemas.request.cols || []).length + (F.data.schemas.response.cols || []).length; },
      variants: [ { key: "shapes", label: "Shapes", hint: "the two shapes side by side as stacks, each nested shape given its own stack below its parent.", render: renderSchemas },
                  { key: "fields", label: "Fields", hint: "every field of both shapes as rows, nested fields indented under the one that carries them.", render: renderSchemaFields } ] },
    functions: { icon: "function", word: "Functions", col: S.KINDCOL["function"], hint: "the handler and the call tree behind it — reach 5 · 29 behind; the levels walk 3·16·5·1 with the confidence of each hop; ONE bead walks it",
      count: function(F){ return F.functions.behind.fns; },
      variants: [ { key: "levels", label: "Levels", hint: "one column per hop, every callee visible at once; the bead crosses the strip.", render: renderFunctions },
                  { key: "chain", label: "Chain", hint: "the walk as one horizontal spine; a hop opens below when you click it. Fits a short box.", render: renderFnChain },
                  { key: "ledger", label: "Ledger", hint: "one row per function — hop · role · size · confidence · commit · tables touched.", render: renderFnLedger } ] },
    tests: { icon: "test", word: "Tests", col: "#4cbe83", hint: "the cases that reach this door stacked by the status they assert (26 api, all passing · 15 web as file coverage) and the 6+21 cross-entity journeys",
      count: function(F){ return F.tests.cases.length + F.tests.case_files.length; },
      variants: [ { key: "status", label: "Status", hint: "a column per HTTP status the case names assert; the declared one is bordered.", render: renderTests },
                  { key: "ledger", label: "Ledger", hint: "one row per case — id · status · corpus · state · full name — with the journeys beside.", render: renderTestsLedger } ] },
    widening: { icon: "globe", word: "Widening", col: S.KINDCOL.screen || "#a855f7", hint: "how far the door reaches: the ladder from the door up to the app, and the workflow steps around it",
      count: function(F){ return F.widening.fetched_by.length + F.widening.chain.reduce(function(s, l){ return s + l.length; }, 0); },
      variants: [ { key: "ladder", label: "Ladder", hint: "the rungs stacked, the door at the foot — reads bottom-up like a climb.", render: renderWidening },
                  { key: "flow", label: "Flow", hint: "the same reach on one horizontal axis with the journey rail above it. Uses the width.", render: renderWideFlow } ] },
    security: { icon: "key", word: "Security", col: "#eab308", hint: "what stands before the body runs: the app band (3, saturated), this door's 3 deps with 1 gate, flag walls (none), the status contract, idempotency, the commit",
      count: function(F){ return F.security.guards.length + F.security.asgi.length; },
      variants: [ { key: "band", label: "Band", hint: "the app band over the door's own deps, then the one-line facts. Reads top-down as layers.", render: renderSecurity },
                  { key: "gauntlet", label: "Gauntlet", hint: "the request runs left to right through every stop: band → deps → body → commit → answer.", render: renderSecGauntlet } ] },
  };
  window.EPKIT = { E: E, esc: esc, ico: ico, rwChip: rwChip, trust: trust, sechd: sechd, card: card, RWC: RWC };
})();
