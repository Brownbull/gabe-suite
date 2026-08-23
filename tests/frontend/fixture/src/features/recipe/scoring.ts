import type { Recipe } from "./types";
export const WEIGHTS = { fresh: 2, easy: 1 };
export function score(r: Recipe): number { return r.score * WEIGHTS.fresh; }
export function ScorePreviewSpike(r: Recipe): number { return r.score; }
