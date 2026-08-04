/* evidence-nav.js — the entity Evidence navigator (workflow map ⇄ evidence).
 *
 * One entity's workflows as small-node maps on the left; the selected step's
 * production capture + provenance on the right. Ships with the center shell so
 * a feature page and a prism page render it identically.
 *
 * MOUNT
 *   EvidenceNav.mount(rootEl, data)
 *
 * DATA CONTRACT
 *   states: { <id>: {
 *     l:      label (short — it sits beside a 12px dot)
 *     st:     "running" | "unpowered" | "ghost"
 *              running   = a capture AND an assertion exist
 *              unpowered = asserted (api/unit/e2e) but never photographed
 *              ghost     = neither — a named absence, never a fake shot
 *     role:   free text pill ("principal" | "edge" | "reference" | "named gap" …)
 *     uc:     one sentence — what this step IS
 *     cap:    when it was captured, or "capture owed (<run name>)" / "never"
 *     spec:   the spec/suite that asserts it
 *     code:   [ "fn() (file.py:NN)" … ]      models: [ "Model.field" … ]
 *     cids:   [ "C1067" … ]
 *     writes: [ [field, viaFunction, landsIn] … ]  → renders the ✎ mark + table
 *     shot:   [ url … ]  (absent ⇒ the honest-gap panel)
 *     grp:    1 = a section pill (rect, not a dot)
 *     lnk:    1 = clicking JUMPS to another workflow
 *     link:   target workflow key, or "__parent" for a back link
 *     linkcur: node to select on arrival (optional)
 *   } }
 *   workflows: { <key>: {
 *     label, sub: 1 (indents it under its parent in the picker),
 *     gates: [ [tag, tooltip] … ],
 *     nodes: [ id … ]                       — the sequence strip, first = start
 *     tree:  [ [id, x, y, "r"|"b"] … ]      — "r" labels right, "b" below
 *     edges: [ [a, b, "fx"?] … ]            — "fx" = a DATA EFFECT (violet dash)
 *     taps:  [ [trunkX, trunkY, id] … ]     — bracket connector (no crossings)
 *     bands: [ [label, labelY, sepY|null] … ]
 *     h: svg height (viewBox is 0 0 420 h)
 *   } }
 *   start: <workflow key>
 *
 * LAYOUT LAW (binding on authors and on any generator that emits this data)
 *   · siblings are PARALLEL alternatives from their parent;
 *   · a node that DEPENDS on another sits one level BELOW it;
 *   · a section with real complexity becomes its own workflow, linked —
 *     never a denser subtree.
 */
