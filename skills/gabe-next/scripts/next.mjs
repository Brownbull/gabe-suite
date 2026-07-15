#!/usr/bin/env node
// gabe-next — deterministic, zero-token routing decision over .kdbp/PLAN.json.
// READ-ONLY: prints the decision; any Current Phase advance is written by the caller
// per the SKILL's advance mechanics (PLAN.md + PLAN.json in the same turn).
// Exit codes: 0 = decision printed · 1 = no decision (message printed) · 2 = PLAN.json unusable
// (caller falls back to the prose PLAN.md routing).
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const asJson = args.includes("--json");

const MOCKUP_TAGS = new Set([
  "design-system", "ui-kit", "mockup-flows", "mockup-index", "mockup-docs", "mockup-validation",
]);
const GLYPH = { todo: "⬜", in_progress: "🔄", done: "✅", deferred: "⏸", obsolete: "⚰️" };

function out(obj, lines) {
  if (asJson) console.log(JSON.stringify(obj));
  else console.log(lines.join("\n"));
}

let plan;
try {
  plan = JSON.parse(readFileSync(".kdbp/PLAN.json", "utf8"));
} catch {
  console.log("ℹ PLAN.json missing or invalid — fall back to prose PLAN.md routing (run /gabe-plan update to regenerate the mirror).");
  process.exit(2);
}

if (plan.status !== "active") {
  out({ next: null, reason: "no-active-plan" }, ["ℹ No active plan. Run /gabe-plan [goal] to create one."]);
  process.exit(1);
}

const phases = plan.phases ?? [];
const cur = String(plan.current_phase ?? "");
const idx = phases.findIndex((p) => String(p.id) === cur);
if (idx === -1) {
  console.log(`⚠ Current Phase ${cur} has no matching entry in PLAN.json phases.`);
  process.exit(2);
}

const projectType = plan.project_type ?? "code";
function execCmd(phase) {
  const types = phase.types ?? [];
  const hasMock = types.some((t) => MOCKUP_TAGS.has(t));
  const allMock = types.length > 0 && types.every((t) => MOCKUP_TAGS.has(t));
  if (projectType === "mockup") return "/gabe-mockup";
  if (projectType === "hybrid" && hasMock && allMock) return "/gabe-mockup";
  return "/gabe-execute";
}

// Prior-row sweep (always print, never block). deferred/obsolete rows are settled, not debt.
const debt = [];
for (let i = 0; i < idx; i++) {
  const c = phases[i].cells ?? {};
  if (c.exec === "deferred" || c.exec === "obsolete") continue; // parked rows owe nothing
  // red (TDD checkpoint) and center (command-center coverage) are OPTIONAL cells. Undefined never
  // matches todo/in_progress, so projects without the column never accrue that debt (E-precedent).
  const owed = ["red", "exec", "review", "commit", "push", "center"]
    .filter((k) => c[k] === "todo" || c[k] === "in_progress")
    .map((k) => `${k[0].toUpperCase()}${k.slice(1)} ${GLYPH[c[k]]}`);
  if (owed.length) debt.push(`${phases[i].id}: ${owed.join(", ")}`);
}
const warnings = debt.length
  ? [`⚠ INCOMPLETE PRIOR PHASES: [${debt.join(" · ")}] — routing continues on Phase ${cur}; clear the debt with /gabe-red, /gabe-review, /gabe-push, or /gabe-feature on the listed phases.`]
  : [];

// Decision table (first match wins), walking forward from the current phase over
// settled (deferred/obsolete/all-done) rows.
let advanceChain = [];
for (let i = idx; i < phases.length; i++) {
  const ph = phases[i];
  const c = ph.cells ?? {};
  // A deferred/obsolete Exec parks the whole phase (⏸/⚰️ rows like a deferred VAR chain):
  // never route review/commit/push for work that was never executed.
  // `red` (before Exec) and `center` (after Push) join the lifecycle only when the project
  // defines them; absent → not this project's concern, never blocks settle/advance.
  const lifecycle = ["exec", "review", "commit", "push"];
  if (c.red !== undefined) lifecycle.unshift("red");
  if (c.center !== undefined) lifecycle.push("center");
  const settled =
    c.exec === "deferred" || c.exec === "obsolete" ||
    lifecycle.every(
      (k) => c[k] === "done" || c[k] === "deferred" || c[k] === "obsolete"
    );
  if (settled) {
    advanceChain.push(String(ph.id));
    continue;
  }
  let next, reason;
  // red-before-execute: the TDD ordering is a machine predicate, not a plea. An exec already
  // in_progress resumes (never retro-blocked); otherwise a pending red routes first.
  if (c.exec === "in_progress") { next = execCmd(ph); reason = "Phase exec in progress (resume)"; }
  else if (c.red === "todo" || c.red === "in_progress") { next = `/gabe-red ${ph.id}`; reason = "Phase planned — failing cases first (TDD)"; }
  else if (c.exec === "todo") { next = execCmd(ph); reason = "Tasks not yet implemented"; }
  else if (c.review === "todo") { next = "/gabe-review"; reason = "Code written and Exec gate complete"; }
  else if (c.commit === "todo") { next = "/gabe-commit"; reason = "Reviewed, not committed"; }
  else if (c.push === "todo") { next = "/gabe-push"; reason = "Committed, not pushed"; }
  else if (c.center === "todo" || c.center === "in_progress") { next = `/gabe-feature ${ph.id}`; reason = "Shipped, not yet covered in the command center"; }
  else { advanceChain.push(String(ph.id)); continue; } // deferred/obsolete tail cells
  const state = lifecycle
    .map((k) => `${k[0].toUpperCase()}${k.slice(1)} ${GLYPH[c[k]] ?? "?"}`).join(" | ");
  const advance = advanceChain.length && String(ph.id) !== cur ? String(ph.id) : null;
  out(
    { next, reason, phase: String(ph.id), name: ph.name, state: c, advance_to: advance, warnings: debt, project_type: projectType },
    [
      ...warnings,
      ...(advance ? [`ℹ PLAN: settled through ${advanceChain.join(", ")} — advance Current Phase to ${advance} (caller writes PLAN.md + PLAN.json).`] : []),
      "GABE NEXT (PLAN.json)",
      ...(projectType !== "code" ? [`PROJECT_TYPE: ${projectType}`] : []),
      `PHASE: ${ph.id} — ${ph.name ?? "?"}`,
      `STATE: ${state}`,
      `NEXT:  ${next}`,
      `REASON: ${reason}`,
    ]
  );
  process.exit(0);
}

out(
  { next: "/gabe-plan complete", reason: "all-phases-settled", warnings: debt },
  [...warnings, "GABE NEXT (PLAN.json)", "NEXT:  /gabe-plan complete", "REASON: every phase is settled (done/deferred/obsolete) — archive the plan."]
);
process.exit(0);
