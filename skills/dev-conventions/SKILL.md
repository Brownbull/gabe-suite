---
name: dev-conventions
description: "The user's cross-project engineering conventions — coding style, code review, testing, security, git workflow, agent orchestration, hooks, patterns — loaded ON DEMAND instead of riding every session's context. Read the matching reference when the task actually touches its topic."
when_to_use: "A task touches code review standards, security-sensitive code (auth/input/queries), test strategy, commit/PR conventions, agent delegation choices, or design patterns — and the project's own CLAUDE.md/rules don't already answer it. Load ONLY the matching reference file, not all of them."
metadata:
  version: 1.0.0
---

# Dev Conventions — the shelved binder

**Why this exists:** these files lived in `~/.claude/rules/common/` and rode every session of
every project as always-on context (~2,467 words) — mostly generic convention the model already
carries. Relocated here, they cost nothing until a task opens a page. Content is RELOCATED, not
deleted — `mv` back to `~/.claude/rules/common/` reverses the move entirely. (Provenance and the
evidence trail live in git and the paper-contrast investigation record.)

## When to open which page

| Reference | Open when |
|---|---|
| `references/code-review.md` | running or preparing a code review; severity levels, checklists |
| `references/security.md` | auth, user input, queries, secrets, crypto — before writing or reviewing |
| `references/testing.md` | choosing test strategy or coverage posture for a project without its own rules |
| `references/coding-style.md` | style questions a project's own conventions don't answer (immutability, file size, nesting) |
| `references/git-workflow.md` | commit message format, PR workflow, branching questions |
| `references/development-workflow.md` | the research-first feature pipeline (gh search → docs → registries) |
| `references/agents.md` | delegation/orchestration choices; NOTE: roster is partially stale (tdd-guide, doc-updater, rust-reviewer may not exist) |
| `references/patterns.md` | repository pattern / API envelope questions |
| `references/hooks.md` | hook-type or auto-accept questions; two operational lines: never `dangerously-skip-permissions`, prefer `allowedTools` |
| `references/README.md` | (install/maintenance doc for the original rules repo — rarely needed) |

## Rules of use

- **Load one page, not the binder.** The point of this skill is that the other nine files stay
  unloaded.
- **Project rules outrank these.** A project's CLAUDE.md, `.kdbp/VALUES.md`, or language-specific
  rules (`~/.claude/rules/<language>/`, still in place) always win over these defaults.
- **Known staleness:** the audit (recorded on the paper-contrast artifact) flagged
  `code-review.md`, `patterns.md`, `testing.md` as near-pure generic convention and cut
  candidates; `agents.md` roster rows may be stale. Treat their content as defaults, not law,
  until the operator rules on the audit rows.
