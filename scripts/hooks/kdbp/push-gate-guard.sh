#!/usr/bin/env bash
# PUSH-GATE-GUARD — PreToolUse hook for Bash (terminal-env promotion guard)
# Ruling 2026-08-07, after the observed bypass: 49 commits promoted to production main via raw
# `git push origin origin/staging:main` — the scan ran, but the mandated proceed/hold ask was
# never asked and three gate fixes shipped sight-unseen. Spec prose alone did not hold (the
# same cycle's TASK CONTRACT went 0-for-19), so the terminal push fails CLOSED here instead.
#
# SECURITY POSTURE — fail closed on ambiguity. A gate that parses a command string cannot
# out-parse bash, so it does NOT try: any `git push` that this hook cannot PROVE targets only a
# non-terminal branch REQUIRES the marker. Every parser gap (glued operators, --all/--mirror,
# unknown global value-flags, repo redirection, glob refspecs, an unlocatable push verb) becomes
# a safe block, not a bypass. Clean feature pushes still resolve and stay silent.
# (The command-string layer is the fast advisory; a git-native pre-push hook that sees promotions,
#  wrappers, aliases and IDE pushes with zero parsing is the logged deeper follow-up — backlog.)
#
# Behavior:
#   · Fires only in KDBP projects with a MULTI-env .kdbp/PUSH.md (single-env gating is OFF by
#     ruling 2026-07-31). Only the DEFAULT env's terminal branch is gated (a mis-wired topology
#     where several envs read as terminal must not block ordinary staging pushes).
#   · A `git push` this hook cannot prove is non-terminal-only is BLOCKED unless /gabe-push wrote a
#     marker whose recorded HEAD sha equals the current HEAD (the scan ran against THIS tree — any
#     commit since invalidates it; content, never mtime, so it is portable and clone-safe).
#   · Emergency escape: `GABE_PUSH_EMERGENCY=1` in the command — allowed with a loud warning.
#   · INERT (allow + loud warn) ONLY when a TOOL is missing (python3), never on push ambiguity.
# Exit 2 + stderr = blocking feedback. Battery: tests/hooks/run.sh (FIRE and SILENT both proven).
set -uo pipefail

[ -f ".kdbp/PUSH.md" ] || exit 0
input=$(cat)

# Cheap bash-side prefilter: the ~99% of Bash calls that are not pushes never pay a python boot.
# A quoted decoy mentioning "push" slips through to python, which then decides correctly.
case "$input" in *push*) ;; *) exit 0 ;; esac

if ! command -v python3 >/dev/null 2>&1; then
  echo "[WARN] push-gate-guard INERT: python3 not on PATH — terminal-env push gating was NOT enforced"
  exit 0
fi

MARKER=".kdbp/.push-gate-ok"

