import { useEffect, useState } from "react";
import { apiFetch } from "@lib/api";
import type { Recipe } from "./types";
export function useRecipe(id: string) {
  const [r, setR] = useState<Recipe | null>(null);
  useEffect(() => { apiFetch<Recipe>("/api/v1/recipes/" + id).then(setR); }, [id]);
  return r;
}
