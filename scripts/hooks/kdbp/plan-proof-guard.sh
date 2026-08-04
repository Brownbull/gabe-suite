#!/usr/bin/env bash
# PLAN-PROOF-GUARD — PostToolUse hook for Write|Edit on .kdbp/PLAN.json / PLAN.md
# D7 (block lies, warn debts): a ✅ cell whose evidence does not exist is a LIE and is BLOCKED
# at every tier. Debts (thin coverage, un-walked, absent angles) are NEVER this hook's business.
# Checks (validates the WHOLE current PLAN.json state after the write — no diffing):
#   · cells.red  == done → the phase's `cases` record must exist; a `red@<sha>` must be reachable
#   · cells.review == done + a red@-bearing cases record → the record must carry a `green@<sha>`
#     (stamped at execute finish when the case-scoped verify passed — case-thread.py prints it)
#     and every cited green@<sha> must be reachable. Review ✅ claims the cases pass; a record
#     that never left red is a LIE and blocks. Records with skip:* or no red@ are exempt.
#   · cells.exec == done → every declared PROOF artifact path must exist on disk (proof:null passes)
#   · WARN (stdout, never blocks): cells.exec == done while cells.red is todo/in_progress —
#     red never ran for an executed phase. A debt, not a lie (D7).
#     Real proof lines use shorthand (globs, {a,b}.png braces, 01..06 ranges — ruling R2): a token
#     passes if the literal path exists, a brace-expanded glob matches, or its parent dir is
#     non-empty. An empty/missing evidence dir still blocks — that is the lie being caught.
#     A token with NO concrete path component (a bare *, ../../**) is never evidence — blocked.
# Exit 2 + stderr = blocking feedback to the model. Parse errors exit 0 (a malformed mirror is
# next.mjs's exit-2 concern, not a lie — never brick edits from a hook).
set -uo pipefail

[ -f ".kdbp/PLAN.json" ] || exit 0
input=$(cat)

# Only fire when the WRITE targeted the plan (path check inside the script keeps the matcher broad)
fp=$(printf '%s' "$input" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*:[[:space:]]*"//;s/"$//')
case "$fp" in
  *".kdbp/PLAN.json"|*".kdbp/PLAN.md") ;;
  *) exit 0 ;;
esac

# The guard's whole job is blocking — an invisible no-op would fail open silently.
if ! command -v python3 >/dev/null 2>&1; then
  echo "[WARN] plan-proof-guard INERT: python3 not on PATH — PLAN honesty checks were NOT run" >&2
  exit 0
fi

