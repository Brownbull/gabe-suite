# Mapping Python + TypeScript Codebases: Why It's Hard, What Actually Works, and What to Build

*A reference artifact for a solo dev on FastAPI/PostgreSQL/Alembic + React/TS/Vite/Zustand/TanStack Query/Storybook, using Claude Code. Current as of July 2026.*

## TL;DR

- **Static mapping is hard because execution has information the analyzer fundamentally cannot have without running the code** — concrete values, resolved dynamic dispatch, monkey-patching, `getattr`/`importlib`/`eval`, DI containers, decorators/metaclasses, and JS `import()`/computed `require()`. Rice's theorem makes the general problem undecidable, so every tool must choose between *soundness* (over-approximate, false edges) and *completeness* (under-approximate, missed edges). Dynamic languages amplify this: the best static Python call-graph tool, PyCG, hits **~99.2% precision but only ~69.9% recall** — it silently misses roughly 3 of every 10 real call edges.
- **The fix for your "missed files" problem is to stop globbing and start reusing resolvers that already computed the truth**: the TypeScript compiler's program file list (via `ts-morph`/`tsc`), your Vite/esbuild bundler's module graph (`--metafile`), and a real Python type checker's import graph (Pyright via `scip-python`, or ty). Layer a queryable index (SCIP or a Neo4j/Kuzu graph) on top, and answer feature-level questions with **per-test runtime coverage** (`coverage.py --cov-context`, Playwright/Istanbul) intersected with the static graph.
- **Recommended stack:** weekend path = `scip-typescript` + `scip-python` + `knip` + `dependency-cruiser` + `coverage.py` contexts, queried by Claude Code through the **Serena** MCP server (LSP-backed). Ambitious path = a Neo4j/Kuzu code property graph fed by SCIP/LSP + bundler metafile + per-feature coverage, with **CodeQL** or **Joern** for "what breaks if I change this?" reachability queries. Treat **Graphify** (the YC S26 tree-sitter tool you're evaluating) as a fast navigational layer, not a source of truth — it is heuristic tree-sitter extraction, not type-resolved.

---

## PART 1 — Why Static Mapping Is Hard (From First Principles)

### The core asymmetry: the runtime knows things the analyzer can't

When CPython or V8 *executes* your program, at the moment of every call it holds **concrete values**: the actual object bound to a name, the actual function a variable points to, the actual string passed to `importlib.import_module()`. A static analyzer, by contrast, must reason about *all possible executions at once*, without ever running the code, and therefore only ever has **names and syntax**, not values.

**A physical analogy.** Executing a program is like dropping a single ball into a pachinko machine and watching the exact path it takes — every peg it hits is determined. Static analysis is like being handed the blueprint of the machine and asked to predict *every path any ball could ever take*. The blueprint is enough for a rough answer, but the moment a peg's position depends on where the previous ball landed (a value computed at runtime), you can no longer draw the paths precisely — you can only draw an envelope of "somewhere in here." Dynamic language features are pegs that move based on runtime state.

The "compiler resolves it cleanly" intuition is partly misleading:

- **CPython does almost nothing at "compile time."** It compiles source to bytecode, but name lookup is **late-bound**: `foo.bar()` is resolved by dictionary lookups on `foo`'s type and instance *at the moment the call executes*. `self.method()` targets are not fixed until runtime. Monkey-patching (`obj.method = other`), `setattr`, metaclasses that rewrite class bodies, and decorators that replace functions all happen at import/run time. There is no compile-time call target to read off.
- **TypeScript's `tsc` knows a great deal — then throws it away.** During type-checking, `tsc` has a rich structural type graph and can answer "what does this resolve to." But types are **erased at emit**: the JavaScript that runs carries no type information. So the type info exists but is not preserved in the artifact; you must query the type-checker itself (Compiler API) to get it. Worse, `any` erases type info even at check time, index signatures (`{[k:string]: T}`) make member access unresolvable to a specific declaration, and structural/duck typing means "which type is this" can have many answers.

Features that defeat precise static resolution, by language:

| Python | JS/TS |
|---|---|
| `getattr`/`setattr`, dynamic attributes | dynamic `import()` with computed specifier |
| `importlib.import_module(name)` | `require(variable)` with computed path |
| `eval`/`exec` | `eval`, `new Function()` |
| monkey-patching, `functools.wraps` | prototype mutation, `Object.assign` |
| decorators, metaclasses | Proxies, getters/setters |
| DI containers, `Depends()` | DI containers, string-keyed registries |
| `*args`/`**kwargs`, duck typing | `any` erasing types, index signatures, structural typing |

### Rice's theorem and the halting problem

**Rice's theorem** states that every non-trivial *semantic* property of a program is undecidable. "Does function A ever call function B at runtime?" is a semantic property, so no algorithm can decide it precisely for all programs. This reduces to the **halting problem**: to know whether a call on an unreachable-looking branch actually fires, you'd have to know whether the code reaches it, which is undecidable in general. Precise call-graph construction is therefore not "hard engineering" — it is provably impossible in the exact case. Every real tool is an approximation.

### Soundness vs. completeness (the central trade-off)

Two ways to be wrong, and you must pick which:

- **Sound / over-approximation:** report a *superset* of what can really happen. Never miss a true edge, but include false ones. "This function *might* be called." Good for "what breaks if I change this?" (you want no false negatives — don't miss a caller). Cost: noise.
- **Complete / under-approximation:** report a *subset* — only edges you're sure about. No false positives, but misses real ones. Good for "show me definitely-used code." Cost: silent gaps (exactly your "missed files" failure mode).

**Physical analogy.** Soundness is a smoke detector tuned so sensitive it never misses a fire but sometimes screams at toast (over-approximate: false alarms, zero missed fires). Completeness is one so conservative it never false-alarms but occasionally stays silent during a real fire (under-approximate: no false alarms, some missed fires). You cannot have both perfectly; you choose which failure you can live with per task. Grep-based mapping tools are usually *neither* sound nor complete — they're a cheap heuristic that trades guarantees for speed and language-agnosticism.

Note the PyCG paper's precise usage: they call a call graph **complete** when it has no false-positive edges and **sound** when it contains every real edge — some literature swaps these labels, so always check the definition in the source.

### Points-to / alias analysis and the precision blow-up

To know what `x.foo()` calls, you must know what objects `x` can point to — **points-to analysis** (and its dual, **alias analysis**: can `x` and `y` reference the same object?). Precision is tuned along axes:

- **Flow sensitivity:** respect statement order (what `x` points to *here* vs *there*). PyCG is flow-*insensitive*, a key reason it misses edges; Jarvis adds flow sensitivity.
- **Context sensitivity / k-CFA:** distinguish calls to the same function from different call sites, up to depth *k*. k=0 merges everything; higher k separates contexts.

The problem: **each increment in context depth multiplies the number of abstract states**, so cost grows roughly exponentially in k. Susan Horwitz proved even flow-insensitive may-alias analysis is NP-hard. This is why whole-program precise analysis doesn't scale: per the Jarvis paper (arXiv:2305.05949), PyCG "ran out of memory or exceeded the time limit for programs exceeding 2,000 lines of code... due to the costly global fixed-point iterations," which is what motivated Jarvis's function-scoped approach.

**Physical analogy.** Context sensitivity is like tracking every water molecule through a plumbing system separately instead of treating water as a bulk fluid. Bulk-fluid (context-insensitive) math is cheap but tells you only average flow; per-molecule tracking answers precise questions but the bookkeeping explodes combinatorially with every junction. k-CFA is choosing how many junctions deep you track individual molecules before giving up and treating them as bulk again.

### Why dynamic languages are dramatically harder than Java/Go/Rust/C#

In statically typed compiled languages, the declared type of a receiver bounds the set of possible call targets — the compiler already resolved overloads and the type hierarchy is explicit. Call-graph tools like WALA on Java start from solid ground. In Python/JS there is no declared receiver type by default, so the analyzer must *reconstruct* type information it was never given.

The empirical numbers make this concrete:

- **Python — PyCG (Salis et al., ICSE 2021, arXiv:2103.00587):** "PyCG achieves high rates of precision ∼99.2%, and adequate recall ∼69.9%"; the paper adds that "on average, 69.9% of all call edges are successfully retrieved" while ">98% of the generated call edges are true positives." It's flow-insensitive, ignores calls into external libraries, and misses ~30% of real edges. **Jarvis** (Yan et al., "Scalable and Precise Application-Centered Call Graph Construction for Python," arXiv:2305.05949) reports it "improves PYCG by at least 67% faster in time in the scenario of whole-program CGC... 84% in precision and at least 20% in recall in application-centered CGC" (averaging 8.16s and 227 MB), using flow-sensitive, function-scoped type graphs. **HeaderGen** reports 95.6% precision / 95.3% recall but on a narrow domain (15 Jupyter notebooks).
- **JavaScript — "Static JavaScript Call Graphs: A Comparative Study" (Antal, Hegedűs, Tóth, Ferenc & Gyimóthy, arXiv:2405.07206):** across five tools (npm callgraph, WALA, Google Closure, ACG, TAJS), a manual evaluation of 348 call edges found that "ACG stands out with its almost perfect (99%) precision and quite high recall (91%)," and that "ACG and TAJS together covered 99% of the found true edges... maintaining a precision as high as 98%." But note recall is measured against *the union of what these static tools found*, not against ground-truth runtime behavior. Against dynamic ground truth the picture is worse: the ECOOP 2022 root-cause study (Chakraborty, Olivares, Sridharan & Hassanshahi, arXiv:2205.06780) found the pessimistic WALA ACG reached "average recall... 37% (by the Reachable Edges metric)" *after improvements* on framework-based (TodoMVC) apps, with "24% of missed call edges... due to calls to unmodeled standard library functions."

Takeaway: for your React + FastAPI stack specifically, a purely static call graph will be *precise but incomplete* — it will confidently show real edges and quietly miss framework-mediated ones (event handlers, DI-injected dependencies, dynamic route dispatch). This is the fundamental reason your custom-skill mapper misses files, and no amount of better globbing fixes it.

### Why grep/regex tools persist

Because they are the only approach that is **cheap, language-agnostic, incrementally indexable, tolerant of broken/partial code, and fast enough for IDE latency budgets.** A type-resolved index needs a working build, all dependencies installed, and seconds-to-minutes of compute; ripgrep needs none of that and returns in milliseconds on a half-written file. GitHub code search, ripgrep, ctags, and Zoekt exist because for "where is this string" the semantic cost is unjustified. Stack graphs were GitHub's attempt to get precise-ish nav at grep-like scale via file-incremental analysis — and even GitHub reportedly de-emphasized "Precise Code Navigation," showing how hard the middle ground is. Graphify (the tool you're evaluating) sits here: tree-sitter AST extraction, tagging edges `EXTRACTED` vs `INFERRED` — deliberately heuristic to stay fast and language-agnostic across 40+ languages, at the cost of type-level precision.

### Syntactic reachability ≠ feature reachability

Even a *perfect* call graph answers "can control flow reach function F," not "does F serve the *checkout* feature." A feature/user-workflow is a semantic concept that cuts across the call graph: one utility function serves twenty features; one endpoint fans out into hundreds of functions shared with other endpoints. The call graph has no notion of "feature." Bridging that gap requires an external definition of the feature (a tagged test, an E2E scenario, an entry point) and then either forward-slicing the static graph from that entry point *or* — more reliably — capturing **which functions actually execute** when that feature runs. That is the single most important architectural insight for your goal, and it's why Part 2 spends real time on coverage.

---

## PART 2 — What Actually Exists (Tools & Methods)

### A. Cross-language infrastructure (the strongest foundation)

#### Language Server Protocol (LSP) as an oracle
Your editor already runs a language server (Pyright/Pylance/ty for Python, tsserver for TS) that answers *type-resolved* "go to definition," "find references," and "call hierarchy." You can drive these programmatically:

- **`multilspy`** (microsoft/multilspy) — Python client library wrapping language servers behind one API; supports Python, Rust, Java, Go, JS, Ruby, C#, Dart. Built for the NeurIPS 2023 "Monitor-Guided Decoding" paper. Exposes definition, references, completion, hover, document symbols.
- **Serena** (github.com/oraios/serena) — an MCP server that turns LSP into agent tools (`find_symbol`, `find_referencing_symbols`, `replace_symbol_body`, `get_diagnostics_for_file`). It's the free/OSS default (LSP backend) with an optional paid JetBrains backend added late 2025. It does **not** parse code itself; it launches the same language servers your IDE uses (built on `multilspy`, adapted into their `solid-lsp`). This is the most direct way for Claude Code to get compiler-accurate answers. Guidance from a 2026 guide: install it when your repo is big enough that you use go-to-definition yourself; skip for tiny projects.

**Failure mode:** LSP answers are per-query and don't give you a whole-program graph artifact; you must crawl symbols and stitch references yourself. LSP "find references" is also not the same as a call graph (it includes non-call references) and can miss dynamic dispatch.

#### SCIP / LSIF (precise, portable indexes)
**SCIP** (Sourcegraph Code Intelligence Protocol) is a Protobuf-based index format that replaced LSIF. It's a *persistable, queryable artifact* of compiler-accurate symbol/reference data.

- **`scip-typescript`** (github.com/sourcegraph/scip-typescript) — built on the TS type-checker; indexes 1k–5k LoC/sec; cross-repo; handles JS with `--infer-tsconfig`.
- **`scip-python`** (github.com/sourcegraph/scip-python) — built on **Pyright**, so it inherits Pyright's type resolution; gives "equivalent code navigation quality to what you get with the Python language server in VS Code or PyCharm." Emits stable references into your dependencies when run in an environment with them installed.
- Other SCIP indexers: scip-java, rust-analyzer, scip-clang, scip-ruby, scip-dotnet, scip-dart, scip-php.

**Status/caveat:** these indexers are open source and usable standalone (emit a `.scip`/index file you own). But they were built to feed a Sourcegraph instance; the open-source Sourcegraph server itself has moved toward enterprise licensing, so treat the *indexers* as the durable, free asset and don't assume a free self-hosted Sourcegraph UI.

#### Stack Graphs
GitHub's `tree-sitter-stack-graphs` — file-incremental, zero-config precise navigation via a declarative name-binding DSL, works for Python and JS/TS/Java. Powerful in theory, but community reports say it "withered on the vine" after GitHub de-emphasized Precise Code Nav; the TypeScript definitions are ~6k lines of DSL, so adding/maintaining languages is very heavy. **Not recommended for a solo dev to author.**

#### Glean (Meta) and Kythe (Google)
- **Glean** (github.com/facebookincubator/Glean, open-sourced Aug 2021) — stores typed schema-defined facts about code, queried with the **Angle** Datalog-style language; open indexers include C++, Hack, Python, Haskell, Flow, plus LSIF/SCIP import for Go/Java/Rust/TS. Powerful at Meta scale; **written in Haskell, heavy to operate — impractical for a solo dev.**
- **Kythe** (Google) — language-agnostic graph indexer; requires an instrumented build. Per Wikipedia, the US-based dev team was laid off in April 2024 and replaced with an India-based maintenance team; effectively in maintenance. **Not recommended.**

#### CodeQL — "code as a database"
GitHub's CodeQL builds a semantic DB (AST, CFG, data-flow, type hierarchy, **call graph**) and lets you write **QL** queries like "which functions are reachable from this entry point" or path-problem queries for data flow. Supports Python and JS/TS (TS via the JS extractor). The JS library ships an explicit `CallGraph.qll` with `callEdge`/`isStartOfCallPath`/`isEndOfCallPath` predicates for path queries.

**Licensing — read carefully:** The CodeQL *libraries/queries* repo is open source, but the **CodeQL CLI/engine is licensed separately**; per the github/codeql README, "If you'd like to use the CodeQL CLI to analyze closed-source code, you will need a separate commercial license." It's free for analysis of open-source repos and via code scanning on public repos; private repos need GitHub Advanced Security. **This is the key constraint for your private commercial project** — CodeQL on a private repo needs GHAS/commercial licensing, which conflicts with your flat-rate/OSS preference.

#### Semgrep (+ Pro interprocedural/interfile)
Semgrep CE (open source, LGPL) does **intra-procedural, single-function** taint/pattern analysis — fast, no build needed, but "will miss many true positives." **Semgrep Pro** adds interprocedural (`--pro-intrafile`, all languages) and **interfile** analysis (Python, TS/JS, Java, Go, C#, Kotlin, C/C++) with taint traces — directly useful for "what data flows through this path?" **Caveats:** interfile is a paid/hosted tier; it defaults to falling back to single-file mode above 5 GB memory or 3 hours, and interfile taint results have been reported to disappear on codebases >1,000 files (issue #10761). Recommends 4–8 GB RAM/core.

#### Joern — Code Property Graph (CPG)
Joern (github.com/joernio/joern, open source) builds a **Code Property Graph** = AST + CFG + PDG (data + control dependence) in one queryable graph, with a Scala DSL. Supports Python and JavaScript (plus C/C++/Java/Kotlin/binary). **Robust "fuzzy" parsing** — "Joern allows importing code even if a working build environment cannot be supplied or parts of the code are missing" (directly relevant to your "broken/partial code" tolerance). Can export to Neo4j (`joern-export --format neo4jcsv`). **Failure modes:** Python/JS CPG frontends are less mature than the C/Java ones; recall for dynamic dispatch inherits all the Part 1 limits; Scala/JVM footprint and DSL learning curve are non-trivial.

#### Search-based: Sourcegraph / OpenGrok / Zoekt
Fast text/trigram search, not semantic. Zoekt (the engine behind Sourcegraph search) is excellent for "where is this string" at scale but doesn't resolve types. Keep as a complementary layer, not the map.

### B. TypeScript / JavaScript specific

| Tool | What it gives you | Resolution basis | Status 2026 | Notes / failure modes |
|---|---|---|---|---|
| **TS Compiler API + `ts-morph`** | Programmatic AST + **type checker**; `getTypeChecker()`, `.findReferences()`, go-to-def | Real TS type-checker | Active; `ts-morph` **v28.0.0 (Apr 12 2026)**, MIT, by David Sherret | The ground-truth resolver for your TS code. In-memory edits; primarily Node-oriented |
| **typescript-eslint** | Type-aware lint rules | TS type info | Active | Great for fitness rules, not whole-graph |
| **knip** | Unused files/exports/deps via full **module graph** (mark-and-sweep) | TS + resolver | Active, the current standard | Replaces ts-prune; `--fix`; needs correct `entry` config or false positives |
| **ts-prune** | Unused exports | TS | **Archived, maintenance mode → use knip** | Repo explicitly recommends knip |
| **madge** | Module dep graph, circular deps | dependency-tree parse | Maintained, lightweight | File/module level only; no type resolution |
| **dependency-cruiser** | Dep graph + **rule enforcement** (architecture fitness functions) | AST parse | Active; you already use it | Best-in-class for "forbid these imports"; not a call graph |
| **SWC / Oxc / Biome** | Very fast parsers with AST access | Rust-based AST | Active | Building blocks; no type resolution by themselves |
| **Bundler metafile (esbuild `--metafile`, Vite/`rollup-plugin-visualizer`)** | **The real module graph + tree-shaking reachability** | Bundler resolver | Active | *Key insight — see below* |
| **react-docgen / Storybook CSF indexer / addon-coverage** | Component props/tree; story→component; interaction coverage | AST + runtime | Active | Storybook stories = ready-made feature units |

**The bundler-metafile insight (act on this).** Your Vite/esbuild build *already computes the real, resolved module graph and marks which modules/exports are reachable from each entry point* — including dynamic `import()` splits. `esbuild --metafile=meta.json` emits every input, every import, and which entry points reach it (esbuild's linker literally tags each file with `EntryBits` for reachability: "Tree shaking works by starting from entry points and walking the import graph, marking files and their parts as 'live'"). This is a **complete, resolver-accurate file inventory and reachability graph for the frontend, for free, as a byproduct of a build you already run.** Feed the metafile into your map instead of globbing. **Failure mode:** tree-shaking preserves side-effect-only modules conservatively (a module that patches `fetch`, loads `dotenv/config`, or registers OpenTelemetry may look "unused" by exports but is load-bearing) — so metafile tells you *reachability*, and you must not treat "no exports used" as "dead."

### C. Python specific

| Tool | What it gives you | Resolution basis | Status 2026 | Notes |
|---|---|---|---|---|
| **PyCG** | Static call graph | Assignment/flow-insensitive | Research tool; foundational | ~99% precision / ~70% recall; struggles >2k LoC |
| **Jarvis** | Faster, flow-sensitive call graph | Function-scoped type graphs | Research (submitted TOSEM) | ≥84% precision & ≥20% recall over PyCG |
| **code2flow / pyan3 / pydeps** | Call/dep visualizations | AST heuristics | Varies; older | Low recall on dynamic code |
| **importlab** | Import dep graph (Google) | AST imports | Stable | Import-level only |
| **Pyright / `scip-python`** | Type-resolved nav + SCIP index | Pyright type checker | Active | Best precise Python index for a solo dev |
| **mypy / pytype** | Type graph internals | Type inference | Active | mypy shipped experimental parallel workers |
| **Pyre + Pysa (Meta)** | Whole-program + **taint analysis** | OCaml, whole-program | Active | **Pysa is the only OSS Python tool with out-of-the-box taint analysis** (SQLi/SSRF/sensitive sinks) — trace data flow through a feature |
| **ty (Astral)** | Extremely fast type checker + LSP | Rust, incremental | **Beta (released Dec 16 2025), 1.0 targeted 2026** | Astral: "consistently between 10x and 60x faster than mypy and Pyright"; after editing PyTorch it "recomputes diagnostics in 4.7ms: 80x faster than Pyright (386ms)." But per pydevtools' July 2026 conformance run (ty 0.0.50), ty passes "roughly 76%" of typing-spec tests vs Pyrefly 1.1.0's "about 96%" — keep Pyright/mypy authoritative in CI for now |
| **LibCST / `ast` / `symtable` / Scalpel** | Concrete/abstract syntax trees, scopes | Parse | Active | LibCST preserves formatting (good for codemods); Scalpel bundles call-graph/inheritance analysis |

**FastAPI-specific structure you can exploit as feature boundaries:**
- **OpenAPI schema** = an authoritative list of every route/endpoint (feature entry points). `app.openapi()` gives you the whole surface for free.
- **`Depends()` dependency graph** — FastAPI builds a `Dependant` tree per route (`get_dependant()` in `fastapi/dependencies/utils.py`) that "recursively resolves any nested `Depends()` declarations" with per-request caching. This *is* a resolved DI graph you can walk: route → dependencies → sub-dependencies (e.g., handler → `get_db_session` → engine config).
- **route → handler mapping** via `APIRoute` objects on `app.routes`.
- **Alembic migration → model mapping** via SQLAlchemy metadata (map `Base.metadata.tables` to migration revisions).

### D. AI-agent-oriented mapping tools (2025–2026)

| Tool | Graph store | Resolution | Status 2026 | License |
|---|---|---|---|---|
| **aider repo map** | in-memory | tree-sitter + **PageRank** ranking of symbols (NetworkX personalized PageRank) | Active; 130+ langs | Apache-2.0 |
| **Graphify** (Graphify-Labs) | local files (`graphify-out/`), `graph.html`, MCP server | **tree-sitter** across 40+ langs; edges tagged EXTRACTED/INFERRED/AMBIGUOUS; Leiden community detection; `--postgres` schema introspection | Very active; YC S26; v0.8.35 (Jun 7 2026); ~one release/day | Apache-2.0 |
| **serena** | none (LSP live) | **LSP** | Active | OSS (LSP default free) |
| **potpie** (potpie-ai/potpie) | **Neo4j** (+Postgres/Redis) | tree-sitter AST + LLM | Active; v1.1.0 (May 6 2026); ~5.4k★ | Apache-2.0 |
| **blarify** (blarApp/blarify) | **Neo4j**/FalkorDB | **LSP** (+ optional SCIP, reported ~330× faster refs) | Active; updated May 25 2026; ~230★; distributed via PyPI (no tagged releases) | MIT |
| **code-graph-rag** (vitali87) | **Memgraph** (+Qdrant vectors) | tree-sitter (+ ast-grep) | Very active; rapid 0.0.x churn; ~2k★; MCP server | MIT |
| **nuanced** (nuanced-dev/nuanced-py) | in-memory→JSON | static (Jarvis fork), Python-only | **ARCHIVED Mar 5 2026 (read-only)** | MIT |
| **stakgraph** (stakwork) | Neo4j or in-memory | tree-sitter + **optional LSP** | Active | — |
| **repomix** | text bundle | pack repo to one file | Active | Not a graph |

**Reading of this landscape:** the tree-sitter-only tools (Graphify, aider map, code-graph-rag, potpie) are fast, language-agnostic, and tolerant of broken code — but inherit exactly the precision limits of Part 1 (heuristic edges, no type resolution). The LSP/type-checker-backed tools (Serena, blarify, scip-*) are the ones that give *compiler-accurate* answers. **blarify is the closest off-the-shelf match to your "codebase → Neo4j graph via LSP" goal**, and it can use SCIP for a reported ~330× reference-resolution speedup over raw LSP. (One correction to a common claim: the nuanced founder's documented GitHub open-source lineage is the *Semantic* code-analysis library, adjacent to — but not identical with — GitHub's Stack Graphs project; nuanced is archived regardless.)

### E. Graph storage layer
- **Neo4j** — mature, Cypher, used by potpie/blarify/Joern-export; heaviest to run (JVM).
- **KuzuDB** — embedded (SQLite-like), fast, Cypher-compatible, no server; ideal for a solo-dev local artifact.
- **DuckDB** — embedded OLAP; can model edges as tables and do recursive CTEs; great if you already know SQL and want zero infra.

### F. Dynamic / runtime approaches (how you actually answer "which functions serve this feature")

This is the part that closes the semantic gap and is under-used:

- **Python — `coverage.py` dynamic contexts + `pytest-cov --cov-context=test`.** Coverage records, *per test*, exactly which lines/functions executed. Per the pytest-cov docs, "the context name recorded in the coverage.py database is the pytest test id, and the phase of execution, one of 'setup', 'run', or 'teardown'," e.g. `test_functions.py::test_addition|run`. If you tag or name tests by feature, you get a **feature → exact-functions-executed** map from ground-truth execution — no static approximation. This directly answers "which functions are used in a given workflow" and "what is dead code" (functions never covered by any feature test).
- **Python live tracing:** `sys.settrace`, `viztracer` (timeline), `py-spy` (sampling profiler, no code change) to map real call paths in a running FastAPI app; **OpenTelemetry** distributed tracing to capture request→handler→DB call paths in production.
- **JS/TS:** Istanbul/`nyc` coverage; **Playwright/Cypress E2E coverage**; **Chrome DevTools Protocol precise coverage** (function/block-level). Storybook interaction tests + `@storybook/addon-coverage` give per-component/per-story coverage — your stories become feature units.

**The hybrid method (highest confidence, recommended):**
1. Define each "feature" as a set of tagged tests and/or E2E/Storybook scenarios.
2. Run them with per-context coverage → get the set of functions that *actually execute* for that feature (sound against real behavior for the paths your tests exercise; the limit is test coverage, not analysis precision).
3. Intersect/union with the **static** call graph (SCIP/CodeQL/Joern) to (a) confirm edges, (b) find statically-reachable-but-never-run code (candidate dead code or missing tests), and (c) extend from covered entry points to catch branches tests missed.

**Physical analogy for the hybrid:** static analysis is the *road map* (every road that exists); coverage is *GPS traces of cars that actually drove* (which roads are really used for a given trip). The map alone over-counts (roads no one drives); traces alone under-count (roads not driven *today*). Overlay them and you get both "all roads" and "roads that serve this route," with disagreements flagged for inspection.

---

## PART 3 — Recommendations for Your Stack

Your constraints: solo dev, CLI-first Linux, Claude Code, strong preference for flat-rate/subscription or free/OSS over usage-based pricing, and a hard requirement to **never miss files**.

### First principle: fix the root cause of missed files

Your custom skill misses files because it **globs and pattern-matches** — an under-approximation with silent gaps. Replace globbing with **authoritative file lists from resolvers that already computed the truth**:

- **Frontend inventory + reachability:** `vite build` / `esbuild --metafile=meta.json`. Every input file and its reachability from entry points, resolver-accurate, including code-split dynamic imports. This is your complete frontend module graph.
- **Frontend symbol graph:** `scip-typescript index` (or `ts-morph` `project.getSourceFiles()` for the full program file list per `tsconfig`).
- **Backend inventory + symbol graph:** `scip-python` (Pyright-backed) run inside your uv/venv with deps installed → complete, type-resolved Python index. For the import graph specifically, Pyright/ty's program file list is authoritative; don't hand-glob.
- **Completeness check:** diff the resolver's file list against `git ls-files '*.py' '*.ts' '*.tsx'`. Any tracked source file *not* in the resolver's program is either genuinely unreachable (candidate dead code) or a config gap (missing `tsconfig` include / wrong entry) — either way, surfaced instead of silently dropped. Make this diff a CI check.

### Weekend minimal path (start here)

Goal: a reliable, queryable map with near-zero new infra, all OSS/CLI.

1. **Inventory (never miss files):** wire `esbuild --metafile` (or `vite-bundle-visualizer`) for FE and `scip-python` for BE into a `make map` target. Add the `git ls-files` diff check.
2. **Dead code / unused exports:** `knip` (frontend) + Pyright/ty unused + `coverage.py` "never executed" (backend). `dependency-cruiser` you already have — add rules encoding your intended architecture as fitness functions.
3. **Precise nav for the agent:** install **Serena** as an MCP server so Claude Code gets LSP-accurate `find_symbol` / `find_referencing_symbols` / call-hierarchy instead of grepping. This alone will materially reduce agent "missed reference" errors.
4. **Feature→function maps:** turn on `pytest --cov-context=test` and tag tests by feature; for FE, enable Storybook `addon-coverage` and/or Playwright coverage. Store the per-feature function sets as JSON — this becomes your `archmap.json`'s feature layer, grounded in real execution.
5. **FastAPI structure:** a ~30-line script that walks `app.routes` + `get_dependant()` to emit route→handler→dependency chains, and `Base.metadata` for model/table inventory. Deterministic, complete, cheap.

Effort: a weekend. Maintenance: low (all run in CI). Failure modes: coverage only reflects tested paths (grow tests); metafile mis-flags side-effect modules (keep an allowlist).

### Ambitious full architecture

When you want a single queryable brain an agent can traverse:

1. **Storage:** **KuzuDB** (embedded, Cypher, no server) — or Neo4j if you want the ecosystem/Bloom viz. Avoid usage-priced cloud graph DBs given your pricing preference.
2. **Ingest layers into one graph:**
   - Files/modules + reachability ← bundler metafile (FE) + Pyright program (BE).
   - Symbols + type-resolved references ← `scip-typescript` + `scip-python` (parse the SCIP protobuf; symbols have a documented string grammar).
   - Call/data-flow edges for "what breaks if I change this?" ← **Joern CPG** (AST+CFG+PDG, tolerant of partial code) exported to your graph, or CodeQL if licensing allows.
   - DI/route graph ← FastAPI `Depends()` walker.
   - Feature→function ← per-context coverage (nodes get a `features: [...]` property).
3. **Query surface for Claude Code:** expose the graph via an **MCP server** (blarify already does codebase→Neo4j-via-LSP and can be adapted; or write a thin MCP wrapper over KuzuDB/Cypher). Then agent questions map to graph queries:
   - *"Which functions serve feature X?"* → nodes where `features contains X` (coverage), optionally expanded along static call edges.
   - *"What breaks if I change F?"* → reverse-reachability from F over call/PDG edges (this is the query you want **sound/over-approximate** — better a few false alarms than a missed caller).
   - *"What data types flow through this path?"* → SCIP type edges + Joern/Pysa/Semgrep-Pro taint trace.
   - *"What is dead code?"* → in program file list AND unreferenced (SCIP) AND never covered (coverage) — the intersection is high-confidence dead code.

Maintenance: moderate (keep indexers + graph build in CI; re-index on merge). Failure modes: graph staleness (rebuild incrementally), Python/JS CPG recall limits on dynamic dispatch (backstop with coverage), and the operational weight of Joern/Neo4j (prefer Kuzu + SCIP if you want to stay light).

### On the tools you named specifically

- **Graphify (YC S26):** genuinely useful as a *fast navigational/onboarding layer* and it's OSS (Apache-2.0) with a Claude Code skill + MCP server, live PostgreSQL schema introspection (`--postgres`), and honest EXTRACTED/INFERRED edge tagging. But it is **tree-sitter heuristic extraction, not type-resolved** — it will have the Part 1 recall gaps and is *not* a source of truth for "what breaks if I change this?" **Cloning its Python/TS mappers won't get you past the precision ceiling** because the ceiling is the tree-sitter/heuristic approach itself, not the implementation. If you want precision, clone/reuse `scip-python` (Pyright) and `scip-typescript` (TS checker) or drive LSP via `multilspy`/Serena instead. Use Graphify for exploration; use SCIP/LSP + coverage for ground truth.
- **dependency-cruiser:** keep it — it's the right tool for architecture fitness functions; just don't expect call-level or feature-level answers from it.

### Decision thresholds (what would change the recommendation)

- If your repo stays < ~20k LoC and mostly conventional: the **weekend path is likely sufficient forever**; skip the graph DB.
- If you frequently ask cross-cutting "impact of change" questions or hit agent errors from missed references: **add the Joern/SCIP graph + MCP** layer.
- If you need real data-flow/taint ("does user input reach this SQL/log sink"): add **Pysa** (OSS) or **Semgrep Pro** (paid, flat-ish subscription) — Semgrep Pro only if the flat pricing fits and repos stay < ~1,000 files (interfile reliability cliff).
- Reconsider **CodeQL** only if this becomes open source (then it's free and excellent); on a private commercial repo its separate commercial/GHAS licensing conflicts with your pricing preference.
- Adopt **ty** as your fast primary checker once it hits stable 1.0 (targeted 2026) and its typing-spec conformance rises from the ~76% seen in mid-2026; until then keep Pyright/mypy authoritative and use ty for speed in the editor.

---

## Caveats

- **Recall numbers are approximate and benchmark-dependent.** PyCG's ~70% recall and the JS ACG numbers come from specific benchmarks (real-world packages; SunSpider/TodoMVC); your React/FastAPI recall will differ and is generally *worse* for framework-mediated dispatch. Treat all static call graphs as precise-but-incomplete. Note the JS study's 91% recall is measured against the *union of edges the five static tools found*, whereas the ECOOP root-cause study's ~37% recall is measured against *dynamic ground truth* — these are not the same yardstick, and the gap between them is precisely the "framework-mediated edges static analysis misses" problem.
- **"Sound vs complete" labels are used inconsistently** across the literature (PyCG's paper even uses "complete" to mean "no false positives"). Always check a tool's own definition before trusting a claim.
- **Star counts, versions, and maintenance states are point-in-time (mid-2026)** and drift; verify latest releases before adopting. blarify publishes via PyPI (no tagged GitHub releases); code-graph-rag is pre-1.0 with very fast version churn; nuanced is archived (Mar 5 2026); ts-prune is archived (recommends knip).
- **Coverage is only as complete as your tests.** The hybrid method's "feature→function" map is ground-truth for paths your tests exercise and silent about the rest — its completeness is a function of test coverage, not analysis.
- **Sourcegraph and CodeQL are open-source-friendly but commercially gated for private code**; don't assume a free self-hosted precise-nav server. The durable free assets are the standalone indexers (`scip-*`) and OSS analyzers (Joern, Pysa, Semgrep CE, multilspy/Serena).
- **The `ty` conformance figure (~76%, mid-2026)** comes from a third-party blog testing ty 0.0.50 against the Python typing-spec conformance suite; it is a fast-moving beta and the number should be re-checked at adoption time.