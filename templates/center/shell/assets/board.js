/* Board station behaviour — framing switch, cross-framing filters, column
   folds, and the phase-sequence detail panel.

   The board is a PROJECTION: this file only ever SHOWS and HIDES what the
   generator already rendered. It never writes state anywhere except the
   remembered framing, because a card the viewer can move would become a
   second source of truth competing with PLAN.md and PENDING.md.

   Every framing is rendered as its own .bboard; switching shows one and hides
   the rest, so a filter applies across all of them at once and survives the
   switch. */
(function () {
  var F = { track: '', entity: '', area: '', effort: '', ripe: '', unblocked: '', state: '',
            closed30: '', aged: '' };
  var boards = [].slice.call(document.querySelectorAll('.bboard'));
  if (!boards.length) return;                 // page without a board — no-op

  function apply() {
    var shown = 0, total = 0;
    boards.forEach(function (b) {
      if (b.style.display === 'none') return;
      [].forEach.call(b.querySelectorAll('.bcard'), function (c) {
        total++;
        var ents = ' ' + (c.dataset.entities || '') + ' ';
        var ok = (!F.track || c.dataset.track === F.track)
          && (!F.entity || ents.indexOf(' ' + F.entity + ' ') >= 0)
          && (!F.area || c.dataset.area === F.area)
          && (!F.effort || c.dataset.effort === F.effort)
          && (!F.ripe || c.dataset.ripe === '1')
          && (!F.state || c.dataset.state === F.state)
          && (!F.closed30 || c.dataset.closed30 === '1')
          && (!F.aged || c.dataset.aged === '1')
          && (!F.unblocked || (c.dataset.state !== 'blocked'
            && c.dataset.state !== 'parked'));
        c.classList.toggle('hide', !ok);
        if (ok) shown++;
      });
      [].forEach.call(b.querySelectorAll('.bcol'), function (col) {
        var vis = col.querySelectorAll('.bcard:not(.hide)').length;
        col.classList.toggle('empty', vis === 0);
        var n = col.querySelector('h3 .n');
        if (n) n.textContent = vis;
        // the fold's own count has to track the filter, or "+ 12 more" lies
        var fold = col.querySelector('.bfold'), more = col.querySelector('.bmore');
        if (fold && more) {
          var hidden = fold.querySelectorAll('.bcard:not(.hide)').length;
          more.style.display = hidden ? '' : 'none';
          more.dataset.n = hidden;
          if (!fold.classList.contains('open')) more.textContent = '+ ' + hidden + ' more';
        }
      });
    });
    var any = Object.keys(F).some(function (k) { return F[k]; });
    [].forEach.call(document.querySelectorAll('.bcount'), function (e) {
      e.textContent = any ? (shown + ' of ' + total + ' cards')
        : (total + ' cards');
    });
  }

  function mode(m) {
    boards.forEach(function (b) {
      b.style.display = b.dataset.mode === m ? 'grid' : 'none';
    });
    [].forEach.call(document.querySelectorAll('.bmodes button'), function (b) {
      b.classList.toggle('on', b.dataset.m === m);
    });
    try { localStorage.setItem('gabe.board.mode', m); } catch (e) { /* private mode */ }
    // "ripe" and "unblocked" describe OPEN moves; on the Done board they would
    // filter against a property no closed card carries.
    var isDone = (m === 'done');
    [].forEach.call(
      document.querySelectorAll('.bchip[data-f="ripe"],.bchip[data-f="unblocked"]'),
      function (b) {
        b.style.display = isDone ? 'none' : '';
        if (isDone && F[b.dataset.f]) { F[b.dataset.f] = ''; b.classList.remove('on'); }
      });
    var wrap = document.querySelector('.bwrap');
    if (wrap) wrap.classList.toggle('donemode', isDone);
    apply();
  }

  document.addEventListener('change', function (ev) {
    var sel = ev.target.closest('.bfilters select');
    if (!sel) return;
    F[sel.dataset.f] = sel.value;
    sel.classList.toggle('set', !!sel.value);
    apply();
  });

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('.bchip');
    if (b) {
      if (b.classList.contains('bclear')) {
        Object.keys(F).forEach(function (k) { F[k] = ''; });
        [].forEach.call(document.querySelectorAll('.bfilters select'), function (x) {
          x.value = ''; x.classList.remove('set');
        });
        [].forEach.call(document.querySelectorAll('.bchip[data-f]'), function (c) {
          c.classList.remove('on');
        });
        return apply();
      }
      var f = b.dataset.f;
      if (f === 'ripe' || f === 'unblocked') {
        F[f] = F[f] ? '' : '1';
        b.classList.toggle('on', !!F[f]);
        apply();
      }
      return;
    }
    var m = ev.target.closest('.bmodes button');
    if (m) return mode(m.dataset.m);
    var kpi = ev.target.closest('.kpi[data-kpi]');
    if (kpi) return kpiAction(kpi.dataset.kpi, kpi);
    var more = ev.target.closest('.bmore');
    if (more) {
      var fold = more.previousElementSibling;
      var open = fold.classList.toggle('open');
      more.textContent = open ? '– show less' : ('+ ' + more.dataset.n + ' more');
      return;
    }
    if (ev.target.closest('.bsdx')) return hidePhase();
    var ph = ev.target.closest('.ph');
    if (ph) {
      if (ph.classList.contains('on')) return hidePhase();
      showPhase(+ph.dataset.i);
    }
  });

  /* ---- phase-sequence detail ------------------------------------------- */
  var PH = [];
  try {
    var node = document.getElementById('phase-seq');
    if (node) PH = JSON.parse(node.textContent || '[]');
  } catch (e) { PH = []; }
  var GL = { done: '✅', in_progress: '🔄', todo: '⬜',
             paused: '⏸', 'n/a': '—' };

  function esc(t) {
    var d = document.createElement('div');
    d.textContent = t == null ? '' : t;
    return d.innerHTML;
  }

  function showPhase(i) {
    var det = document.querySelector('.bseqdet'), p = PH[i];
    if (!det || !p) return;
    var rail = Object.keys(p.cells || {}).map(function (k) {
      var v = p.cells[k], owed = (v === 'todo' || v === 'in_progress');
      return '<span class="' + (owed ? 'owed' : '') + '">' + (GL[v] || '⬜')
        + '<i>' + esc(k) + '</i></span>';
    }).join('');
    var tags = [];
    if (p.tier) tags.push('<span class="bc-area">tier ' + esc(p.tier) + '</span>');
    if (p.complexity) tags.push('<span class="bc-area">' + esc(p.complexity) + '</span>');
    (p.types || []).forEach(function (t) {
      tags.push('<span class="bc-area">' + esc(t) + '</span>');
    });
    /* declared entities (plan-time, operator-confirmed — ruling 2026-08-07):
       null/undefined = never declared → NOTHING renders (absence is absence);
       [] = an explicit `none — <reason>` declaration → say so honestly. */
    if (p.entities && p.entities.length) {
      p.entities.forEach(function (s) {
        tags.push('<span class="bc-ent" style="--ec:var(--accent)"><i></i>' + esc(s) + '</span>');
      });
    } else if (p.entities) {
      tags.push('<span class="bc-area">entities: none declared</span>');
    }
    tags.push('<span class="bc-' + (p.owes && p.owes.length ? 'gate' : 'ripe') + '">'
      + (p.owes && p.owes.length ? 'owes ' + p.owes.join(', ') : 'complete')
      + '</span>');
    /* live overlay — window.GABE_INFLIGHT is the beat-tail projection
       (inflight.js sibling; absent file = no overlay, static payload stands).
       Match on the generator's `current` stamp (num-or-id joined server-side),
       NOT a string compare of IF.current_phase to p.id — those live in different
       id spaces and never matched on a `<id> · <name>` layout. */
    var live = '';
    var IF = window.GABE_INFLIGHT;
    var isCurrent = p.current
      || (IF && (String(IF.current_phase) === String(p.id)
                 || String(IF.current_phase) === String(p.num)));
    if (IF && IF.active && isCurrent) {
      var bits = [];
      if (IF.work_source === 'dirty') bits.push(IF.dirty_files + ' file(s) in flight');
      else if (IF.work_source && IF.work_source !== 'none') bits.push('last work @ ' + IF.work_source);
      /* declared-vs-touched — the comparison the ruling was built for. `declared`
         null = never declared, [] = explicit none, else the operator's slugs. */
      if (IF.declared && IF.declared.length) bits.push('declared ' + IF.declared.join(', '));
      else if (IF.declared) bits.push('declared: none');
      (IF.touched || []).forEach(function (t) {
        bits.push('touched ' + t.slug + ' ×' + t.files);
      });
      if (bits.length) {
        live = '<p class="bsdlive"><b>live</b> · ' + esc(bits.join(' · '))
          + (IF.head ? ' · head ' + esc(IF.head) : '') + '</p>';
      }
    }
    det.innerHTML = '<div class="bsdhead"><b>' + esc(p.id) + ' — ' + esc(p.name)
      + '</b><button class="bsdx" aria-label="close">×</button></div>'
      + '<div class="bsdtags">' + tags.join('') + '</div>'
      + live
      + (p.desc ? '<p>' + esc(p.desc) + '</p>' : '')
      + '<div class="bc-rail">' + rail + '</div>';
    det.hidden = false;
    [].forEach.call(document.querySelectorAll('.ph'), function (b) {
      b.classList.toggle('on', +b.dataset.i === i);
    });
  }

  function hidePhase() {
    var det = document.querySelector('.bseqdet');
    if (det) det.hidden = true;
    [].forEach.call(document.querySelectorAll('.ph'), function (b) {
      b.classList.remove('on');
    });
  }

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') hidePhase();
  });

  /* ── the current-beat banner (▶ NOW) ──────────────────────────────────
     A prominent, always-visible read of the ACTIVE beat, from the same
     inflight.js projection the phase-detail overlay uses — so "what is being
     executed" is a glance, not a click. Three rows (header · entities · meta),
     sitting on the SAME edges as the KPI cards. Renders only when a beat has
     written the projection; absent/inactive → nothing (absence is absence). */
  (function renderNow() {
    var IF = window.GABE_INFLIGHT;
    var kpis = document.querySelector('.kpis');
    var anchor = kpis || document.querySelector('.bseq');
    if (!IF || !IF.active || !anchor) return;
    var cur = PH.filter(function (p) {
      return p.current || String(IF.current_phase) === String(p.id)
                       || String(IF.current_phase) === String(p.num);
    })[0];
    var name = cur ? cur.name : '';
    var owes = (cur && cur.owes && cur.owes.length) ? cur.owes.join(', ') : '';

    /* the current spine STEP — the beat being worked NOW: an in_progress cell if
       one exists, else the first still-todo cell (the next owed beat). Read from
       the phase's cells (plan-time order preserved), so the pill names WHERE in
       the spine we are, not just THAT we are somewhere. */
    var cells = (cur && cur.cells) || (IF.phase && IF.phase.cells) || {};
    var ckeys = Object.keys(cells), step = '';
    for (var si = 0; si < ckeys.length; si++) { if (cells[ckeys[si]] === 'in_progress') { step = ckeys[si]; break; } }
    if (!step) { for (var sj = 0; sj < ckeys.length; sj++) { if (cells[ckeys[sj]] === 'todo') { step = ckeys[sj]; break; } } }
    var stepTxt = step ? step.toUpperCase() : 'COMPLETE';
    var stepLive = !!step && cells[step] === 'in_progress';

    /* the SPINE ticker — every stage of this phase with its status glyph, the
       current one lit, so the status is a rail not a single word. Each stage
       maps to the gabe command that drives it, so "last executed / next to run"
       are named, not guessed. CMD is keyed by the lowercased cell name. */
    var CMD = { red: '/gabe-red', exec: '/gabe-execute', review: '/gabe-review',
                commit: '/gabe-commit', push: '/gabe-push', center: '/gabe-cc-update' };
    var lastDone = '';
    var stageChips = ckeys.map(function (k) {
      var st = cells[k], isNow = (k === step);
      if (st === 'done') lastDone = k;
      var cls = (st === 'done') ? 'done' : (isNow ? 'now' : 'todo');
      var g = (st === 'done') ? '✓' : (isNow ? '▶' : '○');
      return '<span class="bnow-stage ' + cls + '">' + g + ' ' + esc(k) + '</span>';
    }).join('');
    var lastCmd = CMD[lastDone.toLowerCase()] || '';
    var nextCmd = CMD[(step || '').toLowerCase()] || '';
    var cmdline = (lastCmd || nextCmd)
      ? '<span class="bnow-cmd">' + (lastCmd ? 'last ' + esc(lastCmd) : '')
        + (lastCmd && nextCmd ? ' · ' : '') + (nextCmd ? 'next ' + esc(nextCmd) : '') + '</span>'
      : '';

    var declared = IF.declared;                    // null=never · []=declared none · [slugs]
    var touched = (IF.touched || []).map(function (t) { return t.slug; });
    var declSet = {}; (declared || []).forEach(function (s) { declSet[s] = 1; });
    var drift = touched.filter(function (s) { return !declSet[s]; });   // touched but NOT declared

    var declTxt = (declared && declared.length) ? declared.join(', ')
                : (declared ? 'none' : 'not declared');
    var touchTxt = (IF.touched || []).map(function (t) { return t.slug + ' ×' + t.files; }).join(', ') || '—';
    var flight = (IF.work_source === 'dirty') ? (IF.dirty_files + ' file(s) in flight')
               : (IF.work_source && IF.work_source !== 'none') ? ('last work @ ' + IF.work_source) : '';
    var did = IF.last_commit ? esc(IF.last_commit) : (flight ? esc(flight) : '');

    /* r1 STATUS — the loud, high-contrast pill now NAMES the spine step
       (▶ NOW + CENTER), owes + head trailing. r2/r3/r4 mirror the beat brief:
       Feature (the phase) · Entity (declared vs touched) · Did (last commit). */
    var r1 = '<span class="bnow-tag">▶ NOW</span>'
           + '<span class="bnow-step' + (stepLive ? ' live' : '') + '">' + esc(stepTxt)
           + (stepLive ? ' <i>in progress</i>' : '') + '</span>'
           + (owes ? '<span class="bnow-owes">owes ' + esc(owes) + '</span>' : '')
           + (IF.head ? '<span class="bnow-head">head ' + esc(IF.head) + '</span>' : '')
           /* this beat's touched → blast is exactly what the codebase-graph station
              overlays (C2 derives it live from the same inflight), so the ▶ NOW banner
              links there. Only rendered when active, so the target is never honest-empty. */
           + '<a class="bnow-graph" href="codebase-graph.html" title="See this change on the codebase graph">graph &#8599;</a>';
    var rSpine = '<span class="bnow-lab">Spine</span>'
           + '<span class="bnow-rail">' + stageChips + '</span>' + cmdline;
    var r2 = '<span class="bnow-lab">Feature</span>'
           + '<b class="bnow-ph">' + esc(String(IF.current_phase)) + (name ? ' · ' + esc(name) : '') + '</b>';
    var r3 = '<span class="bnow-lab">Entity</span>'
           + '<span class="bnow-ent">declared <b>' + esc(declTxt) + '</b> · touched <b>' + esc(touchTxt) + '</b></span>'
           + (drift.length ? '<span class="bnow-drift">⚠ touched, not declared: ' + esc(drift.join(', ')) + '</span>' : '');
    var r4 = did ? ('<span class="bnow-lab">Did</span><span class="bnow-did">' + did + '</span>') : '';

    var el = document.createElement('div');
    el.className = 'bnow' + (drift.length ? ' bnow--drift' : '');
    el.innerHTML = '<div class="bnow-r r1">' + r1 + '</div>'
                 + '<div class="bnow-r rspine">' + rSpine + '</div>'
                 + '<div class="bnow-r r2">' + r2 + '</div>'
                 + '<div class="bnow-r r3">' + r3 + '</div>'
                 + (r4 ? '<div class="bnow-r r4">' + r4 + '</div>' : '');
    // after the KPI block (same container/edges), and NOT hidden by the intro toggle
    if (kpis) kpis.parentNode.insertBefore(el, kpis.nextSibling);
    else anchor.parentNode.insertBefore(el, anchor);
  })();

  /* ── the KPI tiles become filters ─────────────────────────────────────
     Clicking a tile drives the EXISTING filter machinery (F + mode), never a
     parallel one. Each tile's action is derived from its label; "median cycle"
     stays informational. A second click on an active tile clears back to all. */
  function resetFilters() {
    Object.keys(F).forEach(function (k) { F[k] = ''; });
    [].forEach.call(document.querySelectorAll('.bfilters select'), function (x) { x.value = ''; x.classList.remove('set'); });
    [].forEach.call(document.querySelectorAll('.bchip[data-f]'), function (c) { c.classList.remove('on'); });
    [].forEach.call(document.querySelectorAll('.kpi[data-kpi]'), function (k) { k.classList.remove('on'); });
  }
  function kpiAction(key, el) {
    var wasOn = el && el.classList.contains('on');
    resetFilters();
    if (wasOn) { apply(); return; }                 // toggle off → back to all
    if (key === 'open') { mode('state'); }
    else if (key === 'owed') { F.state = 'owed_to_you'; mode('state'); }
    else if (key === 'blocked') { F.state = 'blocked'; mode('state'); }
    else if (key === 'ripe') {
      F.ripe = '1';
      var chip = document.querySelector('.bchip[data-f="ripe"]');
      if (chip) chip.classList.add('on');
      apply();
    }
    else if (key === 'closed') { F.closed30 = '1'; mode('done'); }   // done ∧ closed ≤30d
    else if (key === 'aged') { F.aged = '1'; mode('age'); }          // open ∧ age >90d
    else { apply(); }
    if (el) el.classList.add('on');
  }
  (function kpiSetup() {
    var MAP = { 'open cards': 'open', 'owed to you': 'owed', 'ripe now': 'ripe',
                'blocked': 'blocked', 'closed 30d': 'closed', 'over 3 months': 'aged' };
    [].forEach.call(document.querySelectorAll('.kpi'), function (k) {
      var lab = (k.querySelector('.lab') || {}).textContent || '';
      var key = MAP[lab.trim().toLowerCase()];
      if (!key) return;                             // median cycle etc. stay informational
      k.dataset.kpi = key;
      k.setAttribute('role', 'button');
      k.setAttribute('tabindex', '0');
      k.classList.add('kpi--btn');
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      var k = ev.target.closest && ev.target.closest('.kpi[data-kpi]');
      if (k) { ev.preventDefault(); kpiAction(k.dataset.kpi, k); }
    });
  })();

  /* ── hide/show the board intro (description + KPI tiles) ───────────────
     A button by the title folds the "what's happening in the world" lede AND
     the seven KPI tiles; the ▶ NOW banner stays (it is the live status, not
     the intro). Persisted. */
  (function descToggle() {
    var head = document.querySelector('.subjecthead');
    var h1 = document.querySelector('.pagehead h1');
    if (!head || !h1) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'desctoggle';
    function set(min) {
      head.classList.toggle('desc-min', min);
      btn.textContent = min ? '▸' : '▾';           // arrow only, next to the title
      btn.setAttribute('aria-expanded', String(!min));
      btn.setAttribute('aria-label', min ? 'Show board intro and KPIs' : 'Hide board intro and KPIs');
      btn.title = min ? 'Show board intro + KPIs' : 'Hide board intro + KPIs';
      try { localStorage.setItem('gabe.board.descmin', min ? '1' : ''); } catch (e) { /* private */ }
    }
    btn.addEventListener('click', function () { set(!head.classList.contains('desc-min')); });
    h1.parentNode.insertBefore(btn, h1.nextSibling);
    var saved = ''; try { saved = localStorage.getItem('gabe.board.descmin') || ''; } catch (e) { /* private */ }
    set(!!saved);
  })();

  var saved = null;
  try { saved = localStorage.getItem('gabe.board.mode'); } catch (e) { /* private */ }
  mode(saved || 'state');
})();
