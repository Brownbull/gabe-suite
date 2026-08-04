"""S8 evidence-debt angle — absent · below threshold · above threshold."""
import importlib.util, json, shutil, sys
from pathlib import Path

tmp = Path(sys.argv[1]); root = tmp / "proj"
wf = root / "docs/site/center/workflows"
spec = importlib.util.spec_from_file_location("ang", "skills/gabe-pulse/scripts/angles.py")
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

def census(n):
    return {"entity": "t", "workflows": {},
            "states": {f"s{i}": {"l": f"s{i}", "st": "ghost", "cap": "capture owed (run)"}
                       for i in range(n)}}

shutil.rmtree(wf, ignore_errors=True)
absent = m.s8_evidence(root, None, None)
wf.mkdir(parents=True)
(wf / "a.json").write_text(json.dumps(census(1)))
below = m.s8_evidence(root, None, None)
(wf / "a.json").write_text(json.dumps(census(9)))
above = m.s8_evidence(root, None, None)

ok = (isinstance(absent, m.Unavailable) and below is None
      and isinstance(above, tuple) and "/gabe-cc-update" in above[1])
print("S8OK" if ok else f"S8BAD absent={absent!r} below={below!r} above={above!r}")
