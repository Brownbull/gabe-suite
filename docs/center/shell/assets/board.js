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
  var F = { track: '', entity: '', area: '', effort: '', ripe: '', unblocked: '' };
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

  var saved = null;
  try { saved = localStorage.getItem('gabe.board.mode'); } catch (e) { /* private */ }
  mode(saved || 'state');
})();
