# Frontend practices — handover note for GASTIFY (2026-08-23)

> STAGED IN THE SUITE: gastify is read-only this session. Next gastify session:
> drop this file at `docs/frontend-practices-handover.md` and commit. Findings are
> from gustify's source review; the practices transfer as gastify web conventions.

> Source: a three-lens source review of `apps/web/src` (decomposition · types/models ·
> scoping), run against the live codebase map (1,148 mapped pieces). Every claim below was
> file-cited in the review; this note carries the practices, not the transcript.
> Applies to gustify now; the same conventions are the starting posture for gastify's web.

## The verdict first

The frontend is **better-than-typical React** — keep its discipline. The element count in
the codebase map is mostly that discipline made visible: screens orchestrate, component
packs stay presentational (~3 components per file, median 35 lines), pure logic lives in
tested `*Model.ts` modules, and view-types deliberately MAP the generated API types
(`shared/api-types.ts`) instead of duplicating them. **No restructuring pass is warranted.**

## Keep doing (the practices that earn the count)

1. **Screens → component packs → pure models.** The layering is by the book; the model
   extractions exist because god-screens were untestable (their own headers say so).
2. **Multi-component pack files.** 349 components in 111 files is co-location, not bloat.
   Do NOT split packs one-file-per-component.
3. **The mapper seam over generated API types.** Every API field is declared twice
   (generated snake_case + view camelCase) by explicit decision (D84/D86) — that is the
   contract boundary, not drift.
4. **Presentational prop threading.** ~30 props at the screen→component seam is the price
   of storybook-able components. Past ~35, group related props into objects — never reach
   for context to save typing.

## Change (the three noise sources, all cheap)

1. **Stop exporting what nothing imports.** 36% of exported types (217 app-wide) have zero
   external consumers — exported by habit. Un-export them (they also leave the codebase map
   automatically: non-exported symbols are never mapped). **Add the lint** so it holds:
   `knip` or `eslint no-unused-export` in the local checks. THE biggest single de-noiser.
2. **No test-only exports from component files.** Layout constants and helpers
   (`MARK_PX`, `clampRatio`, …) exported "for tests" inflate the public surface — test
   through rendered output, or expose ONE test-only object.
3. **Rename the flat API-mapper layer.** `profileModel.ts` exists in two layers with two
   meanings; rename mappers (`profileApiMappers.ts`) or move them under `mappers/`.
   Zero-risk; kills the copies-illusion.

## Opportunistic (only when the file is next touched)

- **Flat-state giants**: `PantryScreen.tsx` (22 `useState`) and `PantryItemDetailSheet.tsx`
  (one 584-line component) want 2–3 extracted hooks or a reducer. Never a rewrite pass.
- **Fixture retirement**: as a screen wires to the live API, retire its fixture unions
  (`CookingRecipeId`-style) and fold showcase-only model shapes toward the generated types.
  The mockup-first lift pattern is working as designed — this is its planned exit.
- Delete the orphan `features/recipes/components/RecipeCard.tsx` (dead, one lens found it).

## Scoping ruling

`features/cooking` at 40% of the app is a **normal domain core for a food app** and is
already ~5 sub-features cleanly clustered as directories (browse / mode / log / creation /
model). Do not split it in code — the map's `area` level surfaces that structure. If a
split is ever wanted: carve `cookingTypes.ts` into per-cluster type files first; the
component layer moves mechanically, the model layer is the entangled part.

## For gastify specifically

Start with these as the conventions of `web/` from day one: the un-used-export lint on,
no test-only exports, mappers named as mappers, fixtures tagged and retired on wiring.
The map will then show the design surface, not the habit surface.
