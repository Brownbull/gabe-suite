import { Chip } from "@design-system/atoms/Chip";
import type { Recipe2 } from "../../apiAliases";
export function RecipeDetailBody({ dto }: { dto: Recipe2 }) { return <div><Chip label="kcal" /></div>; }
