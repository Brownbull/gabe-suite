# Register scoring rubric

Score a candidate response **blind** (label A / B / C, hide the condition), 1 (fails) to 5 (excellent),
against a baseline, on the same cases/model/trials. Weighted.

| Dimension | Weight | What to measure |
|---|---:|---|
| **Movement** | 25% | Every statement carries action + consequence; ordered by what changes the operator's next move; opens with what moved, never with context/setup/method |
| **Actionability** | 20% | The doable leads for a handoff (command/path first); `NEXT:` names ONE concrete move; `NOW:` names the step in the sequence, not a vibe |
| **Honesty** | 20% | Outcomes reported faithfully (failures stated with output); costs are operator-felt and real, never fabricated agent-minutes; one term per concept |
| **Breathing** | 15% | One idea per paragraph; sentences ≤ ~25 words; no walls of bold/tables where movement prose belongs |
| **Concision** | 10% | No filler, recap of completed work, or pleasantry; brevity does not drop needed substance |
| **Discipline** | 10% | A DECISION block when the choice is overrulable (with a defer-trigger); a position-check on a direction change; Auto-Clarity suspends the register for irreversible/security/multi-step |

**Deterministic pre-check:** run `scripts/register-lint.py` on the candidate. A message with lint flags
(sentence over 30 words, a recap/pleasantry phrase, a multi-move NEXT, a missing NOW/NEXT close) starts the
matching dimension one point down — the lint catches the mechanical failures so the judge scores judgment.

**Release the candidate only when:** no dimension falls below baseline − 0.1; the weighted score beats
baseline; the deterministic lint is clean. (Mirrors the i-have-adhd release gate; run via that repo's
`scripts/run_evals.py` with the register as the candidate condition — the case files below share its schema.)
