#!/usr/bin/env bash
# ACTION roots (class 15) fixture battery — `_a3_code.parse_action_roots` executable contract.
#
# Proves FIRE (a file-level `"use server"` module yields one endpoint-shaped record per exported
# function, JSDoc carried) and SILENT (a repo with no server action yields [] — the honest-empty
# that keeps every FastAPI project byte-identical; measured on gustify 2026-09-11, 82/82 files
# unchanged — docs/design/repo-study/action-roots-spike.md), plus the FLOORS the arm states:
# directive must be the FIRST statement, a leading comment block does not hide it, `.test.`/
# `.spec.` and vendored/generated dirs are skipped, and the record shape matches parse_task_roots
# so the generic `_l2` endpoint builder mints `ACTION <name>` with no TASK special-casing.
# Hermetic: synthetic temp trees only. Exit 0 = all pass.
set -u
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
GEN="${GEN_OVERRIDE:-$REPO/templates/center/generators}"   # override for mutation proof

T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
pass=0; fail=0
ok()  { pass=$((pass+1)); }
bad() { fail=$((fail+1)); echo "FAIL: $1"; }
eq()  { if [ "$2" = "$3" ]; then ok; else bad "$1 — expected [$3], got [$2]"; fi; }

# ── the runner: print one line per root as `METHOD path file doc?` ────────────
roots() {  # $1 = tree
  python3 - "$GEN" "$1" <<'PY'
import sys, pathlib
sys.path.insert(0, sys.argv[1])
import _a3_stacks_next as _next
_next._ACTION_ROOTS = None                      # the module caches; each fixture is a fresh read
for r in _next.parse_action_roots(pathlib.Path(sys.argv[2])):
    print(f"{r['method']}|{r['path']}|{r['file']}|{r['doc']}|{r['resp']}|{sorted(r.keys())}")
PY
}

# ── FIXTURE A · a Next.js app with server actions ────────────────────────────
A="$T/a"; mkdir -p "$A/src/app/chat" "$A/src/app/admin" "$A/src/services" "$A/node_modules/x" "$A/src/app/legacy"
cat > "$A/src/app/chat/actions.ts" <<'TS'
"use server";
import { chatService } from "@/composition/container";
/**
 * Server Action: obtain an assistant reply.
 * Second line folds in.
 */
export async function requestReply(input: ReplyInput): Promise<AssistantReply> { return chatService.reply(input); }
export async function requestReadiness(): Promise<ReadinessStatus> { return chatService.checkReadiness(); }
function notExported(): void {}
TS
cat > "$A/src/app/admin/actions.ts" <<'TS'
'use server'
export function createUser(formData: FormData) { return 1; }
TS
# a LEADING COMMENT must not hide the directive
cat > "$A/src/app/legacy/actions.ts" <<'TS'
// a banner comment
/* and a block one */
"use server";
export async function legacyAction() {}
TS
# NOT actions: a plain service, a client component, a test twin, a vendored copy
printf 'export async function reply(){}\n' > "$A/src/services/chat-service.ts"
printf '"use client";\nexport function Screen(){ return null; }\n' > "$A/src/app/chat/screen.tsx"
printf '"use server";\nexport async function ghost(){}\n' > "$A/src/app/chat/actions.test.ts"
printf '"use server";\nexport async function vendored(){}\n' > "$A/node_modules/x/actions.ts"

OUT="$(roots "$A")"; N=$(printf '%s\n' "$OUT" | grep -c .)
eq "A · four actions across three modules" "$N" "4"
printf '%s\n' "$OUT" | grep -q '^ACTION|requestReply|src/app/chat/actions.ts|' && ok || bad "A · requestReply not minted"
printf '%s\n' "$OUT" | grep -q '^ACTION|requestReadiness|' && ok || bad "A · requestReadiness not minted"
printf '%s\n' "$OUT" | grep -q "^ACTION|createUser|src/app/admin/actions.ts|" && ok || bad "A · single-quoted directive not honoured"
printf '%s\n' "$OUT" | grep -q '^ACTION|legacyAction|' && ok || bad "A · leading comment block hid the directive"
printf '%s\n' "$OUT" | grep -q 'notExported' && bad "A · a non-exported function was minted" || ok
printf '%s\n' "$OUT" | grep -q 'reply|src/services' && bad "A · a plain service module was minted" || ok
printf '%s\n' "$OUT" | grep -q 'Screen' && bad 'A · a "use client" component was minted' || ok
printf '%s\n' "$OUT" | grep -q 'ghost' && bad "A · a .test. twin was minted" || ok
printf '%s\n' "$OUT" | grep -q 'vendored' && bad "A · node_modules was scanned" || ok
printf '%s\n' "$OUT" | grep -q 'Server Action: obtain an assistant reply. Second line folds in.' && ok || bad "A · JSDoc not carried onto the record"
# the record shape IS parse_task_roots' — the generic _l2 mint depends on it
printf '%s\n' "$OUT" | head -1 | grep -qF "['doc', 'file', 'fn', 'method', 'path', 'resp', 'status', 'touches', 'touches_x']" && ok \
  || bad "A · record shape drifted from the task-root contract"

# ── FIXTURE B · SILENT: a FastAPI repo (the honest-empty that keeps twins byte-identical) ──
B="$T/b"; mkdir -p "$B/backend/app/api" "$B/web/src"
printf 'from fastapi import APIRouter\nrouter = APIRouter()\n@router.get("/x")\ndef x(): ...\n' > "$B/backend/app/api/main.py"
printf 'export function useThing(){ return 1; }\n' > "$B/web/src/useThing.ts"
printf '// "use server" only inside a comment\nexport function decoy(){}\n' > "$B/web/src/decoy.ts"
eq "B · no server action → honest-empty" "$(roots "$B" | grep -c .)" "0"

# ── FIXTURE C · the directive must be the FIRST statement ────────────────────
C="$T/c"; mkdir -p "$C/src"
printf 'import x from "y";\n"use server";\nexport async function late(){}\n' > "$C/src/late.ts"
eq "C · directive after an import is NOT a server module" "$(roots "$C" | grep -c .)" "0"

# ── FIXTURE D · an empty tree never throws ───────────────────────────────────
D="$T/d"; mkdir -p "$D/src"
eq "D · empty tree → []" "$(roots "$D" | grep -c .)" "0"

# ── the LAW this arm was carved out to hold ──────────────────────────────────
# _a3_code is the PYTHON scanner (233 ast. calls over .py). A TypeScript parser was appended to it
# once, because that is where parse_task_roots happened to live; one more foreign stack landing the
# same way is the mess the register exists to prevent. Fail loudly if TS creeps back in.
TSHITS=$(grep -cE '\.tsx?"|use server|rglob\("\*\.tsx?"\)' "$GEN/_a3_code.py" 2>/dev/null; true)
TSHITS=${TSHITS:-0}
eq "the Python scanner reads no TypeScript" "$TSHITS" "0"
grep -q "parse_action_roots" "$GEN/_a3_stacks_next.py" && ok || bad "the Next arm lost its parser"
# an old caller gets a POINTER, not an AttributeError
if (cd "$GEN" && python3 -c "
import _a3_code, _a3_stacks_next
assert _a3_code.parse_action_roots is _a3_stacks_next.parse_action_roots
import _a3_stacks as S
assert any(r.module == '_a3_stacks_next' for r in S.REGISTER), 'register still names the old module'
" ) >/dev/null 2>&1; then ok; else bad "the tombstone re-export or the register row is wrong"; fi

echo "action-roots: $pass passed, $fail failed"
[ "$fail" = 0 ] || exit 1
