#!/usr/bin/env bash
# PUSH-GATE-GUARD — PreToolUse hook for Bash (terminal-env promotion guard)
# Ruling 2026-08-07, after the observed bypass: 49 commits promoted to production main via raw
# `git push origin origin/staging:main` — the scan ran, but the mandated proceed/hold ask was
# never asked and three gate fixes shipped sight-unseen. Spec prose alone did not hold (the
# same cycle's TASK CONTRACT went 0-for-19), so the terminal push fails CLOSED here instead.
#
# Behavior:
#   · Fires only in KDBP projects with a MULTI-env .kdbp/PUSH.md (single-env gating is OFF by
#     ruling 2026-07-31 — this hook stays silent there, matching push-spec Step 3.7).
#   · A `git push` whose destination resolves to a TERMINAL env's branch (no promote_from
#     chain continues past it) is BLOCKED unless /gabe-push wrote a fresh gate marker
#     (.kdbp/.push-gate-ok, younger than 30 min) after asking the ONE proceed/hold question.
#   · Emergency escape: include GABE_PUSH_EMERGENCY=1 in the command — allowed with a loud
#     warning on stdout; the bypass is visible, never silent.
#   · Parse trouble fails OPEN with a loud INERT warning — never brick pushes from a hook
#     (plan-proof-guard precedent: a guard that cannot run announces itself).
# Exit 2 + stderr = blocking feedback to the model. tests/hooks/run.sh carries the fixture
# battery (FIRE and SILENT both proven).
set -uo pipefail

[ -f ".kdbp/PUSH.md" ] || exit 0
input=$(cat)

if ! command -v python3 >/dev/null 2>&1; then
  echo "[WARN] push-gate-guard INERT: python3 not on PATH — terminal-env push gating was NOT enforced"
  exit 0
fi

MARKER=".kdbp/.push-gate-ok"
FRESH_SECS=1800

