/* _lab-ep-pick.js — the lab opens ANY endpoint of the app (D-035: "Be able to change the endpoint for any of the other
   endpoints that we have here in the all endpoints.html file").

   How an endpoint reaches the lab: endpoint-lab.html?ep=<slug> (the slug is _ep-slug.js's rule). The page's head loads
   _eps/<slug>.js by a script tag BEFORE the lab boots (file:// cannot fetch) — see the loader beside _lab-ep.js in the
   page — and records what happened in window.LABEP_OPEN { asked, state: default | opened | missing | invalid | mismatch,
   label }. This file draws the two things the lede says about it:
     · THE PICKER — the endpoint's name in the lede is a control: it opens every endpoint the feed holds
       (window.LABEP_INDEX, committed), grouped by entity and in path order (his all-endpoints defaults, D-034), each with
       its method badge, behind a filter box. Choosing one reloads the lab with ?ep=. An endpoint whose facts are not in
       _eps/ (window.LABEP_BUILT, read from _eps/built.js only when the list opens) is listed, marked "not built here",
       and says the command that builds it. WHERE the control sits and HOW it opens is the agent's pick, unruled: it
       wears the dashed border (D-034's mark).
     · THE MISS LINE — a ?ep= the lab could not open is SAID in the lede: which endpoint, and the exact command that
       builds its file. The lab then runs on the default endpoint, and the line says that too. Never a silent fallback.
   Every name, count and command below is read from the index, the facts or the build manifest — nothing typed. */
