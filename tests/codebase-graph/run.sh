#!/usr/bin/env bash
# Codebase-graph station battery — a STATIC/STRUCTURAL executable contract for the
# twin center's "Codebase graph" station (templates/center/shell/codebase-graph.html
# + assets/sim-panel.js), the change-simulation lifecycle instrument.
#
# WHY THIS EXISTS: the render gates never EXECUTE the station's inline sim JS —
# verify_center_chrome.mjs runs only rowclick.js against a stub DOM, and
# check_center_links only resolves srcs. So a whole class of station bug ships green.
# This battery is node-stdlib/grep only (no browser, no twin), zero-arg, and the
# doctor auto-runs it. It locks in the failure modes the render gates cannot see:
#   * a `hidden` element defeated by an author `display:` rule — the exact class of
#     the modal-shows-on-load bug and the stray-stageSeg bug (MUTATION-PROVEN here).
#   * a JS mount id (getElementById) or <script src> with no matching markup/file.
#   * the shared window.GABE_SIM_PANEL contract drifting from either host (station
#     + the arch-graph lab both load assets/sim-panel.js).
# Exit 0 = all pass. Add a FIRE+SILENT pair with every new station invariant.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
SHELL_SRC="$REPO/templates/center/shell"

python3 - "$SHELL_SRC" <<'PY'
import sys, re, pathlib
shell = pathlib.Path(sys.argv[1])
station = (shell / "codebase-graph.html").read_text(encoding="utf-8")
panel   = (shell / "assets" / "sim-panel.js").read_text(encoding="utf-8")
lab     = (shell / "example" / "arch-graph-lab" / "arch-graph-sim-svg.html").read_text(encoding="utf-8")

pass_ = 0; fail = 0
def check(cond, msg):
    global pass_, fail
    if cond: pass_ += 1
    else: fail += 1; print("  FAIL:", msg)

# ── helpers ────────────────────────────────────────────────────────────────
def hidden_subjects(html):
    """class/id selectors on elements that carry the `hidden` attribute."""
    subs = set()
    for tag in re.findall(r'<[^>]*\bhidden\b[^>]*>', html):
        m = re.search(r'\bid="([^"]+)"', tag)
        if m: subs.add('#' + m.group(1))
        m = re.search(r'\bclass="([^"]+)"', tag)
        if m:
            for c in m.group(1).split(): subs.add('.' + c)
    return subs

def display_forced(css, subject):
    """A BARE-subject author rule (selector == subject exactly, no descendant scope)
    setting display to a VISIBLE value defeats the UA [hidden]{display:none} for
    EVERY element carrying it. A scoped rule (`.X .subject{…}`) only forces the
    scoped elements, so we don't chase it here — the known bug class is bare."""
    for m in re.finditer(r'([^{}]+)\{([^}]*)\}', css):
        if not re.search(r'display\s*:\s*(flex|inline-flex|grid|block|inline-block)\b', m.group(2)):
            continue
        for sel in m.group(1).split(','):
            if sel.strip() == subject:
                return True
    return False

def has_hidden_guard(css, subject):
    return re.search(re.escape(subject) + r'\[hidden\]\s*\{[^}]*display\s*:\s*none', css) is not None

# ── A · [hidden]-guard contract — the render gates cannot see this (MUTATION-PROVEN)
# CSS comments can carry literal braces (e.g. a comment mentioning [hidden]{display:none}),
# which would confuse the brace-based rule parser — strip them before cascade analysis.
CSS = re.sub(r'/\*.*?\*/', ' ', station, flags=re.S)
subs = hidden_subjects(station)
forced = sorted(s for s in subs if display_forced(CSS, s))
check('.cbg-seg' in forced,   "fixture: .cbg-seg is a display-forced hidden subject")
check('.cbg-modal' in forced, "fixture: .cbg-modal is a display-forced hidden subject")
for s in forced:
    check(has_hidden_guard(CSS, s),
          f"hidden element {s} is display-forced but has no {s}[hidden] display:none guard "
          f"(it will show on load, like the modal/stageSeg bug)")
# FIRE: strip the .cbg-seg guard → the check above must be able to catch it
_mut = re.sub(r'\.cbg-seg\[hidden\]\s*\{[^}]*\}', '', CSS, count=1)
check(not has_hidden_guard(_mut, '.cbg-seg'), "MUTATION: a removed [hidden] guard is detectable")

# ── B · every JS mount id resolves to an id in the file
# (both static id="…" markup AND ids created dynamically as id='…' in JS strings)
ids_present = set(re.findall(r'\bid=["\']([^"\']+)["\']', station))
mount_ids = set(re.findall(r'getElementById\("([^"]+)"\)', station))
check(len(mount_ids) > 10, "fixture: found the station's mount ids")
for mid in sorted(mount_ids):
    check(mid in ids_present, f'getElementById("{mid}") has no matching id in the markup/JS')
# FIRE: rename a mount id everywhere it is declared → it no longer resolves
_mut2 = set(re.findall(r'\bid=["\']([^"\']+)["\']',
                       re.sub(r'id=(["\'])cbg-detail\1', r'id=\1cbg-detailX\1', station)))
check('cbg-detail' not in _mut2, "MUTATION: a renamed mount id is detectable")

# ── C · <script src>: assets resolve on disk; the two emitted data globals are referenced
srcs = re.findall(r'<script src="([^"]+)"', station)
for src in srcs:
    if src.startswith("assets/"):
        check((shell / src).is_file(), f'<script src="{src}"> does not resolve in the shell')
check("./c4-graph.js" in srcs, "station references the emitted ./c4-graph.js (window.GABE_C4)")
check("./sim.data.js" in srcs, "station references the emitted ./sim.data.js (window.GABE_SIM)")
check("assets/sim-panel.js" in srcs, "station loads the shared assets/sim-panel.js")

# ── D · shared GABE_SIM_PANEL contract, symmetric across both hosts
check("window.GABE_SIM_PANEL" in panel, "sim-panel.js defines window.GABE_SIM_PANEL")
_ret = re.search(r'return\s*\{([^}]*)\}', panel, re.S)
_ret = _ret.group(1) if _ret else ""
for key in ["openDetail", "openEntityDetail", "stageSummary", "resetPanel"]:
    check(key in _ret, f"sim-panel.js returns the {key} surface")
check("window.GABE_SIM_PANEL" in station and 'src="assets/sim-panel.js"' in station,
      "station wires the shared sim-panel.js")
check("window.GABE_SIM_PANEL" in lab and "../../assets/sim-panel.js" in lab,
      "the arch-graph lab wires the same shared sim-panel.js")
for key in ["openDetail", "openEntityDetail", "resetPanel"]:
    check(("PANEL." + key) in station, f"station calls PANEL.{key}")
    check(("PANEL." + key) in lab, f"lab calls PANEL.{key}")

# ── E · honest-empty contract: the station degrades when GABE_SIM is null
check("degradePanel" in station, "station has a degrade path (no change in flight)")
check(re.search(r'window\.GABE_SIM\s*\|\|\s*null', station) is not None,
      "station reads window.GABE_SIM defensively (|| null)")

print(f"codebase-graph battery: {pass_} passed, {fail} failed")
sys.exit(1 if fail else 0)
PY