(function () {
  var S, WF, EL, WFK, CUR, PARENT;

  var SHELL =
    '<div class="evsplit">' +
      '<div class="evmap">' +
        '<div class="evbar"><select data-ev-wf></select></div>' +
        '<div data-ev-diag data-probe></div>' +
        '<div class="evgates" data-ev-gates></div>' +
        '<div class="evleg">' +
          '<span><i class="lr"></i>running — shot + assertion</span>' +
          '<span><i class="lu"></i>unpowered — asserted, unphotographed</span>' +
          '<span><i class="lg"></i>ghost — nothing</span>' +
          '<span class="lw">✎ writes data</span>' +
          '<span style="color:#6b46c1">⇢ data effect (dashed)</span>' +
        '</div>' +
      '</div>' +
      '<div class="evpanel" data-probe>' +
        '<div class="shot" data-ev-shot></div>' +
        '<div class="meta"><h3><span data-ev-title data-probe-expect="\\S"></span> ' +
          '<span class="evpill" data-ev-role></span></h3>' +
          '<p class="uc" data-ev-uc></p><div data-ev-rows></div></div>' +
        '<div class="evseq" data-ev-seq></div>' +
      '</div>' +
    '</div>';

  var DEFS = '<defs><marker id="evarr" viewBox="0 0 8 8" refX="7" refY="4" ' +
    'markerWidth="5.5" markerHeight="5.5" orient="auto">' +
    '<path d="M0,0L8,4L0,8z" fill="#9aa5b1"/></marker></defs>';

  function esc(t) { return String(t).replace(/[&<>]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }

  function node(id, x, y, side) {
    var s = S[id];
    if (s.grp) {
      var bw = s.l.length * 7.4 + 20;
      return '<g class="evnode grp' + (s.lnk ? " lnk" : "") +
        (id === CUR ? " on" : "") + '" data-state="' + id + '">' +
        '<rect x="' + (x - bw / 2) + '" y="' + (y - 12) + '" width="' + bw +
        '" height="24" rx="9"/><text x="' + x + '" y="' + (y + 3.5) +
        '" text-anchor="middle">' + esc(s.l) + '</text></g>';
    }
    var lw = s.l.length * 7.2 + 8;
    var w = s.writes && s.writes.length
      ? '<text class="wmark" x="' + (x + 10) + '" y="' + (y - 9) + '">✎</text>' : "";
    var lab = side === "r"
      ? '<text x="' + (x + 18) + '" y="' + (y + 4.5) + '" text-anchor="start">' + esc(s.l) + '</text>'
      : '<text x="' + x + '" y="' + (y + 26) + '" text-anchor="middle">' + esc(s.l) + '</text>';
    // the hit area spans dot AND label — without it the <g> centre falls in the
    // gap between them and the node is unclickable.
    var hit = side === "r"
      ? '<rect class="hit" x="' + (x - 14) + '" y="' + (y - 14) + '" width="' + (28 + lw) + '" height="28"/>'
      : '<rect class="hit" x="' + (x - Math.max(lw, 28) / 2) + '" y="' + (y - 14) +
        '" width="' + Math.max(lw, 28) + '" height="44"/>';
    return '<g class="evnode s-' + s.st + (id === CUR ? " on" : "") +
      '" data-state="' + id + '">' + hit + '<circle cx="' + x + '" cy="' + y +
      '" r="12"/>' + w + lab + '</g>';
  }

  function edge(a, b, P, kind) {
    if (!P[a] || !P[b]) return "";
    var x1 = P[a][0], y1 = P[a][1], x2 = P[b][0], y2 = P[b][1];
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    return '<path class="edge' + (kind === "fx" ? " fx" : "") + '" d="M' +
      (x1 + dx / L * 14) + ',' + (y1 + dy / L * 14) + ' L' +
      (x2 - dx / L * 16) + ',' + (y2 - dy / L * 16) + '"/>';
  }

  // bracket connector: down the trunk, then across — zero crossings by construction
  function tap(x1, y1, x2, y2) {
    return '<path class="tap" d="M' + x1 + ',' + y1 + ' L' + x1 + ',' + y2 +
      ' L' + (x2 - 14) + ',' + y2 + '" marker-end="url(#evarr)"/>';
  }

  function draw() {
    var w = WF[WFK], P = {};
    w.tree.forEach(function (t) { P[t[0]] = [t[1], t[2]]; });
    var g = '<svg viewBox="0 0 420 ' + w.h + '">' + DEFS;
    (w.bands || []).forEach(function (b) {
      if (b[2] != null)
        g += '<line class="lanesep" x1="6" y1="' + b[2] + '" x2="414" y2="' + b[2] + '"/>';
      g += '<text class="lanelab" x="8" y="' + b[1] + '" style="paint-order:stroke" ' +
        'stroke="var(--surface,#fff)" stroke-width="3">' + esc(b[0]) + '</text>';
    });
    (w.taps || []).forEach(function (t) {
      var n = P[t[2]]; if (n) g += tap(t[0], t[1], n[0], n[1]);
    });
    (w.edges || []).forEach(function (e) { g += edge(e[0], e[1], P, e[2]); });
    w.tree.forEach(function (t) { g += node(t[0], t[1], t[2], t[3] || "b"); });
    EL.diag.innerHTML = g + "</svg>";
  }

  function chips(list, cls) {
    return (list || []).map(function (c) {
      return '<span class="evchip ' + cls + '">' + esc(c) + "</span>"; }).join("");
  }

  function render() {
    draw();
    EL.gates.innerHTML = "<b>gates</b>" + (WF[WFK].gates || []).map(function (g) {
      return '<span class="evgate" title="' + esc(g[1]) + '">' + esc(g[0]) + "</span>"; }).join("");
    var s = S[CUR];
    EL.shot.innerHTML = s.shot
      ? s.shot.map(function (u) {
          return '<img src="' + u + '" alt="' + esc(s.l) + '" loading="lazy">'; }).join("")
      : (s.grp
          ? '<div class="gap" style="background:var(--bg,#f5f7fa);border:none">' +
            '<b style="color:var(--accent-ink,#0a565e)">§ section</b><span>' + esc(s.uc) + "</span></div>"
          : '<div class="gap"><b>⚠ no capture exists</b><span>' + esc(s.uc) + "</span></div>");
    EL.title.textContent = s.l;
    EL.role.textContent = s.role;
    EL.role.className = "evpill " + (s.st === "ghost" ? "gap" : String(s.role).split(" ")[0]);
    EL.uc.textContent = s.shot ? s.uc : "";
    EL.rows.innerHTML =
      ((s.writes && s.writes.length)
        ? '<table class="wmap"><tr><th>✎ field</th><th>via function</th><th>lands in</th></tr>' +
          s.writes.map(function (w) {
            return Array.isArray(w)
              ? '<tr><td class="f">' + esc(w[0]) + '</td><td class="fn">' + esc(w[1]) +
                '</td><td class="md">' + esc(w[2]) + "</td></tr>"
              : '<tr><td class="f">' + esc(w) + '</td><td class="fn">—</td><td class="md">—</td></tr>';
          }).join("") + "</table>" : "") +
      '<div class="evrow"><span class="k">captured</span><span>' + esc(s.cap) + "</span></div>" +
      '<div class="evrow"><span class="k">spec</span><span class="evchip">' + esc(s.spec) + "</span></div>" +
      ((s.code || []).length ? '<div class="evrow"><span class="k">code</span><span>' + chips(s.code, "code") + "</span></div>" : "") +
      ((s.models || []).length ? '<div class="evrow"><span class="k">models</span><span>' + chips(s.models, "model") + "</span></div>" : "") +
      ((s.cids || []).length ? '<div class="evrow"><span class="k">cases</span><span>' + chips(s.cids, "cid") + "</span></div>" : "");
    EL.seq.innerHTML = '<span class="k">' + esc(WF[WFK].label) + "</span>" +
      WF[WFK].nodes.map(function (id) {
        return '<button class="evstep' + (id === CUR ? " on" : "") + '" type="button" data-state="' +
          id + '">' + esc(S[id].l) + "</button>"; }).join(" ");
  }

  function onClick(e) {
    var t = e.target.closest("[data-state]");
    if (!t) return;
    var id = t.getAttribute("data-state"), s = S[id];
    if (s.lnk) {
      var tgt = s.link === "__parent" ? PARENT : s.link;
      if (!WF[WFK].sub) PARENT = WFK;          // remember the parent we came from
      WFK = tgt; CUR = s.linkcur || WF[WFK].nodes[0];
      EL.sel.value = WFK;
    } else CUR = id;
    render();
  }

  window.EvidenceNav = {
    mount: function (root, data) {
      S = data.states; WF = data.workflows;
      root.innerHTML = SHELL;
      EL = {
        diag: root.querySelector("[data-ev-diag]"), gates: root.querySelector("[data-ev-gates]"),
        shot: root.querySelector("[data-ev-shot]"), title: root.querySelector("[data-ev-title]"),
        role: root.querySelector("[data-ev-role]"), uc: root.querySelector("[data-ev-uc]"),
        rows: root.querySelector("[data-ev-rows]"), seq: root.querySelector("[data-ev-seq]"),
        sel: root.querySelector("[data-ev-wf]"),
      };
      EL.sel.innerHTML = Object.keys(WF).map(function (k) {
        return '<option value="' + k + '">' + (WF[k].sub ? "\u00a0\u00a0↳ " : "") +
          esc(WF[k].label) + "</option>"; }).join("");
      WFK = data.start; CUR = WF[WFK].nodes[0]; PARENT = WFK;
      EL.sel.value = WFK;
      root.addEventListener("click", onClick);
      EL.sel.addEventListener("change", function (e) {
        WFK = e.target.value; CUR = WF[WFK].nodes[0]; render(); });
      render();
    },
  };
})();
