# The port-seam work — before and after

**2026-09-12.** Four phases over the four maps the operator named: gustify, gastify, tier3
(repo-study) and keypro-front, plus a verdict on **graft** itself. Every phase gated on
`scripts/map-baseline.sh check` and committed separately.

Commits: `554c2b5` (phase 0+1) · `ba095ad` (phase 2) · `67b721e` (phase 3).

---

## The one-line answer

The walk crossed the port. On keypro-front the chain now prints end to end:

```
login → AuthService.login → CookieSessionStore.save → PostgresSessionRepository.create
```

and the journey panel renders per-table columns — `ACTION login` shows `users=[R] sessions=[W]`.
It had shown `—` in every STORE cell.

---

## Before → after, per map

Each number is from that phase's gate run, not from a later re-read.

| | gustify | gastify | tier3 | keypro-front |
|---|---|---|---|---|
| **fn_nodes** | 299 → 299 | 136 → 136 | 2,666 → 2,666 | **37 → 40** |
| **fn_edges** | 427 → 427 | 141 → 141 | 3,348 → 3,348 | **23 → 40** (8 `binds`) |
| **fns with d2w** | — | — | — | **11 → 31** |
| **cross data edges** | unchanged | unchanged | **1,628 → 1,891** | **0 → 30** |
| **endpoint rollups** | unchanged | unchanged | unchanged | **0 → 10 of 11** |
| **`behind` rollups** | unchanged | unchanged | −3 empty records | **0 → 11 of 11** |
| **homing pieces** | unchanged | unchanged | **3,089 → 3,110** | unchanged |
| **census verdict** | IDENTICAL | IDENTICAL | 2 measures moved | 3 measures moved |
| **regen** | ok | ok | ok | **crashed → exit 0** |

**gustify and gastify are census-identical across all four phases.** They gain exactly one thing:
`stats.graft.di`, carrying the port arm's honest-empty reason — *"no call through an injected port
resolved"* (1 `implements` edge, 0 port-typed fields). Their maps did not move.

**tier3's two changes are both recoveries, not additions of opinion.** 263 cross-entity data edges
(`reads_from` +177, `writes_to` +86) were being computed and thrown away by a merge that dropped
`xaccess` for TASK roots. And 21 TASK roots entered the homing census with a data witness for the
first time (agree −11, stay +33, move −1 = exactly +21, so nothing was lost — 21 pieces gained
evidence and the classification redistributed).

**keypro-front went from a crashing regen to a complete data layer.** `CookieSessionStore.save`
went from undrawn to drawn, which is the hop the whole exercise was about.

---

## What each phase did

**Phase 0 — three build-killing crashes.** The plan froze R2 with `cls: None` and said consumers
key on `table`. There are **81 hard `["cls"]` reads** in the generators, and three killed the build:
`_a3_tests` ran `re.sub` over None, `_a3_codetab` ran `html.escape` over it, `_dm_detail` ran
`re.findall` over a list-of-lists `uqs`. keypro's regen had been failing since its tables entered
`entities[].models` — I had been grepping for success lines instead of checking the exit code.
Fixed at the source: the table carries its name as `cls`, `uqs` is a list of strings like the Python
arm's. `tests/stack-sql` gained an R2 **conformance** check pinning every field's TYPE.

**Phase 1 — self-edges.** 979 across the four (gustify 281 · gastify 214 · tier3 463 · keypro 21),
all at graft's *highest* confidence. The diagnosis called them a walker trap; measured, they never
reached `fn_edges` — the three call-edge builders already filter. They reached `_behind_context`,
which did not, and each minted a `{fns: 0, depth: 0}` record. Effect: 3 nodes on tier3.

**Phase 2 — one None, three breakages.** A raw-SQL op's `model: None` collapsed two tables into one
op key, crashed the rollup sort on any mixed tree, and drew `model:null`. Same verdict as `cls`.
A second defect: `bentities` folded only *unclaimed* roots, assuming a claimed root already sat in
its entity's `endpoints` — true for a FastAPI handler, false for every ACTION and TASK root.

