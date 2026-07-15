# Project Behavior — {PROJECT_NAME}

<!-- The per-project binding file: identity + the commands the gates trust. Written at /gabe-init,
     edited by the HUMAN when the project's tooling changes. Gates NEVER guess a command — they
     bind here first (gate-spec Step 2.0), then package manifests, then language fallbacks. -->

- **Project:** {PROJECT_NAME}
- **Domain:** {DOMAIN}
- **Maturity:** {MATURITY}   <!-- prototype | mvp | production -->
- **Tech:** {TECH}

## Verify Commands

<!-- The commands the commit gate and execute's task verification RUN. Author them to your real
     tooling; a checker that cannot fail is non-evidence. -->

- lint: `{LINT_CMD}`
- types: `{TYPES_CMD}`
- tests: `{TESTS_CMD}`
- results_out: `{RESULTS_PATH}`   <!-- OPTIONAL (D1/D4 — report, never gate). Set ONLY if your
     tests command above is authored to emit a machine report there (e.g. pytest
     --junitxml=tests/results/junit.xml). When present, /gabe-commit writes a small COMMITTED
     digest beside it that the command center reads; absent, the center renders
     ⤫ skipped(no reporter) — an honest gap. Greenfield init sets this by default; brownfield
     opts in by adding the reporter flag to a command YOU own, never by letting a tool guess. -->

## Critical Paths

<!-- Globs whose changes are hotfix-sensitive: ad-hoc work touching them inherits `proof: test`
     (evidence-doctrine) — a failing-then-passing test, not just a green suite. One glob per line. -->

- `{CRITICAL_GLOB_1}`   <!-- e.g. src/auth/** — the paths where a silent break hurts most -->

## Notes

<!-- Anything a session must know before running commands here (env quirks, service deps). -->
