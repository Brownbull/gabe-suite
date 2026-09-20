# Slice 11e — what a client branch does (leftovers piece 10, the generation part)

> **DRAFT — not landed.** Written 2026-09-20 by a read-only planning run (4 readers + 1 designer). Nothing in `templates/center/generators/` has changed.
> The amendment's own process applies (amendment-1.md: *the operator rules on the decisions, then says "land it"*). Raw findings: `slice-11e-does.plan.json`.

## What is written

The new keys sit inside the existing `reason` part. There is no new part, no registry change, no finding and no id letter.

**Where it is written**
- forms.json → `frontend.reasons.sites[]`, on every site: status, detail and code alike.
- Assembled in `/home/khujta/projects/gabe_lens/templates/center/generators/_a3_fe_reason.py:254-262`.
- One stats key: `arms.frontend.stats.reason.does`.
- Nothing else is touched: `readers{}`, `origins`, `endpoints`, `branch`, the site `id` (hashed at :254 from name · recv · member · op · value · n) and the three findings.
- forms.json is written with `sort_keys=True`, so key order is irrelevant.

**Site-level additions (three keys)**
- `does`: always a list, in extractor walk order, capped at `FF.DOES_CAP` (24). Over the cap the site also carries `does_more: <int dropped>`.
- `does_state`: always present, one of `read · mixed · empty · returned · no-rows · unread`.
  - This keeps the estate's rule of a word beside an empty list (the `_o()` precedent at :108).
- `ctx`: the comparison row's own extractor ctx, verbatim, written only when non-empty.
  - Example: `["callback:useEffect"]`. It gives the row-level `in` something to be relative to.

**Row schema (every does row)**
- Required:
  - `class`: one of `FF.DOES_CLASSES`.
  - `k`: the extractor row kind actually read, one of `call|new|ret|throw|jsx`.
  - `at`: `"<file>:<line>"`.
- Rows derived from a call or new:
  - `callee`: verbatim, extractor-clipped at 80.
  - `args`: the extractor's first-3 literal-resolved list, verbatim, nulls kept, only when the row has it.
  - `props`: the literal props of the first object argument, verbatim, only when present.
  - `from`, one of:
    - `bind:<leaf of the call that binds the callee's base in this body>`, for example `bind:useState`, `bind:useAuth`.
    - `param`: the base is a parameter of the body.
    - `fe:<file>#<name>` or `ext:<name>`: what `_a3_fe_forms._resolve` returns.
    - absent: a global such as `console`, `fetch`, `window`, or unresolved.
- Per class:
  - navigate: `to` (str or null) plus `tag` or `callee`.
  - throw: `callee`, `value` (text, clipped 80), and `args`/`props` absorbed from the same-line `new`/`call` sibling.
  - render: `tag`, plus `tags` when read from a ret row.
  - return: `value` (raw text or null) plus exactly one of:
    - `bare:true` for `return;`
    - `null:true`
    - `literal:"<unquoted text>"`, only when the whole value is one quoted literal with no `${}` and is not clipped
    - `obj:{…}`, the extractor's returned-object map.
  - message: `key` (args[0] when a str, else null).
  - surface: `level` (the leaf when in the roster, else null).
  - state: `how` = `setter|store|storage`.
  - refresh: `how` = `invalidate|write|refetch`, `key` = raw `opts.queryKey` / args[0].
  - retry: `how` = `mutate|mutateAsync|refetch|fetch`.
  - request: `method`, `path`, and `endpoint` only when the forms hold it.
  - log: `level`.
  - other: `callee` always.
- Optional on any row, written only when true or non-empty:
  - `returned:true`: the row is a call whose value the branch returns. The ret row was merged into it.
  - `in:[ctx…]`: callbacks entered inside the branch, which is the row ctx beyond the site's ctx.
  - `when:[{pred,neg?}…]`: conditions inside the branch that also gate this row. It is `guards[n+1:]` plus `after[len(site.after):]`.
  - `by:"name"`: the row's guard matched only through the named-constant alternative of the regex, not the literal.
  - `reads:["detail"|"code"…]`: which refusal members the row's texts name. This is the evidence behind the word `reads`.
  - `passes:true`: the receiver's base is among the call's refs. This is the evidence behind the word `passed`.
  - `clipped:true`: `value` or `callee` sits at the 80-character cap.
- No ids. A row is addressed by `at` plus its position in `does[]`. This follows the §A4 V33 precedent at amendment-1.md:115, where `b s a q m t` were struck. Two rows can share an `at`, for example `toast.error(t("k"))`.

**Stats**
- `stats.reason.does` = `{"rows":int, "narrowed":int, "sites":{all six states:int}, "classes":{all twelve classes:int}}`.
- `narrowed` counts sites where the structural selection kept fewer rows than `_branch`'s textual `inside`.
- Every class and every state is listed, so a zero is a measured zero.

**Worked example 1: gustify, RequireSetup**
- Source, verified by reading: `/home/khujta/projects/apps/gustify/apps/web/src/routes/RequireSetup.tsx`
  - :31 `const { signOut } = useAuth();`
  - :37 `useEffect(() => {`
  - :38 `if (isError && isApiError(error) && error.status === 401) {`
  - :39 `void signOut();`
- The site after the change. Pre-existing keys are unchanged. This is predicted from source, not yet produced by a run:
```json
{"id":"r-<unchanged>","piece":"fe:apps/web/src/routes/RequireSetup.tsx#RequireSetup","at":"apps/web/src/routes/RequireSetup.tsx:38","receiver":"error","reads":"status","op":"===","value":401,"branch":"none","origins":["…unchanged…"],"endpoints":["endpoint:GET /me"],
 "ctx":["callback:useEffect"],"does_state":"read",
 "does":[{"class":"other","k":"call","at":"apps/web/src/routes/RequireSetup.tsx:39","callee":"signOut","from":"bind:useAuth"}]}
```
- The else arm at :41 (`pushToast({tone:"info",message:t(…)})`) carries the guard with `neg:true`, so it is not in does[]. It belongs to the exits the site does not cover.

