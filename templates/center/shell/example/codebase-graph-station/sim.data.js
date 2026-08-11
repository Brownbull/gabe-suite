window.GABE_SIM = {
 "commit": "fecb2ce3",
 "subject": "feat(repertorio): the mode row becomes the cupo — 0063 migration + real service (C8134-C8136, C8138)",
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
    "via": "recipe_id → recipes.id"
   },
   {
    "id": "model:CookingStepProgress",
    "label": "CookingStepProgress",
    "kind": "model",
    "role": "link",
    "via": "recipe_step_id → recipe_steps.id"
   },
   {
    "id": "model:DishHistoryEvent",
    "label": "DishHistoryEvent",
    "kind": "model",
    "role": "link",
    "via": "recipe_id → recipes.id"
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
   "via": "recipe_id → recipes.id"
  },
  {
   "from_slug": "cooking",
   "from": "model:CookingStepProgress",
   "to_slug": "recipe",
   "to": "model:RecipeStep",
   "via": "recipe_step_id → recipe_steps.id"
  },
  {
   "from_slug": "cooking",
   "from": "model:DishHistoryEvent",
   "to_slug": "recipe",
   "to": "model:Recipe",
   "via": "recipe_id → recipes.id"
  }
 ],
 "stages": {
  "red": {
   "label": "Red · real cases",
   "real": true,
   "pieces": {
    "model:RecipeFilterMode": {
     "tested": true,
     "cases": [
      "C8134"
     ],
     "red": "cupo capacity is the members own pool — two members of ONE household — chef B fills 5 slots, free A holds 1, s",
     "covers": "cupo capacity / member pool (free-1 chef-5)",
     "guards": "a member's cupo cap is wrong",
     "source": "tests/test_repertorio.py",
     "ids": {
      "fn": [
       "attach_cupo",
       "release_cupo"
      ],
      "endpoint": [
       {
        "m": "PUT",
        "p": "/recipe-filter-modes/{mode_id}/cupo",
        "fn": "put_cupo"
       },
       {
        "m": "DELETE",
        "p": "/recipe-filter-modes/{mode_id}/cupo",
        "fn": "delete_cupo"
       }
      ],
      "model": [
       "RecipeFilterMode"
      ],
      "datatype": [
       {
        "n": "cupo_dish_type",
        "t": "str | None"
       }
      ],
      "test": [
       {
        "cid": "C8134",
        "kind": "unit",
        "state": "red",
        "name": "test_cupo_capacity_is_the_members_own_pool_C8134",
        "tfile": "apps/api/tests/test_repertorio.py"
       },
       {
        "cid": "web",
        "kind": "web",
        "state": "red",
        "name": "useRecipeFilterModes.rollback.test.tsx",
        "tfile": "apps/web/src/features/cooking/useRecipeFilterModes.rollback.test.tsx"
       }
      ]
     },
     "use_case": "A member's cupo capacity is their OWN pool (free 1 / chef 5), fail-closed"
    },
    "model:PlannedRecipe": {
     "tested": true,
     "cases": [
      "C8135",
      "C8136",
      "C8142"
     ],
     "red": "cupo journey stamps and derived counters — planning stamps ``cupo_id`` + ``planned_by_user_id``; · downgrade forces keep one and history survives · plan with cupo stamps the link",
     "covers": "the cook→cupo path (plan stamps cupo_id) + downgrade",
     "guards": "counters diverge / history lost on downgrade",
     "source": "tests/test_repertorio.py + test_repertorio_api.py",
     "ids": {
      "fn": [
       "plan_into_cupo",
       "downgrade_to_free",
       "planeadas_for_cupo",
       "cocinadas_for_cupo"
      ],
      "endpoint": [
       {
        "m": "POST",
        "p": "/recipes/{recipe_id}/plan",
        "fn": "post_plan_recipe"
       },
       {
        "m": "GET",
        "p": "/repertorio/cupos",
        "fn": "get_cupos"
       }
      ],
      "model": [
       "PlannedRecipe"
      ],
      "datatype": [
       {
        "n": "cupo_id",
        "t": "uuid.UUID | None"
       },
       {
        "n": "planned_by_user_id",
        "t": "uuid.UUID"
       },
       {
        "n": "status",
        "t": "str"
       }
      ],
      "test": [
       {
        "cid": "C8135",
        "kind": "unit",
        "state": "red",
        "name": "test_cupo_journey_stamps_and_derived_counters_C8135",
        "tfile": "apps/api/tests/test_repertorio.py"
       },
       {
        "cid": "C8136",
        "kind": "unit",
        "state": "red",
        "name": "test_downgrade_forces_keep_one_and_history_survives_C8136",
        "tfile": "apps/api/tests/test_repertorio.py"
       },
       {
        "cid": "C8142",
        "kind": "integration",
        "state": "red",
        "name": "test_plan_with_cupo_stamps_the_link_C8142",
        "tfile": "apps/api/tests/test_repertorio_api.py"
       }
      ]
     },
     "use_case": "Cook→cupo journey: plan stamps the link · downgrade keeps one · log-derived history survives"
    },
    "model:CookingSession": {
     "tested": false,
     "guards": "a recipe change could break an in-flight session",
     "ids": {
      "datatype": [
       {
        "n": "recipe_id",
        "t": "uuid.UUID"
       }
      ],
      "model": [
       "CookingSession"
      ]
     }
    }
   }
  },
  "execute": {
   "label": "Execute · changes",
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
     "effect": "PlannedRecipe part of the cupo migration",
     "ids": {
      "fn": [
       "plan_into_cupo"
      ],
      "model": [
       "PlannedRecipe"
      ],
      "datatype": [
       {
        "n": "cupo_id",
        "t": "uuid.UUID | None"
       }
      ],
      "structure": [
       "Index ix_planned_recipes_cupo_id",
       "FK → recipe_filter_modes.id (SET NULL)"
      ],
      "test": [
       {
        "cid": "C8135",
        "kind": "unit",
        "state": "pass",
        "name": "test_cupo_journey_stamps_and_derived_counters_C8135",
        "tfile": "apps/api/tests/test_repertorio.py"
       },
       {
        "cid": "C8136",
        "kind": "unit",
        "state": "pass",
        "name": "test_downgrade_forces_keep_one_and_history_survives_C8136",
        "tfile": "apps/api/tests/test_repertorio.py"
       },
       {
        "cid": "C8142",
        "kind": "integration",
        "state": "pass",
        "name": "test_plan_with_cupo_stamps_the_link_C8142",
        "tfile": "apps/api/tests/test_repertorio_api.py"
       }
      ]
     }
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
     "effect": "RecipeFilterMode the mode row becomes a cupo",
     "ids": {
      "fn": [
       "attach_cupo",
       "release_cupo"
      ],
      "model": [
       "RecipeFilterMode"
      ],
      "datatype": [
       {
        "n": "cupo_dish_type",
        "t": "str | None"
       }
      ],
      "structure": [
       "String(60), nullable"
      ],
      "test": [
       {
        "cid": "C8134",
        "kind": "unit",
        "state": "pass",
        "name": "test_cupo_capacity_is_the_members_own_pool_C8134",
        "tfile": "apps/api/tests/test_repertorio.py"
       },
       {
        "cid": "web",
        "kind": "web",
        "state": "pass",
        "name": "useRecipeFilterModes.rollback.test.tsx",
        "tfile": "apps/web/src/features/cooking/useRecipeFilterModes.rollback.test.tsx"
       }
      ]
     }
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
   "label": "Review · real findings",
   "real": true,
   "pieces": {
    "model:PlannedRecipe": {
     "touched_again": true,
     "why": "Cross-type plan is unruled: POST /recipes/{id}/plan {cupo_id} accepts ANY recipe for ANY cupo dish type, so planeadas can carry plans whose ",
     "risk": "medium",
     "impact": "a soup cupo showing dessert planeadas reads as a broken counter to the user",
     "source": "PENDING #209",
     "ids": {
      "fn": [
       "plan_into_cupo"
      ],
      "endpoint": [
       {
        "m": "POST",
        "p": "/recipes/{recipe_id}/plan",
        "fn": "post_plan_recipe"
       }
      ],
      "model": [
       "PlannedRecipe"
      ],
      "datatype": [
       {
        "n": "cupo_id",
        "t": "uuid.UUID | None"
       }
      ]
     }
    },
    "model:RecipeFilterMode": {
     "touched_again": true,
     "why": "attach_cupo silently overwrites (retype): a cupo's dish type can be swapped while old-type planeadas persist under the new label — nothing i",
     "risk": "low",
     "impact": "confusing counter provenance if a retype UI ever ships without a ruling",
     "source": "PENDING #211",
     "ids": {
      "fn": [
       "attach_cupo"
      ],
      "endpoint": [
       {
        "m": "PUT",
        "p": "/recipe-filter-modes/{mode_id}/cupo",
        "fn": "put_cupo"
       }
      ],
      "model": [
       "RecipeFilterMode"
      ],
      "datatype": [
       {
        "n": "cupo_dish_type",
        "t": "str | None"
       }
      ]
     }
    },
    "model:CookingSession": {
     "touched_again": false,
     "why": "unchanged — verify the FK still resolves",
     "risk": "watch"
    }
   }
  },
  "commit": {
   "label": "Commit",
   "real": true,
   "meta": {
    "subject": "feat(repertorio): the mode row becomes the cupo — 0063 migration + real service (C8134-C8136, C8138)",
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
 },
 "ids_head": "430360b8",
 "evidence": {
  "api": {
   "passed": 1164,
   "failed": 0,
   "skipped": 0,
   "exit": 0,
   "head": "93b32077",
   "duration_s": 128.38
  },
  "web": {
   "passed": 856,
   "failed": 0,
   "skipped": 2,
   "exit": 0,
   "head": "fecb2ce3",
   "duration_s": 10.97
  }
 }
};
