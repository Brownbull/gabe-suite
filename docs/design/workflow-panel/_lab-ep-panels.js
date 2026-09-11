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
    var D = F.data, I = F.identity, req = D.schemas.request, res = D.schemas.response;
    head(box, "table", "Data + schemas", D.ops.length + " ops · " + D.tables.length + " tables",
      "what crosses the door is a SHAPE (lines, never the data) · what it lands on is a TABLE (a stack, its height = its columns)");
    var body = E("div", { class: "dbody" });

    /* left — the request shape */
    var reqCol = E("div", { class: "dcol dside" });
    var nestSetReq = {}; (req.nested || []).forEach(function(n){ nestSetReq[n.name] = 1; });
    reqCol.append(E("div", { class: "dslbl in" }, ico("down", 12, S.OPC.read), "REQUEST", E("span", { class: "n" }, String((req.cols || []).length))));
    var reqShape = E("div", { class: "schm", style: "border-color:" + (req.entity_color || "var(--line)") },
      E("div", { class: "snm" }, ico("schema", 12, S.KINDCOL.schema), esc(req.name || "—")),
      shapeStack(req.name, req.cols || [], { color: S.KINDCOL.schema, nestSet: nestSetReq }));
    bind(reqShape, card({ title: req.name, icon: "schema", color: S.KINDCOL.schema, sub: "request body · entity " + req.entity,
      rows: [["fields", String((req.cols || []).length)], ["nested", String((req.nested || []).length) + " shapes"], ["file", String(req.file || "—")], ["doc", (req.doc || "—").slice(0, 90)]],
      fields: (req.cols || []).map(function(c){ return c[0] + " · " + c[1]; }), station: "schema:" + req.name }));
    reqCol.append(reqShape);
    var nb = E("div", { class: "nests" });
    (req.nested || []).forEach(function(n){ var t = E("span", { class: "pchip schema" }, ico("schema", 11), esc(n.name) + " ·" + n.cols.length);
      bind(t, card({ title: n.name, icon: "schema", color: S.KINDCOL.schema, sub: "nested in " + req.name + " · " + n.cols.length + " fields",
        fields: n.cols.map(function(c){ return c[0] + " · " + c[1]; }), station: "schema:" + n.name })); nb.append(t); });
    if ((req.nested || []).length) reqCol.append(E("div", { class: "dnlbl" }, "nested ×" + req.nested.length), nb);
    body.append(reqCol);

    /* middle — the grounds */
    var mid = E("div", { class: "dcol dmid" });
    var grounds = {}; D.tables.forEach(function(t){ (grounds[t.entity || "—"] = grounds[t.entity || "—"] || []).push(t); });
    var order = Object.keys(grounds).sort(function(a, b){ return grounds[b].length - grounds[a].length || a.localeCompare(b); });
    var gwrap = E("div", { class: "grounds" });
    order.forEach(function(ent){
      var ts = grounds[ent], ec = ts[0].entity_color || "#8794ab";
      var g = E("div", { class: "ground" + (ent === I.entity ? " home" : ""), style: "--ec:" + ec + ";flex-grow:" + Math.min(3, ts.length) });
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

    /* right — the response shape */
    var resCol = E("div", { class: "dcol dside" });
    var nestSetRes = {}; (res.nested || []).forEach(function(n){ nestSetRes[n.name] = 1; });
    resCol.append(E("div", { class: "dslbl out" }, ico("down", 12, S.OPC.write), "RESPONSE", E("span", { class: "n" }, String((res.cols || []).length))));
    var resShape = E("div", { class: "schm", style: "border-color:" + (res.entity_color || "var(--line)") },
      E("div", { class: "snm" }, ico("schema", 12, S.KINDCOL.schema), esc(res.name || "—")),
      shapeStack(res.name, res.cols || [], { color: S.KINDCOL.schema, nestSet: nestSetRes }));
    bind(resShape, card({ title: res.name, icon: "schema", color: S.KINDCOL.schema, sub: "response body · entity " + res.entity,
      rows: [["fields ferried", String((I.payload || {}).n != null ? I.payload.n : (res.cols || []).length)], ["nested", String((res.nested || []).length) + " shapes"], ["also returned by", String(F.widening.response_consumers.length) + " other endpoint(s)"], ["file", String(res.file || "—")]],
      fields: (res.cols || []).map(function(c){ return c[0] + " · " + c[1]; }), station: "schema:" + res.name }));
    resCol.append(resShape);
    var nb2 = E("div", { class: "nests" });
    (res.nested || []).forEach(function(n){ var t = E("span", { class: "pchip schema" }, ico("schema", 11), esc(n.name) + " ·" + n.cols.length);
      bind(t, card({ title: n.name, icon: "schema", color: S.KINDCOL.schema, sub: "nested in " + res.name + " · " + n.cols.length + " fields",
        fields: n.cols.map(function(c){ return c[0] + " · " + c[1]; }), station: "schema:" + n.name })); nb2.append(t); });
    if ((res.nested || []).length) resCol.append(E("div", { class: "dnlbl" }, "nested ×" + res.nested.length), nb2);
    body.append(resCol);
    box.append(body);

    /* the foot: the evidence row (home_ev), the entity-model row, and the legend */
    var foot = E("div", { class: "pfoot" });
    var ev = I.home_ev;
    if (ev && ev.verdict) { var top = function(m){ var ks = Object.keys(m || {}); if (!ks.length) return null; ks.sort(function(a, b){ return m[b] - m[a]; }); var tot = ks.reduce(function(s, k){ return s + m[k]; }, 0); return ks[0] + " " + Math.round(100 * m[ks[0]] / tot) + "% of " + tot; };
      var u = top(ev.users), d = top(ev.data);
      var er = E("div", { class: "kv" }, ico("role", 13), E("span", { class: "k" }, "evidence"), E("span", { class: "v" }, "home " + I.entity + " by its file claim · users say " + (u || "abstain") + " · data says " + (d || "abstain") + " → " + String(ev.verdict).toUpperCase()));
      bind(er, card({ title: "membership evidence", icon: "role", sub: "file · users · data — the three witnesses",
        rows: [["home by", String(ev.by)], ["users", u || "abstain"], ["data", d || "abstain"], ["verdict", String(ev.verdict).toUpperCase()]],
        body: "the FILE wins here — evidence only, nothing is re-homed. The data witness leans <b>settings</b> because 5 of the 13 tables this door writes belong to settings." }));
      foot.append(er); COV.mark("EVIDENCE", "data"); }
    var mh = I.models_home || {}; var mrow = E("div", { class: "kv" }, ico("link", 13), E("span", { class: "k" }, "model"), E("span", { class: "v" }, "claim " + I.entity + (mh.seeded || mh.derived || mh.proposed ? " · a view re-homes it" : " · every entity model keeps it here (no delta)")));
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

  /* ── the registry — icons are STATION icons (words on hover), counts answer A ─────────── */
  window.PANELS = {
    data: { icon: "table", word: "Data + schemas", hint: "where the reads and writes land (13 tables on 5 entity grounds, one DB commit) and the shapes that cross the door (request 7 · response 6) — abstractions drawn as lines, the exact columns on hover",
      count: function(F){ return F.data.tables.length; }, render: renderData },
    functions: { icon: "function", word: "Functions", hint: "the handler and the call tree behind it — reach 5 · 29 behind; the levels walk 3·16·5·1 with the confidence of each hop; ONE bead walks it",
      count: function(F){ return F.functions.behind.fns; }, render: renderFunctions },
    tests: { icon: "test", word: "Tests", hint: "the cases that reach this door stacked by the status they assert (26 api, all passing · 15 web as file coverage) and the 6+21 cross-entity journeys",
      count: function(F){ return F.tests.cases.length + F.tests.case_files.length; }, render: renderTests },
    widening: { icon: "globe", word: "Widening", hint: "how far the door reaches: the ladder from the door up to the app, and the workflow steps around it",
      count: function(F){ return F.widening.fetched_by.length + F.widening.chain.reduce(function(s, l){ return s + l.length; }, 0); }, render: renderWidening },
    security: { icon: "key", word: "Security", hint: "what stands before the body runs: the app band (3, saturated), this door's 3 deps with 1 gate, flag walls (none), the status contract, idempotency, the commit",
      count: function(F){ return F.security.guards.length + F.security.asgi.length; }, render: renderSecurity },
  };
  window.EPKIT = { E: E, esc: esc, ico: ico, rwChip: rwChip, trust: trust, sechd: sechd, card: card, RWC: RWC };
})();