verdict=$(GABE_HOOK_INPUT="$input" python3 - <<'PY' 2>/dev/null
import json, os, re, shlex, subprocess, sys

def out(v): print(v); sys.exit(0)

try:
    cmd = json.loads(os.environ.get("GABE_HOOK_INPUT", "{}")).get("tool_input", {}).get("command", "")
except Exception:
    out("ALLOW")
if not cmd or "push" not in cmd or "git" not in cmd:
    out("ALLOW")
if "GABE_PUSH_EMERGENCY=1" in cmd:
    out("EMERGENCY")

def git(args):
    try:
        r = subprocess.run(["git"] + args, capture_output=True, text=True, timeout=10)
        return r.stdout.strip() if r.returncode == 0 else ""
    except Exception:
        return ""

# ── PUSH.md → env table + default_env (comments stripped: the template ships an example env
#    inside <!-- --> that must never count as declared). Two real shapes are parsed — template
#    table rows (`| target_branch | main |`) and plain key lines (`target_branch: main`) — and
#    the key cell is de-decorated (bold **k**, `backtick`, spaces) because the file is
#    hand-editable and markdown tables get prettified. A file that declares env headings but
#    yields no target_branch is INERT (loud), never a silent ALLOW. ──────────────────────────
try:
    raw = open(".kdbp/PUSH.md", encoding="utf-8").read()
except Exception:
    out("INERT")
raw = re.sub(r"<!--.*?-->", "", raw, flags=re.S)

def clean_key(k):
    return k.strip().strip("*").strip("`").strip()

def field(block, key):
    for line in block.splitlines():
        m = re.match(r"\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|", line)
        if m and clean_key(m.group(1)) == key:
            return m.group(2).strip()
        m = re.match(r"\s*([^:|]+?)\s*:\s*(.+?)\s*$", line)
        if m and clean_key(m.group(1)) == key:
            return m.group(2).strip()
    return None

def default_env(text):
    # de-decorate the key the same way field()/clean_key() do — a prettified
    # `| **default_env** | staging |` row must not fall silently to "production"
    for line in text.splitlines():
        m = re.match(r"\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|", line)
        if m and clean_key(m.group(1)) == "default_env":
            return m.group(2).strip()
        m = re.match(r"\s*([^:|]+?)\s*:\s*(.+?)\s*$", line)
        if m and clean_key(m.group(1)) == "default_env":
            return m.group(2).strip()
    return "production"

heading_blocks = re.split(r"^###\s+", raw, flags=re.M)[1:]
envs = []  # (name, target_branch, promote_from)
for block in heading_blocks:
    name = block.splitlines()[0].strip()
    tb = field(block, "target_branch")
    pf = field(block, "promote_from")
    if tb:
        envs.append((name, tb, pf or ""))

if heading_blocks and not envs:
    out("INERT")               # declared env headings but none parsed — never a silent ALLOW
if len(envs) < 2:
    out("ALLOW")               # single env: gating OFF (ruling 2026-07-31)

sources = {pf for _, _, pf in envs if pf and pf.lower() not in ("—", "-", "", "null", "none")}
terminal = {tb for name, tb, _ in envs if tb not in sources}
if not terminal:
    out("ALLOW")               # cyclic/odd config — not this guard's call
# A mis-wired topology reads several envs as terminal (the template's example second env,
# uncommented without wiring production.promote_from). Gate only the DEFAULT env's branch so
# ordinary staging pushes stay free; keep the whole set only when the default is not terminal.
if len(terminal) > 1:
    de = default_env(raw)
    de_tb = next((tb for name, tb, _ in envs if name == de), None)
    if de_tb in terminal:
        terminal = {de_tb}

# ── command → push destinations, fail-closed on anything unprovable ─────────────────────────
REDIRECT = ("-C", "--git-dir", "--work-tree", "--namespace", "--exec-path", "--config-env")
VALUE_FLAGS = {"-o", "--push-option", "--receive-pack", "--exec", "--repo", "-C", "-c",
               "--git-dir", "--work-tree", "--namespace", "--exec-path", "--config-env"}
GLUE = ("&&", "||", ";", "|", "`", "$(", "\n")

try:
    toks = shlex.split(cmd)
except ValueError:
    out("REQUIRE unparseable")  # unbalanced quoting on a push-shaped command → fail closed

def resolve_current():
    up = git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"])
    if up and "/" in up:
        return up.split("/", 1)[1]     # remote-tracking → its branch
    return git(["rev-parse", "--abbrev-ref", "HEAD"]) or None

i = 0
while i < len(toks):
    if toks[i] != "git":
        i += 1
        continue
    # any global redirect flag means our cwd/PUSH.md may be the wrong repo → cannot prove safe
    seg_has_redirect = False
    j = i + 1
    while j < len(toks) and toks[j].startswith("-"):
        t = toks[j]
        if t in REDIRECT or t.startswith(tuple(r + "=" for r in REDIRECT)):
            seg_has_redirect = True
        j += 2 if (t in VALUE_FLAGS and not t.endswith("=") and "=" not in t) else 1
    if j >= len(toks) or toks[j] != "push":
        # a `git` whose subcommand we could not locate as `push` (an unknown value-flag ate it,
        # or it is `git log`/etc). If the whole command still mentions push, fail closed.
        i = j
        continue
    if seg_has_redirect:
        out("REQUIRE repo-redirect")
    # collect this push's segment up to a shell operator
    seg, k = [], j + 1
    while k < len(toks):
        if any(g in toks[k] for g in GLUE):
            out("REQUIRE shell-glue")   # operator glued to a token → parse cannot be trusted
        seg.append(toks[k]); k += 1
    if any(f in seg for f in ("--all", "--mirror", "--tags")):
        out("REQUIRE push-all")         # updates branches wholesale, main among them
    deleting = ("--delete" in seg) or ("-d" in seg)
    pos, s = [], 0
    while s < len(seg):
        t = seg[s]
        if t.startswith("-"):
            s += 2 if (t in VALUE_FLAGS and "=" not in t) else 1
            continue
        pos.append(t); s += 1
    refspecs = pos[1:]  # pos[0] = remote
    dests = []
    if not refspecs:
        cur = resolve_current()
        if not cur:
            out("REQUIRE unknown-branch")
        dests = [cur]
    else:
        for r in refspecs:
            d = r.split(":", 1)[1] if ":" in r else r
            d = re.sub(r"^\+", "", d).replace("refs/heads/", "")
            if d in ("HEAD", "@", ""):
                cur = resolve_current()
                if not cur:
                    out("REQUIRE unknown-branch")
                d = cur
            if re.search(r"[*?\[]", d):
                out("REQUIRE glob-refspec")  # `refs/heads/*` — can't prove it misses terminal
            dests.append(d)
    hit = sorted(set(d for d in dests if d in terminal))
    if hit:
        verb = "delete of" if deleting else "push to"
        out("REQUIRE " + verb + " " + " ".join(hit))
    i = k

out("ALLOW")
PY
)
rc=$?

