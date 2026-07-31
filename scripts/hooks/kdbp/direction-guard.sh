#!/usr/bin/env bash
# DIRECTION GUARD — UserPromptSubmit hook (semantic steer detection, ruled 2026-07-31)
# Fires ONLY in KDBP projects. Injects the steer rule so the model evaluates a new
# direction BEFORE building (the moving-target/scope-creep pain: targets moved across
# sessions with no at-hand evaluation). Semantic-only by operator ruling — no counters.
# The rule is dosed: contained, tier-matched asks proceed without ceremony.
set -u
ROOT="${CLAUDE_PROJECT_DIR:-$PWD}"
[ -d "$ROOT/.kdbp" ] || exit 0
cat <<'EOF'
DIRECTION GUARD (kdbp): if THIS prompt steers the work in a new direction — a new
target, a scope expansion, a tier jump, "let's also…" mid-phase — run /gabe-assess
brief BEFORE building and show it: blast radius · tier fit · proceed-vs-backlog.
Contained, tier-matched asks: proceed without ceremony. Ship-and-question, never stall.
EOF
exit 0
