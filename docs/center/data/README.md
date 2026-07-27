# Suite center data

Two kinds of input feed this center, and the pages label which is which. Keeping
them apart is the whole reason the enforcement ledger can be trusted.

## Derived — never stored here

Recomputed from the repo on **every build** by `_suite_data.py`:

| Fact | Source |
|---|---|
| Skills, versions, dispatch chars, fork/read-only flags | `skills/gabe-*/SKILL.md` frontmatter |
| Hook slot, matcher, timeout, literal exit codes | `scripts/hooks/kdbp/*.sh` + `templates/hooks.json` |
| Battery paths, G3 inclusion, exclusion reasons | `tests/*/run.sh` + `scripts/suite-doctor.sh` |
| HEAD, build stamp, uncommitted paths | `git` |

The doctor's battery-exclusion list is **read out of the doctor**, never restated
here — a restated list drifts silently the moment the doctor changes.

## Authored — the files in this directory

### `enforcement.json` — judgment

The rule registry. Whether a rule is *hardenable* or *inherently a judgment call*
is a decision no parser can make, so it is authored, committed, and reviewable in
a diff. Every rule carries the evidence that established its bucket.

```jsonc
{
  "generated": "<ISO date>",          // when the classification was last revisited
  "method": "<how it was established>",
  "rules": [{
    "title": "…",                     // short label
    "beat": "commit",                 // one of suite-center.config.json → beats[].slug
    "bucket": "HARDENABLE",           // HARD_ENFORCED | HARDENABLE | PROMPT_ONLY | BROKEN_CLAIM
    "statement": "…",                 // what the rule requires, one sentence
    "where": "path/to/file.md:42",    // where the rule is STATED
    "mechanism": "none",              // the check enforcing it, or "none"
    "mechanism_where": "",
    "exit_semantics": "",             // e.g. "exit 2 = WARN, nothing consumes it"
    "evidence": "…",                  // how the bucket was established
    "hardening": "…",                 // HARDENABLE: the concrete check that would close it
    "carrier": "…",                   // PROMPT_ONLY: which file carries the rule
    "carrier_depth": "reference-spec",// lean-core | reference-spec | template | claude-md | rules-file | generated-catalog | none
    "defect": "…",                    // BROKEN_CLAIM: exactly what is false
    "severity": "high"                // critical | high | medium | low
  }]
}
```

Two fields do the real work:

- **`hardening`** is what makes `HARDENABLE` honest. If you cannot name a
  concrete check, the rule is not hardenable — it is `PROMPT_ONLY`. "Write a
  script that greps for it" only counts when the grep would have a low
  false-positive rate on this repo's actual content.
- **`carrier_depth`** is what makes `PROMPT_ONLY` accountable. A prompt-only rule
  is not a failure, but a rule that lives only in a `references/` deep spec may
  never be loaded at the moment it must fire. The ledger flags that depth.

### `facts.json` — recorded runs

Observations that are too slow or too stateful to redo per build: probed hook
exit codes, battery assertion counts and pass/fail, and the sweep of gates with
no battery. Running eight batteries on every page build would make the center
slow and non-deterministic, so a real run is recorded with its stamp and the
pages report its age.

Probed hook behaviour is recorded rather than derived on purpose: a static scan
finds `exit 2` in `plan-proof-guard.sh` but cannot see that `session-kdbp-active.sh`
exits 1 through `set -euo pipefail` on a failing command substitution. Only
running it shows that.

## Rebuild

```bash
bash docs/center/generators/refresh_suite_center.sh        # build + gate
bash docs/center/generators/refresh_suite_center.sh check  # gate only
```

A missing file in this directory is **not** an error: the affected page renders a
named gap saying which source is absent. An empty table that reads as "nothing to
report" would be a lie; a named gap is not.
