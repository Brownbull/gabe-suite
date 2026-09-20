# Review plan — the leftovers program (pieces 1–8, 10's lab half, the two plans)

Written 2026-09-20 for the operator. About 70 minutes. The order is by consequence: what I WROTE comes before what I
GENERATED, because a generated fact is checked by the probe and a written sentence is checked by nobody but you.

Open `docs/design/workflow-panel/endpoint-lab.html` for steps 2 and 3.

## 1 · Read the sentences and rules I wrote — 15 min · the most important step

Everything else in the lab is read out of the feed and the probe recounts it. These are my judgement:

| what | where | the question |
|---|---|---|
| 36 lines: what is normal at each stage, per topic | the appendix below | would you say this of ANY endpoint of this kind? Strike a line that grades, or that is only true of this app |
| the words beside a count: the norm ≥ 9 in 10 · rare ≤ 1 in 10 · only here = 1 | `workflow-panel/_ep_pieces.py:65` | are these your thresholds? |
| the four roles of a function, and what lights each | `workflow-panel/_ep_joins.py:169` | is "it raises" enough to say a function DECIDES an ending? |
| "the route that gets through" = the success ending that passes the most checks | `workflow-panel/gen-endpoint-facts.py:219` | is that the route you mean? |
| why a test came here: tests this endpoint · only sets something up · through a helper · from the service side | the Tests part, any case chip | are these the four reasons, in your words? |

Two lines I already doubt: GATE · tables says "here the user row" (true of this app, not of the kind), and several lines
still say "door" and "lock" where the lab now says "endpoint" and "login check".

## 2 · See the five places where I touched a layout you had ruled — 15 min

For each: **keep · move · make it a switchable option**.

1. Data → Blocks → click `household_format_preferences`. The record has a FIFTH row, "found by" (yours had four).
2. Functions → Blocks → click `complete_setup`. Three new rows: does · inside · map facts.
3. Pick the path "first run". Under step 13 the call is ALWAYS open — eight rows inside it. I built no option to close it.
4. Pick a 409 ending, open its record. Two new sections: "in this app" and "on the client".
5. Header: hover the globe ("everything"), then the risk chip. The place in the app is on the first, not the second.

## 3 · Rule on piece 10, then land it or hold it — 20 min

Read only these parts of `docs/design/element-forms/plans/slice-11e-does.plan.md`: the worked example under "What is
written" · the class ladder and the six state words under "How a row is classed" · the first three risks and the two on rosters.

Then answer: a `useNavigate` roster (yes · no) · the word for "the caller decides" (`beyond one level` · `returned`) ·
`toast` as a library idiom (yes · no) · `useTranslation` with no app using it (yes · no) · **land it · hold**.

Before ruling, look at what it fills: in the lab, the 409 ending's "on the client" section says where the branch IS.
The generation part adds what the branch DOES. If that row would not change how you read an ending, hold it.

## 4 · Piece 11: decide WHEN, not how — 5 min

Read the worked example at the top of `docs/design/element-forms/plans/kinds-inflight.plan.md` and its first risk.
My recommendation: after piece 10 is landed and you have seen its row in the lab. It is about four days of work and
its own evaluation ranks it lowest of the three parts.

## 5 · Rate the new rows — 15 min

The rating sheet (Version 10): the rows marked (proposed). Every one now shows a real value from this endpoint, except
in-flight values. Paste the RATINGS text back as before; that unlocks M1 round 2.

## Skip

Probe counts, mutant runs, commit messages, the generator code, the two `.plan.json` files. Three corrected facts were
checked against the app's source on 2026-09-20: the handler is at `api/setup.py:183` and the file is 254 lines long ·
`main.py` registers Idempotency (:124), RateLimit (:127), CORS (:132), so they run in the reverse order · `RedirectIfSetupComplete.tsx` exists.

## Paste this back

```
REVIEW · leftovers
1 norms: ok | strike <topic · STAGE> …
1 thresholds: ok | <your numbers>
1 roles: ok | <change>
1 through-route: ok | <change>
2 found-by row: keep | move | option
2 function rows: keep | move | option
2 open call: keep | option
2 ending sections: keep | move | option
2 place card: everything | risk
3 piece 10: land it | hold · useNavigate y/n · word <…> · toast y/n · useTranslation y/n
4 piece 11: after 10 | now | drop
```

## Appendix — the 36 lines of step 1

**tables**

- EDGE — no table — the app band checks the request before any data is touched
- GATE — the rows the lock reads or creates to know who is knocking — here the user row, provisioned before the body is read
- INPUT — no table — the body is read and checked against its shape, not against the database
- HANDLER — the reads and writes the door's own code makes — every table it touches, in the order it touches them
- EFFECTS — the fate of each write, committed, still open or rolled back — decided by the ending
- ANSWER — no table — the reply is built from what was already read; nothing is touched here

**shapes**

- EDGE — no shape — the app band reads headers and the address, never the body
- GATE — the credential the lock expects — the header it rides on and the scheme it follows
- INPUT — the request shape — every field the body must carry, and the rules that refuse it
- HANDLER — the shapes the door's own code builds on the way — the values it hands to the functions it calls
- EFFECTS — the table shapes behind each write — the model a saved row has to fit
- ANSWER — the response shape of each ending — the body a success returns, the detail a refusal returns

**functions**

- EDGE — the app-wide steps — the middleware every request runs through, in the order it runs
- GATE — the functions that give context — who is calling, the database session, the settings
- INPUT — the framework's own reader — it parses the body and checks it against the shape
- HANDLER — the handler and the functions it calls — the ones that decide an ending, the ones that touch the data
- EFFECTS — the functions that settle a write — the commit, the rollback, the savepoint
- ANSWER — the function that builds the reply — it turns what was read into the response shape

**tests**

- EDGE — a test for each app-wide refusal — the rate limit answering before the door is reached
- GATE — a test for each way the lock says no — no credential, an invalid credential
- INPUT — a test for each rule on the body — a missing field, a value out of range
- HANDLER — a test for each guard and each fork — one per ending the door's own code can choose
- EFFECTS — a test that reads the database back — the row saved on success, the row absent after a refusal
- ANSWER — a test of the reply itself — the status, the fields of the body, the headers

**the client**

- EDGE — the address the client calls — the method, the path, and the wrapper that sends it
- GATE — the credential the client attaches — and the screen's move when the lock refuses it
- INPUT — the form the screen fills — the fields it collects before it calls
- HANDLER — no client piece — the door's own work is invisible to the screen
- EFFECTS — the cached answers the screen drops or refills once the writes are done
- ANSWER — the branch of the screen each ending reaches — the message, the redirect, the retry

**security**

- EDGE — the app-wide checks — the rate limit, the origin rules, the repeat key
- GATE — the login scheme and the function that checks it — with the rows it may create on the way in
- INPUT — the rules a body has to pass — sizes, ranges, allowed values
- HANDLER — the guards the door's own code adds — whose row this is, whether this caller may do this
- EFFECTS — the writes a refusal leaves behind — what is undone when the door says no, what is kept
- ANSWER — the detail each refusal gives the caller, and the headers the reply sends
