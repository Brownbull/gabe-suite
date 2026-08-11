window.GABE_SIM = {
 "commit": "fecb2ce3",
 "subject": "feat(repertorio): the mode row becomes the cupo \u2014 0063 migration + real service (C8134-C8136, C8138)",
 "date": "2026-08-07",
 "touched": [
  "recipe"
 ],
 "touched_l2": {
  "recipe": [
   "model:PlannedRecipe",
   "model:Recipe",
   "model:RecipeCreationRequest",
   "model:RecipeDemand",
   "model:RecipeEquipment",
   "model:RecipeFilterMode",
   "model:RecipeIngredient",
   "model:RecipeStep",
   "model:UserRecipeFlag"
  ]
 },
 "blast": [
  "cooking"
 ],
 "blast_edges": [
  {
   "from": "cooking",
   "to": "recipe",
   "kinds": {
    "fk": 3
   }
  }
 ],
 "files": 10,
 "entity_files": {
  "recipe": 3
 },
 "pieces": {
  "recipe": [
   {
    "id": "model:PlannedRecipe",
    "label": "PlannedRecipe",
    "kind": "model",
    "role": "changed"
   },
   {
    "id": "model:Recipe",
    "label": "Recipe",
    "kind": "model",
    "role": "changed"
   },
   {
    "id": "model:RecipeCreationRequest",
    "label": "RecipeCreationRequest",
    "kind": "model",
    "role": "changed"
   },
   {
    "id": "model:RecipeDemand",
    "label": "RecipeDemand",
    "kind": "model",
    "role": "changed"
   },
   {
    "id": "model:RecipeEquipment",
    "label": "RecipeEquipment",
    "kind": "model",
    "role": "changed"
   },
   {
    "id": "model:RecipeFilterMode",
    "label": "RecipeFilterMode",
    "kind": "model",
    "role": "changed"
   },
   {
    "id": "model:RecipeIngredient",
    "label": "RecipeIngredient",
    "kind": "model",
    "role": "changed"
   },
   {
    "id": "model:RecipeStep",
    "label": "RecipeStep",
    "kind": "model",
    "role": "changed"
   },
   {
    "id": "model:UserRecipeFlag",
    "label": "UserRecipeFlag",
    "kind": "model",
    "role": "changed"
   }
  ],
  "cooking": [
   {
    "id": "model:CookingSession",
    "label": "CookingSession",
    "kind": "model",
    "role": "link",
    "via": "recipe_id \u2192 recipes.id"
   },
   {
    "id": "model:CookingStepProgress",
    "label": "CookingStepProgress",
    "kind": "model",
    "role": "link",
    "via": "recipe_step_id \u2192 recipe_steps.id"
   },
   {
    "id": "model:DishHistoryEvent",
    "label": "DishHistoryEvent",
    "kind": "model",
    "role": "link",
    "via": "recipe_id \u2192 recipes.id"
   }
  ]
 },
 "intra_edges": {
  "recipe": [
   {
    "source": "model:PlannedRecipe",
    "target": "model:Recipe"
   },
   {
    "source": "model:PlannedRecipe",
    "target": "model:RecipeFilterMode"
   },
   {
    "source": "model:RecipeCreationRequest",
    "target": "model:Recipe"
   },
   {
    "source": "model:RecipeEquipment",
    "target": "model:Recipe"
   },
   {
    "source": "model:RecipeIngredient",
    "target": "model:Recipe"
   },
   {
    "source": "model:RecipeStep",
    "target": "model:Recipe"
   },
   {
    "source": "model:UserRecipeFlag",
    "target": "model:Recipe"
   }
  ],
  "cooking": [
   {
    "source": "model:CookingStepProgress",
    "target": "model:CookingSession"
   },
   {
    "source": "model:DishHistoryEvent",
    "target": "model:CookingSession"
   }
  ]
 },
 "cross_edges": [
  {
   "from_slug": "cooking",
   "from": "model:CookingSession",
   "to_slug": "recipe",
   "to": "model:Recipe",
   "via": "recipe_id \u2192 recipes.id"
  },
  {
   "from_slug": "cooking",
   "from": "model:CookingStepProgress",
   "to_slug": "recipe",
   "to": "model:RecipeStep",
   "via": "recipe_step_id \u2192 recipe_steps.id"
  },
  {
   "from_slug": "cooking",
   "from": "model:DishHistoryEvent",
   "to_slug": "recipe",
   "to": "model:Recipe",
   "via": "recipe_id \u2192 recipes.id"
  }
 ]
};
