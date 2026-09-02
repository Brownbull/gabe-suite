#!/usr/bin/env bash
# mcp-registration checker battery — proves the ONE-line registration report can FIRE (not
# registered · disabled for this project · path mismatch) and stay green (registered, parity ok),
# always exit 0, against FIXTURE configs — never this machine's ~/.claude.json. Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
CK="${CK_OVERRIDE:-$REPO/scripts/checkers/mcp-registration.sh}"   # override for mutation proof
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }
INST="$REPO/skills/gabe-map/scripts/server.py"
PROJ="$T/proj"; mkdir -p "$PROJ"

run() { out=$(bash "$CK" "$@" 2>&1); rc=$?; }

# FIRE: no config at all
run --config "$T/none.json" --project "$PROJ" --installed "$INST"
[ $rc -eq 0 ] && ok || bad "must exit 0 with no config (got $rc)"
echo "$out" | grep -q "NOT registered" && ok || bad "no config → NOT registered: $out"

# FIRE: config without the server
echo '{"mcpServers":{"other":{"type":"stdio","command":"x"}}}' > "$T/a.json"
run --config "$T/a.json" --project "$PROJ" --installed "$INST"
echo "$out" | grep -q "NOT registered" && echo "$out" | grep -q -- "--register-mcp" && ok || bad "unregistered must name the register command: $out"

# GREEN: registered, parity ok, enabled
printf '{"mcpServers":{"gabe-map":{"type":"stdio","command":"python3","args":["%s"]}}}' "$INST" > "$T/b.json"
run --config "$T/b.json" --project "$PROJ" --installed "$INST"
echo "$out" | grep -q "registered (user scope)" && echo "$out" | grep -q "enabled here" && echo "$out" | grep -q "install parity ok" && ok || bad "registered+parity must read green: $out"
echo "$out" | grep -qE "server_sha [0-9a-f]{12}" && ok || bad "must print the install's server_sha: $out"

# FIRE: registered but disabled for THIS project
python3 - "$T/b.json" "$T/c.json" "$PROJ" <<'PY'
import json,sys,os
d=json.load(open(sys.argv[1])); d["projects"]={os.path.abspath(sys.argv[3]):{"disabledMcpServers":["gabe-map"]}}
json.dump(d,open(sys.argv[2],"w"))
PY
run --config "$T/c.json" --project "$PROJ" --installed "$INST"
echo "$out" | grep -q "disabled here" && ok || bad "disabled for the project must be named: $out"

# FIRE: registered to a stale path (install moved)
printf '{"mcpServers":{"gabe-map":{"type":"stdio","command":"python3","args":["/elsewhere/server.py"]}}}' > "$T/d.json"
run --config "$T/d.json" --project "$PROJ" --installed "$INST"
echo "$out" | grep -q "PATH MISMATCH" && ok || bad "stale registered path must read PATH MISMATCH: $out"

# SILENT-safe: unreadable config never fails
echo 'not json' > "$T/e.json"
run --config "$T/e.json" --project "$PROJ" --installed "$INST"
[ $rc -eq 0 ] && echo "$out" | grep -q "NOT registered" && ok || bad "unreadable config → exit 0 + NOT registered: rc=$rc $out"

# one line, always
[ "$(echo "$out" | wc -l)" = 1 ] && ok || bad "must print exactly one line"

echo "mcp-registration battery: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
