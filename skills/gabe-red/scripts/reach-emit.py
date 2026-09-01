#!/usr/bin/env python3
"""reach-emit — red's Reach record + map-delta emit in ONE deterministic run.

Runs the two-arm graft query (callers UNION word-boundary grep) for each subject
symbol, prints the Reach line for the record, AND auto-emits the arm-difference as
map-delta lines. One command, so the "notice the divergence + remember to append"
discretion the audit flagged (axis 2, the 0-for-19 failure class) disappears — the
gated Reach record can no longer be produced without the emit.

  reach-emit.py <sym>... [--dir REPO] [--dry-run]
  reach-emit.py <sym> --callers-json F --grep-json F [--dir REPO]   # test injection

The delta per symbol = grep_files − caller_files − def_files, after a build-output /
vendored / generated noise filter and a source-extension gate. grep is queried with
a \\b<sym>\\b word boundary so a short name never matches inside a longer identifier
(measured on gustify: `_auth` 60 substring hits collapse to 1 real caller edge). A
grep-found reference graft's index did NOT return is a missed caller → gen
`_a3_graft.calls`. Emit goes through the ONE validated writer (map-deltas.py append,
sibling skill), so the delta schema has a single source of truth.

No graft index → prints `no index`, emits nothing, exit 0. --dry-run prints the
deltas instead of appending (safe preview; used to validate against a twin read-only).

Exit: 0 for any normal run (report-never-gate) · 1 = usage error.
"""
import sys, os, re, json, subprocess

SRC_EXT = (".py", ".ts", ".tsx", ".js", ".jsx", ".mjs")
_EXCL_DIR = re.compile(
    r'(^|/)(node_modules|dist|build|storybook-static|_archive|\.venv|venv|'
    r'__pycache__|coverage|\.next|site-packages)/|(^|/)docs/site/center/')
_EXCL_BASE = re.compile(r'(\.min\.(js|css)|\.bundle\.js|-[A-Za-z0-9]{6,}\.js)$')
_MAP_DELTAS = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           "..", "..", "gabe-commit", "scripts", "map-deltas.py")
CAP = 20  # per-symbol delta cap; excess is LOGGED, never silently dropped


def _noise(p):
    return bool(_EXCL_DIR.search(p)) or bool(_EXCL_BASE.search(os.path.basename(p))) \
        or not p.endswith(SRC_EXT)


def _run(cmd, repo):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, cwd=repo)
        return r.stdout if r.returncode == 0 else None
    except Exception:
        return None


def _short_head(repo):
    out = _run(["git", "rev-parse", "--short", "HEAD"], repo)
    return out.strip() if out else "?"


def _parse(callers_json, grep_json):
    """→ (caller_files set, def_files set, grep_files {path: first-line})."""
    callers, defs, grep = set(), set(), {}
    try:
        for m in (json.loads(callers_json) if callers_json else {}).get("matches", []):
            if m.get("symbol"):
                defs.add(m["symbol"]["path"])
            for h in m.get("hits", []):
                if h.get("path"):
                    callers.add(h["path"])
    except Exception:
        pass
    try:
        for g in (json.loads(grep_json) if grep_json else {}).get("groups", []):
            p, hits = g.get("path"), (g.get("hits") or [])
            if p and hits and p not in grep:
                grep[p] = hits[0].get("line", 0)
    except Exception:
        pass
    return callers, defs, grep


def _emit(sym, path, line, repo, dry):
    found = "%s:%s" % (path, line)
    if dry:
        print("  DELTA %s  %s  (gen _a3_graft.calls)" % (sym, found))
        return
    subprocess.run([sys.executable, _MAP_DELTAS, "append",
                    "--type", "add", "--gen", "_a3_graft.calls", "--cmd", "red",
                    "--subject", "callers(%s)" % sym, "--found", found, "--pointer", found],
                   cwd=repo)


def process(sym, repo, callers_json, grep_json, dry):
    """Return (reach_files sorted, emitted_count) and emit deltas as a side effect."""
    callers, defs, grep = _parse(callers_json, grep_json)
    reach = sorted(f for f in (callers | defs | set(grep)) if not _noise(f))
    delta = sorted(p for p in grep if p not in callers and p not in defs and not _noise(p))
    for p in delta[:CAP]:
        _emit(sym, p, grep[p], repo, dry)
    if len(delta) > CAP:
        print("  note: %s — %d delta files, capped at %d (%d suppressed)"
              % (sym, len(delta), CAP, len(delta) - CAP))
    return reach, min(len(delta), CAP)


def _print_reach(files, repo):
    sha = _short_head(repo)
    body = " · ".join(files) if files else "—"
    print("- **Reach:** %s (graft@%s)" % (body, sha))


def main():
    args = sys.argv[1:]
    dry, dir_, cj, gj, syms = False, ".", None, None, []
    i = 0
    while i < len(args):
        a = args[i]
        if a == "--dir":
            i += 1; dir_ = args[i] if i < len(args) else "."
        elif a == "--dry-run":
            dry = True
        elif a == "--callers-json":
            i += 1; cj = args[i] if i < len(args) else None
        elif a == "--grep-json":
            i += 1; gj = args[i] if i < len(args) else None
        elif a.startswith("--"):
            sys.stderr.write("reach-emit: unknown flag %s\n" % a); return 1
        else:
            syms.append(a)
        i += 1
    if not syms:
        sys.stderr.write("reach-emit: need at least one <symbol>\n"); return 1
    repo = os.path.abspath(dir_)

    # test-injection mode: one symbol, JSON supplied from files (no graft run)
    if cj is not None or gj is not None:
        cjson = open(cj).read() if cj else "{}"
        gjson = open(gj).read() if gj else "{}"
        reach, n = process(syms[0], repo, cjson, gjson, dry)
        _print_reach(reach, repo)
        print("  emitted %d delta(s)%s" % (n, " (dry-run)" if dry else ""))
        return 0

    if not os.path.isdir(os.path.join(repo, "graft")):
        print("no index")
        return 0

    all_reach, total = set(), 0
    for s in syms:
        cjson = _run(["graft", "callers", s, ".", "--json", "--no-refresh"], repo)
        gjson = _run(["graft", "grep", r"\b%s\b" % s, ".", "--json", "--no-refresh"], repo)
        reach, n = process(s, repo, cjson, gjson, dry)
        all_reach.update(reach); total += n
    _print_reach(sorted(all_reach), repo)
    print("  emitted %d delta(s)%s" % (total, " (dry-run)" if dry else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