**Worked example 2: gustify, SetupScreen.tsx:43**
- This is the 409 behind both `reason-collapsed` goldens.
- Source: `function setupErrorMessage(error: unknown, t: TFunction)` … `if (error.status === 409) return t("auth.setup.error.in_progress");`
- Result: `"does_state":"read","does":[{"class":"other","k":"call","at":"apps/web/src/features/auth/SetupScreen.tsx:43","callee":"t","args":["auth.setup.error.in_progress"],"from":"param","returned":true}]`.
- Its class is `other`, not `message`. `t` is a parameter typed by gustify's own `useT`, not a library binder. The key is still readable as args[0].

## How a row is classed

**Which rows are selected**
- Two selections run over one regex and must not be confused.
- Textual selection, for the word. `_inside(rows, site)` is today's :76-78, verbatim for status sites. It returns `(pat, later, inside)`.
  - `_branch(later, inside, recv)` is today's :79-86, byte for byte.
  - The five words keep their meanings and the three findings cannot move.
  - `_pat(site)` adds a named group `(?P<lit>…)` around the literal alternative. For an int this is the same language as today.
  - For a string `right` the literal alternative is quoted: `["'`]<escaped>["'`]`. Today's unquoted pattern can never match `error.code === "setup_locked"`. That is harmless today only because `_branch` runs for status sites alone.
- Structural selection, for `does[]`. A row of `inside` is the site's own when all of the following hold. Here `n = len(site.guards)`, `sg`/`sa`/`sc` are the comparison row's own guards, after and ctx, and `g`, `after`, `ctx` are the row's.
  1. `len(g) > n and g[:n] == sg and not g[n].get("neg") and pat.search(g[n]["pred"])`.
     - The branch guard sits exactly one deeper than the comparison's own guards.
     - This holds by construction in the extractor. `_a3_fe_extract.mjs` :417-421 walks an `if` condition with `(guards, passed, ctx)` and its then-arm with `[...guards,{pred}]`. :366-375 does the same for a ternary and for `cond && <jsx/>`.
  2. ctx never diverges: `all(a == b for a, b in zip(sc, ctx))`.
     - A textually identical `if` in a sibling callback is excluded.
     - A comparison inside a callback within the condition still owns the statement-level rows.
  3. `after[:len(sa)] == sa`, and no pred in `after[len(sa):]` matches `pat`.
     - A row that runs only after this comparison was ruled out cannot be in its branch.
  4. If the match came through the name alternative (`m.group("lit") is None`), the row belongs only to the nearest preceding comparison.
     - That is the greatest `line <=` the row's line among cmp rows with the same `left`·`op` and equal guards.
     - The row is kept only when that comparison is the site, and it carries `by:"name"`.
- The invariant `does ⊆ inside` holds, so `branch in (value, unread)` implies `does == []`.
- The word is never recomputed from the narrowed rows. Doing so would move `reason-collapsed`. It is deferred to its own ruling.

**Rows skipped and merged (one pass, grouped by line)**
- A `cmp` row is skipped. It is a site of its own.
- A `let` row is skipped. It is an alias, not an action.
- A `throw` absorbs the same-line `new`/`call` row whose callee equals `throw.callee`. It takes that row's `args`/`props` and the sibling is dropped.
- A `ret` whose value, after stripping a leading `await ` or `void `, starts with a same-line call's `callee + "("`:
  - the call row is kept with `returned:true`
  - the ret row is dropped.
- A `ret` with `jsx` is the single render or navigate row.
  - Every `jsx` row at a line >= that ret's line in the same ctx is dropped, because a returned tree is one row.
  - A `jsx` row under the guard with no such ret is kept. This is the conditional render case.
- A same-line `new URL(<str>)` row feeds `to` for a `NAV_STATIC` call and is dropped.

**Class ladder (first match wins; order = `FF.DOES_CLASSES`)**
- ret and throw rows:
  1. navigate: the throw callee's leaf is in `NAV_THROWS`, or `ret.jsx` is in `NAV_ELEMENTS`.
     - `to` comes from the same-line jsx `props.to`, or from the call's `props.to` / args[0].
     - The lookup is this function's own same-line lookup. `_a3_fe_forms._nav` refuses ctx-ed siblings.
  2. throw.
  3. render: `ret.jsx` is set.
  4. merged into its call (see above).
  5. return.
- jsx rows: navigate when the tag is in `NAV_ELEMENTS`, else render.
- call and new rows:
  1. navigate, any of:
     - the callee equals a name bound by a `NAV_BINDERS` call
     - the base is bound by a `NAV_ROUTER_BINDERS` call and the leaf is in `NAV_ROUTER_METHODS`
     - the callee is in `NAV_STATIC`
     - an undotted callee is in `NAV_CALLS`
     - `NAV_PLATFORM` fullmatches.
  2. retry: the leaf is in `MUTATE_CALLS|REFETCH_MEMBERS` and it is the same request as the receiver.
     - "Same request" means the callee base equals the receiver base, or both names were bound by the same call row.
     - Example: `const {error, refetch} = useMe()`.
     - Also: `_fetch_call(r)` resolves through `reach.endpoint` to a key in the site's own `endpoints`.
  3. refresh:
     - leaf in `INVALIDATE_CALLS` gives `how: invalidate`
     - leaf in `CACHE_WRITE_CALLS|SEED_CALLS` gives `how: write`
     - leaf in `REFETCH_MEMBERS` on another base gives `how: refetch`.
  4. request: `_fetch_call(r)` is not None, or a dotted `MUTATE_CALLS` leaf on another base.
  5. message: an undotted callee bound by a `MESSAGE_BINDERS` call.
     - When the roster names a member, the bound member must match.
  6. surface: the base is in `SURFACE_CALLS`, and the callee equals the base or the leaf is in `SURFACE_LEVELS`.
  7. state, any of:
     - the callee is index 1 of a `STATE_BINDERS` bind list
     - its binder `_resolve`s to an id in `store_ids`, the fe structure arm's proven `kind:"store"` pieces, passed in
     - `STORAGE_WRITES` fullmatches.
  8. log: `LOG_CALLS` fullmatches.
  9. other: always emitted with `callee` and `args`.
- The guiding rules:
  - `retry` is claimed only when the same request is provably re-sent. Everything else is `request` or `refresh`.
  - A class comes from a library binder or a library callee shape, never from the local name. `navigate`, `t`, `refetch` and `setX` are just locals.
  - The row always shows `callee` and `from`, so the reader sees both the idiom and its provenance.
  - Matching is by leaf or shape with no binding disproof. This is consistent with every existing roster in `_a3_forms_fe.py`. `NAV_THROWS` and `INVALIDATE_CALLS` are leaf-matched today.

**State words (`does_state`), evaluated in this order**
- `read`: at least one row was kept.
- `mixed`: rows were kept, but a later comparison with the same left · op · value, equal guards, equal after and non-diverging ctx exists in the body.
  - The walker matches a branch by its condition's text and cannot split two such branches.
  - The name `shared` is avoided on purpose. The lab already uses `shared` for endings that share one site.
- `empty`: rows were structurally inside but every one was a cmp or let.
- `returned`: no own row, and a `ret` row with equal guards and ctx, at a line <= the site's, whose `value` text contains `site.left` exists.
  - The comparison is the function's return value and its callers decide what happens. This is not followed.
  - It is this part's spelling of `beyond one level`. The operator may prefer that phrase.
- `unread`: no own row, and a guard at or below the site is >= 120 characters (the extractor's silent clip) or the body is `truncated`.
- `no-rows`: no own row otherwise.
  - Either the comparison feeds a value (a const, a ternary of literals), or its branch holds only statements the walker emits no row for: an assignment, a `yield`, a `continue`.
  - The walker cannot tell these apart without an extractor change.
  - This replaces the word `value`'s over-claim for does. `branch:"value"` itself is untouched.

**What is honestly not read, and said so**
- The else arm, the fall-through of a `!==` site, and exits routed to `rest` get no does. There is no site to hang them on.
- An early-exit inversion (`if (s !== 409) return; …`) is not followed.
- `switch (err.status)` emits no cmp row, so there is no site. This is a pre-existing blind spot.
- A textually negated pred such as `!(e.status === 409)` still matches. This is residual: the word has the same flaw. One optional line checks that `pred[:m.start()]` does not end in `!(`.

## Rosters

Add one block to `/home/khujta/projects/gabe_lens/templates/center/generators/_a3_forms_fe.py` after `REASON_MEMBERS` (:39). It is data only, about 16 lines, taking the file from 56 to about 72.

```python
# ── what a reason branch does (Slice 11e) ───────────────────────────────────────
DOES_CLASSES = ("navigate", "throw", "render", "return", "retry", "refresh", "request", "message", "surface", "state", "log", "other")   # ladder order
DOES_STATES = ("read", "mixed", "empty", "returned", "no-rows", "unread")
DOES_CAP = 24
NAV_BINDERS = frozenset({"useNavigate"})                   # react-router v6/v7 · @tanstack/react-router: const navigate = useNavigate(); navigate("/x") / navigate({ to })
NAV_ROUTER_BINDERS = frozenset({"useRouter"})              # next/navigation · next/router · @tanstack/react-router
NAV_ROUTER_METHODS = frozenset({"push", "replace", "navigate"})   # next: router.push/replace · TanStack: router.navigate({ to })
NAV_CALLS = frozenset({"redirect", "permanentRedirect"})   # next/navigation: CALLED, not thrown; the thrown TanStack redirect stays NAV_THROWS
NAV_STATIC = frozenset({"NextResponse.redirect", "Response.redirect"})   # next/server route handlers · the Fetch API static
NAV_PLATFORM = r"(?:window\.)?location\.(?:assign|replace|reload)"          # DOM Location (location.href = … is an assignment: no flow row)
REFETCH_MEMBERS = frozenset({"refetch"})                   # @tanstack/query-core QueryObserverResult.refetch
MESSAGE_BINDERS = {"useTranslations": None, "useTranslation": "t"}       # next-intl: the bound value IS t · react-i18next: the destructured member t
SURFACE_CALLS = frozenset({"toast"})                        # the export sonner · react-hot-toast · react-toastify share: toast(msg) and toast.<level>(msg)
SURFACE_LEVELS = frozenset({"error", "success", "warning", "warn", "info", "message", "loading"})   # sonner levels + react-toastify's warn
STATE_BINDERS = frozenset({"useState", "useReducer"})       # react: index 1 of the bound pair is the setter / dispatch
LOG_CALLS = r"console\.(?:error|warn|info|log|debug)"      # the Console API
```

**Existing rosters reused, matched by leaf exactly as `_a3_fe_forms`/`_a3_fe_controls` already do**
- `NAV_ELEMENTS`, `NAV_THROWS` (:8-9)
- `INVALIDATE_CALLS` (:26)
- `SEED_CALLS` (:27)
- `CACHE_WRITE_CALLS` (:35)
- `MUTATE_CALLS` (:38)
- `STORAGE_WRITES` (:34)
- `REASON_MEMBERS` (:39)

**Evidence in the four study apps**
- Read this session: the four `package.json` files.
- From the readers: call sites.
- Present and used in a reason branch or its body:
  - react-router-dom ^7.18.1 (gustify)
  - @tanstack/react-router ^1.169.2 (gastify)
  - next 16.3.3 (tier3) and next 16.2.10 (keypro):
    - `NextResponse.redirect` at tier3 `auth/oauth/callback/route.ts:37`
    - `router.push` at tier3 connector `page.tsx:170`
  - next-intl ^4.13.7 (tier3):
    - `const t = useTranslations("auth")`, `lib/auth/components.tsx:47`
  - @tanstack/react-query (gustify ^5.62, gastify ^5.100.10)
  - react `useState`
  - `console.*`
  - `window.location.reload()` (gustify `SettingsContainer`).
- Cited to a public package API only. No study app depends on the package, so these are unverified locally:
  - sonner, react-hot-toast, react-toastify (`SURFACE_*`)
  - react-i18next (`useTranslation`).
- tier3's 135-file `toast` is its own design-system store, imported from `@opal/layouts`.
  - tsconfig paths `@opal/*` make it in-repo.
  - It matches the shape, and its row will say `from: fe:…#toast`.
  - That is the honest reading: a project module with the library's shape.

**Deliberately left out**
- Any project-local name. These are never rostered:
  - signOut, pushToast, writeModesCache, setRollbackNotice, isApiError, useT (gustify)
  - translate, uploadFailed (gastify)
  - logout, readError, errorDetail, authErrorRedirect, finishConnectorDeletion, writeExportIdToUrl, setSessionFetchError (tier3)
  - isUniqueViolation (keypro).
- `t`, `translate`, `i18n.t`, `formatMessage` by name.
  - A one-letter local means three different things across the apps.
  - react-intl's `useIntl().formatMessage` is in no study app. Add it when a target uses it.
- Error class names such as RedirectError and RateLimitedError. They are data on a throw row (`callee`), never a roster.
- SWR's bare `mutate(key)`.
  - It collides with the `MUTATE_CALLS` leaf.
  - Refresh inside a reason branch measured zero across all four apps.
- react-router v5 `useHistory`. It is in no app.
- `alert`/`confirm`. Not found.
- Store action names.
  - `state` comes from `STATE_BINDERS` or the fe arm's proven `kind:"store"` pieces.
  - It never comes from a `set*` name pattern.
- The `setTimeout + continue` retry shape, `location.href =` and `yield`. The extractor emits no row for `continue`, assignment or `yield`.

**V40a**
- V40a (amendment-1.md:1149) stays struck. `NAV_BINDERS` classifies a does row. It does not build the nav-hook guard. D29 must say so.

## Code plan

Smallest change first. All paths are under `/home/khujta/projects/gabe_lens/templates/center/generators/`. No new module, so `propagate.sh` takes its update-only path.

**1. `_a3_forms_fe.py`**
- After :39, add the roster block. About 16 lines.

**2. `_a3_forms_build.py:394`**
- One edit: pass a sixth argument to `FER.reason_part(...)`:
  - `{p["id"] for p in (fe or {}).get("pieces") or [] if p.get("kind") == "store"}`
- `:408 built` and `_a3_forms.py:312` are not touched. `does` is not a registered part.

**3. `_a3_fe_reason.py`**
- 291 lines today, about 375 after, against a budget of 800.

**3a. Constants, after :45**
- `READ_M_RX = re.compile(r"\.(" + "|".join(FF.REASON_MEMBERS) + r")\b")`. `READ_RX` is left untouched.
- `STORAGE_RX`, `NAV_PLATFORM_RX`, `LOG_RX`, compiled from the rosters.
- `LIT_RX`: a whole quoted literal, in `"`, `'` or a backtick, with no `${`.

**3b. :75-78 becomes two functions**
- `_pat(site: dict) -> re.Pattern`:
  - Today's expression with `(?P<lit>…)` around the literal alternative.
  - For an int `right` the literal alternative is `re.escape(str(v)) + r"\b"`, the same language as :76.
  - For a str `right` it is the quoted form.
- `_inside(rows, site) -> tuple[re.Pattern, list, list]` returns `(pat, later, inside)`, with `later`/`inside` exactly as :77-78.

**3c. `_branch(later: list, inside: list, recv: str) -> str`**
- The body is old :79-86, verbatim.
- This is the safety property. Every word-dependent assert passes unchanged: F13 :271/:274/:279/:281, F14 :301/:308, and the finding at :278.

**3d. New helpers**
- `_binders(rows) -> dict`:
  - Built from every `call` row with `binds`.
  - Maps the local name to `(binder callee, member, index, binder row line)`.
  - Rename form: `member:alias` gives local = alias.
  - A name bound by two different callees is dropped as ambiguous.
- `_params(body) -> set`:
  - String params plus the locals of destructured lists.
- `_from(base, binders, params, bindings, file, local) -> str|None`, with precedence:
  1. bind
  2. param
  3. `_resolve`'s `fe:`/`ext:`
  4. None.
- `_does_row(r, sibs, recv, eps, reach, binders, params, bindings, file, local, stores) -> dict`:
  - The class ladder plus the per-class keys and the optional decorations.
- `_does(rows, body, site, pat, inside, recv, eps, reach, file, stores) -> tuple[list, str, bool, int]`:
  - Runs the structural `own()` test and the skip/merge pass, in row order.
  - Applies the cap, then computes the state.
  - Returns `(does, state, narrowed, more)`.
  - `_fetch_call` (:118) and `reach.endpoint` (:160) are reused as they are.

**3e. `reason_part` signature, :237**
- Add `store_ids: set | None = None`.
- The battery's four-argument `reason()` helper keeps working. With None, a store-bound call reads as `other`.

**3f. The site loop, :257-262**
- The order of edits matters. `does` needs `s["endpoints"]` for the retry-by-endpoint rule.
```python
pat, later, inside = _inside(rows, r)            # lifted ABOVE the member test: detail/code sites get does too
if member == "status":
    s["branch"] = _branch(later, inside, recv)   # unchanged word
…origins / endpoints exactly as today…
if r.get("ctx"): s["ctx"] = list(r["ctx"])
s["does"], s["does_state"], nar, more = _does(rows, body, r, pat, inside, recv, s["endpoints"], reach, file, store_ids or set())
if more: s["does_more"] = more
```

**3g. Stats, :287-289**
- Add `"does": {"rows", "narrowed", "sites": {state: n for FF.DOES_STATES}, "classes": {c: n for FF.DOES_CLASSES}}`.

**3h. Docstring, :20-22**
- Extend it with the does contract:
  - the selection
  - the state words
  - no ids
  - the word is never recomputed from does.

**Not changed**
- `_a3_fe_extract.mjs`. There is no re-freeze for extractor reasons, and `tests/frontend` is untouched.
- `_a3_forms.py`: no FINDINGS change and no ARMS change.
- `form_drift.py`, `mapquery.py` and the example `forms.json` (`regen-example.sh:38` pins arms none).
- The CLAUDE.md capability table. There is no skill version bump.

**Docs, in the same commit**
- `/home/khujta/projects/gabe_lens/templates/center/generators/README.md:60`: extend the `_a3_fe_reason` clause with:
  - "and what each branch does: the call with its literal arguments, the value returned, the element rendered, a navigation, a retry, a cache refresh — each classed against library idioms, `other` when none matches".
- `/home/khujta/projects/gabe_lens/CLAUDE.md:66`: one "Slice 11e" sentence after the Slice 11d sentence.
- `/home/khujta/projects/gabe_lens/docs/design/element-forms/amendment-1.md`:
  - an "as built, Slice 11e" block under :1214 in the 11c shape: Capture · Classification · Not built · Goldens on gustify
  - D29 after :1429
  - an added "Not built" line at :1212.
- `/home/khujta/projects/gabe_lens/docs/design/element-forms/goldens/render-acceptance.py:8-10`: add `"11e": "frontend · reason does"` to `ARM`.

**D29, in the house form**
- CHOSE:
  - keys inside the reason part
  - rows addressed by `at` and order (V33)
  - no finding
  - `branch` and every prior key untouched.
- ASSUMED:
  - a then-arm row carries the comparison's own guards plus the condition (`_a3_fe_extract.mjs:366-375`, `:417-421`)
  - no target needs react-intl, SWR revalidation or an assignment row to be read usefully.
- BREAKS IF:
  - `narrowed` or `no-rows` dominate a dry run. Then the extractor needs a branch ordinal and assign/yield/continue rows, which forces a re-freeze under F16.
  - Or the operator wants `branch` recomputed from the narrowed rows. That moves `reason-collapsed` counts and gets its own commit.

## Battery

All of this lives in `/home/khujta/projects/gabe_lens/tests/forms-frontend/run.sh`, in the house style: `py "<Fn> · FIRE…; SILENT on…"`, `at(rel, text)` for lines, in-memory mutants on a deep copy that must flip the verdict. The highest case id today is F20.

**Fixture**
- Add one file, `tests/forms-frontend/fixture/src/routes/SetupFailure.tsx`. It is mounted nowhere, has no button or anchor and no `<Navigate>`, so the guards, controls and router counts stay put.
- A component `SetupFailure` binds:
  - `useCompleteSetup`, `useMe`, `useNavigate`, `useQueryClient`
  - `useTranslations("setup")`
  - `useState`
  - an import of `toast` from "sonner"
  - `const LOCKED = 423`.
- Inside `const onFail = () => {…}` it holds three branches on `complete.error?.status`:
  - 401: `navigate("/login"); return;`
  - LOCKED: `complete.mutate({});`
  - 500, in this order:
    - `toast.error(t("failed"));`
    - `queryClient.invalidateQueries({queryKey:["me"]});`
    - `me.refetch();`
    - `setNote("failed");`
    - `console.warn("setup failed");`
    - `void fetch("/api/v1/me");`
    - `setTimeout(() => setNote(null), 10);`
    - `throw new Error("failed");`
- Statuses 401, 423 and 500 are all produced by `FORMS_R`'s POST /setup/complete, and none is the shared 409. So no new finding fires and F14 stays as it is.
- Re-freeze `flow.frozen.json` with F16's own command (run.sh:378).

**Existing asserts that move; reconcile them on the OLD generator first**
- F8 :152: `len(sites) == 14` becomes 17.
- F13 :291: `rs` sites, reads_status, joined, routed and rest.
  - Predicted: 17 · 14 · 14 · 12 · 13.
  - Confirm by the run.
- F13 :286: `sorted(rd)` gains `("SetupFailure", "complete.error")`.
- F9: add `json.dumps(reason(), sort_keys=True) == json.dumps(reason(), sort_keys=True)`.

**F21 · what each branch does, from the REAL capture**
- FIRE:
  - (a) SetupForm 409 at `error.status === 409) return`: does == one `return` row with `literal "setup in progress"`.
  - (b) conflictMessage 409: a `return` row with `reads == ["detail"]`. `branch` is still `reads`.
  - (c) ErrorBody `error.code === "setup_locked"`: exactly one `render` row, `tag "p"`, `k "ret"`. The same-line jsx row is merged.
  - (d) The detail site `"consent required"`: `literal "consent"`. This proves the quoted pattern, so a detail or code site gets rows.
  - (e) RequireSetup:
    - `[other · callee signOut · from "bind:useAuth"]`
    - site `ctx == ["callback:useEffect"]`
    - `pushToast` is absent, because its guard is negated.
  - (f) SetupFailure:
    - 401: `[navigate to "/login" from "bind:useNavigate", return bare:true]`.
    - LOCKED: `[retry how "mutate" by "name"]`.
    - 500: classes in order `[surface, message, refresh, refresh, state, log, request, other, state, throw]`, with:
      - message `key "failed"`, `from "bind:useTranslations"`
      - refresh[0] `how invalidate`, `key ["me"]`
      - refresh[1] `how refetch`
      - request `GET /api/v1/me`, `endpoint "endpoint:GET /me"`
      - the second state row has `in == ["callback:setTimeout"]`
      - throw has `callee "Error"`, `args ["failed"]`, and no separate `new` row.
- SILENT:
  - `me.error.status === 401` (a const): `[]` plus `no-rows`.
  - Both `errors.ts` sites: `returned`.
  - The session store: `no-rows`.
  - No site in `client.ts`.
  - Every row class is in `FF.DOES_CLASSES`.
  - Every site has a `does_state` in `FF.DOES_STATES`.
  - `does_state in (read, mixed)` exactly when `len(does) > 0`.
- Mutants, by JSON round-trip on the SetupFailure body:
  - `"useNavigate"`→`"useNav"`: navigate flips to other. The class comes from the binder, never from the name `navigate`.
  - fetch path → `/api/v1/setup/complete` plus `props.method POST`: request flips to retry with `how fetch`.
  - `complete.mutate`→`save.mutate`: retry flips to request.
  - `toast.error`→`notify.error`: surface flips to other.
  - `useTranslations`→`useT`: message flips to other with `args` kept. This is the gustify shape.

**F22 · selection and state words, FIRE+SILENT, all transplants of REAL rows**
- (a) Copy the 401 branch's rows into a sibling `callback:onRetry` with a different action.
  - The first site's does excludes it.
  - `FER._inside` still holds it, and `narrowed == 1`.
- (b) A later identical `if` whose rows carry the first's pred negated in `after` is excluded.
- (c) A later non-exiting twin with equal guards and after: the earlier site reads `mixed`, the later reads `read`.
- (d) By name:
  - the LOCKED row is absent from the 401 site and present on the LOCKED site with `by "name"`
  - rewriting the guard text to `=== 423` makes `by` disappear.
- (e) Cut the 401 guard pred to 120 characters with the comparison lost: `[]` plus `unread`.
- (f) A branch holding only a nested cmp: `empty`.
- (g) `truncated:true` with no rows: `unread`.
- (h) A `neg:true` guard never enters does.
- (i) 30 transplanted rows: `len(does) == 24` and `does_more == 6`.

**F23 · the word is untouched**
- `{at: branch}` of the 14 original sites equals the words F13 and F14 already assert.
- Under F22(a), with a planted twin row reading `.detail`:
  - the first site's `branch` flips to `reads`, which is today's behaviour, kept
  - no row of its does carries `reads`
  - so does narrowing never leaks into the word.
- The site key set minus `{does, does_state, does_more, ctx}` is a subset of the 11 prior keys.
- The stats keys are the nine plus `does`.

**Source mutants (hand-applied, each must turn the named case red, then reverted; record in the commit)**
- S1: `own()` returns True. F22 a, b, d go red.
- S2: drop the nearest-preceding clause. F22 d goes red.
- S3: `_pat` unquoted for str. F21 d goes red.
- S4: the ladder always returns other. F21 goes red.
- S5: the word computed from the narrowed rows. F23 goes red.
- S6: skip the merge pass. F21 c and f go red.

**Goldens**
- File: `/home/khujta/projects/gabe_lens/docs/design/element-forms/goldens/expected.json`, slice `"11e"`.
- Every source below was read this session.
- `does-setupscreen-409` (V):
  - get: `frontend.reasons.sites` where `at` = `apps/web/src/features/auth/SetupScreen.tsx:43` → first → does → first → args
  - eq `["auth.setup.error.in_progress"]`.
- `does-requiresetup-signout` (V):
  - get: the site at `apps/web/src/routes/RequireSetup.tsx:38` → does → pluck callee
  - has `signOut`
  - and `from` eq `bind:useAuth`.
- `does-cooking-403-literal` (V):
  - get: the site at `apps/web/src/features/cooking/cookingSessionModel.ts:381` → does → first → literal
  - eq `cooking.error.start_allergen`.
- `does-isclienterror-returned` (P):
  - get: the site at `apps/web/src/lib/api/errors.ts:73` → `does_state`
  - eq `returned`.
- `does-stats` (U):
  - `arms.frontend.stats.reason.does.rows` exists.

**Landing-time law proof (not a permanent case)**
- A committed "before" file would become tautological after its first re-bless, so this is done once at landing.
- On the re-frozen flow, dump `reason()` with the OLD generator.
- After the edit, strip `does`, `does_state`, `does_more` and `ctx` from the sites and `does` from the stats.
- The `json.dumps(sort_keys=True)` outputs must be equal.
- Record "N sites · 0 prior keys differ" in the commit message.

## What the endpoint lab reads

This is a separate commit that closes leftovers piece 10. Its definition of done: facts generated, never typed; corrections made with existing components only; the probe can fail. How the card finally shows a fact is decided by seeing, not here.

**1. `/home/khujta/projects/gabe_lens/docs/design/workflow-panel/_ep_joins.py:278`**
- `does` already passes through via `st.get("does")`.
- Add:
  - `"does_state": st.get("does_state")`
  - `"does_more": st.get("does_more")`
  - `"branch": st.get("branch")`
  - `"site_ctx": st.get("ctx")`.
- A `rest` route has no site, so all of them stay None.
- What the general case does is not read by this part. The lab should say so, not leave a blank.
- Add `n.does_rows` per reader. Its smallest · middle · largest over the 80 endpoints is the inventory row this piece owes.

**2. `/home/khujta/projects/gabe_lens/docs/design/workflow-panel/_lab-ep-panels.js:2835`**
- This line must change in the same commit that regenerates the facts.
  - `String(rt.does)` on a list of dicts prints `[object Object]`.
  - `[]` is truthy in JS, so it prints an empty row.
- Replace it with a `doesWords(rt)` row, gated on `rt.own_branch`.
- When `does_state` is undefined, the feed predates the reading. Say "not read — this feed predates the reading" (not_emitted).
- For `read`/`mixed`, join one phrase per row with " · ". One neutral phrase per class:
  - navigate: goes to “<to>”; with no target: "leaves the screen, target not read"
  - throw: throws <callee>
  - render: shows <tag>
  - return: gives back “<literal>” · null · nothing (bare) · <value>
  - message: message “<key>”
  - surface: shows a notice (<callee>)
  - state: sets state (<callee>)
  - refresh: refreshes <key>
  - retry: sends the request again
  - request: calls <method> <path>
  - log: writes to the console
  - other: calls <callee>(“<args[0]>”).
- Append to the phrase:
  - "and returns it" on `returned`
  - "later, inside <in>" on `in`
  - "only when <when>" on `when`
  - "(matched by a named constant)" on `by`.
- For `mixed`, append "two checks with the same text share these lines".
- For the no-row states:
  - `returned`: the check is handed back to its caller. What happens next is decided there and is not followed.
  - `no-rows`: nothing the reading can see happens under this check. It feeds a value, or the branch only assigns.
  - `unread`: a condition here was too long to read.
  - `empty`: the branch only compares again.
- For `does_more`, show "+N more".

**3. The sentence at :2831**
- It hard-codes "it reads the <reads> only".
- With the feed it can be measured: any does row with `reads` means "its branch reads the detail". This is the same evidence as `branch:"reads"`.

**4. `/home/khujta/projects/gabe_lens/docs/design/workflow-panel/probe-eplab.mjs`**
- Add one assert near :2695: on POST /setup/complete's 409 ending, the drawn "what it does" text contains `auth.setup.error.in_progress`.
- Add one mutant: blank `does` in the facts, and the assert flips.

**5. Feed**
- The lab needs an all-arms-on gustify build.
  - Command: `scripts/forms-dryrun.sh --arms all gustify`. Run it alone.
  - Then copy `~/.cache/gabe-map-baselines/.check/gustify/forms.json`.
- Then run `python3 docs/design/workflow-panel/gen-endpoint-facts.py --forms <that file>`.
- Expected on the lab's endpoint:
  - Both 409 endings share the one site at SetupScreen.tsx:43.
  - Its does is `other · t("auth.setup.error.in_progress") · returned`.
  - So the record reads "calls t(“auth.setup.error.in_progress”) and returns it" for both.
  - This is the fact behind `reason-collapsed`, now visible as what the client does.

## Landing order

1. 0 · Pre-flight: `git -C /home/khujta/projects/gabe_lens log -1`; `df -h /mnt/c` (alarm under 40 GB free); `du -sh /var/log` (alarm over 2 GB); `ps -eo stat,comm | awk '$1 ~ /^D/'` and confirm no other heavy job is running. COST: seconds. PASS: clean tree on graft-adoption, headroom OK, nothing else building.
2. 1 · Spec first, because suite changes get a draft and an explicit 'land it'. In /home/khujta/projects/gabe_lens/docs/design/element-forms/amendment-1.md: a draft Slice 11e block under :1214; DECISION D29 after :1429; a note at :1149 that V40a stays struck; no change to the §A1 arms row (:76) or the id row (:115), since `does` is not a part and mints no letter. COST: writing only. PASS: the operator says go on D29 — inside the reason part, no ids, no finding, `branch` untouched, the class list, the state words.
3. 2 · OLD-code feeds for the 'existing keys keep their values' proof: `bash scripts/forms-dryrun.sh --arms frontend gustify`, then `cp ~/.cache/gabe-map-baselines/.check/gustify/forms.json <scratch>/old.gustify.json`; repeat serially for gastify, tier3, keypro. COST: two builds per target (gustify ≈1 min a build, tier3 ≈2); about 10–12 min total; run ALONE. PASS: each prints 'on vs off: forms.json moved — OK'. Cheaper variant: gustify and tier3 only (12 and 45 of the 61 sites).
4. 3 · Fixture: write tests/forms-frontend/fixture/src/routes/SetupFailure.tsx. Re-freeze with F16's own command (run.sh:378): `GABE_TS_DIR=<gustify apps/web or gastify web> GABE_FE_FLOW=1 node templates/center/generators/_a3_fe_extract.mjs tests/forms-frontend/fixture tests/forms-frontend/flow.frozen.json tests/forms-frontend/fixture`. COST: one node run over ~35 files, seconds, run alone. PASS: `git diff --stat` shows only the new .tsx and flow.frozen.json.
5. 4 · Reconcile fixture churn on the OLD generator: `bash tests/forms-frontend/run.sh`. Expected reds are only F8 :152 (14→17 sites) and F13 :286/:291 (the new reader tuple and the moved counts). Update those asserts and re-run to green. Then dump `reason()` on the new frozen flow to `<scratch>/reasons.old.json` with a 5-line python using the battery prelude. COST: not stated anywhere in the repo; about 20 python subprocesses plus 2 node runs, estimated under a minute (unverified). PASS: all passed, 0 failed, F16 not skipped. If any OTHER case goes red, the fixture file disturbed a part it should not have; simplify the file before going on.
6. 5 · Rosters: templates/center/generators/_a3_forms_fe.py, add the Slice 11e block after :39 (56 → about 72 lines). COST: none. PASS: data only, flat, no import.
7. 6 · Generator: templates/center/generators/_a3_fe_reason.py — `_pat`, `_inside`, `_branch` body verbatim, `_binders`, `_params`, `_from`, `_does_row`, `_does`, the site-loop edit at :257-262, stats at :287, the docstring; 291 → about 375 lines. Plus the one-line sixth argument at _a3_forms_build.py:394. COST: none. PASS: `python3 -c 'import _a3_fe_reason'` with PYTHONPATH set to the generators directory.
8. 7 · Unit law proof: dump NEW `reason()` on the same flow; strip `does`, `does_state`, `does_more` and `ctx` from the sites and `does` from the stats; compare `json.dumps(sort_keys=True)` with reasons.old.json. COST: seconds. PASS: byte-equal; record 'N sites · 0 prior keys differ'.
9. 8 · Battery: add F21, F22 and F23, extend F9 and F13 in tests/forms-frontend/run.sh (395 → about 460 lines); `bash tests/forms-frontend/run.sh`. Then hand-apply source mutants S1–S6 one at a time; each must turn its named case red; revert each. COST: about a minute per run (estimate). PASS: green with F16 LIVE not skipped; six mutants killed and listed for the commit message.
10. 9 · Neighbour batteries, serially: `bash tests/forms-core/run.sh` (seconds), then `bash tests/center/run.sh`. COST: tests/center runs several full centre builds, so minutes, and it must run ALONE. PASS: both green. tests/center :445-455 proves arms only add on endpoints, and :411 proves a raising extend_frontend writes no frontend key.
11. 10 · `./install.sh`. COST: ≈5 s. PASS: exit 0. Without it suite-doctor reports template DRIFT (suite-doctor.sh:76-85).
12. 11 · NEW-code dry run on all four targets, serially and alone: `bash scripts/forms-dryrun.sh --arms frontend <name>`, copying each `.check/<name>/forms.json` to `<scratch>/new.<name>.json`. COST: about 10–12 min. PASS, part one: arms none stays BYTE-IDENTICAL against the blessed baseline, and with arms on only forms.json moves. PASS, part two, a seconds-long strip-and-diff per target: `frontend.reasons` with the does keys stripped equals OLD, and everything else equals OLD except `arms.frontend.stats.reason.does` and `arms.frontend.bytes`. `bytes` is a size measure and the one prior key that legitimately moves. Record per target: sites · rows · the six states · the twelve classes · narrowed.
13. 12 · Read the numbers before trusting them. Open about 10 tier3 sites and check that rows match source. If `narrowed` is more than a handful, or `no-rows` is most of the former `value` sites, that is the BREAKS-IF in D29: say so in the commit and do not tune rosters to the targets.
14. 13 · Goldens: add the five `11e` goldens to docs/design/element-forms/goldens/expected.json; add `"11e"` to the ARM dict at render-acceptance.py:8-10; `python3 docs/design/element-forms/goldens/check-goldens.py <scratch>/new.gustify.json --slice 11e`; then re-render acceptance.html with render-acceptance.py. COST: seconds. PASS: every 11e golden MATCH, none MISMATCH or MISSING; the two 11c goldens still MATCH.
15. 14 · Docs: extend the `_a3_fe_reason` clause at templates/center/generators/README.md:60; add the Slice 11e sentence at CLAUDE.md:66; finalise the amendment's as-built block with the measured numbers. COST: none. PASS: no capability-table or version change, so doctor parity is unaffected.
16. 15 · `bash scripts/suite-doctor.sh`. COST: ≈5–6 min (46 batteries, eight of them launch a browser), ALONE. PASS: CLEAN, with no 'SKIPPED coverage' INFO for forms-frontend.
17. 16 · Commit by explicit path, `git log -1` before and after (a concurrent `git add -A` has swallowed a commit on this branch before). The message carries the unit proof, the per-target numbers, the six mutants and the line counts (_a3_fe_reason.py ≈375, run.sh ≈460, all under 800). Trailer: Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>.
18. 17 · Twins: `bash templates/center/generators/propagate.sh <twin-root> --check` (seconds, writes nothing), then the real run per twin. COST: minutes each, because it runs `<twin>/scripts/refresh_center.sh regen`. Both changed generators already exist on the twins, so this is the update-only path. Push and PR are the operator's.
19. 18 · Lab carry, in its own commit closing leftovers piece 10: an all-arms gustify feed (`forms-dryrun.sh --arms all gustify`, ≈2 min, alone) → gen-endpoint-facts.py --forms → _ep_joins.py:278 + _lab-ep-panels.js:2835 + the probe assert and mutant in probe-eplab.mjs. COST: the probe is browser-gated, minutes, alone. PASS: the 409 ending's record shows the call and its key, read off the feed; the probe fails on the blanked-does mutant; the inventory row carries smallest · middle · largest does rows over the 80 endpoints.

## Risks

- `branch` and `does` can disagree by design. `does` is the structurally narrowed subset of the word's textual `inside`, so a site can read `branch: reads` while no does row carries `reads`. This exposes a pre-existing over-capture in the word: a body-wide text match, no ctx filter, and a named-constant alternation that lets `x.status === TEAPOT` match every site on that left. Recomputing the word from the narrowed rows is more correct, but it can add or remove `reason-collapsed` findings and the two 11c goldens. It needs its own ruling and commit, never this one. The `narrowed` stat is the evidence for that ruling.
- The structural test (`own()`) rests on the extractor threading guards, after and ctx as read at _a3_fe_extract.mjs:366-375 and :417-421 for if, ternary and &&-JSX. It was read, not run. Switch cases synthesise guards and emit no cmp row, so they never reach it. A construct that pushes rows with a different guard depth would silently drop real rows into `no-rows`. F22 and the per-target `narrowed` count are the tripwires.
- Known mis-attributions that remain, each flagged on the row or site. Non-exiting sequential twins read `mixed`. A by-name row goes to the nearest preceding comparison, which is wrong when a value-only comparison of the same left·op sits between a named `if` and its rows. A comparison inside a callback in the condition loses branch rows that sit in another callback, because ctx diverges. A textually negated pred such as `!(e.status === 409)` still matches.
- The extractor emits no row for an assignment, a `yield`, or `continue`/`break`. tier3's `errorMsg = t(…)` followed by a later `toast.error(errorMsg)` reads as a message row only, because the toast sits outside the branch. svcSS.ts:68's default-object substitution, services/lib.tsx's yielded packet and apiServices.ts:272's retry loop read `no-rows` or a lone `other: setTimeout`. `no-rows` says this out loud, but the true doing is invisible until the extractor grows those kinds. That would mean re-freezing flow.frozen.json and re-running tests/frontend.
- The 15 `value` sites stay one hop short. A predicate function reads `returned`; a const predicate reads `no-rows`. The const's name is unknowable because a non-call, non-alias initializer emits no row. Following the caller's `if (isX(error))` branch is a second walk and is deliberately not built. If `returned` plus `no-rows` is most of a target, the operator may read that as the part being empty.
- `surface` and `useTranslation` are cited to packages that no study app installs (sonner, react-hot-toast, react-toastify, react-i18next). The four package.json files were read this session. They are justified by public API shape only. tier3's 135-file `toast` is a project module. The expectation that its rows carry `from: fe:…#toast` through the tsconfig `@opal/*` paths was not confirmed by any capture: tier3 has no node_modules and is parsed with a borrowed typescript.
- Matching is by leaf or shape with no binding disproof, the same as every existing roster. A project function named `toast` or `redirect` is therefore classed as the library idiom. The `from` key is the only tell. If the operator wants a project binding to disprove the idiom, tier3's toasts become `other`.
- `message` is zero on gustify and gastify by construction, because both have project-local i18n (`useT`, `translate`). The marquee lab example (SetupScreen.tsx:43) is class `other` with the key in `args`. The lab must render `other` rows with their first literal argument or the fact is lost.
- Battery count churn from the new fixture file is predicted, not measured: sites 17, routed 12, rest 13, and no new finding, because 401, 423 and 500 are all produced by FORMS_R and none is the shared 409. If the file disturbs guards, hooks, controls or stores counts, simplify the file first. The predicted does[] for the 14 existing sites (10 read · 2 returned · 2 no-rows; classes return 8 · render 1 · other 1) is a source reading, not a run.
- F16 LIVE needs a resolvable typescript (run.sh:15-19 looks in gustify apps/web and gastify web). Without one the re-freeze cannot be made and suite-doctor reports SKIPPED coverage, which is not a full CLEAN. The re-freeze is a node run and must not overlap any other heavy job on this WSL box.
- `arms.frontend.bytes` and forms.json's size change when the keys are added. They are the only prior values that move, and D29 must say so or the 'existing keys keep their values' claim reads as broken. Per-site payload is bounded by DOES_CAP 24. tier3's 45 sites are the largest expected growth. Bytes were not measured.
- The lab half is wired to a string today (`String(rt.does)` at _lab-ep-panels.js:2835, passthrough at _ep_joins.py:278). A facts regen from a new feed without the lab edit prints `[object Object]`, and an empty list prints a blank row because `[]` is truthy in JS. The two must land together in step 18.
- About 5% of sites are not API reasons (gastify useScanToDraft.ts:67, gustify recipeFacetOptions.ts:167, keypro's SQLSTATE comparison in a backend adapter typed as a `fe:` piece). They will carry does rows or `returned`. They are harmless, since they reach no endpoint and route nothing, but they count in the stats.
- Adding `useNavigate` to a roster may be read as the V40a build trigger (amendment-1.md:1149). It is not: it classifies a does row and builds no guard row. This needs the operator's explicit word in D29.
- `returned` is a new state word beside the estate's `beyond one level`. The operator's state-word sweep may prefer the existing phrase. `mixed` was chosen because the lab already uses `shared` for endings that share one site.
- Nothing downstream reads frontend{} by design (D16): form_drift, pulse S20, review FORM DRIFT and gabe-map are all blind to it. No rail will notice if does[] regresses on a twin. Only tests/forms-frontend and the goldens protect it.
