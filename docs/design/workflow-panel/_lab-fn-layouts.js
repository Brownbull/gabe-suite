/* ═══ FUNCTION — five layouts of the console's MIDDLE + RIGHT ═══════════════════
   Sourced from the analysis pass (five theses, five geometries) and built on the
   console's own builders. Every value comes from window.LABFN or the lab element's
   slots; an empty is drawn in the feed's words, never dropped. Each proposal must
   measure < 0.60 structural similarity against G and against each other
   (probe-labsim.mjs) or it is a restyle, not an option. */
(function(){
  var F = window.LABFN;
  function liveN(e, key){
    var rows = e.slots[key] || [];
    var live = rows.filter(function(x){ return x.tone !== "none" && x.tone !== "unmeas"; }).length;
    return { live:live, n:rows.length, r: rows.length ? live / rows.length : 0 };
  }
  var SLOTK = [["ident","IDENTITY"],["op","OPERATION"],["in","IN"],["store","STORE"],["out","OUT"],["ev","EVIDENCE"],["place","PLACE"]];
  function hd(label, count, icon){
    var h = el("div", { class:"reghd lhd" });
    var g = el("span", { class:"rl ico", html:rowSvg((typeof REGI !== "undefined" && REGI[label]) || icon || "__row", 12) });
    h.appendChild(g); var t = el("span", { class:"rt", text:label }); tipOn(t, label, ""); h.appendChild(t);
    if (count != null) h.appendChild(el("span", { class:"rn", text:String(count) }));
    return h;
  }
  function clip(box, body){
    var mark = function(){ box.classList.toggle("clipped", body.scrollHeight > body.clientHeight + 1); };
    requestAnimationFrame(mark);
    if (window.ResizeObserver){ try { new ResizeObserver(mark).observe(body); } catch (e) {} }
  }
  function chip(t, cls, title){ return el("span", { class:"lchip " + (cls || ""), text:t, title:title || t }); }
  var reads = (F.access.ops || []).filter(function(o){ return o.rw === "r"; });
  var writes = (F.access.ops || []).filter(function(o){ return o.rw === "w"; });
  var ser = F.access.serializes || [];
  var col = function(e){ return kcol(e.kind); };
  var sigLine = (F.sig.async ? "async " : "") + F.name + " → " + (F.sig.returns || "—") + " ▸ " + F.flines + " lines · " + F.layer + " · " + F.role + (F.god ? " · god ≥" + F.god_rule_lines : "");

  /* ── P1 · THE WAIST — call-graph first ─────────────────────────────────── */
  function p1(e, mbox){
    var w = el("div", { class:"lm p1" });
    /* ABOVE — the callers, as the endpoints they are, ribbons converging on the function */
    var above = el("div", { class:"p1band above" });
    above.appendChild(hd("ABOVE", F.in_degree + " callers", "caller"));
    var ab = el("div", { class:"p1abody" });
    var chipsRow = el("div", { class:"p1chips" });
    F.callers.forEach(function(c){ chipsRow.appendChild(chip(c.endpoint || c.fn, c.conf === "extracted" ? "ok" : "warn", c.fn + " · " + c.conf)); });
    ab.appendChild(chipsRow);
    var n = F.callers.length, W = 400, H = 26;
    var lines = F.callers.map(function(c, i){ var x = (i + .5) * W / n; return '<path d="M' + x.toFixed(1) + ' 2 C ' + x.toFixed(1) + ' 14, 200 12, 200 ' + H + '" fill="none" stroke="' + col(e) + '" stroke-opacity=".55" stroke-width="1.6"' + (c.conf === "extracted" ? "" : ' stroke-dasharray="3 3"') + '/>'; }).join("");
    ab.appendChild(el("div", { class:"p1rib", html:'<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' + lines + '</svg>' }));
    above.appendChild(ab); w.appendChild(above);
    /* WAIST — the function itself, one strip */
    var waist = el("div", { class:"p1band waist" });
    var np = el("div", { class:"p1np" }, [
      el("span", { class:"kg", style:"color:" + col(e), html:svgK(e.kind, col(e), 18) }),
      el("span", { class:"t" }, [ el("b", { text:F.name }), el("i", { text:F.role + " · " + F.layer + " · " + F.slug }) ])
    ]);
    if (F.god) np.appendChild(el("span", { class:"lbadge warn", text:"GOD ≥" + F.god_rule_lines, title:"length ≥ " + F.god_rule_lines + " lines; this one is " + F.flines }));
    waist.appendChild(np);
    waist.appendChild(el("div", { class:"p1sig", text:sigLine, title:sigLine }));
    var data = el("div", { class:"p1data" });
    reads.forEach(function(o){ data.appendChild(chip(o.table, "ok", "reads " + o.model)); });
    F.schemas.returns.forEach(function(s){ data.appendChild(chip("→ " + s.replace(/^schema:/, ""), "acc", "returns")); });
    data.appendChild(chip(ser.length + " serialised", "dim", ser.map(function(b){ return b.cls + ":" + b.line; }).join(" · ")));
    waist.appendChild(data); w.appendChild(waist);
    /* BELOW — the callee and the mass behind, as a tree */
    var below = el("div", { class:"p1band below" });
    below.appendChild(hd("BELOW", F.out_degree + " callee · " + F.behind.fns + " behind · depth " + F.behind.depth, "reach"));
    var bb = el("div", { class:"p1bbody" });
    var names = F.behind_names || [], m = names.length, BW = 400, BH = 78;
    var svg = '<svg viewBox="0 0 ' + BW + ' ' + BH + '" preserveAspectRatio="none">';
    svg += '<line x1="200" y1="0" x2="200" y2="16" stroke="' + col(e) + '" stroke-opacity=".6" stroke-width="1.6"/>';
    F.callees.forEach(function(c){ svg += '<line x1="200" y1="16" x2="200" y2="30" stroke="' + col(e) + '" stroke-width="1.6"' + (c.conf === "inferred" ? ' stroke-dasharray="3 3" stroke-opacity=".7"' : "") + '/>'; });
    names.forEach(function(b, i){ var x = (i + .5) * BW / Math.max(1, m); svg += '<path d="M200 30 C 200 50, ' + x.toFixed(1) + ' 44, ' + x.toFixed(1) + ' 62" fill="none" stroke="' + col(e) + '" stroke-opacity=".4" stroke-width="1.2"/><circle cx="' + x.toFixed(1) + '" cy="64" r="2.6" fill="' + col(e) + '" fill-opacity=".7"/>'; });
    svg += '</svg>';
    bb.appendChild(el("div", { class:"p1tree", html:svg }));
    var cal = el("div", { class:"p1callee" });
    F.callees.forEach(function(c){ cal.appendChild(chip(c.fn + " · " + c.conf + (c.crosses ? " · → " + c.entity : ""), c.conf === "inferred" ? "warn" : "ok", c.id)); });
    if (!F.callees.length) cal.appendChild(chip("— calls nothing the map resolved", "none"));
    bb.appendChild(cal);
    var fan = el("div", { class:"p1fan" });
    names.forEach(function(b){ fan.appendChild(el("span", { class:"p1leaf", text:b.name.split(".").pop(), title:b.name + (b.role ? " · " + b.role : "") + (b.slug ? " · " + b.slug : "") })); });
    bb.appendChild(fan);
    below.appendChild(bb); w.appendChild(below);
    mbox.appendChild(w);
    [above, waist, below].forEach(function(b){ clip(b, b.lastChild); });
  }

  /* ── P2 · THE CARGO HOLD — data first ───────────────────────────────────── */
  function p2(e, mbox){
    var w = el("div", { class:"lm p2" });
    var rh = el("div", { class:"hold reads" }); rh.appendChild(hd("READS", reads.length + "/" + reads.length, "read"));
    var rg = el("div", { class:"cargo p2grid" });
    for (var i = 0; i < 6; i++){
      var o = reads[i];
      rg.appendChild(o ? el("div", { class:"cell", title:o.model + " · " + o.table }, [ el("span", { class:"cn", text:o.table }), el("span", { class:"ct", text:o.model }) ])
                       : el("div", { class:"cell well" }));
    }
    rh.appendChild(rg);
    rh.appendChild(el("div", { class:"cargonote", text: writes.length ? writes.length + " writes" : "reads only · commits " + String(!!F.access.commits) + (reads.length > 6 ? " · +" + (reads.length - 6) + " more reads" : "") }));
    w.appendChild(rh);
    var sp = el("div", { class:"p2spine" });
    sp.appendChild(el("span", { class:"kg", style:"color:" + col(e), html:svgK(e.kind, col(e), 22) }));
    sp.appendChild(el("b", { text:F.name }));
    sp.appendChild(el("i", { text:F.role.toUpperCase() + " · " + F.layer }));
    sp.appendChild(el("i", { text:F.file.split("/").pop() + ":" + F.flines }));
    if (F.god) sp.appendChild(el("span", { class:"lbadge warn", text:"GOD", title:"length ≥ " + F.god_rule_lines }));
    sp.appendChild(el("i", { class:"ent", text:F.slug }));
    w.appendChild(sp);
    var th = el("div", { class:"hold returns" }); th.appendChild(hd("RETURNS", F.schemas.returns.length + " · uses " + F.schemas.uses.length, "resp"));
    var tb = el("div", { class:"p2ret" });
    tb.appendChild(el("div", { class:"cell wide", title:"schema_edges rel=returns" }, [ el("span", { class:"cn", text:(F.schemas.returns[0] || "—").replace(/^schema:/, "") }), el("span", { class:"ct", text:"the door — 1 returns wire" }) ]));
    var uses = el("div", { class:"p2uses" });
    F.schemas.uses.forEach(function(s){ var nm = s.replace(/^schema:/, ""); var b = ser.filter(function(x){ return x.cls === nm; })[0]; uses.appendChild(chip(nm + (b ? " :" + b.line : ""), b ? "ok" : "", b ? "serialised at line " + b.line : "used, not serialised in-body")); });
    tb.appendChild(uses);
    th.appendChild(tb); w.appendChild(th);
    var rail = el("div", { class:"p2rail res" });
    [["callers", F.in_degree, "caller"], ["callees", F.out_degree, "dep"], ["behind", F.behind.fns, "reach"], ["depth", F.behind.depth, "reach"], ["home", F.slug + (F.model_homes.derived ? " · derived " + F.model_homes.derived.replace(/^d:/, "") : ""), "home"]].forEach(function(x){
      rail.appendChild(el("span", { class:"r" }, [ el("span", { class:"ri", html:rowSvg(x[2], 11) }), el("b", { text:String(x[1]) }), el("span", { class:"u", text:x[0] }) ]));
    });
    w.appendChild(rail);
    mbox.appendChild(w);
    clip(rh, rg); clip(th, tb);
  }

  /* ── P3 · THE LEDGER — dense key/value, 3 × 8, nothing drawn ────────────── */
  function p3(e, mbox){
    var w = el("div", { class:"lm p3" });
    var cols = [
      ["IDENTITY", [["name", F.name, ""], ["file", F.file, ""], ["lines", F.flines + "", ""], ["sig", (F.sig.async ? "async · " : "") + "→ " + F.sig.returns, ""],
                    ["doc", F.doc || "— none captured", F.doc ? "" : "none"], ["role", F.role, ""], ["layer", F.layer + " (the station says api for all 292)", "warn"], ["god", F.god ? "yes · ≥" + F.god_rule_lines + " lines" : "no", F.god ? "warn" : ""]]],
      ["GRAPH", [["callers", F.in_degree + " extracted · " + F.callers.map(function(c){ return c.endpoint; }).join(" · "), "ok"], ["callees", F.out_degree + " · " + F.callees.map(function(c){ return c.fn + " (" + c.conf + ")"; }).join(" · "), "warn"],
                 ["behind", F.behind.fns + " · " + (F.behind.names || []).join(" · "), ""], ["depth", F.behind.depth + "", ""], ["d2w", F.d2w != null ? String(F.d2w) : "— not computed for this function (absent on 74 accessors)", F.d2w != null ? "" : "dim"],
                 ["journeys", "— none direct · " + F.via_callers.journeys + " via callers", "dim"], ["homing", F.homing ? F.homing.verdict : "— not weighed", "dim"], ["pressure", "— empty", "none"]]],
      ["DATA", [["tables", reads.length + " read · " + reads.map(function(o){ return o.table; }).join(" · "), "ok"], ["commits", F.access.commits ? "yes" : "no", "dim"],
                ["returns", F.schemas.returns.map(function(s){ return s.replace(/^schema:/, ""); }).join(" · "), "ok"], ["uses", F.schemas.uses.length + " · " + F.schemas.uses.map(function(s){ return s.replace(/^schema:/, ""); }).join(" · "), ""],
                ["serialises", ser.length + " · " + ser.map(function(b){ return b.cls + ":" + b.line; }).join(" · "), ""], ["sinks", F.sinks ? JSON.stringify(F.sinks) : "— none", "none"],
                ["tests", "— not measured · " + F.via_callers.cases + " via callers", "unmeas"], ["entity", F.slug + (F.model_homes.derived ? " · derived " + F.model_homes.derived : ""), ""]]]
    ];
    var t = el("div", { class:"p3t" });
    cols.forEach(function(c){
      var colEl = el("div", { class:"p3c" }); colEl.appendChild(el("div", { class:"p3h", text:c[0] }));
      c[1].forEach(function(r0){ colEl.appendChild(el("div", { class:"p3r " + r0[2] }, [ el("span", { class:"k", html:rowSvg(ROWI[r0[0]] ? r0[0] : "__row", 10) + "<span>" + r0[0] + "</span>" }), el("span", { class:"v", text:r0[1], title:r0[1] }) ])); });
      t.appendChild(colEl);
    });
    w.appendChild(t);
    var strip = el("div", { class:"p3strip" });
    SLOTK.forEach(function(sk, gi){
      if (gi) strip.appendChild(el("span", { class:"gap" }));
      (e.slots[sk[0]] || []).forEach(function(r0){ var st = r0.tone === "none" ? "empty" : r0.tone === "unmeas" ? "unmeas" : "live"; strip.appendChild(el("span", { class:"cx " + st, title:sk[1] + " · " + r0.k + " · " + st })); });
    });
    w.appendChild(strip);
    mbox.appendChild(w); clip(w, t);
  }

  /* ── P4 · THE COCKPIT — vitals first ─────────────────────────────────────── */
  function p4(e, mbox){
    var w = el("div", { class:"lm p4" });
    var bank = el("div", { class:"p4bank" });
    function meter(key, label, v, max, state, note, needle2){
      var pct = (state === "ok" && max) ? Math.max(3, Math.round(100 * v / max)) : 0;
      var m = el("div", { class:"vit p4m " + state, title:label + " — " + note });
      var h = el("div", { class:"vithd" }); var l = el("span", { class:"vl ico" }); l.innerHTML = rowSvg(METERI[key] || key, 12); l.appendChild(el("span", { class:"vt", text:label })); tipOn(l, label, note); h.appendChild(l);
      h.appendChild(el("span", { class:"vv", text: state === "unmeas" ? "not measured" : String(v) + (max ? " / " + max : "") }));
      m.appendChild(h);
      var tr = el("div", { class:"vtrack" }, [ el("i", { style:"width:" + pct + "%" }) ]);
      if (needle2 != null && max) tr.appendChild(el("b", { class:"needle", style:"left:" + Math.round(100 * needle2 / max) + "%", title:"hub.usage " + needle2 }));
      m.appendChild(tr);
      return m;
    }
    bank.appendChild(meter("reach", "REACH", F.behind.fns, FMAX.behind, "ok", "fns behind · notch " + FMAX.behind + " is the console's FIXED p95; the feed's own p95 is " + F.behind_p95_feed + " (nearest-rank)"));
    bank.appendChild(meter("reach", "DEPTH", F.behind.depth, FMAX.depth, "ok", "BFS eccentricity · notch " + FMAX.depth));
    bank.appendChild(meter("fanin", "FAN-IN", F.in_degree, VMAX.fanin, "ok", "fn_edges in-degree · the second needle is hub.usage", F.hub.usage));
    bank.appendChild(meter("tested", "TESTED", 0, VMAX.tested, "unmeas", "the mint hardcodes 0 · " + F.via_callers.cases + " cases via callers"));
    w.appendChild(bank);
    w.appendChild(el("div", { class:"p4sig", text:sigLine, title:sigLine }));
    var bottom = el("div", { class:"p4bottom" });
    var cx = 52, cy = 50, R = 40;
    function pt(i, r){ var a = -Math.PI / 2 + i * 2 * Math.PI / 7; return [(cx + Math.cos(a) * R * r).toFixed(1), (cy + Math.sin(a) * R * r).toFixed(1)]; }
    var poly = SLOTK.map(function(sk, i){ return pt(i, Math.max(.06, liveN(e, sk[0]).r)).join(","); }).join(" ");
    var rings = [.34, .67, 1].map(function(r){ return '<polygon points="' + SLOTK.map(function(_, i){ return pt(i, r).join(","); }).join(" ") + '" fill="none" stroke="currentColor" stroke-opacity=".16"/>'; }).join("");
    var spokes = SLOTK.map(function(sk, i){ var p = pt(i, 1); return '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0] + '" y2="' + p[1] + '" stroke="currentColor" stroke-opacity=".14"><title>' + sk[1] + ' ' + liveN(e, sk[0]).live + '/' + liveN(e, sk[0]).n + '</title></line>'; }).join("");
    bottom.appendChild(el("div", { class:"p4radar", html:'<svg viewBox="0 0 104 100">' + rings + spokes + '<polygon points="' + poly + '" fill="' + col(e) + '" fill-opacity=".38" stroke="' + col(e) + '" stroke-width="2"/></svg>' }));
    var np = el("div", { class:"p4np" }, [ el("span", { class:"kg", html:svgK(e.kind, col(e), 20) }), el("span", { class:"t" }, [ el("b", { text:F.name }), el("i", { text:e.kind + " · " + F.slug }) ]) ]);
    bottom.appendChild(np);
    var counts = el("div", { class:"p4counts res" });
    [["callers", F.in_degree, "caller"], ["callees", F.out_degree, "dep"], ["behind", F.behind.fns, "reach"], ["schemas", F.schemas.returns.length + F.schemas.uses.length, "resp"], ["serialise", ser.length, "touch"], ["writes", writes.length, "write"]].forEach(function(x){
      counts.appendChild(el("span", { class:"r" + (x[1] ? "" : " off") }, [ el("span", { class:"ri", html:rowSvg(x[2], 11) }), el("b", { text:String(x[1]) }), el("span", { class:"u", text:x[0] }) ]));
    });
    bottom.appendChild(counts);
    w.appendChild(bottom);
    mbox.appendChild(w); clip(w, bank);
  }

  /* ── P5 · THE BUILD QUEUE — what is missing leads ────────────────────────
     SC2's InfoPaneQueue is ONE STRIP of square cells with a progress bar under
     the head — not a grid of cards (a 3x2 of cards measured 0.75 against G's
     cargo hold: the same form under another name). The wireframe carries its
     own labels inside the drawing, so no rails duplicate it as meters. */
  function p5(e, mbox){
    var w = el("div", { class:"lm p5" });
    var owed = [
      ["tests", "test", "unmeas", "never measured directly — the mint writes tests:0 · " + F.via_callers.cases + " cases reach it through callers", "/gabe-red names it in a case"],
      ["doc", "doc", "empty", "no docstring captured (200 of 292 have one)", "write one; the mint must join detail"],
      ["sig", "sig", "warn", "in the feed, dropped by the mint at :" + F.station.det_line, "one join to detail['fn:slug|name']"],
      ["homing", "home", "empty", "not weighed (66 of 292 were)", "/gabe-cc-init rank · Part C"],
      ["journeys", "journey", "empty", "none direct · " + F.via_callers.journeys + " via callers", "curate-workflows"],
      ["pressure", "via", "empty", "levels.pressure is {} — a placeholder", "the emitter has no writer"],
    ];
    var q = el("div", { class:"p5q" });
    q.appendChild(hd("QUEUE", owed.length + " dims owed", "test"));
    var strip = el("div", { class:"p5strip" });
    var cap = el("div", { class:"p5cap" });
    function showCap(o){ cap.innerHTML = ""; cap.appendChild(el("b", { text:o[0] })); cap.appendChild(el("span", { text:" — " + o[3] })); cap.appendChild(el("i", { text:"↳ " + o[4] })); }
    owed.forEach(function(o, i){
      var c = el("button", { class:"p5c " + o[2] + (i ? "" : " head"), title:o[0] + " — " + o[3] + " · fills: " + o[4] });
      if (!i) c.appendChild(el("i", { class:"prog" }));
      c.appendChild(el("span", { class:"ci", html:rowSvg(o[1], 16) }));
      c.appendChild(el("span", { class:"cq", text:String(i + 1) }));
      c.onmouseenter = function(){ showCap(o); };
      strip.appendChild(c);
    });
    q.appendChild(strip); q.appendChild(cap); showCap(owed[0]);
    var live = 0, tot = 0; SLOTK.forEach(function(sk){ var s = liveN(e, sk[0]); live += s.live; tot += s.n; });
    q.appendChild(el("div", { class:"p5bar" }, [ el("i", { style:"width:" + Math.round(100 * live / Math.max(1, tot)) + "%" }), el("span", { text:live + " of " + tot + " console rows live · " + (tot - live) + " honest-empty" }) ]));
    w.appendChild(q);
    var kn = el("div", { class:"p5known" });
    kn.appendChild(hd("KNOWN", live + "/" + tot, "layers"));
    var body = el("div", { class:"p5kb" });
    var bands = SLOTK.map(function(sk, i){ var s = liveN(e, sk[0]); var y = 6 + i * 12.6;
      return '<rect x="0" y="' + y + '" width="150" height="11" fill="' + col(e) + '" opacity="' + (0.12 + s.r * .75).toFixed(2) + '"><title>' + sk[1] + ' ' + s.live + '/' + s.n + '</title></rect>'
           + '<text x="160" y="' + (y + 8.5) + '" font-size="7.5" font-family="Menlo,Consolas,monospace" fill="currentColor" opacity=".8">' + sk[1] + '</text>'
           + '<text x="228" y="' + (y + 8.5) + '" font-size="7.5" font-family="Menlo,Consolas,monospace" fill="currentColor" opacity=".55" text-anchor="end">' + s.live + '/' + s.n + '</text>'; }).join("");
    body.appendChild(el("div", { class:"p5wf", html:'<svg viewBox="0 0 230 100" preserveAspectRatio="xMinYMid meet"><defs><clipPath id="p5clip"><path d="M26 4h98l24 22v48l-24 22H26L2 74V26z"/></clipPath></defs><g clip-path="url(#p5clip)"><rect width="150" height="100" fill="currentColor" opacity=".07"/>' + bands.replace(/<text[^>]*>[^<]*<\/text>/g, "") + '</g><path d="M26 4h98l24 22v48l-24 22H26L2 74V26z" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="1.6"/>' + bands.replace(/<rect[^>]*>(<title>[^<]*<\/title>)?<\/rect>/g, "") + '</svg>' }));
    kn.appendChild(body); w.appendChild(kn);
    mbox.appendChild(w); clip(q, strip); clip(kn, body);
  }

  function rightPlanet(e, rin){ rin.appendChild(planetEl(e)); rin.appendChild(evidenceEl(e)); rin.appendChild(commandEl(e.id, null, {})); }
  function rightGlyph(e, rin){ rin.appendChild(portraitEl(e)); rin.appendChild(evidenceEl(e)); rin.appendChild(commandEl(e.id, null, {})); }

  window.LABLAYOUTS = [
    { key:"p1", name:"P1 · The Waist", note:"call-graph first — callers above, the function as the waist, callee and behind-mass below. The only proposal whose primary axis is vertical flow through the element.", middle:p1, right:rightPlanet },
    { key:"p2", name:"P2 · The Cargo Hold", note:"data first — a READS hold and a RETURNS hold with the function as the converter between them; the call graph is one strip of digits.", middle:p2, right:rightPlanet },
    { key:"p3", name:"P3 · The Ledger", note:"nothing drawn — 3 × 8 fixed keys, every value one line, every empty in the feed's words; a glyph instead of a planet.", middle:p3, right:rightGlyph },
    { key:"p4", name:"P4 · The Cockpit", note:"numbers first — four notched meters (FAN-IN carries two needles), one signature line, a slot radar and a digit strip.", middle:p4, right:rightPlanet },
    { key:"p5", name:"P5 · The Build Queue", note:"what is missing leads — six owed fields with the beat that fills each, then what is known as a wireframe and rails.", middle:p5, right:rightPlanet },
  ];
})();
