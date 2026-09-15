import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "./api/client";
import { queryKeys } from "./query/keys";

export function useRecipe(id: string) {
  return useQuery({ queryKey: queryKeys.recipes.detail(id), queryFn: () => apiFetch(`/api/v1/recipes/${id}`) });
}
