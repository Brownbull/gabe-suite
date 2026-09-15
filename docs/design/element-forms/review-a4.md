# Element forms — Amendment 1 §A4, the verification pass (2026-09-15)

Read-only review of the built generation: five lenses (backend arms on gustify · the tier3 false-positive sweep ·
gastify as a second FastAPI style · the feed shape against §A1 · the frontend arm), then one verifier over the
deduped union. The agents wrote nothing; this file is the record.

- **step 1 · goldens** — `goldens/expected.json` (62 goldens) + `goldens/check-goldens.py`: **62 match · 0 mismatch · 0 missing** on the gustify feed.
- **step 2 · review** — 56 raw findings → **48 merged · 40 CONFIRMED · 8 REFUTED** (below).
- **step 3 · tier3 false-positive sweep** — 17 finding ids and 23 unknown/absent reason strings, 231 rows read against onyx source; precision tables below.
- **step 4 · id stability on real code** — gustify rebuilt from a copy with one blank line prepended to every `.py`
  (3,428 files): **4,036 ids · 2,186 distinct · 0 added · 0 dropped**, and all 2,365 `.py` `at` anchors shifted by exactly one line.
  (The runner's "unmoved" line is a set intersection, not a per-row check — a line number another row moved into.)

## Tier 1 — WRONG rows in the default (arms-off) feed, live in S20 / FORM DRIFT / gabe-map
V1 [c1] declared-unproduced counts a 2xx responses={} key as a declared refusal (_a3_paths.py:799 appends every key; :944 subtracts
   {422, success.status} for undeclared, :947 subtracts nothing). tier3 2 of 2 false (0%). · WRONG · RC-C · element-forms · re-blesses baselines
V2 [c3] shared-status cannot read a code carried by **<Enum>.detail(...) (_a3_paths.py:182-185 needs a Constant key; a ** unpack has key None)
   → main.py:242 joins the text-only set. 61 of 180 tier3 findings collapse; text-only n inflated on 75 endpoints. · WRONG · RC-D · element-forms
V3 [B3+c6] escape-500 never evaluates call-site literals (_a3_paths._analyse takes no call-site context; :870-878 lifts every escape).
   gustify clean_tags(allowed=None) → the :101 raise is dead; tier3 threadpool_concurrency.py:360 dead at both sites. · WRONG · RC-A · element-forms+forms-kinds
   (B3's "arm_findings.kinds" citation REFUTED — the claim lives in functions{}.raises[].untranslated_at)
V4 [c7] reason-lost pairs a raise with a `was` the call site forbids (chat_backend.py:373-379 passes include_deleted=True) — 4 of 9 rows. · WRONG · RC-A · element-forms
V5 [B4] declared.response_model names a model FastAPI sets to None (routing.py:847-850) — 25 endpoints across three feeds; the stream
   branch already emits {"state":"n/a"}. · WRONG · RC-C · element-forms
V6 [B5] full_path states a truncated path as fact for a non-literal route arg (_a3_paths.py:774 yields "" for Name/BinOp while the
   APIRouter(prefix=) read one line below resolves one hop). Four gustify endpoints publish as /api/v1; full_path feeds _exempts,
   path_match, when_for_path, schema path params and the test join — all four endpoints' real tests joined nothing. · WRONG · RC-C · element-forms+forms-tests

## Tier 2 — WRONG rows inside the opt-in arms
V7 [B1] the walker enumerates arm × exit with no consistency test → impossible paths; DELETE /pantry/locations books real writes as
   uncommitted on a 404. · WRONG · RC-A/RC-B · forms-paths
V8 [B2] a refusal raised inside an except is placed on straight-line flow with NO catch entry, after a branch where the callee RETURNED
   (_a3_paths.py:287-288 walks an except body with the unchanged guard stack). 8 exits × 2 paths on relief-accept. · WRONG · RC-B · forms-paths
V9 [c2] refusal-writes books a write committed on the path where the commit FAILED, rides a callee's whole step list past the raise, and
   fires on an unreachable refusal. 10 of 20 false. Refined: at 2 of 3 sites the rollback IS recorded but outranked — _rollup
   (_a3_forms_effects.py:546-555) treats every commit as successful. · WRONG · RC-B+RC-E · forms-effects
V10 [D2] _a3_forms_tests._match:60 lets {*} satisfy a literal and returns route_match "full"; sorted() inverts the registration order
   main.py:107-112 protects. 48 gastify joins, 4 false asserted-unproduced, two endpoints reading tests: null.
   (lens's "gustify 0 of 565" REFUTED — gustify has 14, all onto GET /recipes/explore.) · WRONG · RC-D · forms-tests
V11 [D8] the suffix fallback joins C486 (notifications) to PATCH /card-aliases/{alias_id} and writes a .tests ref on its success exit. · WRONG · RC-D · forms-tests
V12 [D3] shared_limit is not in rate_idioms and a decorator limit mints no 429: gastify 0 × 429 beside 21 limiter rows; 9 of its 16
   asserted-unproduced are 429s blaming the tests. · WRONG · RC-D · forms-contract
V13 [F1] _a3_fe_forms.py:377-379 defaults every fetch method to GET: all 57 gastify rows GET, 25 beside a contradicting endpoint. · WRONG · RC-D · forms-frontend
V14 [F2] 14 gustify mutations pass onSuccess: <local name> and read invalidates: []; usePantryOverview.invalidated_by names 1 of 9. · WRONG · RC-D · forms-frontend
V15 [c4] "generator: runs after the response line" said of @contextmanager callees entered BEFORE the response
   (_a3_forms_paths.py:238-240 keys on any Yield). 15 of 19 false; one actually decides an exit. · WRONG · RC-D · forms-paths
V16 [c9] the replay skips op.execute("ALTER TABLE … RENAME COLUMN …") → model:UserFile carries both halves of one rename as two phantom
   drift rows, migration.state "defined", no partial. · WRONG · RC-D · forms-short

## Tier 3 — MISLEADING (an honest gap said dishonestly)
V17 [B9] the effects arm walks into the callee the paths arm collapsed as after-the-response-line and splices its steps BEFORE the exit
   (SSE: 12 maybe_committed + one of two safe-method-commits). The walk is required by a Slice 6 golden; the attachment and rollup are not. · RC-B · forms-effects
V18 [c8] untranslated-raise credits a StreamingResponse generator's raise to the endpoint's 500 — the two arms disagree. · RC-B · forms-kinds
V19 [B11] failure.catches can never say swallow: 142 rows {translate 141, pass-through 1}; _a3_forms_effects.py:505-506 reads only chain
   catch entries, minted from exits. DELETE /me's deliberate swallow absent while failure.state reads "defined". §A2 Slice 6 promises
   "every try ON A PATH". · RC-B · forms-effects
V20 [B7+c5] collapsed reasons misdescribe the code: "one return" for a callee with ZERO returns and before the contributes-rows test
   (64 of gustify's 155 name a callee that supplies a row); "arms change neither exit nor commit" where an arm is a raise the same feed
   reports as the 500. The candidacy rule is declared; the WORDING is not. · RC-B/RC-F · forms-paths
V21 [D1] FRAMEWORK_MIN 0.136.3 is the maintainer's pin → every dependency effect erased on gastify (364/364 unknown, 0 of 805 steps) and
   tier3; get_auth_context's commit appears on none of 49 endpoints. D28 declares this and its BREAKS IF has FIRED on two of three targets;
   the 0.136.1↔0.136.3 diff is empty in the cited ranges (tier3 0.133.1 UNPROVEN). Sub-row: inherited counters print bare 0, not unknown. · RC-F · forms-effects+forms-short
V22 [D4] all 47 gastify auth gates read {"fn": null}, 0 provisions, while the qualified name sits in dependencies{} with applies_to 47;
   _a3_forms_contract.py:301 resolves the gate name in the ENDPOINT module, which an Annotated alias never enters. · RC-D+RC-F · forms-contract
V23 [D6] surfaces_on: [] reads "surfaces nowhere" for a refusal past the one-call floor while reached_by names the endpoint root with paths
   (2 gastify, 11 tier3, 0 gustify). The word exists one function away (translation: "beyond one level"). · RC-F · forms-kinds
V24 [B8+c12] responses{} under-reads: _SSE_HEADERS (a module dict) dropped with no note where an inline dict is read; a -> None handler
   reads body "unknown" (103 tier3 rows, 4 of them 204) with media "application/json". REFUTED halves: media "n/a" on a streaming row is
   declared; the photo row's runtime media_type is honest; 251 rows not 392. · RC-D/RC-C · forms-contract
V25 [c10] migration-drift's says line describes 4 of 150 rows; 103 are server_default-only, 29 of 60 findings server-default end to end;
   the finding row carries no `field` so a consumer cannot tell. · RC-F · forms-short
V26 [c11] mirror rows label the other side `a` and the subject `b` (_a3_forms_mirror.py:264 keys on b, :211 fills a from the with side). · RC-F · forms-short
V27 [F3] one pass-through prop drops EVERY host control in the body (_a3_fe_controls.py:149-150, scoped per piece): 145 of 313 gustify and
   55 of 157 gastify buttons never examined, no `skipped` in stats. · standalone · forms-frontend
V28 [F6] useQueries mints a hook row with no key, no fetch, no endpoint and no reason (key_unresolved: null). · RC-D · forms-frontend
V29 [F7] the bridge keeps the first export per (method, path) (_a3_web.py:344) → two of three hooks PATCHing one path reach no endpoint;
   3 of 7 recoverable by the (verb, _norm_path) join the reason part already uses. · RC-D · forms-frontend
V30 [S5] keypro's seven backend arms say "switched off" although the run selected every arm (extend_frontend seeds _off for F.ARM_ORDER
   without consulting selection(cfg)). · RC-F · forms-core
V31 [D10+S12] SECRET_RX redaction lives only in _env_rows → setting:database_url prints <redacted> from .env.example and the full DSN from
   tests.sets[] in the same object. Not a contract break (D24 scopes the promise); committed test fixtures. · LOW/hygiene · forms-short

## Tier 4 — CONTRACT (§A1 vs the built shape)
V32 [NEW, found while verifying B11] §A1's Registry bullet was never built: KINDS["endpoint"] holds only U3·U7·K1; the nine declared slots
   (U6 U8 U9 U11 U12 U14 K2 K3 K4) exist on ZERO endpoints; KINDS has none of the 13 new kinds; STATES lacks `external` though the setting
   form emits it (7 gustify settings). This is why V19's "missing from U11" is true in the strong sense: there IS no U11. · forms-core
V33 [S2+S10+S11] declared ids and vocabulary never minted: k: w: e: (0 across four feeds), chain kind `commit` (0), and 6 of 11 frontend
   id letters (x e c p r only; the module docstring documents 3). · forms-core
V34 [S3+S7] the feed's ONLY dangling reference class: piece refs (gustify 6 ids/18 occurrences, gastify 3/4, tier3 29/69, keypro 1/1) vs
   0 dangling among x g r b p sw st c. Two halves: action-uncalled points at a frontend.stores key because §A1's fe:<file>#<Store>.<action>
   piece key was never minted; the rest are function bodies the reason map named and never classified. · forms-frontend
V35 [S1] test_cases collapses parametrized runs instead of §A1's <tfile>::<def> fallback (_a3_forms_tests.py:134 falls back only when the
   NAME has no C-id): gustify 1172 → 1157 (5 ids), gastify 1125 → 1090 (21). · forms-tests
V36 [S6] dependency exits omit the `phase` their own id encodes (3/5 gustify, 1/2 gastify, 6/15 tier3); both cited ids recomputed. · forms-kinds
V37 [S4] keypro carries no head: extend_backend returns at _a3_forms_build.py:224 before :226, and extend_frontend writes the file anyway (D21). · forms-core
V38 [S8] endpoint-scoped findings live in two places: 68 tests + 2 frontend rows feed-wide with an `endpoint` key vs effects (3) and
   contract (2) per endpoint. · forms-core/forms-tests
V39 [S9] arms.tests.reason on tier3 matches none of §A1's eight enumerated forms. · LOW · forms-core
V40 [F5+D5+F11] (a) the NAV-HOOK guard §A2 Slice 11 step 4 lists was never built and is in NO "Not built" list → gastify's only auth guard
   (ProtectedRoute, wrapped around every non-public route at __root.tsx:19-25) has no row, though c4-graph knows the piece. (b) routers: []
   and mounts: 0 print bare zeros where the sibling k3 says "no route config read". (c) REFUTED: the empty frontend.idioms.unknown is declared.
   · (a) CONTRACT, (b) MISLEADING · forms-frontend

## Root causes
RC-A a literal never crosses the call boundary → V3 V4 V7 V9(d)
RC-B the callee is atomic on the path → V7 V8 V9(a,c) V17 V18 V19 V20
RC-C a framework rule the endpoint pass does not mirror → V1 V5 V6 V24
RC-D an idiom the reader does not know → V2 V10 V11 V12 V13 V14 V15 V16 V22a V24 V28 V29
RC-E a commit is assumed to have succeeded → V9(a,b)   [third cause, missed by the tier3 lens]
RC-F a number printed where there is no knowledge → V20 V21 V22b V23 V25 V26 V30 V40b
RC-G §A1 not kept in step with the build → V32–V39 V40a.  Standalone: V27 V31
VERDICT on the tier3 lens's "two systemic causes": true of its sample, FALSE of the union — RC-A+RC-B close 9 of the 31 non-contract
confirmed findings. The largest group is RC-D (12, an idiom roster); the costliest is RC-C, whose rows a consumer reads today.

## Fix order (the verifier's)
1. Split _a3_paths.py — D26's named, byte-neutral split with re-exports (map-baseline check proves identity). Nothing in Tier 1 lands without it; it commits alone.
2. The endpoint-pass batch — V1 V2 V5 V6 + the escape/reason lifts of V3 V4. One commit per rule, each with a tests/element-forms case.
   ⚠ none of the eight arm batteries covers the endpoint pass; tests/element-forms (C0–C13) is its executable contract. Each commit re-blesses
   forms.json in 4 tests/baselines/*.sha256 and forms_nag/forms_count in 3 *.census.json (gustify 40/160 · gastify 24/98 · tier3 275/934).
3. One shared falsification leaf (RC-A) — _a3_forms_schema already has the engine (_bound :314-324, _truth :334, :538); lift it beside
   _a3_forms_{ids,settings,catch,reach} and call it from the escape lift (V3 V4), the walker's arm combination (V7), the effects reach (V9d).
4. The path/effect atomicity pass (RC-B + RC-E) — V8 V9 V17 V18 V19 V20. Battery: forms-paths + forms-effects + forms-kinds.
5. The idiom rosters (RC-D) — independent, any order: V10+V11 (one matcher), V12 V13 V14 V15 V16 V22a V24 V28 V29.
6. The state-word sweep (RC-F) — V21 V22b V23 V25 V26 V30 V40b.
7. §A1 reconciliation (RC-G) — build or strike, in the spec's own commit: V32–V39 + the operator's ruling on V40a's nav hook.
FROZEN FIXTURE: no confirmed frontend fix needs the extractor for its RULE; the battery CASES for V13 V14 V40a and the clean variant of V28
need new fixture sources → re-derive tests/forms-frontend/flow.frozen.json. V27's fix re-blesses run.sh F17.

## Landed

1 · the split — `728856f`, byte-neutral on all four feeds (D26's own trigger).
2 · the endpoint-pass batch — V1 V2 V5 V6 in ONE commit (they share the fixture and one re-bless), cases C14 C15 C16,
    6 mutants each killed by its own case. V3 and V4's escape/reason lifts move to fix 3: both need the falsification leaf.
    Measured old → new: response_model → n/a 4 · 1 · 20 (gustify · gastify · tier3) · full_path corrected 4 · 0 · 1 ·
    declared.refusals fixed 0 · 0 · 2 · rows that gained a code 0 · 0 · 75. tier3 shared-status 164 → 103,
    declared-unproduced 2 → 0, text-only 452 → 449; census forms_nag 275 → 214, forms_count 934 → 929. gustify and
    gastify stay census-IDENTICAL on all 30 measures — response_model and full_path feed no finding. 62/62 goldens match.

3 · the shared falsification leaf — `_a3_forms_falsify.py` (bind + truth + dead), called from the endpoint pass's call
    loop (V3 V4), the walker's arm combination (V7) and, through the paths it removes, the effects rollup (V9d). Cases
    C17 (element-forms) and S5.P16 (forms-paths), 7 mutants each killed by its own case.
    Measured: gustify 1 falsified row → escape-500 8 → 7 (the predicted `clean_tags(allowed=None)`); gastify 0 — nothing
    to prove, and the feed grows only by the new stat key; tier3 38 falsified → rows 2492 → 2486, escape-500 71 → 69
    (the predicted `threadpool_concurrency.py` pair), reason-lost 20 → 19. Paths: gustify 756 → 752 (impossible 4),
    tier3 4076 → 4046 (impossible 24), gastify 0. gustify's `DELETE /pantry/locations/{location_id}` goes 12 paths → 10:
    both the 404 that booked two writes as uncommitted and the 204 that booked none are gone.

⚠ V4 is PARTIAL, and the number is smaller than the review's. One row went — exactly the cited
`chat_backend.py:381`, whose `was` came from the INNER `get_chat_session_by_id(..., include_deleted=True)`. The other
four rows carrying that same `was` come from the OUTER call, which passes `include_deleted=include_deleted` — a
parameter, not a literal, so nothing at THIS call site proves the branch dead and the leaf abstains by design. Closing
them needs a different rule (reading the endpoint's own parameter default and its declared values), not a stronger
fold. Recorded, not fixed; it belongs with the state-word sweep, fix 6.

⚠ BASELINE NOISE (not a finding, seen while re-blessing): `board.html` carries WALLCLOCK card ages ("on the board 56
days"), so every `map-baseline check` run a day after its bless reports it as moved on gustify and gastify. Re-blessing
re-stamps it and the drift returns tomorrow. The fix is one more `_NORM_RX` rule in `scripts/map-baseline.sh`; owed,
outside this pass — until then, read a lone `board.html` in a check as the calendar, never as a regression.

## Refuted (8)
B6  /healthz findings from an applies:false row — declared floor D19, and the fix is forbidden by §A1 shared rules + D16. Operator config flip.
B10 mutually exclusive callee writes as definite — declared twice in Slice 6 "As built"; every step carries cond: true; W2 is a model-binding widening.
F4  18 of 20 unknown controls provably live — declared at §A2:1218 and pinned by forms-frontend F17; only the mechanism half is real.
F9  optimistic.writes lists readers — declared rule ("or a call handed the useQueryClient() value"); 2 of 3 cited lines hold, :189 does write.
F10 a reason-origin unknown names the wrong identifier — _a3_fe_reason.py:171-172/:234 already builds from the LAST hop; two hops share the name.
D7  race-500 can never fire without an idempotency key — gustify HAS the key and still leaves 20 of 22 uncaught races unfired; U12-claim-scoped by
    declaration. Survives only as a note: m10.race_500 [] beside a recorded uncaught race.
D9  every gastify rate limit unknown — declared shape twice; the feed says unknown with the raw expr. The wrong rows belong to V12.
B3-half the second surface is arm_findings.kinds — gustify has 0 such findings naming preferences.py; the claim lives in functions{}.raises[].untranslated_at.

## Numbers corrected during verification (cite these, not the lenses')
tier3 body:"unknown" 251 (not 392), 103 of them -> None · model drift rows 150 (not 146) · framework_exits tier3 390 (not 388) ·
c5 feed-wide 62/361 and 38/1131 (not 42/360, 23/1105) · c4 is 15 of 19 false (not 2 of 17 true) · D6 is 2 gastify rows (not systemic) ·
gustify carries 14 of D2's wildcard joins (the lens said 0).

## Precision — tier3 finding ids (§A4 step 3)
| id | hits | sampled | true | precision | verdict |
|---|---|---|---|---|---|
| declared-unproduced | 2 | 2 | 0 | 0% | tighten (c1) |
| collapsed "generator: runs after the response line" | 19 | 17 | 2 | 12% | tighten (c4) |
| refusal-writes | 28 | 20 | 10 | 50% | tighten or demote to count (c2) |
| shared-status | 180 | 20 | 13 | 65% | tighten (c3) |
| reason-lost | 20 | 20 | 16 | 80% | at the bar; fix c7 |
| escape-500 | 73 | 20 | 17 | 85% | keep; fix c6 |
| untranslated-raise | 22 | 22 | 19 | 86% | keep; fix c6+c8 |
| text-only | 466 | 20 | 20 | 100% | keep (n inflated by c3) |
| undeclared | 466 | 20 | 20 | 100% | keep |
| http-swallowed | 2 | 2 | 2 | 100% | keep |
| safe-method-commits | 14 | 14 | 14 | 100% | keep |
| swallows-broad | 288 | 20 | 20 | 100% | keep |
| dependency-commits | 1 | 1 | 1 | 100% | keep |
| extra-ignored | 172 | 20 | 20 | 100% | keep |
| migration-drift | 60 | 20 | 20 | 100% | keep; c9 row bug + c10 says line |
| default-overridden | 5 | 5 | 5 | 100% | keep |
| mirror-disagree | 2 | 2 | 2 | 100% | keep; c11 orientation |
| action-uncalled | 8 | 8 | 8 | 100% | keep |

## Precision — tier3 unknown/absent reasons
| reason | where | hits | sampled | true | precision |
|---|---|---|---|---|---|
| generator: runs after the response line | collapsed[].reason | 19 | 17 | 2 | 12% |
| arms change neither exit nor commit | collapsed[].reason | 361 | 20 | 13 | 65% |
| one return | collapsed[].reason | 1131 | 20 | 16 | 80% |
| <Cls> <file>:<line> (named 500 cause) | paths[].unknown | 71 | 20 | 17 | 85% |
All 19 other reason strings sampled at 100% — incl. dynamic status (591), anywhere (403), app handler for OnyxError (198),
an unverified translation no binding proves (139), pass-through raise (76), the fastapi version gate (390), dependency unknown (4076),
constructor: builds a value (307), swallowed by the caller (41), the 6 frontend origin reasons (33), spread props (5), submit-with-no-form (1),
task keyword unknown (25), dependency kind (1), dependency-factory argument unread (1416), responses body/media unknown (~402, under-read → c12).

