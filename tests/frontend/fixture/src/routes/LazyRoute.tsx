import { lazy } from "react";
// React code-splitting: a lazy() const is NOT an import declaration — the extractor must bind it from the
// dynamic import's resolved file + the mapped export (2026-09-03), or every <Card/> below renders nothing.
const Card = lazy(() => import("@features/recipe/RecipeCard").then((m) => ({ default: m.RecipeCard })));
export function LazyRoute() { return <section><Card id="r2" /></section>; }
