#!/usr/bin/env bash
# evidence-nav battery — the shell asset's data contract, proven headless.
# Every case can FAIL: each asserts something the renderer must do, and the
# mutation notes record how each was proven capable of failing.
set -uo pipefail
cd "$(dirname "$0")/../.."
PAGE="docs/site/center/prism-evidence-states.html"
[ -f "$PAGE" ] || { echo "evidence-nav: $PAGE not built — run refresh_suite_center.sh"; exit 2; }
node tests/evidence-nav/cases.mjs "$PAGE"
