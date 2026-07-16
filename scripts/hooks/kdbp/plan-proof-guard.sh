#!/usr/bin/env bash
# PLAN-PROOF-GUARD — PostToolUse hook for Write|Edit on .kdbp/PLAN.json / PLAN.md
# D7 (block lies, warn debts): a ✅ cell whose evidence does not exist is a LIE and is BLOCKED
# at every tier. Debts (thin coverage, un-walked, absent angles) are NEVER this hook's business.
# Checks (validates the WHOLE current PLAN.json state after the write — no diffing):
#   · cells.red  == done → the phase's `cases` record must exist; a `red@<sha>` must be reachable
#   · cells.exec == done → every declared PROOF artifact path must exist on disk (proof:null passes)
#     Real proof lines use shorthand (globs, {a,b}.png braces, 01..06 ranges — ruling R2): a token
#     passes if the literal path exists, a brace-expanded glob matches, or its parent dir is
#     non-empty. An empty/missing evidence dir still blocks — that is the lie being caught.
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

viol=$(python3 - <<'PY' 2>/dev/null
import glob as globmod, itertools, json, os, re, subprocess, sys

def brace_expand(tok):
    m = re.search(r"\{([^{}]*)\}", tok)
    if not m:
        return [tok]
    head, tail = tok[: m.start()], tok[m.end():]
    return [v for part in m.group(1).split(",") for v in brace_expand(head + part + tail)]

def evidence_exists(tok):
    # R2: literal path → brace-expanded glob → non-empty parent dir (human shorthand tolerated;
    # a missing or empty evidence dir still fails)
    if os.path.exists(tok):
        return True
    for cand in brace_expand(tok):
        if globmod.glob(cand):
            return True
    parent = os.path.dirname(tok)
    return bool(parent) and os.path.isdir(parent) and bool(os.listdir(parent))

try:
    plan = json.load(open(".kdbp/PLAN.json"))
except Exception:
    sys.exit(0)  # malformed mirror = not a lie; other tooling reports it
out = []
for ph in plan.get("phases", []) or []:
    pid = str(ph.get("id", "?")); c = ph.get("cells") or {}
    # --- red ✅ without its record / with an unreachable red commit ---
    if c.get("red") == "done":
        cases = (ph.get("cases") or "").strip()
        if not cases:
            out.append(f"phase {pid}: Red ✅ but no `cases` record (PLAN.json phases[].cases — written by /gabe-red)")
        else:
            for sha in re.findall(r"red@([0-9a-f]{7,40})", cases):
                r = subprocess.run(["git", "cat-file", "-e", sha + "^{commit}"],
                                   capture_output=True)
                if r.returncode != 0:
                    out.append(f"phase {pid}: Red ✅ cites red@{sha} but that commit is unreachable")
    # --- exec ✅ with a declared proof whose artifact is missing on disk ---
    if c.get("exec") == "done":
        proof = ph.get("proof")
        if isinstance(proof, str) and "→" in proof:
            for seg in proof.split(" · "):
                parts = [p.strip() for p in seg.split("→")]
                if len(parts) >= 3 and parts[0].upper().startswith("PROOF"):
                    path = parts[-1].split()[0].strip()
                    if path and not evidence_exists(path):
                        out.append(f"phase {pid}: Exec ✅ but declared proof artifact missing on disk: {path}")
print("\n".join(out))
PY
)

if [ -n "${viol:-}" ]; then
  {
    echo "⛔ PLAN-PROOF-GUARD blocked this PLAN write (D7 — a ✅ without its evidence is a lie):"
    echo "$viol"
    echo "Fix: restore the evidence (re-run and land the artifact / re-point red@sha), or set the cell back to its honest state. Debts warn; lies block."
  } >&2
  exit 2
fi
exit 0
