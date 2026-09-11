#!/usr/bin/env python3
"""Fill the assembled station with the gustify example values + rehome assets → the committed
example page (templates/center/shell/example/codebase-graph-station/gabe-universe.html).
Run AFTER assemble.py; ./c4-graph.js + ./levels.js stay page-relative (they live in the example dir)."""
import io, os, re, sys
D = os.path.dirname(os.path.abspath(__file__))
# RETIRED 2026-09-03 (operator ruling): the page is no longer assembled from parts/ — the TEMPLATE is the source
# of record (edited directly; build_center_a3.py ships it to every project). fill-example only REHOMES it.
SRC = os.path.abspath(os.path.join(D, "..", "..", "..", "..", "templates", "center", "shell", "gabe-universe.html"))
DST = os.path.normpath(os.path.join(D, "..", "..", "..", "..", "templates", "center", "shell",
                                    "example", "codebase-graph-station", "gabe-universe.html"))
t = io.open(SRC, encoding="utf-8").read()
FILL = {
    "{{LANG}}": "en",
    "{{PROJECT_NAME}}": "Gustify",
    "{{ENTITY_COUNT}}": "8",
    "{{TESTS_COUNT}}": "2031",
    "{{SIDEBAR_ENTITIES}}": "",
    "{{SIDEBAR_FE}}": "",           # the frontend entities' nav block — a LATE pass in build_center_a3 fills it; honest-empty here (review 2026-09-10: the token arrived with f8de670 and this fill did not know it)
    "{{SIDEBAR_LEAF}}": "",
    "{{SIDEBAR_CODE}}": ('<a class="navitem" href="architecture.html"><svg viewBox="0 0 24 24" fill="none" '
                         'stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>'
                         ' Architecture</a>'),
    "{{REGEN_STAMP}}": "dev",
    "{{HEAD_SHA}}": "devsha0",
    "{{GENERATOR_NAME}}": "build_center_a3.py",
    "{{STATUS_PILLS}}": '<span class="pill">repo · 2,031 tests · 0 failed</span>',
}
# every token the TEMPLATE carries must be in FILL — a new token is NAMED here, not asserted away below
_missing = sorted(set(re.findall(r"\{\{[A-Z_]+\}\}", t)) - set(FILL))
assert not _missing, "fill-example.py does not know these template tokens (add them to FILL): " + ", ".join(_missing)
for k, v in FILL.items():
    t = t.replace(k, v)
t = t.replace('src="assets/gabe-icon.png"', 'src="../../assets/gabe-icon.png"')
t = t.replace('src="./assets/3d-bundle.js"', 'src="../../assets/3d-bundle.js"')
t = t.replace('src="./assets/chip-assets.js"', 'src="../../assets/chip-assets.js"')
assert "{{" not in t, "unfilled token survived"
if "--out" in sys.argv:                          # write elsewhere (the template↔example parity assert in tests/gabe-universe)
    DST = sys.argv[sys.argv.index("--out") + 1]
io.open(DST, "w", encoding="utf-8").write(t)
print("wrote", DST, ":", len(t), "bytes")