**Phase 3 — the port seam.** `_a3_stacks_di.py` joins four facts already in the source: a
constructor parameter property (field → port), a `this.field.method(` site, graft's `implements`
edges, and the composition root's construction with the **predicate** of its branch. So an edge says
which implementation runs and under what condition — `CookieSessionStore.save → PostgresSessionRepository.create`
under `config`, `→ InMemorySessionRepository.create` under `!config`.

---

## graft: the verdict you asked for

graft is **third-party upstream** (NanoNets/Graft 0.8.2, source at
`refrepos/codemaps/Graft`, matching the installed binary). Every fix here is **suite-side**, so the
stock npm graft keeps working and no project's map depends on a local fork.

What is wrong with it, measured:

* It is **not blind to TypeScript** — 983 TS calls resolve to a class method. It reads types, but
  only three syntactic shapes; a `constructor(private readonly x: T)` parameter property is a
  fourth, and its type is extracted and filed under a key the call site never reads.
* Resolution is **overwhelmingly a name index**: of 790 method-target edges, 87 (11%) came from the
  typed path. A unique name gets an edge even when wrong (`cookies().get()` → `FakeConversationHistory.get`);
  an ambiguous one gets nothing (`.create`, five classes).
* `resolve.ts:160` returns the first same-file match with no not-the-caller guard — the 979
  self-edges, labelled `extracted`.

**Recommendation on graft:** do not fork it. The suite already treats it as a floor, and all three
defects are defensible from the outside — we filter the self-edges, and the DI arm supplies the type
information graft discards. If you want the upstream fixed, `bindings.ts:279-283` (the parameter
property) and `resolve.ts:160` (the guard) are the two places, and the diagnosis at
[dispatch-gap.md](dispatch-gap.md) has the detail to open an issue with.

---

## The Python mirror — worse, and in your own maps

This was never a TypeScript problem. FastAPI apps call modules, not objects (gustify 95% of call
targets are plain functions), which is why the pipeline never hit it. Where Python *does* inject,
it fails **silently** rather than visibly:

* **gustify**: `context.py:77 await verifier.verify(token)` goes through a `Protocol`, and neither
  `TokenVerifier.verify` nor `FirebaseTokenVerifier.verify` is in the drawn graph. The auth journey
  has been one hop short of Firebase since the centre shipped — **verified, and still open**: the DI
  arm reads TypeScript parameter properties, not Python `self.x = x`.
* **onyx (tier3)**: 514 of 524 injected sites (98.1%) reach no implementation; 83 abstract stubs
  absorb 177 inbound edges with zero outbound, so a walk *lands on a named node and looks finished*.
* **FastAPI `Depends()`**: 177 of 177 sites in gustify draw zero call edge.

**The one thing still owed:** the same arm for Python — `self.x = x` from a typed `__init__`
parameter, joined to `abc`/`Protocol` implementations. Same four facts, same shape, different
syntax. That is what would put Firebase back in gustify's auth journey.

---

## Testing

| battery | assertions | mutants killed |
|---|---|---|
| `tests/stack-di` (new) | 2 | 5 — keyword-caller · nearest-if · no-simplify · no-implements · no-xmerge |
| `tests/stack-sql` | 11 | 8 + R2 conformance ×3 |
| `tests/arms` | 8 | 4 — model-null · op-key-model · sort-bare · no-claimed-fold |
| `tests/levels` | 78 | 3 |
| `tests/arch-graph` | 331 | 1 |
| others green | center 169 · gabe-map 199 · entity-models 70 · inflight 26 · action-roots 18 · commits 19 · doctor 13 | |

`suite-doctor` CLEAN after every phase. The baseline roster gained **keypro** as a fourth target,
which is what caught the phase-0 crash within a minute of being added.

**A caveat on this report's own numbers:** the before-snapshot script recorded census, graft and
drawn-graph facts but not the c4 `access_edges` / `cross_edges` fields, so those before-values come
from the phase-3 gate output rather than the snapshot file. The snapshot is at
[before-after.json](before-after.json).