(function(){
  var CMD_DIR = "docs/design/workflow-panel";
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"]/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function E(t, a){ var e = document.createElement(t), k = [].slice.call(arguments, 2);
    for (var p in (a || {})) { if (p === "class") e.className = a[p]; else if (p === "html") e.innerHTML = a[p]; else e.setAttribute(p, a[p]); }
    k.forEach(function f(c){ if (c == null) return; if (Array.isArray(c)) c.forEach(f); else e.append(c); }); return e; }
  function index(){ return ((window.LABEP_INDEX || {}).endpoints) || []; }
  function bySlug(s){ return index().filter(function(r){ return r.slug === s; })[0] || null; }
  /* the build command for one endpoint, or for all of them — the generator's own CLI */
  function buildCmd(label){ return "cd " + CMD_DIR + " && python3 gen-endpoint-set.py" + (label ? " --only \"" + label + "\"" : ""); }

  /* the method badge — the station's method colour (STATION.METHOD), the verb in words */
  function badge(S, m){ var c = (S.METHOD || {})[m] || "var(--muted)";
    return E("span", { class: "epm", style: "color:" + c + ";border-color:color-mix(in srgb, " + c + " 45%, transparent);background:color-mix(in srgb, " + c + " 10%, transparent)" }, m); }

  function missLine(O){
    var box = document.getElementById("ledemiss"); if (!box) return;
    if (O.state === "default" || O.state === "opened") { box.hidden = true; return; }
    var row = bySlug(O.asked), F = window.LABEP, now = F && F.identity ? F.identity.label : "?";
    var what = row ? row.label : O.asked;
    var why = O.state === "invalid" ? "this is not a name the slug rule makes"
      : O.state === "mismatch" ? "its file holds a different endpoint"
      : row ? "its facts file is not built here" : "no endpoint of this feed has that name";
    box.hidden = false; box.dataset.state = O.state; box.innerHTML = "";
    /* a name the feed holds can be built; one it does not hold cannot, so the line points at the list instead */
    box.append(E("b", {}, "could not open " + what), E("span", {}, " — " + why + ". Showing " + now + " instead."),
      row ? E("span", { class: "lmcmd" }, "build it: ", E("code", {}, buildCmd(row.label)))
          : E("span", { class: "lmcmd" }, "the endpoints this feed holds are listed under the name below")); }

  var BUILT = null;   /* null = not read yet · false = no manifest here · {heads} */
  function readBuilt(done){
    if (BUILT !== null) return done();
    if (window.LABEP_BUILT) { BUILT = window.LABEP_BUILT; return done(); }
    var s = document.createElement("script"); s.src = "_eps/built.js";
    s.onload = function(){ BUILT = window.LABEP_BUILT || false; done(); };
    s.onerror = function(){ BUILT = false; done(); };
    document.head.appendChild(s); }
  /* the baked default (_lab-ep.js) opens with no ?ep at all, so it counts as built whatever _eps/ holds */
  function isDefault(slug){ var D = window.LABEP_DEFAULT; return !!(D && D.identity && window.EPSLUG.slug(D.identity.label) === slug); }
  function isBuilt(slug){ return isDefault(slug) || !!(BUILT && BUILT.heads && Object.prototype.hasOwnProperty.call(BUILT.heads, slug)); }

  function init(S){
    var O = window.LABEP_OPEN || { state: "default" }, F = window.LABEP, I = F.identity;
    document.title = "Endpoint lab · " + I.label + " — the six parts, one panel at a time";
    missLine(O);
    var host = document.getElementById("ledebench"); if (!host) return;
    host.innerHTML = "";
    var btn = E("button", { class: "eppick pick", type: "button", id: "eppick", "aria-haspopup": "listbox", "aria-expanded": "false" });
    btn.innerHTML = S.icon("endpoint", 14, S.KINDCOL.endpoint);
    btn.append(badge(S, I.method), E("span", { class: "eppl" }, I.path), E("span", { class: "eppe" }, I.entity || "—"),
      E("span", { class: "eppc", html: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 9l6 6 6-6"/></svg>' }));
    host.append(btn);
    if (window.hoverBind && window.hcard) {
      btn.addEventListener("mouseenter", function(){ window.hoverShow(btn, window.hcard({ title: "change the endpoint", icon: "endpoint",
        plain: "Opens every endpoint of this app; pick one and the lab reloads on it.",
        clarify: "dashed: my pick of where this control sits — not ruled" })); });
      btn.addEventListener("mouseleave", window.hoverHide); }
    var pop = E("div", { class: "eppop", id: "eppop", role: "listbox", hidden: "" });
    host.append(pop);
    btn.onclick = function(ev){ ev.stopPropagation(); if (window.hoverHide) window.hoverHide();
      if (!pop.hidden) return close();
      readBuilt(function(){ draw(S, pop, I); pop.hidden = false; btn.setAttribute("aria-expanded", "true");
        var f = pop.querySelector("input"); if (f) f.focus(); }); };
    function close(){ pop.hidden = true; btn.setAttribute("aria-expanded", "false"); }
    document.addEventListener("click", function(ev){ if (!pop.hidden && !pop.contains(ev.target)) close(); });
    document.addEventListener("keydown", function(ev){ if (ev.key === "Escape" && !pop.hidden) close(); });
    window.EPPICK.close = close; }

  function draw(S, pop, I){
    var rows = index(), groups = {}, order = [];
    rows.forEach(function(r){ var g = r.ent || "—"; if (!groups[g]) { groups[g] = []; order.push(g); } groups[g].push(r); });
    order.sort(function(a, b){ return a < b ? -1 : a > b ? 1 : 0; });
    order.forEach(function(g){ groups[g].sort(function(a, b){ return a.p < b.p ? -1 : a.p > b.p ? 1 : (a.m < b.m ? -1 : a.m > b.m ? 1 : 0); }); });
    var nBuilt = rows.filter(function(r){ return isBuilt(r.slug); }).length;
    pop.innerHTML = "";
    var filt = E("input", { class: "epf", type: "search", placeholder: "filter — method, path or entity", "aria-label": "filter the endpoints" });
    var sum = E("div", { class: "epsum" }, rows.length + " endpoints · " + order.length + " entities · " + nBuilt + " built here");
    var list = E("div", { class: "eplist" });
    order.forEach(function(g){ var G = groups[g], col = G[0].col || "var(--muted)";
      var sec = E("div", { class: "epg" }, E("div", { class: "epgh" }, E("i", { style: "background:" + col }), E("b", {}, g), E("span", {}, String(G.length))));
      G.forEach(function(r){ var here = r.label === I.label, built = isBuilt(r.slug);
        var it = E("button", { class: "epi" + (here ? " here" : "") + (built ? "" : " nb"), type: "button", role: "option", "aria-selected": here ? "true" : "false" },
          badge(S, r.m), E("span", { class: "epip" }, r.p),
          /* where the app mounts it, when the label's path is not that (review 2026-09-23: four rows all read "/") */
          r.mount ? E("span", { class: "epmt" }, "at " + r.mount) : null,
          here ? E("span", { class: "epin" }, "open now") : built ? null : E("span", { class: "epin" }, "not built here"));
        it.dataset.slug = r.slug; it.dataset.label = r.label; it.dataset.built = built ? "1" : "0";
        if (r.mount) it.dataset.mount = r.mount;
        /* the filter reads the mount and the handler's file too, with _ and - alike, so "filter-modes" finds recipe_filter_modes.py */
        it.dataset.q = (r.m + " " + r.p + " " + g + " " + (r.mount || "") + " " + (r.file || "")).toLowerCase().replace(/_/g, "-");
        if (!built && !here) { it.addEventListener("mouseenter", function(){ window.hoverShow(it, window.hcard({ title: r.label, value: "not built here", icon: "endpoint", color: (S.METHOD || {})[r.m],
              plain: "Its facts file is a local build. Build it, then pick it again.", body: "<code>" + esc(buildCmd(r.label)) + "</code>" })); });
          it.addEventListener("mouseleave", window.hoverHide); }
        it.onclick = function(ev){ ev.stopPropagation(); if (here || !built) return; go(r.slug); };
        sec.append(it); });
      list.append(sec); });
    /* THE KEYBOARD (review 2026-09-23: ArrowDown from the filter left the focus in the box): ArrowDown from the filter goes to
       the first row you can pick; in the list the arrows walk the rows you can see, Home and End jump, ArrowUp from the first
       goes back to the filter; Enter or Space picks (the rows are buttons) */
    function rowsNow(){ return [].slice.call(list.querySelectorAll(".epi")).filter(function(it){ return !it.hidden && !it.closest(".epg").hidden; }); }
    filt.addEventListener("keydown", function(ev){ if (ev.key !== "ArrowDown") return; var rs = rowsNow(); if (!rs.length) return;
      ev.preventDefault(); (rs.filter(function(it){ return it.dataset.built === "1" && !it.classList.contains("here"); })[0] || rs[0]).focus(); });
    list.addEventListener("keydown", function(ev){ var rs = rowsNow(), i = rs.indexOf(document.activeElement); if (i < 0) return;
      var to = ev.key === "ArrowDown" ? rs[i + 1] : ev.key === "ArrowUp" ? (i ? rs[i - 1] : filt) : ev.key === "Home" ? rs[0] : ev.key === "End" ? rs[rs.length - 1] : null;
      if (to) { ev.preventDefault(); to.focus(); to.scrollIntoView && to.scrollIntoView({ block: "nearest" }); } });
    filt.oninput = function(){ var q = filt.value.trim().toLowerCase().replace(/_/g, "-");
      [].forEach.call(list.querySelectorAll(".epg"), function(sec){ var any = false;
        [].forEach.call(sec.querySelectorAll(".epi"), function(it){ var on = !q || it.dataset.q.indexOf(q) >= 0; it.hidden = !on; if (on) any = true; });
        sec.hidden = !any; }); };
    pop.append(filt, sum, list);
    if (!BUILT || !BUILT.n) pop.append(E("div", { class: "epsum" }, "only the default is built here — build the rest: ", E("code", {}, buildCmd(null)))); }

  /* the reload keeps the part that is open and changes only ?ep= — the part is WRITTEN into the hash here, since the lab's part
     buttons never write it (review 2026-09-23: Tests open, a pick, and the new endpoint opened on Data) */
  function go(slug){ var u = new URL(location.href), P = document.getElementById("panel"), part = P && P.dataset.tab;
    if (isDefault(slug)) u.searchParams.delete("ep"); else u.searchParams.set("ep", slug);
    if (part) u.hash = "#" + part;
    location.href = u.toString(); }

  window.EPPICK = { init: init, go: go, buildCmd: buildCmd, close: function(){} };
})();