if [ "$rc" -ne 0 ] || [ -z "${verdict:-}" ]; then
  echo "[WARN] push-gate-guard INERT: the guard could not run to a verdict — terminal-env push gating was NOT enforced on this call"
  exit 0
fi

case "$verdict" in
  ALLOW) exit 0 ;;
  INERT)
    echo "[WARN] push-gate-guard INERT: .kdbp/PUSH.md declares env headings but none parsed — terminal-env push gating was NOT enforced. Fix the env table (target_branch rows) or run /gabe-push --reconfigure."
    exit 0 ;;
  EMERGENCY)
    echo "[WARN] push-gate-guard: GABE_PUSH_EMERGENCY=1 — terminal-env push allowed WITHOUT the production gate. This bypass rides its own commit history; expect /gabe-review to flag it."
    exit 0 ;;
  REQUIRE*)
    reason=${verdict#REQUIRE }
    head=$(git rev-parse HEAD 2>/dev/null || true)
    if [ -f "$MARKER" ] && [ -n "$head" ]; then
      read -r m_sha _rest < "$MARKER" 2>/dev/null || m_sha=""
      if [ "$m_sha" = "$head" ]; then
        echo "push-gate: marker honored (HEAD ${head:0:8}) — this push was authorized by /gabe-push"
        exit 0
      fi
    fi
    {
      echo "⛔ PUSH-GATE-GUARD blocked this push (${reason})."
      echo "The production gate has not run for THIS tree: no .kdbp/.push-gate-ok whose recorded HEAD matches $(printf %.8s "${head:-?}") (the marker is written by /gabe-push Step 3.5 ONLY after the /gabe-health findings are presented and the operator answers the ONE proceed/hold question; any commit since re-arms the gate)."
      echo "Fix: run /gabe-push <terminal-env> — it runs the scan, asks, writes the sha-bound marker, and performs this push itself."
      echo "Emergency only: prefix the push with GABE_PUSH_EMERGENCY=1 — allowed with a loud warning, reviewable after the fact."
    } >&2
    exit 2 ;;
  *) exit 0 ;;
esac
