# reference.md — the research backbone

Why this skill is grounded in established work, not vibes. Four bodies of research converge on the
same user; the skill is their intersection. Read when you want to justify a finding, extend the
method, or defend the approach.

## The map: your intuition → the established concept

```
| The intuition                              | Established concept              | Field                    |
|--------------------------------------------|----------------------------------|--------------------------|
| "people plan 1–2 steps, no more"           | bounded / depth-limited lookahead | search & decision theory |
| "the mattress unrolls 3 steps later"       | present bias · myopia · hyperbolic| behavioural economics    |
|                                            |   discounting                     |                          |
| "walk the app step by step, flag trips"    | Cognitive Walkthrough             | usability engineering    |
| "people get overwhelmed / confused"        | cognitive load; working memory ~4 | cognitive psychology     |
| each flag type                             | Nielsen usability heuristics      | HCI                      |
```

## 1. Cognitive Walkthrough — the engine

A **task-based usability inspection** method: reviewers pick a task, walk each step **from a
novice's perspective**, and answer a fixed set of questions per step to find what would trip a new
user. It deliberately needs **no real end-users** — evaluators adopt the novice lens. Our 8-question
battery is its four classic questions (goal / visibility / action-effect match / feedback) plus four
horizon probes. Focus of the original method: **learnability for new or infrequent users** — exactly
our target.
- NN/g: https://www.nngroup.com/articles/cognitive-walkthroughs/
- Wikipedia: https://en.wikipedia.org/wiki/Cognitive_walkthrough
- Usability BoK: https://www.usabilitybok.org/cognitive-walkthrough/

## 2. Bounded planning horizon — the dial

Virtually all chess engines do **depth-limited search**: look forward only *k* ply, truncate, and
value the position there. Humans do the shallow version natively. **Greedy** decision-making assesses
*locally* optimal moves and is known to get stuck in **local optima** — grab the free pawn, miss the
mate in two. That is precisely the myopic user: a low-depth greedy planner. The "horizon" (1 / 1.5 /
2) is the ply limit; the mattress is any line that only refutes at depth 3+.
- Depth-limited search / ply, local optima in greedy trees: https://arxiv.org/pdf/2109.11602 ·
  https://towardsdatascience.com/lookahead-decision-tree-algorithms-1a531897d15c/

## 3. Present bias / myopia — why the future is invisible, not just far

People don't merely *rank* the future lower — under **hyperbolic discounting** the near term is
sharply overweighted and distant consequences are discounted to near-zero, so they **plan to act
later and then don't**. In products this is operationalized deliberately (streaks, instant
gratification). For us it explains the emotional truth of the mattress: the downstream cost isn't
weighed and dismissed — at decision time it is *functionally invisible*.
- Present bias: https://insidebe.com/articles/present-bias/
- Myopia and discounting (Laibson, Harvard): https://scholar.harvard.edu/files/laibson/files/myopia_and_discounting_2017_08_03a.pdf

## 4. Cognitive load & working memory — the overwhelm flag

Working memory is limited (~4 chunks, not the folk "7"); exceed it and users hit **confusion,
fatigue, errors, abandonment**. Too many choices at once → decision paralysis; overcomplicated
workflows → decision fatigue and mid-task abandonment. This grounds the 🌊 overwhelm flag and the
">~4 live decisions per step" threshold.
- Cognitive load in UX: https://www.nngroup.com/articles/minimize-cognitive-load/ ·
  https://www.andacademy.com/resources/blog/ui-ux-design/cognitive-load/

## 5. Nielsen heuristics — what each flag maps to

```
| Our flag            | Nielsen heuristic(s) it operationalizes                              |
|---------------------|----------------------------------------------------------------------|
| 🛏️ Foresight trap   | "Help users recognize, diagnose, recover"; "Error prevention"        |
|                     |   (prevent the trap they can't foresee); visibility of consequences   |
| 🌊 Overwhelm point  | "Aesthetic & minimalist design"; "Recognition rather than recall"     |
| 🧠 Recall demand    | "Recognition rather than recall"; "Minimize the user's memory load"   |
| 🚪 No-undo dead-end  | "User control & freedom" (undo/redo, emergency exit)                 |
```
- 10 heuristics: https://www.nngroup.com/articles/ten-usability-heuristics/
- Gulfs of execution/evaluation (Norman) — the frame for "does the action match the intent, and can
  they read the result": https://en.wikipedia.org/wiki/Gulf_of_execution

## Where this sits vs. existing tools (the gap it fills)

Existing Claude UX skills simulate **experts** — e.g. panels of *"10 world-class design expert
personas"* — and academic LLM usability work (UXAgent, CHI 2026) varies persona **identity /
demographics**, not **planning depth**. This skill is the **inverse and the missing axis**: hold the
user *naive* and dial the *foresight* down. Same reason it must stay dumb — the value is what a
beginner **fails to see coming**, which no expert panel surfaces.
- Expert panels: https://github.com/mastepanoski/claude-skills · https://mcpmarket.com/tools/skills/expert-ui-ux-review-panel
- UXAgent (LLM synthetic usability testing, and its caveats): https://arxiv.org/html/2504.09407v2

## The honesty caveat (bake into every report)

Synthetic/LLM users are **distribution-calibrated but identity-imprecise** — good for **early-stage
concept screening**, not a replacement for testing real humans. Findings are **hypotheses to
validate**, never proof. This is stated in the report header on purpose.
