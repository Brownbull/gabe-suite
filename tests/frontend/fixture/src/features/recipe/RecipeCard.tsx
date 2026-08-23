import { useContext } from "react";
import { Badge } from "@design-system/Badge";
import { ThemeContext } from "@store/theme";
import { useUiStore } from "@store/ui";
import { useRecipe } from "./useRecipe";
import { score } from "./scoring";
import type { RecipeProps } from "./types";
export function RecipeCard({ id }: RecipeProps) {
  const theme = useContext(ThemeContext);
  const dense = useUiStore((s) => s.dense);
  const r = useRecipe(id);
  if (!r) return null;
  return <article className={theme + (dense ? " dense" : "")}><h2>{r.title}</h2><Badge n={score(r)} /></article>;
}