# NB: the hook JSON travels via env var — `python3 - <<heredoc` owns stdin for the script
# itself, so piping the input would hand python an empty stdin (measured: every BLOCK case
# fell to the fail-open path before this was caught by the battery).
verdict=$(GABE_HOOK_INPUT="$input" python3 - <<'PY' 2>/dev/null
import json, os, re, shlex, subprocess, sys

try:
    cmd = json.loads(os.environ.get("GABE_HOOK_INPUT", "{}")).get("tool_input", {}).get("command", "")
except Exception:
    print("ALLOW"); sys.exit(0)
if not cmd or "push" not in cmd or "git" not in cmd:
    print("ALLOW"); sys.exit(0)

# The escape hatch is checked on the RAW command: an operator typing it wants through,
# and a quoted decoy that merely mentions it costs one loud warning, never a block.
if "GABE_PUSH_EMERGENCY=1" in cmd:
    print("EMERGENCY"); sys.exit(0)

# ── PUSH.md → env table (comments stripped: the template ships an example env
#    inside <!-- --> that must never count as declared). Real files carry TWO
#    shapes — the template's table rows (`| target_branch | main |`, gastify) and
#    plain key lines (`target_branch: main`, gustify) — the dry-run against a
#    COPY of both twins' real files caught the table-only parse silently
#    ALLOWING gustify's promotion (meta-review P1: template-derived fixtures
#    validate the template, not reality). Parse both. ──────────────────────────
try:
    raw = open(".kdbp/PUSH.md", encoding="utf-8").read()
except Exception:
    print("INERT"); sys.exit(0)
raw = re.sub(r"<!--.*?-->", "", raw, flags=re.S)

def field(block, key):
    m = re.search(r"^\|\s*" + key + r"\s*\|\s*([^|]+?)\s*\|", block, flags=re.M)
    if not m:
        m = re.search(r"^\s*" + key + r"\s*:\s*(.+?)\s*$", block, flags=re.M)
    return m.group(1).strip() if m else None

envs = []  # (name, target_branch, promote_from)
for block in re.split(r"^###\s+", raw, flags=re.M)[1:]:
    name = block.splitlines()[0].strip()
    tb = field(block, "target_branch")
    pf = field(block, "promote_from")
    if tb:
        envs.append((name, tb, pf or ""))
if len(envs) < 2:
    print("ALLOW"); sys.exit(0)  # single env: gating OFF (ruling 2026-07-31)

sources = set()
for _, _, pf in envs:
    if pf and pf.lower() not in ("—", "-", "", "null", "none"):
        sources.add(pf)
terminal = {tb for name, tb, _ in envs if name not in sources and tb not in sources}
if not terminal:
    print("ALLOW"); sys.exit(0)  # cyclic/odd config — not this guard's call

# ── command → push destinations ─────────────────────────────────────────────
try:
    toks = shlex.split(cmd)
except ValueError:
    print("INERT"); sys.exit(0)  # unbalanced quoting — fail open, loudly (bash side)

VALUE_FLAGS = {"-o", "--push-option", "--receive-pack", "--exec", "--repo", "-C", "-c"}
dests, i = [], 0
while i < len(toks):
    if toks[i] == "git":
        j = i + 1
        while j < len(toks) and toks[j].startswith("-"):
            j += 2 if toks[j] in VALUE_FLAGS else 1
        if j < len(toks) and toks[j] == "push":
            seg, k = [], j + 1
            while k < len(toks) and toks[k] not in ("&&", "||", ";", "|", "|&"):
                seg.append(toks[k]); k += 1
            deleting = ("--delete" in seg) or ("-d" in seg)
            pos, s = [], 0
            while s < len(seg):
                t = seg[s]
                if t.startswith("-"):
                    s += 2 if t in VALUE_FLAGS else 1
                    continue
                pos.append(t); s += 1
            refspecs = pos[1:]  # pos[0] = remote
            if deleting:
                dests.extend(refspecs)
            elif refspecs:
                for r in refspecs:
                    d = r.split(":", 1)[1] if ":" in r else r
                    dests.append(re.sub(r"^\+", "", d).replace("refs/heads/", ""))
            else:
                # bare `git push` / `git push origin` → destination is the current branch
                try:
                    cur = subprocess.run(["git", "rev-parse", "--abbrev-ref", "HEAD"],
                                         capture_output=True, text=True).stdout.strip()
                    if cur:
                        dests.append(cur)
                except Exception:
                    pass
            i = k
            continue
    i += 1

hit = sorted(set(d for d in dests if d in terminal))
print("BLOCK " + " ".join(hit) if hit else "ALLOW")
PY
)
rc=$?

if [ "$rc" -ne 0 ] || [ -z "${verdict:-}" ] || [ "$verdict" = "INERT" ]; then
  echo "[WARN] push-gate-guard INERT: could not parse the command or PUSH.md — terminal-env push gating was NOT enforced on this call"
  exit 0
fi

case "$verdict" in
  ALLOW) exit 0 ;;
  EMERGENCY)
    echo "[WARN] push-gate-guard: GABE_PUSH_EMERGENCY=1 — terminal-env push allowed WITHOUT the production gate. This bypass is logged by its own commit history; expect /gabe-review to flag it."
    exit 0 ;;
  BLOCK*)
    branches=${verdict#BLOCK }
    if [ -f "$MARKER" ]; then
      now=$(date +%s); mt=$(stat -c %Y "$MARKER" 2>/dev/null || echo 0)
      age=$(( now - mt ))
      if [ "$age" -ge 0 ] && [ "$age" -lt "$FRESH_SECS" ]; then
        echo "push-gate: marker honored (${age}s old) — terminal push to [$branches] authorized by /gabe-push"
        exit 0
      fi
    fi
    {
      echo "⛔ PUSH-GATE-GUARD blocked this push (destination [$branches] is the TERMINAL env's branch)."
      echo "The production gate has not run for this push: no fresh .kdbp/.push-gate-ok marker (written by /gabe-push Step 3.7 ONLY after the findings are presented and the operator answers the ONE proceed/hold question; expires after 30 min)."
      echo "Fix: run /gabe-push <terminal-env> — it runs the /gabe-health scan, asks, writes the marker, and performs this push itself."
      echo "Emergency only: re-run with GABE_PUSH_EMERGENCY=1 prefixed — allowed with a loud warning, and reviewable after the fact."
    } >&2
    exit 2 ;;
  *) exit 0 ;;
esac