viol=$(python3 - <<'PY' 2>/dev/null
import collections, glob as globmod, json, os, re, subprocess, sys

MAX_BRACE = 256  # expansion cap — a runaway brace product must not hang past the hook timeout

def brace_expand(tok):
    # FIFO (breadth-first): on a cap-trip the leftovers are evenly partially-expanded, so
    # their brace-free prefixes are deep enough for a fair per-candidate parent probe
    done, work = [], collections.deque([tok])
    while work and len(done) + len(work) <= MAX_BRACE:
        t = work.popleft()
        m = re.search(r"\{([^{}]*)\}", t)
        if not m:
            done.append(t)
            continue
        head, tail = t[: m.start()], t[m.end():]
        work.extend(head + part + tail for part in m.group(1).split(","))
    return done + list(work)  # cap hit → partial expansion; prefixes still probeable

def concrete_parent(tok):
    # deepest brace/glob-free leading directory of THIS candidate
    prefix = re.split(r"[*?\[\]{]", tok)[0]
    parent = prefix if prefix.endswith("/") else os.path.dirname(prefix)
    return parent.rstrip("/")

def evidence_exists(tok):
    # R2: literal path → brace-expanded glob → non-empty parent dir (human shorthand tolerated;
    # a missing or empty evidence dir still fails). Two rules keep the leniency honest:
    #  · a token with no concrete path component (bare */**/{,}) is never evidence;
    #  · the parent probe is PER-CANDIDATE — a mid-path brace whose alternatives don't exist
    #    must NOT pass off an unrelated shared ancestor (docs/{a,b}/x.png needs docs/a or
    #    docs/b to be real, not merely a non-empty docs/).
    if os.path.exists(tok):
        return True
    if not re.sub(r"[*?\[\]{},]|\.\.|/|\.", "", tok).strip():
        return False
    magic_in_dir = bool(re.search(r"[*?\[\]{]", tok.rpartition("/")[0]))
    for cand in brace_expand(tok):
        if "{" in cand:  # cap leftover — probe its (now deeper) brace-free parent
            p = concrete_parent(cand)
            if p and os.path.isdir(p) and os.listdir(p):
                return True
        elif globmod.glob(cand):
            return True
        elif magic_in_dir:
            # fully-expanded candidate with a concrete dir: its OWN parent may vouch for it
            p = os.path.dirname(cand)
            if p and not re.search(r"[*?\[\]]", p) and os.path.isdir(p) and os.listdir(p):
                return True
    if magic_in_dir:
        return False  # no alternative's own directory is real — ancestors prove nothing
    parent = tok.rpartition("/")[0]
    return bool(parent) and os.path.isdir(parent) and bool(os.listdir(parent))

try:
    plan = json.load(open(".kdbp/PLAN.json"))
except Exception:
    sys.exit(0)  # malformed mirror = not a lie; other tooling reports it
out = []
warns = []  # debts — printed with a WARN| prefix, split off in bash, never block
legacy_review = []  # aggregated: one line per PLAN, not per phase (34-line firehose = warn-blindness)
sha_cache = {}  # dedupe: verify each distinct sha once (a 5k-phase plan must not fork 5k gits)
def sha_reachable(sha):
    if sha not in sha_cache:
        if len(sha_cache) >= 200:  # pathological plan — stop forking, past-cap shas pass
            return True
        r = subprocess.run(["git", "cat-file", "-e", sha + "^{commit}"], capture_output=True)
        sha_cache[sha] = (r.returncode == 0)
    return sha_cache[sha]

for ph in plan.get("phases", []) or []:
    pid = str(ph.get("id", "?")); c = ph.get("cells") or {}
    # --- red ✅ without its record / with an unreachable red commit ---
    if c.get("red") == "done":
        cases = (ph.get("cases") or "").strip()
        if not cases:
            out.append(f"phase {pid}: Red ✅ but no `cases` record (PLAN.json phases[].cases — written by /gabe-red)")
        else:
            shas = re.findall(r"red@([0-9a-f]{7,40})", cases)
            for sha in shas:
                if not sha_reachable(sha):
                    out.append(f"phase {pid}: Red ✅ cites red@{sha} but that commit is unreachable")
            # a record that DECLARES failing work (NEW/BUMP) but cites no red commit is
            # record-shaped, not evidence-shaped — guard-only and skip:* records are exempt
            if not shas and "skip:" not in cases and re.search(r"\b(NEW|BUMP)\b", cases):
                out.append(f"phase {pid}: Red ✅ declares NEW/BUMP cases but cites no red@<sha> — a red claimed without its commit is record-less (run /gabe-red; the checkpoint commit carries the proof)")
    # --- review ✅ must leave its record (option B, ruling 2026-08-04) ---
    # present-but-false blocks (lie); absent warns (legacy debt — plans ticked pre-record)
    if c.get("review") == "done":
        rv = (ph.get("review") or "").strip()
        if rv:
            m = re.match(r"^([A-Z]+)@([0-9a-f]{7,40})\s+findings:(\d+)\s+triaged:(\d+)$", rv)
            if not m:
                out.append(f"phase {pid}: Review ✅ but the review record is malformed: {rv!r} (want `<VERDICT>@<sha> findings:<n> triaged:<n>`)")
            else:
                if not sha_reachable(m.group(2)):
                    out.append(f"phase {pid}: Review ✅ cites {m.group(1)}@{m.group(2)} but that commit is unreachable")
                if int(m.group(4)) < int(m.group(3)):
                    out.append(f"phase {pid}: Review ✅ with untriaged findings — findings:{m.group(3)} triaged:{m.group(4)} (every finding gets fix/defer/dismiss)")
        else:
            legacy_review.append(pid)
    # --- review ✅ on a red-beat phase whose cases never went green ---
    if c.get("review") == "done":
        cases = (ph.get("cases") or "").strip()
        if cases and "red@" in cases and "skip:" not in cases:
            greens = re.findall(r"green@([0-9a-f]{7,40})", cases)
            if not greens:
                out.append(f"phase {pid}: Review ✅ but the Cases record never left red — no green@<sha> "
                           "(execute stamps it when the case-scoped verify passes; case-thread.py --assert-green prints it)")
            else:
                for sha in greens:
                    if not sha_reachable(sha):
                        out.append(f"phase {pid}: Review ✅ cites green@{sha} but that commit is unreachable")
    # --- exec ✅ while red still owed — a debt, warned on stdout, never blocked ---
    if c.get("exec") == "done" and c.get("red") in ("todo", "in_progress"):
        warns.append(f"phase {pid}: Exec ✅ while Red ⬜ — red never ran for this phase (debt; /gabe-red or an enumerated skip closes it)")
    # --- exec ✅ with a declared proof whose artifact is missing on disk ---
    if c.get("exec") == "done":
        proof = ph.get("proof")
        if isinstance(proof, str) and "→" in proof:
            for seg in proof.split(" · "):
                parts = [p.strip() for p in seg.split("→")]
                if len(parts) >= 3 and parts[0].upper().startswith("PROOF"):
                    # strip a trailing "(3 shots)"-style annotation; keep paths with spaces intact
                    path = re.sub(r"\s*\([^)]*\)\s*$", "", parts[-1]).strip()
                    if path and not evidence_exists(path):
                        out.append(f"phase {pid}: Exec ✅ but declared proof artifact missing on disk: {path}")
if legacy_review:
    shown = ", ".join(legacy_review[:6]) + (f" (+{len(legacy_review)-6} more)" if len(legacy_review) > 6 else "")
    warns.append(f"{len(legacy_review)} phase(s) Review ✅ without a review record — legacy debt until /gabe-review 1.10.0 adoption (phases: {shown})")
print("\n".join(["WARN|" + w for w in warns] + out))
PY
)

# split debts (WARN|) from lies — debts surface on stdout and never block (D7)
warn_lines=$(printf '%s\n' "${viol:-}" | grep '^WARN|' | sed 's/^WARN|/[WARN] plan-proof-guard: /' || true)
viol=$(printf '%s\n' "${viol:-}" | grep -v '^WARN|' | grep -v '^$' || true)
[ -n "$warn_lines" ] && echo "$warn_lines"

if [ -n "${viol:-}" ]; then
  {
    echo "⛔ PLAN-PROOF-GUARD blocked this PLAN write (D7 — a ✅ without its evidence is a lie):"
    echo "$viol"
    echo "Fix: re-run the phase's proof step and land the artifact at the printed path, OR re-point red@<sha> in the Cases record to a reachable red commit (.kdbp/PLAN.md Phase Details + PLAN.json phases[].cases), OR set that phase's cells.red/cells.exec back to its honest state in BOTH mirrors. Debts warn; lies block."
  } >&2
  exit 2
fi
exit 0