---

## Phase 4 — the Python port seam (`this commit`)

**Firebase is back in gustify's auth journey.**

```
build_auth_context → FirebaseTokenVerifier.verify   [binds]  settings.auth_provider is ProviderMode.REAL
                   → MockTokenVerifier.verify       [binds]  not (settings.auth_provider is ProviderMode.REAL)
```

That hop had been missing since the centre shipped.

### Python needed a different mechanism, not a translation

The TypeScript arm joins a constructor parameter property to graft's `implements` edges. Python
cannot be read that way, and the reason matters:

* A `Protocol` implementation **declares nothing**. `class FirebaseTokenVerifier:` has no base
  naming the port — conformance is structural — so there is no `implements` edge to join. gustify
  carries exactly **1** across 25,220 calls, and it belongs to a TypeScript file.
* The binding is a **factory**, not a constructor: `get_verifier() -> TokenVerifier` returns
  `FirebaseTokenVerifier(settings)` or `MockTokenVerifier()` on a condition.

So the factory IS the declaration, and a better one: its return annotation names the port, its body
names the implementations, and the branch names the predicate. `_a3_stacks_pydi.py` reads all of it
with **`ast`**, not regex — Python hands the shapes over exactly.

The four facts: a class whose bases include `Protocol`/`ABC` (the port) · a class returned by a
function annotated `-> Port`, or one that subclasses it (the abc idiom) · a name annotated with the
port — parameter, attribute or variable (the receiver) · `<receiver>.<method>(` inside a function.

### Three false positives caught before shipping

| accepted | consequence, measured |
|---|---|
| any return annotation as a port | **`Any` became a port**, `MappingProxyType` its implementation — **414 phantom edges** on gustify, drawing `recipe_techniques → ApplicationDefault` |
| a non-abstract annotation as a port | gastify's result dataclasses became ports — `_raw_output → Agent` |
| an unguarded fallback as unconditional | `MockTokenVerifier` read as always-on, the **opposite** of true |

The floor that fixed the first two: **a port must be declared abstract.** A concrete base used as an
injected type is not read, and the census says so rather than this arm guessing.

### A fourth rule the phase needed

Rule **3b2**: the target of a `binds` edge whose source is already drawn is drawn. Without it the
resolution stayed invisible anyway — rule 3 wants a handler source, 3b wants a write to descend
toward, 2b wants a table of its own, and a token verifier is none of the three. Its whole value is
being the END of the chain, so the chain must be allowed to reach it. Bounded by construction: only
arm-minted edges, only from a drawn source, at most four chained hops.

### Measured

| | gustify | gastify | tier3 | keypro |
|---|---|---|---|---|
| fn_nodes | **299 → 301** | unchanged | **2,666 → 2,719** | **40 → 60** |
| fn_edges | **427 → 429** | unchanged | **3,348 → 3,461** | **40 → 66** |
| cross data edges | unchanged | unchanged | **1,891 → 2,032** | unchanged |
| homing_agree | unchanged | unchanged | **1,318 → 1,331** | unchanged |
| ports · impls | 6 · 2 | 1 · 0 | 60 · 125 | — (TS arm) |

gastify is **census-identical** and honest-empty with a reason: *"no abstraction has a known
implementation."* keypro's +20 nodes are the in-memory arm of each binding, now drawn beside the
Postgres arm with the opposite predicate.

### The handoff bug that nearly shipped

`derive_functions` was being passed `_di.get("edges")` — the TypeScript arm only — after the Python
arm was added to `_dibind`. The arm's stats read `resolved: 1` while the map drew nothing. **Only
the baseline gate caught it**: gustify's census came back identical when it should have moved. The
call site is now pinned by a source assertion in `tests/stack-di`, mutation-proven.

`tests/stack-pydi` 2/2 (**5 mutants**: any-is-port · concrete-is-port · no-negation · no-factory ·
no-ast-guard) · `tests/stack-di` 4/4 (+ the handoff pin) · 11 other batteries green ·
suite-doctor CLEAN.
