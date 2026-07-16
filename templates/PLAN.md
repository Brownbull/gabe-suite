# Active Plan

<!-- status: none | active -->
<!-- project_type: code | mockup | hybrid    (default: code when absent) -->
<!-- When no plan is active, this file stays as-is. gabe-plan writes here. -->
<!-- Archived plans go to .kdbp/archive/ with prefix: completed_, defer_, cancelled_ -->
<!-- PLAN.json (machine mirror) is written by /gabe-plan alongside this file — do not create it by hand -->
<!-- Active plans use this Phases table schema: -->
<!-- | # | Phase | Description | Complexity | Exec | Review | Commit | Push | -->
<!-- Exec: ⬜ not started, 🔄 in progress, ✅ complete (written by /gabe-execute or /gabe-mockup) -->
<!-- Review/Commit/Push: ⬜ → ✅ (written by /gabe-review, /gabe-commit, /gabe-push) -->
<!-- Optional Red column (TDD-adopting projects only): insert `| Red |` before Exec; ⬜ → ✅ written by /gabe-red (red checkpoint / guard-only / enumerated skip). Seed ⬜ only where Exec is ⬜ — executing/shipped rows (🔄/✅) get `—` (the PLAN.json mirror omits the key). Absent → /gabe-next treats it as ✅. -->
<!-- Optional Center column (command-center projects only): append `| Center |`; ⬜ → ✅ written by /gabe-feature when it covers the shipped phase. Absent → /gabe-next treats it as ✅. -->
<!-- /gabe-next routes to the next gabe command based on column state + project_type. -->
<!-- project_type dispatch: code → /gabe-execute, mockup → /gabe-mockup, hybrid → per-phase types tag. -->

No active plan. Run `/gabe-plan [goal]` to create a code plan, or `/gabe-mockup [goal]` for a mockup plan.
