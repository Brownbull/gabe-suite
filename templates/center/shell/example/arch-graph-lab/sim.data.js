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
 ],
 "stages": {
  "red": {
   "label": "Red \u00b7 real cases",
   "real": true,
   "pieces": {
    "model:RecipeFilterMode": {
     "tested": true,
     "cases": [
      "C8134"
     ],
     "red": "cupo capacity is the members own pool \u2014 two members of ONE household \u2014 chef B fills 5 slots, free A holds 1, s",
     "covers": "cupo capacity / member pool (free-1 chef-5)",
     "guards": "a member's cupo cap is wrong",
     "source": "tests/test_repertorio.py"
    },
    "model:PlannedRecipe": {
     "tested": true,
     "cases": [
      "C8135",
      "C8136",
      "C8142"
     ],
     "red": "cupo journey stamps and derived counters \u2014 planning stamps ``cupo_id`` + ``planned_by_user_id``; \u00b7 downgrade forces keep one and history survives \u00b7 plan with cupo stamps the link",
     "covers": "the cook\u2192cupo path (plan stamps cupo_id) + downgrade",
     "guards": "counters diverge / history lost on downgrade",
     "source": "tests/test_repertorio.py + test_repertorio_api.py"
    },
    "model:CookingSession": {
     "tested": false,
     "guards": "a recipe change could break an in-flight session"
    }
   }
  },
  "execute": {
   "label": "Execute \u00b7 changes",
   "real": true,
   "pieces": {
    "model:PlannedRecipe": {
     "changed": true,
     "file": "apps/api/models/recipe.py",
     "add": 8,
     "del": 0,
     "kind": "model",
     "action": "added",
     "what": "cupo_id",
     "effect": "PlannedRecipe part of the cupo migration"
    },
    "model:Recipe": {
     "changed": false,
     "lines": 0,
     "kind": "model",
     "summary": "in a changed file but this class was not edited"
    },
    "model:RecipeCreationRequest": {
     "changed": false,
     "lines": 0,
     "kind": "model",
     "summary": "in a changed file but this class was not edited"
    },
    "model:RecipeDemand": {
     "changed": false,
     "lines": 0,
     "kind": "model",
     "summary": "in a changed file but this class was not edited"
    },
    "model:RecipeEquipment": {
     "changed": false,
     "lines": 0,
     "kind": "model",
     "summary": "in a changed file but this class was not edited"
    },
    "model:RecipeFilterMode": {
     "changed": true,
     "file": "apps/api/models/recipe_filter_mode.py",
     "add": 7,
     "del": 0,
     "kind": "model",
     "action": "added",
     "what": "cupo_dish_type",
     "effect": "RecipeFilterMode the mode row becomes a cupo"
    },
    "model:RecipeIngredient": {
     "changed": false,
     "lines": 0,
     "kind": "model",
     "summary": "in a changed file but this class was not edited"
    },
    "model:RecipeStep": {
     "changed": false,
     "lines": 0,
     "kind": "model",
     "summary": "in a changed file but this class was not edited"
    },
    "model:UserRecipeFlag": {
     "changed": false,
     "lines": 0,
     "kind": "model",
     "summary": "in a changed file but this class was not edited"
    },
    "model:CookingSession": {
     "changed": false,
     "lines": 0,
     "kind": "model",
     "summary": "downstream via FK"
    },
    "model:CookingStepProgress": {
     "changed": false,
     "lines": 0,
     "kind": "model",
     "summary": "downstream via FK"
    },
    "model:DishHistoryEvent": {
     "changed": false,
     "lines": 0,
     "kind": "model",
     "summary": "downstream via FK"
    }
   }
  },
  "review": {
   "label": "Review \u00b7 real findings",
   "real": true,
   "pieces": {
    "model:PlannedRecipe": {
     "touched_again": true,
     "why": "Cross-type plan is unruled: POST /recipes/{id}/plan {cupo_id} accepts ANY recipe for ANY cupo dish type, so planeadas can carry plans whose ",
     "risk": "medium",
     "impact": "a soup cupo showing dessert planeadas reads as a broken counter to the user",
     "source": "PENDING #209"
    },
    "model:RecipeFilterMode": {
     "touched_again": true,
     "why": "attach_cupo silently overwrites (retype): a cupo's dish type can be swapped while old-type planeadas persist under the new label \u2014 nothing i",
     "risk": "low",
     "impact": "confusing counter provenance if a retype UI ever ships without a ruling",
     "source": "PENDING #211"
    },
    "model:CookingSession": {
     "touched_again": false,
     "why": "unchanged \u2014 verify the FK still resolves",
     "risk": "watch"
    }
   }
  },
  "commit": {
   "label": "Commit",
   "real": true,
   "meta": {
    "subject": "feat(repertorio): the mode row becomes the cupo \u2014 0063 migration + real service (C8134-C8136, C8138)",
    "date": "2026-08-07",
    "commit": "fecb2ce3",
    "files": 10,
    "add": 305,
    "del": 31,
    "cases": [
     "C8134",
     "C8135",
     "C8136",
     "C8138"
    ]
   }
  }
 }
};
