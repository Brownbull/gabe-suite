#!/usr/bin/env bash
# Raw-SQL arm battery (extractor-gateway plan, step 8) — _a3_stacks_sql's executable contract.
#
# The arm reads tables and access out of SQL STRING LITERALS, for apps that talk to a database
# through a driver rather than an ORM. It is a FALLBACK: where another arm already described the
# data layer it stays silent, because two arms claiming one concept is how a map acquires a
# confident wrong answer. Every case below was a real defect first, measured on the study repos:
#   · SQL found in PROSE — "UPDATE the docs" scored `the` as a table (360 phantom ops / 190 files)
#   · a spanning SELECT…FROM matched `from __future__` on the far side of a file
#   · Salesforce SOQL (`SELECT Id FROM User`) counted `User` as one of tier3's tables
#   · an ALTER-created stub beat the real CREATE and left `users` with ONE column of nine
#   · a functional unique index recorded as `lower(email` — truncated at the inner paren
# Hermetic: synthetic trees only. Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
GEN="${GEN_OVERRIDE:-$REPO/templates/center/generators}"

T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }

mkdir -p "$T/app/db" "$T/prose" "$T/orm" "$T/mig/alembic/versions" "$T/soql"
cat > "$T/app/db/schema.ts" <<'TS'
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));
`;
TS
# the ALTER lives in an EARLIER-SORTING file on purpose: files are walked sorted, so this creates
# the `users` record FIRST with one column, and a merge that keeps the first non-empty list would
# discard the real DDL's four. That is exactly what happened to keypro-front's users table.
cat > "$T/app/db/a_add_email.ts" <<'TS2'
export const ADD_EMAIL = `ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;`;
TS2
cat > "$T/app/db/repo.ts" <<'TS'
export async function find(id: string) {
  return pool.query("SELECT id, username FROM users WHERE id = $1", [id]);
}
export async function save(u: U) {
  await pool.query("INSERT INTO users (id, username) VALUES ($1, $2)", [u.id, u.name]);
  await pool.query("UPDATE users SET username = $1 WHERE id = $2", [u.name, u.id]);
  await pool.query("DELETE FROM sessions WHERE user_id = $1", [u.id]);
}
TS
# PROSE inside literals — the 360-phantom-op case
cat > "$T/prose/doc.js" <<'JS'
export const HELP = "UPDATE the configuration, then DELETE FROM its cache and SELECT a new theme";
export const NOTE = "we INSERT INTO every record a trace id";
JS
# SOQL — a Salesforce object is not one of this app's tables
printf 'const q = "SELECT Id, Name FROM User WHERE IsActive = true";\n' > "$T/soql/sf.ts"
# SQL in a COMMENT, outside every string literal — the case that proves the scan is literal-scoped
mkdir -p "$T/comment"
cat > "$T/comment/notes.ts" <<'TSC'
// This helper used to run: INSERT INTO audit_log (id) VALUES (1)
/* and before that it would DELETE FROM audit_log WHERE id = 1; */
// We also used to SELECT id FROM audit_log WHERE active;
export const nothing = 1;
TSC
# a migration: real SQL, but schema history — never request-path access
printf 'def upgrade():\n    op.execute("INSERT INTO locations (id) VALUES (1)")\n' > "$T/mig/alembic/versions/001_x.py"

run() { python3 - "$GEN" "$1" "${2:-0}" "${3:-0}" <<'PY'
import sys, json, pathlib
sys.path.insert(0, sys.argv[1])
import _a3_stacks_sql as S
print(json.dumps(S.parse(pathlib.Path(sys.argv[2]), orm_tables=int(sys.argv[3]), orm_access=int(sys.argv[4]))))
PY
}

# ── FIRE: the raw-SQL app ────────────────────────────────────────────────────
OUT=$(run "$T/app")
python3 - "$OUT" <<'PY' && ok || bad "FIRE: tables/columns/fks/uqs/access"
import json, sys
o = json.loads(sys.argv[1])
assert o["present"] and o["role"] == "fallback", o
t = {x["table"]: x for x in o["tables"]}
assert set(t) == {"users", "sessions"}, list(t)
assert t["users"]["cls"] is None, "a CREATE TABLE literal has no class — the R2 contract"
cols = [c[0] for c in t["users"]["cols"]]
assert cols == ["id", "username", "role", "created_at", "email"], cols   # ALTER appended, CREATE first
assert t["sessions"]["fks"] == {"user_id": "users.id"}, t["sessions"]["fks"]
assert t["users"]["uqs"] == [["lower(email)"]], t["users"]["uqs"]         # rebalanced, not truncated
ops = o["access"]["db/repo.ts"]
assert all(x["model"] is None and x["table"] for x in ops), ops
got = {(x["table"], x["rw"]) for x in ops}
assert got == {("users", "r"), ("users", "w"), ("sessions", "w")}, got
PY

# ── SILENT: prose, SOQL, migrations, an empty tree ───────────────────────────
python3 -c "
import json,sys; o=json.loads(sys.argv[1])
assert not o['access'], o['access']
assert not o['tables'], o['tables']
assert o['reason'], 'silence must state itself'
" "$(run "$T/prose")" && ok || bad "SILENT: English prose in a string literal is not SQL"
python3 -c "
import json,sys; o=json.loads(sys.argv[1])
assert not o['access'], f'SOQL counted as table access: {o[\"access\"]}'
" "$(run "$T/soql")" && ok || bad "SILENT: Salesforce SOQL is not this app's data layer"
python3 -c "
import json,sys; o=json.loads(sys.argv[1])
assert not o['access'], f'a migration counted as request-path access: {o[\"access\"]}'
" "$(run "$T/mig")" && ok || bad "SILENT: a migration is schema history, not access"
python3 -c "
import json,sys; o=json.loads(sys.argv[1])
assert not o['access'], f'SQL in a COMMENT scored as access: {o[\"access\"]}'
" "$(run "$T/comment")" && ok || bad "SILENT: SQL in a comment is not a statement — the scan is literal-scoped"
mkdir -p "$T/empty"
python3 -c "
import json,sys; o=json.loads(sys.argv[1])
assert o['present'] is False and o['reason']
" "$(run "$T/empty")" && ok || bad "SILENT: an empty tree says why"

# ── the FALLBACK rule: silent where another arm already answered ─────────────
python3 -c "
import json,sys; o=json.loads(sys.argv[1])
assert o['role']=='unused', o['role']
assert 'already produced' in o['reason'], o['reason']
" "$(run "$T/app" 57 165)" && ok || bad "FALLBACK: the arm must stand down when an ORM arm covered the repo"
python3 -c "
import json,sys; o=json.loads(sys.argv[1])
assert o['role']=='fallback', o['role']
" "$(run "$T/app" 0 0)" && ok || bad "FALLBACK: the arm must answer when nothing else did"

# ── the FUNCTION JOIN (step 9): a statement attached to the function that runs it ─────
mkdir -p "$T/join/src" "$T/join/graft/.graph"
cat > "$T/join/src/repo.ts" <<'TSJ'
export class Repo {
  async list() {
    return pool.query("SELECT id FROM users");
  }
  async save(u: U) {
    await pool.query("INSERT INTO users (id) VALUES ($1)", [u.id]);
  }
  async wrap() {
    const inner = async () => {
      await pool.query("UPDATE sessions SET x = 1 WHERE id = $1");
    };
    return inner();
  }
}
const stray = "DELETE FROM audit_log WHERE id = $1";
TSJ
cat > "$T/join/graft/.graph/wiring.json" <<'JSONJ'
{"meta":{"version":1},"nodes":[
 {"id":"src/repo.ts#Repo","kind":"class","path":"src/repo.ts","span":"L1-L9"},
 {"id":"src/repo.ts#Repo.list","kind":"method","path":"src/repo.ts","span":"L2-L4"},
 {"id":"src/repo.ts#Repo.save","kind":"method","path":"src/repo.ts","span":"L5-L7"},
 {"id":"src/repo.ts#Repo.wrap","kind":"method","path":"src/repo.ts","span":"L8-L13"},
 {"id":"src/repo.ts#inner","kind":"function","path":"src/repo.ts","span":"L9-L11"}],
 "edges":[]}
JSONJ
if (cd "$GEN" && python3 - "$T/join" <<'JOINPY'
import sys, pathlib
import _a3_stacks_sql as S
r = pathlib.Path(sys.argv[1])
o = S.parse(r)
sites = o["access"]["src/repo.ts"]
assert all("line" in x for x in sites), sites          # the line is what makes the join possible
j = S.join_functions(r, o["access"])
assert set(j) == {"src/repo.ts::Repo.list", "src/repo.ts::Repo.save", "src/repo.ts::inner"}, sorted(j)
# the INNERMOST callable wins: `inner` sits inside `Repo.wrap`, and the statement is inner's
assert "src/repo.ts::Repo.wrap" not in j, "an enclosing method stole a nested function's statement"
assert [(x["table"], x["rw"]) for x in j["src/repo.ts::inner"]["access"]["ops"]] == [("sessions", "w")]
assert [(x["table"], x["rw"]) for x in j["src/repo.ts::Repo.list"]["access"]["ops"]] == [("users", "r")]
assert [(x["table"], x["rw"]) for x in j["src/repo.ts::Repo.save"]["access"]["ops"]] == [("users", "w")]
# a statement at MODULE scope belongs to no function — dropped, never hung on a neighbour
assert not any("audit_log" in str(v) for v in j.values()), j
# the INNERMOST span wins: the class encloses both methods and must not swallow them
assert "src/repo.ts::Repo" not in j, "the enclosing class stole its methods' statements"
# no graft index → no join, and nothing raises
assert S.join_functions(pathlib.Path(sys.argv[1] + "-none"), o["access"]) == {}
print("ok")
JOINPY
) >/dev/null 2>&1; then ok; else bad "join: line tracking · innermost span · module scope dropped · no index"; fi

# a TEST file must never win a table's home — the code map excludes .test. from an entity's files,
# so a table homed there is dropped and its model never draws (keypro's `users`)
mkdir -p "$T/home/db"
printf 'export const S = `CREATE TABLE IF NOT EXISTS widgets (id TEXT PRIMARY KEY);`;\n' > "$T/home/db/schema.ts"
printf 'const S = `CREATE TABLE IF NOT EXISTS widgets (id TEXT PRIMARY KEY);`;\n' > "$T/home/db/schema.test.ts"
if (cd "$GEN" && python3 - "$T/home" <<'HOMEPY'
import sys, pathlib
import _a3_stacks_sql as S
o = S.parse(pathlib.Path(sys.argv[1]))
t = {x["table"]: x for x in o["tables"]}
assert t["widgets"]["file"] == "db/schema.ts", t["widgets"]["file"]
print("ok")
HOMEPY
) >/dev/null 2>&1; then ok; else bad "home: a test file must not win a table's home"; fi

echo "stack-sql: $pass passed, $fail failed"
[ "$fail" = 0 ] || exit 1
