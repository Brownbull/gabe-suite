window.GABE_LEVELS = {
 "census": {
  "cooking": {
   "run a session": {
    "cls": [
     "AdvanceStageRequest",
     "AdvanceStageResponse",
     "CompletionRequest",
     "CompletionResponse",
     "CookingPhotoRef",
     "CookingSessionResponse",
     "ReadinessUpdate",
     "SessionCreateRequest",
     "SessionTimerRequest",
     "StageReminderResponse",
     "StageUpdate",
     "StepProgressResponse",
     "StepProgressUpdate"
    ],
    "eps": [
     "POST /cooking/sessions",
     "PATCH /cooking/sessions/{session_id}/steps/{step_id}",
     "POST /cooking/sessions/{session_id}/advance-stage",
     "PATCH /cooking/sessions/{session_id}/stage",
     "PATCH /cooking/sessions/{session_id}/readiness",
     "PATCH /cooking/sessions/{session_id}/timer",
     "POST /cooking/sessions/{session_id}/complete",
     "POST /cooking/sessions/{session_id}/cancel",
     "PUT /cooking/sessions/{session_id}/photos/{slot}",
     "GET /cooking/sessions/{session_id}/photos/{slot}",
     "DELETE /cooking/sessions/{session_id}/photos/{slot}"
    ],
    "fns": [
     "delete_session_photo",
     "get_session_photo",
     "patch_readiness",
     "patch_session_timer",
     "patch_stage",
     "patch_step_progress",
     "post_advance_stage",
     "post_cancel",
     "post_complete",
     "post_start_session",
     "put_session_photo"
    ]
   }
  },
  "pantry": {
   "manage items": {
    "cls": [
     "AddToListRequest",
     "AssignLocationRequest",
     "BatchItemResult",
     "BoughtConfirmationResponse",
     "CreateBatchRequest",
     "CreateBatchResponse",
     "ItemDeleteResponse",
     "Location",
     "LocationCreate",
     "LocationListResponse",
     "LocationResponse",
     "LocationUpdate",
     "PantryItemCreate",
     "PantryItemResponse",
     "PantryItemUpdate",
     "ShoppingItemCreate",
     "ShoppingItemResponse"
    ],
    "eps": [
     "POST /pantry/items",
     "POST /pantry/items/batch",
     "POST /pantry/items/{item_id}/assign-location",
     "PATCH /pantry/items/{item_id}",
     "DELETE /pantry/items/{item_id}",
     "GET /pantry/locations",
     "POST /pantry/locations",
     "PATCH /pantry/locations/{location_id}",
     "DELETE /pantry/locations/{location_id}",
     "POST /shopping/items/{source_id}/add-to-list",
     "POST /shopping/items",
     "POST /shopping/items/{item_id}/confirm-bought"
    ],
    "fns": [
     "assign_location",
     "create_location",
     "create_pantry_item",
     "create_pantry_items_batch",
     "create_shopping_item",
     "delete_pantry_item_route",
     "get_locations",
     "post_add_to_list",
     "post_confirm_bought",
     "remove_location",
     "update_location",
     "update_pantry_item"
    ]
   },
   "reset pantry": {
    "cls": [
     "ResetApplyRequest",
     "ResetApplyResponse",
     "ResetPreviewItem",
     "ResetPreviewRequest",
     "ResetPreviewResponse"
    ],
    "eps": [
     "POST /pantry/reset/preview",
     "POST /pantry/reset/apply"
    ],
    "fns": [
     "post_reset_apply",
     "post_reset_preview"
    ]
   }
  }
 },
 "census_note": "EXAMPLE census \u2014 the workflow-census SHAPE with real pantry/cooking endpoint sets; NOT operator-curated. A real twin's census lives at docs/site/center/workflows/<entity>.json.",
 "colors": {
  "__unclaimed__": "#8a8f98",
  "allergen": "#3f6d4c",
  "auth": "#5a53a8",
  "cooking": "#0d6e78",
  "legal-consent": "#0f766e",
  "pantry": "#b45309",
  "progression": "#8e4585",
  "recipe": "#3f6d4c"
 },
 "cross_edges": [
  {
   "f": "UserDietaryProfile",
   "fs": "allergen",
   "t": "User",
   "ts": "auth",
   "via": "user_id"
  },
  {
   "f": "CookingPhoto",
   "fs": "cooking",
   "t": "Household",
   "ts": "auth",
   "via": "household_id"
  },
  {
   "f": "CookingPhoto",
   "fs": "cooking",
   "t": "User",
   "ts": "auth",
   "via": "user_id"
  },
  {
   "f": "CookingSession",
   "fs": "cooking",
   "t": "Household",
   "ts": "auth",
   "via": "household_id"
  },
  {
   "f": "CookingSession",
   "fs": "cooking",
   "t": "User",
   "ts": "auth",
   "via": "user_id"
  },
  {
   "f": "CookingSession",
   "fs": "cooking",
   "t": "Recipe",
   "ts": "recipe",
   "via": "recipe_id"
  },
  {
   "f": "CookingStageReminder",
   "fs": "cooking",
   "t": "Household",
   "ts": "auth",
   "via": "household_id"
  },
  {
   "f": "CookingStageReminder",
   "fs": "cooking",
   "t": "User",
   "ts": "auth",
   "via": "user_id"
  },
  {
   "f": "CookingStepProgress",
   "fs": "cooking",
   "t": "RecipeStep",
   "ts": "recipe",
   "via": "recipe_step_id"
  },
  {
   "f": "DishHistoryEvent",
   "fs": "cooking",
   "t": "Household",
   "ts": "auth",
   "via": "household_id"
  },
  {
   "f": "DishHistoryEvent",
   "fs": "cooking",
   "t": "User",
   "ts": "auth",
   "via": "user_id"
  },
  {
   "f": "DishHistoryEvent",
   "fs": "cooking",
   "t": "Recipe",
   "ts": "recipe",
   "via": "recipe_id"
  },
  {
   "f": "Notification",
   "fs": "cooking",
   "t": "User",
   "ts": "auth",
   "via": "user_id"
  },
  {
   "f": "ProfileProjection",
   "fs": "cooking",
   "t": "User",
   "ts": "auth",
   "via": "user_id"
  },
  {
   "f": "ConsentRecord",
   "fs": "legal-consent",
   "t": "User",
   "ts": "auth",
   "via": "user_id"
  },
  {
   "f": "IngredientHistoryEvent",
   "fs": "pantry",
   "t": "Household",
   "ts": "auth",
   "via": "household_id"
  },
  {
   "f": "IngredientHistoryEvent",
   "fs": "pantry",
   "t": "User",
   "ts": "auth",
   "via": "actor_user_id"
  },
  {
   "f": "Location",
   "fs": "pantry",
   "t": "Household",
   "ts": "auth",
   "via": "household_id"
  },
  {
   "f": "PantryItem",
   "fs": "pantry",
   "t": "Household",
   "ts": "auth",
   "via": "household_id"
  },
  {
   "f": "PantryItem",
   "fs": "pantry",
   "t": "User",
   "ts": "auth",
   "via": "added_by_user_id"
  },
  {
   "f": "PantryResetOperation",
   "fs": "pantry",
   "t": "Household",
   "ts": "auth",
   "via": "household_id"
  },
  {
   "f": "PantryResetOperation",
   "fs": "pantry",
   "t": "User",
   "ts": "auth",
   "via": "actor_user_id"
  },
  {
   "f": "NodeProgress",
   "fs": "progression",
   "t": "User",
   "ts": "auth",
   "via": "user_id"
  },
  {
   "f": "SkillProgress",
   "fs": "progression",
   "t": "User",
   "ts": "auth",
   "via": "user_id"
  },
  {
   "f": "PlannedRecipe",
   "fs": "recipe",
   "t": "Household",
   "ts": "auth",
   "via": "household_id"
  },
  {
   "f": "PlannedRecipe",
   "fs": "recipe",
   "t": "User",
   "ts": "auth",
   "via": "planned_by_user_id"
  },
  {
   "f": "Recipe",
   "fs": "recipe",
   "t": "User",
   "ts": "auth",
   "via": "creator_user_id"
  },
  {
   "f": "RecipeCreationRequest",
   "fs": "recipe",
   "t": "User",
   "ts": "auth",
   "via": "user_id"
  },
  {
   "f": "RecipeDemand",
   "fs": "recipe",
   "t": "Household",
   "ts": "auth",
   "via": "household_id"
  },
  {
   "f": "RecipeDemand",
   "fs": "recipe",
   "t": "User",
   "ts": "auth",
   "via": "user_id"
  },
  {
   "f": "RecipeFilterMode",
   "fs": "recipe",
   "t": "User",
   "ts": "auth",
   "via": "user_id"
  },
  {
   "f": "UserRecipeFlag",
   "fs": "recipe",
   "t": "User",
   "ts": "auth",
   "via": "user_id"
  }
 ],
 "detail": {
  "cls:allergen|ContextualWarningRule": {
   "base": 1,
   "cases": [
    {
     "cid": "C163",
     "corpus": "api",
     "name": "test_seed_safety_warnings_idempotent_and_provenance_C163",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C624",
     "corpus": "api",
     "name": "test_contextual_warning_rule_round_trip_C624",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "ingredient_code",
     "str",
     "",
     1
    ],
    [
     "state_tag",
     "str",
     "",
     1
    ],
    [
     "aviso_code",
     "str",
     "",
     1
    ],
    [
     "severity",
     "str",
     "",
     0
    ],
    [
     "message_es",
     "str",
     "",
     0
    ],
    [
     "source_kind",
     "str",
     "",
     0
    ],
    [
     "source_ref",
     "str",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Maps (canonical ingredient code + preparation STATE) \u2192 a food-safety advisory that applies ONLY in that state (Future-Features SAFE \u2014 founder chose the prep/state context). E.g. `huevo` + `crudo` \u2192 salmonella caution; `porotos` + `crudo` \u2192 toxina danger. Content is PROVENANCE-TAGGED via `source_kind` (`official` | `ai_default`), `source_ref` NOT NULL \u2014 same two-tier disclosure as IngredientWarning",
   "file": "apps/api/models/catalog.py",
   "fks": [],
   "internal": 2,
   "lines": 326,
   "sim": "IngredientWarning",
   "simj": 0.89,
   "usage": 0
  },
  "cls:allergen|DietPreference": {
   "base": 1,
   "cases": [
    {
     "cid": "C161",
     "corpus": "api",
     "name": "test_seed_diet_preferences_d17_soft_C161",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "code",
     "str",
     "",
     1
    ],
    [
     "display_es",
     "str",
     "",
     0
    ],
    [
     "display_en",
     "str",
     "",
     0
    ],
    [
     "sort_order",
     "int",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "A dietary preference entry for soft filter (D17).",
   "file": "apps/api/models/catalog.py",
   "fks": [],
   "internal": 2,
   "lines": 326,
   "sim": "Restriction",
   "simj": 1.0,
   "usage": 0
  },
  "cls:allergen|ExplorationPreferencesInput": {
   "base": 1,
   "cases": [
    {
     "cid": "C326",
     "corpus": "api",
     "name": "test_empty_input_is_valid_and_defaults_empty_C326",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C327",
     "corpus": "api",
     "name": "test_input_accepts_known_codes_C327",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C328",
     "corpus": "api",
     "name": "test_input_strips_lowercases_and_dedupes_C328",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C329",
     "corpus": "api",
     "name": "test_input_rejects_more_than_three_regions_C329",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C330",
     "corpus": "api",
     "name": "test_input_rejects_more_than_three_techniques_C330",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C331",
     "corpus": "api",
     "name": "test_input_rejects_unknown_region_code_C331",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C372",
     "corpus": "api",
     "name": "test_patch_exploration_requires_household_409_C372",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C373",
     "corpus": "api",
     "name": "test_patch_exploration_updates_and_returns_block_C373",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C374",
     "corpus": "api",
     "name": "test_patch_exploration_path_a_plus_round_trips_C374",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C375",
     "corpus": "api",
     "name": "test_patch_exploration_bad_comfort_time_422_C375",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C376",
     "corpus": "api",
     "name": "test_patch_exploration_bad_complexity_cap_422_C376",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C377",
     "corpus": "api",
     "name": "test_patch_exploration_wholesale_replace_clears_omitted_C377",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 47,
   "cols": [
    [
     "explore_regions",
     "list[str]",
     "",
     0
    ],
    [
     "curiosity_techniques",
     "list[str]",
     "",
     0
    ],
    [
     "comfort_techniques",
     "list[str]",
     "",
     0
    ],
    [
     "comfort_time",
     "list[str]",
     "",
     0
    ],
    [
     "skill_complexity_cap",
     "int | None",
     "",
     0
    ],
    [
     "preference_tastes",
     "list[str]",
     "",
     0
    ],
    [
     "preference_textures",
     "list[str]",
     "",
     0
    ],
    [
     "preference_temperature",
     "str | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "D109 + D109-rev Path A+ exploration input \u2014 five soft-BIAS controls.",
   "file": "apps/api/schemas/preferences.py",
   "fks": [],
   "internal": 4,
   "lines": 435,
   "sim": "ExplorationBlock",
   "simj": 1.0,
   "usage": 1
  },
  "cls:allergen|ExplorationPreferencesPatch": {
   "base": 1,
   "cases": [
    {
     "cid": "C347",
     "corpus": "api",
     "name": "test_patch_path_a_plus_fields_validate_C347",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C348",
     "corpus": "api",
     "name": "test_patch_rejects_complexity_cap_out_of_range_C348",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C359",
     "corpus": "api",
     "name": "test_patch_sensory_fields_validate_C359",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C360",
     "corpus": "api",
     "name": "test_patch_rejects_unknown_sensory_code_C360",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C361",
     "corpus": "api",
     "name": "test_patch_same_shape_validates_C361",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C362",
     "corpus": "api",
     "name": "test_patch_rejects_unknown_code_C362",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C372",
     "corpus": "api",
     "name": "test_patch_exploration_requires_household_409_C372",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C373",
     "corpus": "api",
     "name": "test_patch_exploration_updates_and_returns_block_C373",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C374",
     "corpus": "api",
     "name": "test_patch_exploration_path_a_plus_round_trips_C374",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C375",
     "corpus": "api",
     "name": "test_patch_exploration_bad_comfort_time_422_C375",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C376",
     "corpus": "api",
     "name": "test_patch_exploration_bad_complexity_cap_422_C376",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C377",
     "corpus": "api",
     "name": "test_patch_exploration_wholesale_replace_clears_omitted_C377",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 18,
   "cols": [
    [
     "explore_regions",
     "list[str]",
     "",
     0
    ],
    [
     "curiosity_techniques",
     "list[str]",
     "",
     0
    ],
    [
     "comfort_techniques",
     "list[str]",
     "",
     0
    ],
    [
     "comfort_time",
     "list[str]",
     "",
     0
    ],
    [
     "skill_complexity_cap",
     "int | None",
     "",
     0
    ],
    [
     "preference_tastes",
     "list[str]",
     "",
     0
    ],
    [
     "preference_textures",
     "list[str]",
     "",
     0
    ],
    [
     "preference_temperature",
     "str | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "D109 + D109-rev PATCH body for ``/settings/exploration`` \u2014 WHOLESALE REPLACE semantics.",
   "file": "apps/api/schemas/preferences.py",
   "fks": [],
   "internal": 1,
   "lines": 435,
   "sim": "ExplorationBlock",
   "simj": 1.0,
   "usage": 1
  },
  "cls:allergen|HouseholdFormatPatch": {
   "base": 1,
   "cases": [
    {
     "cid": "C1027",
     "corpus": "api",
     "name": "test_settings_requires_household_409_C1027",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1029",
     "corpus": "api",
     "name": "test_patch_household_partial_update_C1029",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C2137",
     "corpus": "api",
     "name": "test_patch_household_auto_discount_round_trips_C2137",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C2138",
     "corpus": "api",
     "name": "test_patch_household_auto_discount_explicit_null_422_C2138",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C2139",
     "corpus": "api",
     "name": "test_me_carries_the_auto_discount_flag_C2139",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1030",
     "corpus": "api",
     "name": "test_patch_household_bad_serving_422_C1030",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 1,
   "cols": [
    [
     "country",
     "str | None",
     "",
     0
    ],
    [
     "units",
     "str | None",
     "",
     0
    ],
    [
     "currency",
     "str | None",
     "",
     0
    ],
    [
     "default_servings",
     "int | None",
     "",
     0
    ],
    [
     "auto_discount_servings",
     "bool | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/settings.py",
   "fks": [],
   "internal": 1,
   "lines": 118,
   "sim": "HouseholdFormatBlock",
   "simj": 1.0,
   "usage": 1
  },
  "cls:allergen|IngredientRestriction": {
   "base": 1,
   "cases": [
    {
     "cid": "C732",
     "corpus": "api",
     "name": "test_fish_allergen_excluded_via_ingredient_join_C732",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C740",
     "corpus": "api",
     "name": "test_allergen_safe_and_region_on_engine_C740",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C794",
     "corpus": "api",
     "name": "test_allergen_safe_excludes_self_report_and_ingredient_C794",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C886",
     "corpus": "api",
     "name": "test_ingredient_delta_upsert_insert_only_C886",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C981",
     "corpus": "api",
     "name": "test_apply_create_new_ingredient_C981",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C989",
     "corpus": "api",
     "name": "test_boot_seeds_ai_path_delta_restriction_pairs_C989",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 2,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "ingredient_code",
     "str",
     "",
     1
    ],
    [
     "restriction_code",
     "str",
     "",
     1
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Maps a canonical ingredient code \u2192 an allergen-restriction code it BREAKS (R8 / #38).",
   "file": "apps/api/models/catalog.py",
   "fks": [],
   "internal": 4,
   "lines": 326,
   "sim": null,
   "simj": null,
   "usage": 0
  },
  "cls:allergen|IngredientWarning": {
   "base": 1,
   "cases": [
    {
     "cid": "C163",
     "corpus": "api",
     "name": "test_seed_safety_warnings_idempotent_and_provenance_C163",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C623",
     "corpus": "api",
     "name": "test_ingredient_warning_round_trip_C623",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C625",
     "corpus": "api",
     "name": "test_warning_severity_check_rejects_invalid_C625",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C626",
     "corpus": "api",
     "name": "test_warning_source_ref_not_null_C626",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "ingredient_code",
     "str",
     "",
     1
    ],
    [
     "aviso_code",
     "str",
     "",
     1
    ],
    [
     "severity",
     "str",
     "",
     0
    ],
    [
     "message_es",
     "str",
     "",
     0
    ],
    [
     "source_kind",
     "str",
     "",
     0
    ],
    [
     "source_ref",
     "str",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Maps a canonical ingredient code \u2192 an INTRINSIC food-safety advisory it carries (Future-Features SAFE). A SOFT advisory \u2014 *how not to mishandle* (e.g. \"los porotos crudos contienen fitohemaglutinina; hervir 10 min\") \u2014 kept DISTINCT from the HARD allergen wall in `IngredientRestriction` (*who can't eat*). Content is PROVENANCE-TAGGED (founder D-PH-1 revised): `source_kind` is `official` (an authori",
   "file": "apps/api/models/catalog.py",
   "fks": [],
   "internal": 2,
   "lines": 326,
   "sim": "ContextualWarningRule",
   "simj": 0.89,
   "usage": 0
  },
  "cls:allergen|PreferencesPatch": {
   "base": 1,
   "cases": [
    {
     "cid": "C1027",
     "corpus": "api",
     "name": "test_settings_requires_household_409_C1027",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1032",
     "corpus": "api",
     "name": "test_patch_preferences_updates_dietary_C1032",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1033",
     "corpus": "api",
     "name": "test_patch_preferences_diet_folds_into_existing_preferences_C1033",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1034",
     "corpus": "api",
     "name": "test_patch_preferences_too_many_allergens_422_C1034",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1035",
     "corpus": "api",
     "name": "test_patch_preferences_clear_allergens_with_empty_list_C1035",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1036",
     "corpus": "api",
     "name": "test_patch_preferences_null_allergens_rejected_C1036",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 2,
   "cols": [
    [
     "language",
     "str | None",
     "",
     0
    ],
    [
     "allergens",
     "list[str] | None",
     "",
     0
    ],
    [
     "preferences",
     "list[str] | None",
     "",
     0
    ],
    [
     "diet",
     "str | None",
     "",
     0
    ],
    [
     "share_shopping_data",
     "bool | None",
     "",
     0
    ],
    [
     "share_culinary_preferences",
     "bool | None",
     "",
     0
    ],
    [
     "allow_reminders",
     "bool | None",
     "",
     0
    ],
    [
     "cooking",
     "bool | None",
     "",
     0
    ],
    [
     "shopping",
     "bool | None",
     "",
     0
    ],
    [
     "pantry",
     "bool | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/settings.py",
   "fks": [],
   "internal": 2,
   "lines": 118,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:allergen|Restriction": {
   "base": 1,
   "cases": [
    {
     "cid": "C154",
     "corpus": "api",
     "name": "test_restriction_d17_hard_filter_C154",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C160",
     "corpus": "api",
     "name": "test_seed_restrictions_d17_allergens_C160",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "code",
     "str",
     "",
     1
    ],
    [
     "display_es",
     "str",
     "",
     0
    ],
    [
     "display_en",
     "str",
     "",
     0
    ],
    [
     "sort_order",
     "int",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "An allergen/restriction entry for hard SQL filter (D17).",
   "file": "apps/api/models/catalog.py",
   "fks": [],
   "internal": 4,
   "lines": 326,
   "sim": "DietPreference",
   "simj": 1.0,
   "usage": 0
  },
  "cls:allergen|UserDietaryProfile": {
   "base": 0,
   "cases": [
    {
     "cid": "C214",
     "corpus": "api",
     "name": "test_cookability_allergen_delta_strictly_smaller_C214",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C592",
     "corpus": "api",
     "name": "test_allergen_recipe_never_in_plan_C592",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C599",
     "corpus": "api",
     "name": "test_gap_excludes_archived_and_allergenic_planned_C599",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C600",
     "corpus": "api",
     "name": "test_get_current_drops_now_allergenic_recipe_C600",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C601",
     "corpus": "api",
     "name": "test_get_current_drops_ingredient_derived_recipe_C601",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C602",
     "corpus": "api",
     "name": "test_get_current_drops_via_reconciled_alias_C602",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C1027",
     "corpus": "api",
     "name": "test_settings_requires_household_409_C1027",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1032",
     "corpus": "api",
     "name": "test_patch_preferences_updates_dietary_C1032",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1033",
     "corpus": "api",
     "name": "test_patch_preferences_diet_folds_into_existing_preferences_C1033",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1034",
     "corpus": "api",
     "name": "test_patch_preferences_too_many_allergens_422_C1034",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1035",
     "corpus": "api",
     "name": "test_patch_preferences_clear_allergens_with_empty_list_C1035",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1036",
     "corpus": "api",
     "name": "test_patch_preferences_null_allergens_rejected_C1036",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 7,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "user_id",
     "uuid.UUID",
     "",
     1
    ],
    [
     "allergens",
     "list[str]",
     "",
     0
    ],
    [
     "preferences",
     "list[str]",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ],
    [
     "updated_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Two-section dietary profile (D108): allergens[] (hard SQL filter) + preferences[] (soft).",
   "file": "apps/api/models/preferences.py",
   "fks": [
    [
     "user_id",
     "users.id"
    ]
   ],
   "internal": 7,
   "lines": 229,
   "sim": null,
   "simj": null,
   "usage": 2
  },
  "cls:auth|Household": {
   "base": 1,
   "cases": [
    {
     "cid": "C13",
     "corpus": "api",
     "name": "test_delete_me_wipes_every_seeded_table_and_spares_system_recipe_C13",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C15",
     "corpus": "api",
     "name": "test_delete_me_multi_member_household_survives_C15",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C268",
     "corpus": "api",
     "name": "test_user_delete_cascades_to_cooking_photo_C268",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C446",
     "corpus": "api",
     "name": "test_iter_candidate_recipes_batches_complete_and_safe_C446",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C468",
     "corpus": "api",
     "name": "test_ingest_routes_not_found_to_admin_queue_C468",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C469",
     "corpus": "api",
     "name": "test_ingest_idempotent_replay_C469",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 17,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "name",
     "str",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "A cooking household \u2014 the tenant boundary for pantry, recipes, shopping.",
   "file": "apps/api/models/household.py",
   "fks": [],
   "internal": 11,
   "lines": 46,
   "sim": "HouseholdSummary",
   "simj": 0.67,
   "usage": 10
  },
  "cls:auth|SetupCompleteRequest": {
   "base": 0,
   "cases": [
    {
     "cid": "C1020",
     "corpus": "api",
     "name": "test_setup_minimal_uses_defaults_C1020",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C1021",
     "corpus": "api",
     "name": "test_setup_blank_name_rejected_C1021",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C1022",
     "corpus": "api",
     "name": "test_setup_rejects_unknown_field_C1022",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C1023",
     "corpus": "api",
     "name": "test_setup_propagates_nested_boundary_rule_C1023",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C218",
     "corpus": "api",
     "name": "test_overview_returns_cookability_fields_C218",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C251",
     "corpus": "api",
     "name": "test_complete_rejects_stored_over_total_C251",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C389",
     "corpus": "api",
     "name": "test_setup_complete_with_exploration_creates_row_C389",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C390",
     "corpus": "api",
     "name": "test_setup_complete_folds_in_path_a_plus_C390",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C391",
     "corpus": "api",
     "name": "test_setup_complete_without_exploration_creates_empty_row_C391",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 21,
   "cols": [
    [
     "household_name",
     "str",
     "",
     0
    ],
    [
     "household_format",
     "HouseholdFormatInput",
     "",
     0
    ],
    [
     "user_format",
     "UserFormatInput",
     "",
     0
    ],
    [
     "dietary",
     "DietaryProfileInput",
     "",
     0
    ],
    [
     "exploration",
     "ExplorationPreferencesInput",
     "",
     0
    ],
    [
     "privacy",
     "PrivacyPermissionsInput",
     "",
     0
    ],
    [
     "notifications",
     "NotificationPreferencesInput",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Everything a first-run user submits to finish setup and create their household.",
   "file": "apps/api/schemas/setup.py",
   "fks": [],
   "internal": 2,
   "lines": 46,
   "sim": "PreferencesSummary",
   "simj": 0.86,
   "usage": 1
  },
  "cls:auth|User": {
   "base": 1,
   "cases": [
    {
     "cid": "C13",
     "corpus": "api",
     "name": "test_delete_me_wipes_every_seeded_table_and_spares_system_recipe_C13",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C14",
     "corpus": "api",
     "name": "test_delete_me_still_204s_when_firebase_delete_fails_C14",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C15",
     "corpus": "api",
     "name": "test_delete_me_multi_member_household_survives_C15",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C81",
     "corpus": "api",
     "name": "test_gustify_chef_exhausted_402_C81",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C134",
     "corpus": "api",
     "name": "test_get_auth_context_persists_user_even_on_fresh_identity_C134",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C228",
     "corpus": "api",
     "name": "test_step_progress_is_user_private_within_household_C228",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 21,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "auth_provider",
     "str",
     "",
     1
    ],
    [
     "auth_provider_id",
     "str",
     "",
     1
    ],
    [
     "email",
     "str | None",
     "",
     0
    ],
    [
     "display_name",
     "str | None",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "A person, identified provider-agnostically (Firebase today, portable tomorrow).",
   "file": "apps/api/models/identity.py",
   "fks": [],
   "internal": 8,
   "lines": 33,
   "sim": "UserSummary",
   "simj": 0.67,
   "usage": 19
  },
  "cls:cooking|ActiveCookingResponse": {
   "base": 0,
   "cases": [
    {
     "cid": "C236",
     "corpus": "api",
     "name": "test_cooking_requires_auth_C236",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C253",
     "corpus": "api",
     "name": "test_slot_replace_swaps_bytes_and_keeps_row_count_stable_C253",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C265",
     "corpus": "api",
     "name": "test_active_sessions_response_carries_photo_refs_without_bytes_C265",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C266",
     "corpus": "api",
     "name": "test_active_sessions_response_carries_recipe_title_C266",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C283",
     "corpus": "api",
     "name": "test_timer_patch_api_round_trip_C283",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "",
     "corpus": "web",
     "name": "6 case(s)",
     "state": "file",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "sessions",
     "list[CookingSessionResponse]",
     "",
     0
    ],
    [
     "count",
     "int",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/cooking.py",
   "fks": [],
   "internal": 1,
   "lines": 231,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:cooking|AdvanceStageRequest": {
   "base": 1,
   "cases": [
    {
     "cid": "C555",
     "corpus": "api",
     "name": "test_advance_and_due_routes_C555",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "expected_stage",
     "int",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Advance a long-prep session. ``expected_stage`` is the stage the client believes the session is on \u2014 advancing is optimistically concurrent (a stale/retry value is a safe no-op replay), so a double-tap can't skip a stage.",
   "file": "apps/api/schemas/cooking.py",
   "fks": [],
   "internal": 1,
   "lines": 231,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:cooking|AdvanceStageResponse": {
   "base": 0,
   "cases": [
    {
     "cid": "C555",
     "corpus": "api",
     "name": "test_advance_and_due_routes_C555",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "session_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "current_stage",
     "int | None",
     "",
     0
    ],
    [
     "next_reminder",
     "StageReminderResponse | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/cooking.py",
   "fks": [],
   "internal": 1,
   "lines": 231,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:cooking|CompletionRequest": {
   "base": 1,
   "cases": [
    {
     "cid": "C242",
     "corpus": "api",
     "name": "test_completion_request_rejects_unknown_storage_method_C242",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C251",
     "corpus": "api",
     "name": "test_complete_rejects_stored_over_total_C251",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C264",
     "corpus": "api",
     "name": "test_complete_keeps_photos_C264",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1087",
     "corpus": "api",
     "name": "test_cook_route_unlocks_surface_on_profile_C1087",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "",
     "corpus": "web",
     "name": "15 case(s)",
     "state": "file",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "actual_portions",
     "int",
     "",
     0
    ],
    [
     "portions_stored",
     "int",
     "",
     0
    ],
    [
     "notes",
     "str | None",
     "",
     0
    ],
    [
     "storage_method_code",
     "str | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Completion counters. ``actual_portions`` is the total cooked; ``portions_stored`` (0 \u2264 stored \u2264 actual) are set aside as a prepared pantry item, the rest eaten.",
   "file": "apps/api/schemas/cooking.py",
   "fks": [],
   "internal": 1,
   "lines": 231,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:cooking|CompletionResponse": {
   "base": 1,
   "cases": [
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C251",
     "corpus": "api",
     "name": "test_complete_rejects_stored_over_total_C251",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C264",
     "corpus": "api",
     "name": "test_complete_keeps_photos_C264",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1087",
     "corpus": "api",
     "name": "test_cook_route_unlocks_surface_on_profile_C1087",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "",
     "corpus": "web",
     "name": "15 case(s)",
     "state": "file",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "session_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "status",
     "str",
     "",
     0
    ],
    [
     "actual_portions",
     "int",
     "",
     0
    ],
    [
     "portions_eaten",
     "int",
     "",
     0
    ],
    [
     "portions_stored",
     "int",
     "",
     0
    ],
    [
     "dish_history_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "ingredient_events_count",
     "int",
     "",
     0
    ],
    [
     "prepared_pantry_item_id",
     "uuid.UUID | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/cooking.py",
   "fks": [],
   "internal": 1,
   "lines": 231,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:cooking|CookingPhoto": {
   "base": 0,
   "cases": [
    {
     "cid": "C13",
     "corpus": "api",
     "name": "test_delete_me_wipes_every_seeded_table_and_spares_system_recipe_C13",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C268",
     "corpus": "api",
     "name": "test_user_delete_cascades_to_cooking_photo_C268",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "user_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "household_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "session_id",
     "uuid.UUID",
     "",
     1
    ],
    [
     "slot",
     "str",
     "",
     1
    ],
    [
     "content_type",
     "str",
     "",
     0
    ],
    [
     "size_bytes",
     "int",
     "",
     0
    ],
    [
     "data",
     "bytes",
     "",
     0
    ],
    [
     "storage",
     "str",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "A cook-photo binary attached to a cooking session (H8, founder-ratified D144).",
   "file": "apps/api/models/cooking.py",
   "fks": [
    [
     "household_id",
     "households.id"
    ],
    [
     "session_id",
     "cooking_sessions.id"
    ],
    [
     "user_id",
     "users.id"
    ]
   ],
   "internal": 1,
   "lines": 248,
   "sim": "CookingPhotoRef",
   "simj": 0.5,
   "usage": 0
  },
  "cls:cooking|CookingPhotoRef": {
   "base": 1,
   "cases": [
    {
     "cid": "C236",
     "corpus": "api",
     "name": "test_cooking_requires_auth_C236",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C253",
     "corpus": "api",
     "name": "test_slot_replace_swaps_bytes_and_keeps_row_count_stable_C253",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C265",
     "corpus": "api",
     "name": "test_active_sessions_response_carries_photo_refs_without_bytes_C265",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C266",
     "corpus": "api",
     "name": "test_active_sessions_response_carries_recipe_title_C266",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C283",
     "corpus": "api",
     "name": "test_timer_patch_api_round_trip_C283",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "",
     "corpus": "web",
     "name": "6 case(s)",
     "state": "file",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "slot",
     "str",
     "",
     0
    ],
    [
     "content_type",
     "str",
     "",
     0
    ],
    [
     "size_bytes",
     "int",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "A cook-photo's metadata (H8 / D144) \u2014 NEVER the bytes. GET the binary route (``/cooking/sessions/{id}/photos/{slot}``) for the actual image.",
   "file": "apps/api/schemas/cooking.py",
   "fks": [],
   "internal": 1,
   "lines": 231,
   "sim": "CookingPhoto",
   "simj": 0.5,
   "usage": 2
  },
  "cls:cooking|CookingSession": {
   "base": 0,
   "cases": [
    {
     "cid": "C13",
     "corpus": "api",
     "name": "test_delete_me_wipes_every_seeded_table_and_spares_system_recipe_C13",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C268",
     "corpus": "api",
     "name": "test_user_delete_cascades_to_cooking_photo_C268",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C661",
     "corpus": "api",
     "name": "test_cooked_ledger_uses_snapshot_immune_to_recipe_edit_C661",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C662",
     "corpus": "api",
     "name": "test_cooked_ledger_mixes_snapshot_and_live_fallback_C662",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C741",
     "corpus": "api",
     "name": "test_cooked_and_complexity_range_on_engine_C741",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C764",
     "corpus": "api",
     "name": "test_backfill_recomputes_node_progress_for_user_C764",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 1,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "user_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "household_id",
     "uuid.UUID",
     "",
     1
    ],
    [
     "recipe_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "idempotency_key",
     "str",
     "",
     1
    ],
    [
     "status",
     "str",
     "",
     0
    ],
    [
     "stage",
     "str",
     "",
     0
    ],
    [
     "reminder_at",
     "datetime | None",
     "",
     0
    ],
    [
     "readiness",
     "dict[str, Any] | None",
     "",
     0
    ],
    [
     "planned_portions",
     "int",
     "",
     0
    ],
    [
     "actual_portions",
     "int | None",
     "",
     0
    ],
    [
     "current_stage",
     "int | None",
     "",
     0
    ],
    [
     "completion_summary",
     "dict[str, Any] | None",
     "",
     0
    ],
    [
     "timer_step_id",
     "str | None",
     "",
     0
    ],
    [
     "timer_ends_at",
     "datetime | None",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ],
    [
     "completed_at",
     "datetime | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "An active or completed cooking session.",
   "file": "apps/api/models/cooking.py",
   "fks": [
    [
     "household_id",
     "households.id"
    ],
    [
     "recipe_id",
     "recipes.id"
    ],
    [
     "user_id",
     "users.id"
    ]
   ],
   "internal": 4,
   "lines": 248,
   "sim": "CookingSessionResponse",
   "simj": 0.75,
   "usage": 4
  },
  "cls:cooking|CookingSessionResponse": {
   "base": 0,
   "cases": [
    {
     "cid": "C236",
     "corpus": "api",
     "name": "test_cooking_requires_auth_C236",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C237",
     "corpus": "api",
     "name": "test_session_requires_idempotency_key_C237",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C253",
     "corpus": "api",
     "name": "test_slot_replace_swaps_bytes_and_keeps_row_count_stable_C253",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C262",
     "corpus": "api",
     "name": "test_upload_rejected_on_non_active_session_C262",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C263",
     "corpus": "api",
     "name": "test_cancel_wipes_photos_C263",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 12,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "user_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "recipe_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "recipe_title",
     "str",
     "",
     0
    ],
    [
     "status",
     "str",
     "",
     0
    ],
    [
     "stage",
     "str",
     "",
     0
    ],
    [
     "current_stage",
     "int | None",
     "long-prep stage index (REQ-16); None = single-session",
     0
    ],
    [
     "reminder_at",
     "datetime | None",
     "",
     0
    ],
    [
     "timer_step_id",
     "uuid.UUID | None",
     "",
     0
    ],
    [
     "timer_ends_at",
     "datetime | None",
     "",
     0
    ],
    [
     "readiness",
     "dict[str, Any] | None",
     "",
     0
    ],
    [
     "planned_portions",
     "int",
     "",
     0
    ],
    [
     "actual_portions",
     "int | None",
     "",
     0
    ],
    [
     "completion_summary",
     "dict[str, Any] | None",
     "",
     0
    ],
    [
     "completed_step_ids",
     "list[uuid.UUID]",
     "",
     0
    ],
    [
     "photos",
     "list[CookingPhotoRef]",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ],
    [
     "completed_at",
     "datetime | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/cooking.py",
   "fks": [],
   "internal": 1,
   "lines": 231,
   "sim": "CookingSession",
   "simj": 0.75,
   "usage": 6
  },
  "cls:cooking|CookingStageReminder": {
   "base": 0,
   "cases": [
    {
     "cid": "C546",
     "corpus": "api",
     "name": "test_start_seeds_first_stage_reminder_C546",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C547",
     "corpus": "api",
     "name": "test_non_staged_recipe_seeds_nothing_C547",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C548",
     "corpus": "api",
     "name": "test_advance_schedules_next_stage_C548",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "session_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "household_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "user_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "stage_index",
     "int",
     "",
     0
    ],
    [
     "label",
     "str",
     "",
     0
    ],
    [
     "due_at",
     "datetime",
     "",
     0
    ],
    [
     "status",
     "str",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Durable per-stage reminder for a long-prep cooking session (REQ-16 / SC-07).",
   "file": "apps/api/models/cooking.py",
   "fks": [
    [
     "household_id",
     "households.id"
    ],
    [
     "session_id",
     "cooking_sessions.id"
    ],
    [
     "user_id",
     "users.id"
    ]
   ],
   "internal": 1,
   "lines": 248,
   "sim": "StageReminderResponse",
   "simj": 0.67,
   "usage": 0
  },
  "cls:cooking|CookingStepProgress": {
   "base": 0,
   "cases": [
    {
     "cid": "C13",
     "corpus": "api",
     "name": "test_delete_me_wipes_every_seeded_table_and_spares_system_recipe_C13",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "session_id",
     "uuid.UUID",
     "",
     1
    ],
    [
     "recipe_step_id",
     "uuid.UUID",
     "",
     1
    ],
    [
     "status",
     "str",
     "",
     0
    ],
    [
     "started_at",
     "datetime | None",
     "",
     0
    ],
    [
     "completed_at",
     "datetime | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Per-step progress within a cooking session.",
   "file": "apps/api/models/cooking.py",
   "fks": [
    [
     "recipe_step_id",
     "recipe_steps.id"
    ],
    [
     "session_id",
     "cooking_sessions.id"
    ]
   ],
   "internal": 1,
   "lines": 248,
   "sim": "StepProgressResponse",
   "simj": 1.0,
   "usage": 0
  },
  "cls:cooking|DishHistoryEvent": {
   "base": 0,
   "cases": [
    {
     "cid": "C13",
     "corpus": "api",
     "name": "test_delete_me_wipes_every_seeded_table_and_spares_system_recipe_C13",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C232",
     "corpus": "api",
     "name": "test_dish_history_created_C232",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C661",
     "corpus": "api",
     "name": "test_cooked_ledger_uses_snapshot_immune_to_recipe_edit_C661",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C662",
     "corpus": "api",
     "name": "test_cooked_ledger_mixes_snapshot_and_live_fallback_C662",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C741",
     "corpus": "api",
     "name": "test_cooked_and_complexity_range_on_engine_C741",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C764",
     "corpus": "api",
     "name": "test_backfill_recomputes_node_progress_for_user_C764",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 3,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "user_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "household_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "recipe_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "session_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "recipe_title_snapshot",
     "str",
     "",
     0
    ],
    [
     "recipe_snapshot",
     "dict[str, Any] | None",
     "",
     0
    ],
    [
     "portions",
     "int",
     "",
     0
    ],
    [
     "complexity",
     "int",
     "",
     0
    ],
    [
     "notes",
     "str | None",
     "",
     0
    ],
    [
     "occurred_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Append-only dish history \u2014 feeds profile aggregates.",
   "file": "apps/api/models/cooking.py",
   "fks": [
    [
     "household_id",
     "households.id"
    ],
    [
     "recipe_id",
     "recipes.id"
    ],
    [
     "session_id",
     "cooking_sessions.id"
    ],
    [
     "user_id",
     "users.id"
    ]
   ],
   "internal": 16,
   "lines": 248,
   "sim": "DishHistoryResponse",
   "simj": 0.64,
   "usage": 0
  },
  "cls:cooking|DueRemindersResponse": {
   "base": 0,
   "cases": [
    {
     "cid": "C555",
     "corpus": "api",
     "name": "test_advance_and_due_routes_C555",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "reminders",
     "list[StageReminderResponse]",
     "",
     0
    ],
    [
     "count",
     "int",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/cooking.py",
   "fks": [],
   "internal": 1,
   "lines": 231,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:cooking|Notification": {
   "base": 0,
   "cases": [
    {
     "cid": "C13",
     "corpus": "api",
     "name": "test_delete_me_wipes_every_seeded_table_and_spares_system_recipe_C13",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C628",
     "corpus": "api",
     "name": "test_notification_creates_C628",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C629",
     "corpus": "api",
     "name": "test_mark_read_C629",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C630",
     "corpus": "api",
     "name": "test_mark_read_all_C630",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C634",
     "corpus": "api",
     "name": "test_future_due_row_hidden_from_list_and_unread_count_C634",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C635",
     "corpus": "api",
     "name": "test_past_due_row_visible_in_list_and_unread_count_C635",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 4,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "user_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "category",
     "str",
     "",
     0
    ],
    [
     "title",
     "str",
     "",
     0
    ],
    [
     "body",
     "str | None",
     "",
     0
    ],
    [
     "source_type",
     "str | None",
     "",
     0
    ],
    [
     "source_ref_id",
     "uuid.UUID | None",
     "",
     0
    ],
    [
     "payload",
     "dict[str, object] | None",
     "",
     0
    ],
    [
     "due_at",
     "datetime | None",
     "",
     0
    ],
    [
     "is_read",
     "bool",
     "",
     0
    ],
    [
     "is_deleted",
     "bool",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "A user notification \u2014 read/delete state is user-owned.",
   "file": "apps/api/models/notification.py",
   "fks": [
    [
     "user_id",
     "users.id"
    ]
   ],
   "internal": 2,
   "lines": 104,
   "sim": "NotificationResponse",
   "simj": 0.83,
   "usage": 0
  },
  "cls:cooking|ProfileProjection": {
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "user_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "total_dishes_cooked",
     "int",
     "",
     0
    ],
    [
     "total_recipes_created",
     "int",
     "",
     0
    ],
    [
     "avg_complexity",
     "float | None",
     "",
     0
    ],
    [
     "summary_data",
     "dict[str, Any] | None",
     "",
     0
    ],
    [
     "updated_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Cached profile summary for fast Perfil landing (Batch 7).",
   "file": "apps/api/models/notification.py",
   "fks": [
    [
     "user_id",
     "users.id"
    ]
   ],
   "internal": 2,
   "lines": 104,
   "sim": "ProfileProjectionResponse",
   "simj": 0.56,
   "usage": 0
  },
  "cls:cooking|ReadinessUpdate": {
   "base": 1,
   "cases": [
    {
     "cid": "C675",
     "corpus": "api",
     "name": "test_cooking_stage_readiness_routes_C675",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "source_selections",
     "dict[str, Any] | None",
     "",
     0
    ],
    [
     "photo_ready",
     "bool | None",
     "",
     0
    ],
    [
     "verified",
     "bool | None",
     "",
     0
    ],
    [
     "log_draft",
     "dict[str, Any] | None",
     "",
     0
    ],
    [
     "mode_preference",
     "Literal['auto', 'practitioner'] | None",
     "",
     0
    ],
    [
     "planned_portions",
     "int | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Source/photo readiness patch (Phase 14; photo upload storage deferred).",
   "file": "apps/api/schemas/cooking.py",
   "fks": [],
   "internal": 1,
   "lines": 231,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:cooking|SessionCreateRequest": {
   "base": 1,
   "cases": [
    {
     "cid": "C237",
     "corpus": "api",
     "name": "test_session_requires_idempotency_key_C237",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C267",
     "corpus": "api",
     "name": "test_start_session_response_carries_recipe_title_C267",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C283",
     "corpus": "api",
     "name": "test_timer_patch_api_round_trip_C283",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C284",
     "corpus": "api",
     "name": "test_timer_patch_mixed_body_api_returns_422_C284",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C555",
     "corpus": "api",
     "name": "test_advance_and_due_routes_C555",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 3,
   "cols": [
    [
     "recipe_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "planned_portions",
     "int",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/cooking.py",
   "fks": [],
   "internal": 1,
   "lines": 231,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:cooking|SessionTimerRequest": {
   "base": 1,
   "cases": [
    {
     "cid": "C277",
     "corpus": "api",
     "name": "test_timer_request_rejects_mixed_body_C277",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C278",
     "corpus": "api",
     "name": "test_timer_request_rejects_zero_duration_C278",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C279",
     "corpus": "api",
     "name": "test_timer_request_allows_max_duration_C279",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C280",
     "corpus": "api",
     "name": "test_timer_request_allows_both_null_C280",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C283",
     "corpus": "api",
     "name": "test_timer_patch_api_round_trip_C283",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C284",
     "corpus": "api",
     "name": "test_timer_patch_mixed_body_api_returns_422_C284",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C285",
     "corpus": "api",
     "name": "test_timer_patch_unknown_session_returns_404_C285",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "step_id",
     "uuid.UUID | None",
     "",
     0
    ],
    [
     "duration_seconds",
     "int | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Start/replace or clear a session's per-step timer (H7, founder-locked 2026-07-08). ``step_id`` + ``duration_seconds`` BOTH set starts/replaces the timer; BOTH null clears it; a mixed body is rejected (422). The SERVER clock computes ``timer_ends_at`` \u2014 never trusts a client-supplied instant, so the countdown survives an app kill/reinstall.",
   "file": "apps/api/schemas/cooking.py",
   "fks": [],
   "internal": 1,
   "lines": 231,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:cooking|StageReminderResponse": {
   "base": 1,
   "cases": [
    {
     "cid": "C555",
     "corpus": "api",
     "name": "test_advance_and_due_routes_C555",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "session_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "stage_index",
     "int",
     "",
     0
    ],
    [
     "label",
     "str",
     "",
     0
    ],
    [
     "due_at",
     "datetime",
     "",
     0
    ],
    [
     "status",
     "str",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "A durable stage reminder for a long-prep session (SC-07).",
   "file": "apps/api/schemas/cooking.py",
   "fks": [],
   "internal": 1,
   "lines": 231,
   "sim": "CookingStageReminder",
   "simj": 0.67,
   "usage": 2
  },
  "cls:cooking|StageUpdate": {
   "base": 1,
   "cases": [
    {
     "cid": "C675",
     "corpus": "api",
     "name": "test_cooking_stage_readiness_routes_C675",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C677",
     "corpus": "api",
     "name": "test_stage_unknown_session_404_C677",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "action",
     "str",
     "",
     0
    ],
    [
     "reminder_at",
     "datetime | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Pause/continue a multi-day session (Phase 14). ``reminder_at`` is only meaningful with ``pause`` \u2014 supplying it on ``continue`` is rejected.",
   "file": "apps/api/schemas/cooking.py",
   "fks": [],
   "internal": 1,
   "lines": 231,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:cooking|StepProgressResponse": {
   "base": 1,
   "cases": [],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "session_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "recipe_step_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "status",
     "str",
     "",
     0
    ],
    [
     "started_at",
     "datetime | None",
     "",
     0
    ],
    [
     "completed_at",
     "datetime | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/cooking.py",
   "fks": [],
   "internal": 1,
   "lines": 231,
   "sim": "CookingStepProgress",
   "simj": 1.0,
   "usage": 1
  },
  "cls:cooking|StepProgressUpdate": {
   "base": 1,
   "cases": [],
   "cases_more": 0,
   "cols": [
    [
     "status",
     "str",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/cooking.py",
   "fks": [],
   "internal": 1,
   "lines": 231,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:legal-consent|ConsentRecord": {
   "base": 0,
   "cases": [
    {
     "cid": "C212",
     "corpus": "api",
     "name": "test_consent_is_append_only_C212",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C998",
     "corpus": "api",
     "name": "test_reset_and_seed_sandbox_records_consent_for_the_real_gate_C998",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "user_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "policy_version",
     "str",
     "",
     0
    ],
    [
     "accepted_at",
     "datetime",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "A single acceptance of the privacy policy + terms, at a policy version.",
   "file": "apps/api/models/consent.py",
   "fks": [
    [
     "user_id",
     "users.id"
    ]
   ],
   "internal": 3,
   "lines": 36,
   "sim": null,
   "simj": null,
   "usage": 0
  },
  "cls:pantry|AddToListRequest": {
   "base": 1,
   "cases": [
    {
     "cid": "C674",
     "corpus": "api",
     "name": "test_from_planned_and_add_to_list_C674",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "source",
     "str",
     "",
     0
    ],
    [
     "display_name",
     "str | None",
     "",
     0
    ],
    [
     "unit_code",
     "str | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/shopping.py",
   "fks": [],
   "internal": 1,
   "lines": 67,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:pantry|AssignLocationRequest": {
   "base": 1,
   "cases": [
    {
     "cid": "C682",
     "corpus": "api",
     "name": "test_assign_location_C682",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C683",
     "corpus": "api",
     "name": "test_assign_location_unknown_item_404_C683",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "location_id",
     "uuid.UUID",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Assign a pantry item to a storage location (Phase 15).",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 1,
   "lines": 366,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:pantry|BatchCandidateResponse": {
   "base": 1,
   "cases": [
    {
     "cid": "C136",
     "corpus": "api",
     "name": "test_resolve_batch_requires_auth_C136",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C138",
     "corpus": "api",
     "name": "test_resolve_batch_matches_seeded_ingredients_C138",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C139",
     "corpus": "api",
     "name": "test_resolve_batch_rejects_empty_lines_C139",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C140",
     "corpus": "api",
     "name": "test_resolve_batch_caps_line_count_C140",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C141",
     "corpus": "api",
     "name": "test_resolve_batch_rejects_oversized_line_C141",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C142",
     "corpus": "api",
     "name": "test_resolve_batch_accepts_at_cap_line_C142",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "code",
     "str",
     "",
     0
    ],
    [
     "label",
     "str",
     "",
     0
    ],
    [
     "kind",
     "BatchItemKind",
     "",
     0
    ],
    [
     "score",
     "float",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "One ranked canonical candidate a typed line could map to.",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 1,
   "lines": 366,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:pantry|BatchItemResult": {
   "base": 0,
   "cases": [
    {
     "cid": "C137",
     "corpus": "api",
     "name": "test_create_batch_requires_auth_C137",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C143",
     "corpus": "api",
     "name": "test_create_batch_creates_all_rows_C143",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C144",
     "corpus": "api",
     "name": "test_create_batch_rejects_foreign_location_per_row_C144",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C145",
     "corpus": "api",
     "name": "test_create_batch_empty_is_rejected_C145",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C146",
     "corpus": "api",
     "name": "test_create_batch_caps_item_count_C146",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C149",
     "corpus": "api",
     "name": "test_frequent_ingredients_orders_by_add_count_C149",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 2,
   "cols": [
    [
     "index",
     "int",
     "",
     0
    ],
    [
     "created",
     "PantryItemResponse | None",
     "",
     0
    ],
    [
     "error",
     "str | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Per-row outcome: the created item (on success) or an error message (on failure). The index ties the result back to the request row so the client can report partial failures precisely.",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 1,
   "lines": 366,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:pantry|BatchResolvedLineResponse": {
   "base": 0,
   "cases": [
    {
     "cid": "C136",
     "corpus": "api",
     "name": "test_resolve_batch_requires_auth_C136",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C138",
     "corpus": "api",
     "name": "test_resolve_batch_matches_seeded_ingredients_C138",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C139",
     "corpus": "api",
     "name": "test_resolve_batch_rejects_empty_lines_C139",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C140",
     "corpus": "api",
     "name": "test_resolve_batch_caps_line_count_C140",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C141",
     "corpus": "api",
     "name": "test_resolve_batch_rejects_oversized_line_C141",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C142",
     "corpus": "api",
     "name": "test_resolve_batch_accepts_at_cap_line_C142",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "raw",
     "str",
     "",
     0
    ],
    [
     "parsed_name",
     "str",
     "",
     0
    ],
    [
     "quantity",
     "float",
     "",
     0
    ],
    [
     "unit_code",
     "str",
     "",
     0
    ],
    [
     "confidence",
     "BatchMatchConfidence",
     "",
     0
    ],
    [
     "candidates",
     "list[BatchCandidateResponse]",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "A resolved input line: parsed quantity + ranked candidates + confidence band. `candidates` is empty when confidence is `low` (the UI forces pick-or-drop so the pantry stays canonical).",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 1,
   "lines": 366,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:pantry|BoughtConfirmationResponse": {
   "base": 1,
   "cases": [
    {
     "cid": "C706",
     "corpus": "api",
     "name": "test_confirm_bought_route_creates_pantry_item_C706",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C707",
     "corpus": "api",
     "name": "test_confirm_bought_route_idempotent_replay_C707",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C708",
     "corpus": "api",
     "name": "test_confirm_bought_route_unknown_404_C708",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "",
     "corpus": "web",
     "name": "15 case(s)",
     "state": "file",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "shopping_item_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "pantry_item_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "history_event_id",
     "uuid.UUID",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/shopping.py",
   "fks": [],
   "internal": 1,
   "lines": 67,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:pantry|CreateBatchRequest": {
   "base": 0,
   "cases": [
    {
     "cid": "C137",
     "corpus": "api",
     "name": "test_create_batch_requires_auth_C137",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C143",
     "corpus": "api",
     "name": "test_create_batch_creates_all_rows_C143",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C144",
     "corpus": "api",
     "name": "test_create_batch_rejects_foreign_location_per_row_C144",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C145",
     "corpus": "api",
     "name": "test_create_batch_empty_is_rejected_C145",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C146",
     "corpus": "api",
     "name": "test_create_batch_caps_item_count_C146",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C149",
     "corpus": "api",
     "name": "test_frequent_ingredients_orders_by_add_count_C149",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 2,
   "cols": [
    [
     "items",
     "list[BatchItemInput]",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 1,
   "lines": 366,
   "sim": "FrequentIngredientsResponse",
   "simj": 1.0,
   "usage": 1
  },
  "cls:pantry|CreateBatchResponse": {
   "base": 0,
   "cases": [
    {
     "cid": "C137",
     "corpus": "api",
     "name": "test_create_batch_requires_auth_C137",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C143",
     "corpus": "api",
     "name": "test_create_batch_creates_all_rows_C143",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C144",
     "corpus": "api",
     "name": "test_create_batch_rejects_foreign_location_per_row_C144",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C145",
     "corpus": "api",
     "name": "test_create_batch_empty_is_rejected_C145",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C146",
     "corpus": "api",
     "name": "test_create_batch_caps_item_count_C146",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C149",
     "corpus": "api",
     "name": "test_frequent_ingredients_orders_by_add_count_C149",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 2,
   "cols": [
    [
     "results",
     "list[BatchItemResult]",
     "",
     0
    ],
    [
     "created_count",
     "int",
     "",
     0
    ],
    [
     "failed_count",
     "int",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 1,
   "lines": 366,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:pantry|FrequentIngredient": {
   "base": 1,
   "cases": [
    {
     "cid": "C147",
     "corpus": "api",
     "name": "test_frequent_ingredients_requires_auth_C147",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C148",
     "corpus": "api",
     "name": "test_frequent_ingredients_empty_when_no_history_C148",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C149",
     "corpus": "api",
     "name": "test_frequent_ingredients_orders_by_add_count_C149",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "code",
     "str",
     "",
     0
    ],
    [
     "name",
     "str",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "One canonical ingredient the household adds often \u2014 feeds the batch-add quick-pick strip.",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 1,
   "lines": 366,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:pantry|FrequentIngredientsResponse": {
   "base": 0,
   "cases": [
    {
     "cid": "C147",
     "corpus": "api",
     "name": "test_frequent_ingredients_requires_auth_C147",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C148",
     "corpus": "api",
     "name": "test_frequent_ingredients_empty_when_no_history_C148",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C149",
     "corpus": "api",
     "name": "test_frequent_ingredients_orders_by_add_count_C149",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "items",
     "list[FrequentIngredient]",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 1,
   "lines": 366,
   "sim": "CreateBatchRequest",
   "simj": 1.0,
   "usage": 1
  },
  "cls:pantry|FromPlannedRecipesResponse": {
   "base": 0,
   "cases": [
    {
     "cid": "C674",
     "corpus": "api",
     "name": "test_from_planned_and_add_to_list_C674",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C676",
     "corpus": "api",
     "name": "test_p14_routes_require_auth_C676",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "items",
     "list[ShoppingItemResponse]",
     "",
     0
    ],
    [
     "count",
     "int",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/shopping.py",
   "fks": [],
   "internal": 1,
   "lines": 67,
   "sim": "ResetPreviewResponse",
   "simj": 0.67,
   "usage": 1
  },
  "cls:pantry|IngredientHistoryEvent": {
   "base": 0,
   "cases": [
    {
     "cid": "C229",
     "corpus": "api",
     "name": "test_complete_session_atomic_C229",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C699",
     "corpus": "api",
     "name": "test_delete_item_used_logs_consumo_event_C699",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C700",
     "corpus": "api",
     "name": "test_delete_item_removed_no_history_event_C700",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C701",
     "corpus": "api",
     "name": "test_delete_item_idempotent_replay_C701",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C713",
     "corpus": "api",
     "name": "test_history_event_creates_C713",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C714",
     "corpus": "api",
     "name": "test_add_pantry_item_C714",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 3,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "household_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "actor_user_id",
     "uuid.UUID | None",
     "",
     0
    ],
    [
     "ingredient_code",
     "str",
     "",
     0
    ],
    [
     "display_name_snapshot",
     "str",
     "",
     0
    ],
    [
     "quantity",
     "float",
     "",
     0
    ],
    [
     "unit_code",
     "str",
     "",
     0
    ],
    [
     "source",
     "str",
     "",
     0
    ],
    [
     "source_ref_id",
     "uuid.UUID | None",
     "",
     0
    ],
    [
     "occurred_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Append-only ingredient history \u2014 source is compra/receta/descarte.",
   "file": "apps/api/models/pantry.py",
   "fks": [
    [
     "actor_user_id",
     "users.id"
    ],
    [
     "household_id",
     "households.id"
    ]
   ],
   "internal": 6,
   "lines": 165,
   "sim": "IngredientHistoryResponse",
   "simj": 0.8,
   "usage": 0
  },
  "cls:pantry|IngredientHistoryPage": {
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "cols": [
    [
     "events",
     "list[IngredientHistoryResponse]",
     "",
     0
    ],
    [
     "count",
     "int",
     "",
     0
    ],
    [
     "has_more",
     "bool",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 1,
   "lines": 366,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:pantry|IngredientHistoryResponse": {
   "base": 1,
   "cases": [],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "ingredient_code",
     "str",
     "",
     0
    ],
    [
     "display_name_snapshot",
     "str",
     "",
     0
    ],
    [
     "quantity",
     "float",
     "",
     0
    ],
    [
     "unit_code",
     "str",
     "",
     0
    ],
    [
     "source",
     "str",
     "",
     0
    ],
    [
     "source_ref_id",
     "uuid.UUID | None",
     "",
     0
    ],
    [
     "occurred_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 1,
   "lines": 366,
   "sim": "IngredientHistoryEvent",
   "simj": 0.8,
   "usage": 1
  },
  "cls:pantry|ItemCandidate": {
   "base": 1,
   "cases": [
    {
     "cid": "C674",
     "corpus": "api",
     "name": "test_from_planned_and_add_to_list_C674",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1077",
     "corpus": "api",
     "name": "test_shopping_requires_auth_C1077",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "ingredient_code",
     "str",
     "",
     0
    ],
    [
     "display_name",
     "str",
     "",
     0
    ],
    [
     "unit_code",
     "str",
     "",
     0
    ],
    [
     "count",
     "int",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "A non-persisted shopping suggestion (frequent or planned-recipe gap).",
   "file": "apps/api/schemas/shopping.py",
   "fks": [],
   "internal": 2,
   "lines": 67,
   "sim": "ShoppingItemCreate",
   "simj": 0.5,
   "usage": 1
  },
  "cls:pantry|ItemDeleteResponse": {
   "base": 1,
   "cases": [
    {
     "cid": "C699",
     "corpus": "api",
     "name": "test_delete_item_used_logs_consumo_event_C699",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C700",
     "corpus": "api",
     "name": "test_delete_item_removed_no_history_event_C700",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C701",
     "corpus": "api",
     "name": "test_delete_item_idempotent_replay_C701",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C702",
     "corpus": "api",
     "name": "test_delete_item_not_found_404_C702",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C703",
     "corpus": "api",
     "name": "test_delete_item_bad_reason_400_C703",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C704",
     "corpus": "api",
     "name": "test_delete_item_requires_auth_C704",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 1,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "status",
     "str",
     "",
     0
    ],
    [
     "reason",
     "ItemDeleteReason",
     "",
     0
    ],
    [
     "history_logged",
     "bool",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "FLAT delete result (D84) \u2014 the new status + whether a history event was logged.",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 1,
   "lines": 366,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:pantry|Location": {
   "base": 0,
   "cases": [
    {
     "cid": "C8122",
     "corpus": "api",
     "name": "test_account_export_serializes_a_renamed_column_C8122",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C621",
     "corpus": "api",
     "name": "test_create_user_household_membership_location_C621",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C742",
     "corpus": "api",
     "name": "test_principal_despensa_created_once_C742",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C743",
     "corpus": "api",
     "name": "test_second_principal_per_household_rejected_by_db_C743",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C1064",
     "corpus": "api",
     "name": "test_complete_setup_does_not_duplicate_principal_C1064",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C137",
     "corpus": "api",
     "name": "test_create_batch_requires_auth_C137",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C143",
     "corpus": "api",
     "name": "test_create_batch_creates_all_rows_C143",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C144",
     "corpus": "api",
     "name": "test_create_batch_rejects_foreign_location_per_row_C144",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C145",
     "corpus": "api",
     "name": "test_create_batch_empty_is_rejected_C145",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C146",
     "corpus": "api",
     "name": "test_create_batch_caps_item_count_C146",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C149",
     "corpus": "api",
     "name": "test_frequent_ingredients_orders_by_add_count_C149",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 4,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "household_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "name",
     "str",
     "",
     0
    ],
    [
     "is_principal",
     "bool",
     "",
     0
    ],
    [
     "color",
     "str | None",
     "",
     0
    ],
    [
     "icon",
     "str | None",
     "",
     0
    ],
    [
     "order",
     "int | None",
     "",
     0
    ],
    [
     "active",
     "bool",
     "",
     0
    ],
    [
     "type",
     "str | None",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "A storage location in a household. Exactly one principal `Despensa` is protected.",
   "file": "apps/api/models/location.py",
   "fks": [
    [
     "household_id",
     "households.id"
    ]
   ],
   "internal": 5,
   "lines": 78,
   "sim": "LocationResponse",
   "simj": 0.8,
   "usage": 5
  },
  "cls:pantry|LocationCreate": {
   "base": 0,
   "cases": [
    {
     "cid": "C718",
     "corpus": "api",
     "name": "test_add_location_C718",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C719",
     "corpus": "api",
     "name": "test_delete_location_moves_items_C719",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C721",
     "corpus": "api",
     "name": "test_list_locations_principal_first_C721",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C682",
     "corpus": "api",
     "name": "test_assign_location_C682",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C683",
     "corpus": "api",
     "name": "test_assign_location_unknown_item_404_C683",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C692",
     "corpus": "api",
     "name": "test_location_create_with_color_icon_round_trips_C692",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C693",
     "corpus": "api",
     "name": "test_location_create_without_color_icon_is_null_C693",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C695",
     "corpus": "api",
     "name": "test_location_patch_changes_color_icon_C695",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C696",
     "corpus": "api",
     "name": "test_location_create_unknown_color_422_C696",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 2,
   "cols": [
    [
     "name",
     "str",
     "",
     0
    ],
    [
     "color",
     "LocationColor | None",
     "",
     0
    ],
    [
     "icon",
     "LocationIcon | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 3,
   "lines": 366,
   "sim": "LocationUpdate",
   "simj": 0.6,
   "usage": 1
  },
  "cls:pantry|LocationListResponse": {
   "base": 0,
   "cases": [
    {
     "cid": "C8112",
     "corpus": "api",
     "name": "test_principal_location_cannot_be_deactivated_C8112",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C692",
     "corpus": "api",
     "name": "test_location_create_with_color_icon_round_trips_C692",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C694",
     "corpus": "api",
     "name": "test_principal_despensa_has_default_color_icon_C694",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C729",
     "corpus": "api",
     "name": "test_locations_requires_auth_C729",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "locations",
     "list[LocationResponse]",
     "",
     0
    ],
    [
     "count",
     "int",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 1,
   "lines": 366,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:pantry|LocationResponse": {
   "base": 1,
   "cases": [
    {
     "cid": "C8110",
     "corpus": "api",
     "name": "test_location_patch_persists_order_C8110",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C8111",
     "corpus": "api",
     "name": "test_location_patch_persists_active_C8111",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C8112",
     "corpus": "api",
     "name": "test_principal_location_cannot_be_deactivated_C8112",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C682",
     "corpus": "api",
     "name": "test_assign_location_C682",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C683",
     "corpus": "api",
     "name": "test_assign_location_unknown_item_404_C683",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C692",
     "corpus": "api",
     "name": "test_location_create_with_color_icon_round_trips_C692",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 7,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "name",
     "str",
     "",
     0
    ],
    [
     "is_principal",
     "bool",
     "",
     0
    ],
    [
     "color",
     "str | None",
     "",
     0
    ],
    [
     "icon",
     "str | None",
     "",
     0
    ],
    [
     "order",
     "int | None",
     "",
     0
    ],
    [
     "active",
     "bool",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 1,
   "lines": 366,
   "sim": "Location",
   "simj": 0.8,
   "usage": 3
  },
  "cls:pantry|LocationUpdate": {
   "base": 0,
   "cases": [
    {
     "cid": "C8110",
     "corpus": "api",
     "name": "test_location_patch_persists_order_C8110",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C8111",
     "corpus": "api",
     "name": "test_location_patch_persists_active_C8111",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C8112",
     "corpus": "api",
     "name": "test_principal_location_cannot_be_deactivated_C8112",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C695",
     "corpus": "api",
     "name": "test_location_patch_changes_color_icon_C695",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C698",
     "corpus": "api",
     "name": "test_location_patch_unknown_color_422_C698",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "name",
     "str | None",
     "",
     0
    ],
    [
     "color",
     "LocationColor | None",
     "",
     0
    ],
    [
     "icon",
     "LocationIcon | None",
     "",
     0
    ],
    [
     "order",
     "int | None",
     "",
     0
    ],
    [
     "active",
     "bool | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 2,
   "lines": 366,
   "sim": "LocationResponse",
   "simj": 0.62,
   "usage": 1
  },
  "cls:pantry|PantryItem": {
   "base": 0,
   "cases": [
    {
     "cid": "C13",
     "corpus": "api",
     "name": "test_delete_me_wipes_every_seeded_table_and_spares_system_recipe_C13",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C15",
     "corpus": "api",
     "name": "test_delete_me_multi_member_household_survives_C15",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C143",
     "corpus": "api",
     "name": "test_create_batch_creates_all_rows_C143",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C8133",
     "corpus": "api",
     "name": "test_create_batch_honours_prepared_kind_C8133",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C238",
     "corpus": "api",
     "name": "test_complete_stored_creates_prepared_item_C238",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C243",
     "corpus": "api",
     "name": "test_complete_stored_idempotent_replay_C243",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 8,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "household_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "ingredient_code",
     "str",
     "",
     0
    ],
    [
     "display_name",
     "str",
     "",
     0
    ],
    [
     "kind",
     "str",
     "",
     0
    ],
    [
     "quantity",
     "float",
     "",
     0
    ],
    [
     "unit_code",
     "str",
     "",
     0
    ],
    [
     "location_id",
     "uuid.UUID | None",
     "",
     0
    ],
    [
     "expiry_date",
     "str | None",
     "",
     0
    ],
    [
     "storage_method_code",
     "str | None",
     "",
     0
    ],
    [
     "notes",
     "str | None",
     "",
     0
    ],
    [
     "status",
     "str",
     "",
     0
    ],
    [
     "added_by_user_id",
     "uuid.UUID | None",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ],
    [
     "updated_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "A current-state inventory row \u2014 what is believed to exist in the household pantry.",
   "file": "apps/api/models/pantry.py",
   "fks": [
    [
     "added_by_user_id",
     "users.id"
    ],
    [
     "household_id",
     "households.id"
    ],
    [
     "location_id",
     "locations.id"
    ]
   ],
   "internal": 7,
   "lines": 165,
   "sim": "PantryItemResponse",
   "simj": 0.8,
   "usage": 1
  },
  "cls:pantry|PantryItemCreate": {
   "base": 1,
   "cases": [
    {
     "cid": "C714",
     "corpus": "api",
     "name": "test_add_pantry_item_C714",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C715",
     "corpus": "api",
     "name": "test_edit_pantry_item_C715",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C717",
     "corpus": "api",
     "name": "test_list_pantry_items_C717",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C719",
     "corpus": "api",
     "name": "test_delete_location_moves_items_C719",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C722",
     "corpus": "api",
     "name": "test_reset_preview_C722",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C723",
     "corpus": "api",
     "name": "test_reset_apply_atomic_C723",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C137",
     "corpus": "api",
     "name": "test_create_batch_requires_auth_C137",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C143",
     "corpus": "api",
     "name": "test_create_batch_creates_all_rows_C143",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C144",
     "corpus": "api",
     "name": "test_create_batch_rejects_foreign_location_per_row_C144",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C145",
     "corpus": "api",
     "name": "test_create_batch_empty_is_rejected_C145",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C146",
     "corpus": "api",
     "name": "test_create_batch_caps_item_count_C146",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C149",
     "corpus": "api",
     "name": "test_frequent_ingredients_orders_by_add_count_C149",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 9,
   "cols": [
    [
     "ingredient_code",
     "str",
     "",
     0
    ],
    [
     "display_name",
     "str",
     "",
     0
    ],
    [
     "kind",
     "Literal['ingredient', 'prepared']",
     "",
     0
    ],
    [
     "quantity",
     "float",
     "",
     0
    ],
    [
     "unit_code",
     "str",
     "",
     0
    ],
    [
     "location_id",
     "uuid.UUID | None",
     "",
     0
    ],
    [
     "expiry_date",
     "str | None",
     "",
     0
    ],
    [
     "notes",
     "str | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 2,
   "lines": 366,
   "sim": "BatchItemInput",
   "simj": 1.0,
   "usage": 2
  },
  "cls:pantry|PantryItemResponse": {
   "base": 1,
   "cases": [
    {
     "cid": "C137",
     "corpus": "api",
     "name": "test_create_batch_requires_auth_C137",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C143",
     "corpus": "api",
     "name": "test_create_batch_creates_all_rows_C143",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C144",
     "corpus": "api",
     "name": "test_create_batch_rejects_foreign_location_per_row_C144",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C145",
     "corpus": "api",
     "name": "test_create_batch_empty_is_rejected_C145",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C146",
     "corpus": "api",
     "name": "test_create_batch_caps_item_count_C146",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C149",
     "corpus": "api",
     "name": "test_frequent_ingredients_orders_by_add_count_C149",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 18,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "ingredient_code",
     "str",
     "",
     0
    ],
    [
     "display_name",
     "str",
     "",
     0
    ],
    [
     "kind",
     "Literal['ingredient', 'prepared']",
     "",
     0
    ],
    [
     "quantity",
     "float",
     "",
     0
    ],
    [
     "unit_code",
     "str",
     "",
     0
    ],
    [
     "location_id",
     "uuid.UUID | None",
     "",
     0
    ],
    [
     "expiry_date",
     "str | None",
     "",
     0
    ],
    [
     "notes",
     "str | None",
     "",
     0
    ],
    [
     "status",
     "str",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ],
    [
     "updated_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 1,
   "lines": 366,
   "sim": "PantryItem",
   "simj": 0.8,
   "usage": 5
  },
  "cls:pantry|PantryItemUpdate": {
   "base": 1,
   "cases": [
    {
     "cid": "C715",
     "corpus": "api",
     "name": "test_edit_pantry_item_C715",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C716",
     "corpus": "api",
     "name": "test_edit_pantry_item_not_found_C716",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C682",
     "corpus": "api",
     "name": "test_assign_location_C682",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C683",
     "corpus": "api",
     "name": "test_assign_location_unknown_item_404_C683",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "",
     "corpus": "web",
     "name": "4 case(s)",
     "state": "file",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "display_name",
     "str | None",
     "",
     0
    ],
    [
     "quantity",
     "float | None",
     "",
     0
    ],
    [
     "unit_code",
     "str | None",
     "",
     0
    ],
    [
     "location_id",
     "uuid.UUID | None",
     "",
     0
    ],
    [
     "expiry_date",
     "str | None",
     "",
     0
    ],
    [
     "notes",
     "str | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 2,
   "lines": 366,
   "sim": "PantryItemCreate",
   "simj": 0.75,
   "usage": 2
  },
  "cls:pantry|PantryOverviewResponse": {
   "base": 0,
   "cases": [
    {
     "cid": "C218",
     "corpus": "api",
     "name": "test_overview_returns_cookability_fields_C218",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C541",
     "corpus": "api",
     "name": "test_pantry_overview_localizes_canonical_display_name_C541",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C699",
     "corpus": "api",
     "name": "test_delete_item_used_logs_consumo_event_C699",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C706",
     "corpus": "api",
     "name": "test_confirm_bought_route_creates_pantry_item_C706",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C707",
     "corpus": "api",
     "name": "test_confirm_bought_route_idempotent_replay_C707",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 4,
   "cols": [
    [
     "items",
     "list[PantryItemResponse]",
     "",
     0
    ],
    [
     "count",
     "int",
     "",
     0
    ],
    [
     "cookable_count",
     "int",
     "",
     0
    ],
    [
     "catalog_total",
     "int",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Pantry overview + the cookability summary (F1.1).",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 1,
   "lines": 366,
   "sim": "FromPlannedRecipesResponse",
   "simj": 0.5,
   "usage": 1
  },
  "cls:pantry|PantryResetDecision": {
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "reset_operation_id",
     "uuid.UUID",
     "",
     1
    ],
    [
     "pantry_item_id",
     "uuid.UUID",
     "",
     1
    ],
    [
     "decision",
     "str",
     "",
     0
    ],
    [
     "move_to_location_id",
     "uuid.UUID | None",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Per-item decision in a reset operation: keep / discard / move.",
   "file": "apps/api/models/pantry.py",
   "fks": [
    [
     "move_to_location_id",
     "locations.id"
    ],
    [
     "pantry_item_id",
     "pantry_items.id"
    ],
    [
     "reset_operation_id",
     "pantry_reset_operations.id"
    ]
   ],
   "internal": 1,
   "lines": 165,
   "sim": "ResetDecisionInput",
   "simj": 0.5,
   "usage": 0
  },
  "cls:pantry|PantryResetOperation": {
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "household_id",
     "uuid.UUID",
     "",
     1
    ],
    [
     "idempotency_key",
     "str",
     "",
     1
    ],
    [
     "scope",
     "str",
     "",
     0
    ],
    [
     "scope_location_id",
     "uuid.UUID | None",
     "",
     0
    ],
    [
     "status",
     "str",
     "",
     0
    ],
    [
     "summary",
     "dict[str, Any] | None",
     "",
     0
    ],
    [
     "actor_user_id",
     "uuid.UUID | None",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ],
    [
     "completed_at",
     "datetime | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "A pantry reset operation \u2014 scope + summary. Idempotency-required.",
   "file": "apps/api/models/pantry.py",
   "fks": [
    [
     "actor_user_id",
     "users.id"
    ],
    [
     "household_id",
     "households.id"
    ],
    [
     "scope_location_id",
     "locations.id"
    ]
   ],
   "internal": 1,
   "lines": 165,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:pantry|ResetApplyRequest": {
   "base": 0,
   "cases": [
    {
     "cid": "C723",
     "corpus": "api",
     "name": "test_reset_apply_atomic_C723",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C724",
     "corpus": "api",
     "name": "test_reset_idempotent_replay_C724",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C726",
     "corpus": "api",
     "name": "test_history_source_filter_C726",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C709",
     "corpus": "api",
     "name": "test_reset_apply_route_keep_discard_C709",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C710",
     "corpus": "api",
     "name": "test_reset_apply_route_requires_idempotency_key_C710",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C711",
     "corpus": "api",
     "name": "test_reset_apply_route_idempotent_replay_C711",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C730",
     "corpus": "api",
     "name": "test_reset_requires_idempotency_key_C730",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "",
     "corpus": "web",
     "name": "15 case(s)",
     "state": "file",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "decisions",
     "list[ResetDecisionInput]",
     "",
     0
    ],
    [
     "scope",
     "str",
     "",
     0
    ],
    [
     "scope_location_id",
     "uuid.UUID | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 2,
   "lines": 366,
   "sim": "ResetPreviewRequest",
   "simj": 0.67,
   "usage": 1
  },
  "cls:pantry|ResetApplyResponse": {
   "base": 1,
   "cases": [
    {
     "cid": "C709",
     "corpus": "api",
     "name": "test_reset_apply_route_keep_discard_C709",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C710",
     "corpus": "api",
     "name": "test_reset_apply_route_requires_idempotency_key_C710",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C711",
     "corpus": "api",
     "name": "test_reset_apply_route_idempotent_replay_C711",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C730",
     "corpus": "api",
     "name": "test_reset_requires_idempotency_key_C730",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "",
     "corpus": "web",
     "name": "15 case(s)",
     "state": "file",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "operation_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "kept",
     "int",
     "",
     0
    ],
    [
     "discarded",
     "int",
     "",
     0
    ],
    [
     "moved",
     "int",
     "",
     0
    ],
    [
     "summary",
     "dict[str, Any]",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 1,
   "lines": 366,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:pantry|ResetPreviewItem": {
   "base": 1,
   "cases": [],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "ingredient_code",
     "str",
     "",
     0
    ],
    [
     "display_name",
     "str",
     "",
     0
    ],
    [
     "quantity",
     "float",
     "",
     0
    ],
    [
     "unit_code",
     "str",
     "",
     0
    ],
    [
     "location_id",
     "uuid.UUID | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 1,
   "lines": 366,
   "sim": "ShoppingItemCreate",
   "simj": 0.57,
   "usage": 1
  },
  "cls:pantry|ResetPreviewRequest": {
   "base": 1,
   "cases": [],
   "cases_more": 0,
   "cols": [
    [
     "scope",
     "str",
     "",
     0
    ],
    [
     "scope_location_id",
     "uuid.UUID | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 1,
   "lines": 366,
   "sim": "ResetApplyRequest",
   "simj": 0.67,
   "usage": 1
  },
  "cls:pantry|ResetPreviewResponse": {
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "cols": [
    [
     "items",
     "list[ResetPreviewItem]",
     "",
     0
    ],
    [
     "count",
     "int",
     "",
     0
    ],
    [
     "scope",
     "str",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 1,
   "lines": 366,
   "sim": "FromPlannedRecipesResponse",
   "simj": 0.67,
   "usage": 1
  },
  "cls:pantry|ResolveBatchRequest": {
   "base": 1,
   "cases": [
    {
     "cid": "C136",
     "corpus": "api",
     "name": "test_resolve_batch_requires_auth_C136",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C138",
     "corpus": "api",
     "name": "test_resolve_batch_matches_seeded_ingredients_C138",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C139",
     "corpus": "api",
     "name": "test_resolve_batch_rejects_empty_lines_C139",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C140",
     "corpus": "api",
     "name": "test_resolve_batch_caps_line_count_C140",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C141",
     "corpus": "api",
     "name": "test_resolve_batch_rejects_oversized_line_C141",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C142",
     "corpus": "api",
     "name": "test_resolve_batch_accepts_at_cap_line_C142",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "lines",
     "list[BatchLine]",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Raw typed lines (one product per line, optional inline quantity). Capped for DoS safety: at most MAX_BATCH_LINES lines, each at most MAX_LINE_LENGTH chars (enforced pre-handler).",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 1,
   "lines": 366,
   "sim": "ResolveBatchResponse",
   "simj": 1.0,
   "usage": 1
  },
  "cls:pantry|ResolveBatchResponse": {
   "base": 0,
   "cases": [
    {
     "cid": "C136",
     "corpus": "api",
     "name": "test_resolve_batch_requires_auth_C136",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C138",
     "corpus": "api",
     "name": "test_resolve_batch_matches_seeded_ingredients_C138",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C139",
     "corpus": "api",
     "name": "test_resolve_batch_rejects_empty_lines_C139",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C140",
     "corpus": "api",
     "name": "test_resolve_batch_caps_line_count_C140",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C141",
     "corpus": "api",
     "name": "test_resolve_batch_rejects_oversized_line_C141",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C142",
     "corpus": "api",
     "name": "test_resolve_batch_accepts_at_cap_line_C142",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "lines",
     "list[BatchResolvedLineResponse]",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/pantry.py",
   "fks": [],
   "internal": 1,
   "lines": 366,
   "sim": "ResolveBatchRequest",
   "simj": 1.0,
   "usage": 1
  },
  "cls:pantry|ShoppingDashboardResponse": {
   "base": 0,
   "cases": [
    {
     "cid": "C674",
     "corpus": "api",
     "name": "test_from_planned_and_add_to_list_C674",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1077",
     "corpus": "api",
     "name": "test_shopping_requires_auth_C1077",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "pending",
     "list[ShoppingItemResponse]",
     "",
     0
    ],
    [
     "recent",
     "list[ShoppingItemResponse]",
     "",
     0
    ],
    [
     "frequent",
     "list[ItemCandidate]",
     "",
     0
    ],
    [
     "suggested",
     "list[ItemCandidate]",
     "",
     0
    ],
    [
     "pending_count",
     "int",
     "",
     0
    ],
    [
     "recent_count",
     "int",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/shopping.py",
   "fks": [],
   "internal": 1,
   "lines": 67,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:pantry|ShoppingItemCreate": {
   "base": 1,
   "cases": [
    {
     "cid": "C1071",
     "corpus": "api",
     "name": "test_add_shopping_item_C1071",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C1072",
     "corpus": "api",
     "name": "test_list_shopping_C1072",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C1073",
     "corpus": "api",
     "name": "test_confirm_bought_atomic_C1073",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C1074",
     "corpus": "api",
     "name": "test_confirm_bought_idempotent_replay_C1074",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C1076",
     "corpus": "api",
     "name": "test_bought_moves_to_recent_C1076",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C706",
     "corpus": "api",
     "name": "test_confirm_bought_route_creates_pantry_item_C706",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C707",
     "corpus": "api",
     "name": "test_confirm_bought_route_idempotent_replay_C707",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "ingredient_code",
     "str",
     "",
     0
    ],
    [
     "display_name",
     "str",
     "",
     0
    ],
    [
     "quantity",
     "float",
     "",
     0
    ],
    [
     "unit_code",
     "str",
     "",
     0
    ],
    [
     "notes",
     "str | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/shopping.py",
   "fks": [],
   "internal": 2,
   "lines": 67,
   "sim": "PantryItemCreate",
   "simj": 0.62,
   "usage": 1
  },
  "cls:pantry|ShoppingItemResponse": {
   "base": 1,
   "cases": [
    {
     "cid": "C674",
     "corpus": "api",
     "name": "test_from_planned_and_add_to_list_C674",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C676",
     "corpus": "api",
     "name": "test_p14_routes_require_auth_C676",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C706",
     "corpus": "api",
     "name": "test_confirm_bought_route_creates_pantry_item_C706",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C707",
     "corpus": "api",
     "name": "test_confirm_bought_route_idempotent_replay_C707",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1077",
     "corpus": "api",
     "name": "test_shopping_requires_auth_C1077",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "ingredient_code",
     "str",
     "",
     0
    ],
    [
     "display_name",
     "str",
     "",
     0
    ],
    [
     "quantity",
     "float",
     "",
     0
    ],
    [
     "unit_code",
     "str",
     "",
     0
    ],
    [
     "status",
     "str",
     "",
     0
    ],
    [
     "source",
     "str",
     "",
     0
    ],
    [
     "notes",
     "str | None",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ],
    [
     "bought_at",
     "datetime | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/shopping.py",
   "fks": [],
   "internal": 1,
   "lines": 67,
   "sim": "PantryItemResponse",
   "simj": 0.57,
   "usage": 4
  },
  "cls:progression|AccountExportResponse": {
   "base": 1,
   "cases": [
    {
     "cid": "C684",
     "corpus": "api",
     "name": "test_account_export_stub_C684",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C685",
     "corpus": "api",
     "name": "test_account_export_requires_household_409_C685",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "export_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "status",
     "str",
     "",
     0
    ],
    [
     "message",
     "str",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Acknowledgement for POST /account/export (Phase 15 stub).",
   "file": "apps/api/schemas/responses.py",
   "fks": [],
   "internal": 1,
   "lines": 263,
   "sim": null,
   "simj": null,
   "usage": 0
  },
  "cls:progression|MeResponse": {
   "base": 0,
   "cases": [
    {
     "cid": "C218",
     "corpus": "api",
     "name": "test_overview_returns_cookability_fields_C218",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C251",
     "corpus": "api",
     "name": "test_complete_rejects_stored_over_total_C251",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C387",
     "corpus": "api",
     "name": "test_me_surfaces_empty_exploration_for_no_row_C387",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C388",
     "corpus": "api",
     "name": "test_me_surfaces_written_exploration_C388",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C389",
     "corpus": "api",
     "name": "test_setup_complete_with_exploration_creates_row_C389",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 26,
   "cols": [
    [
     "setup_required",
     "bool",
     "",
     0
    ],
    [
     "user",
     "UserSummary",
     "",
     0
    ],
    [
     "household",
     "HouseholdSummary | None",
     "",
     0
    ],
    [
     "membership",
     "MembershipSummary | None",
     "",
     0
    ],
    [
     "preferences",
     "PreferencesSummary | None",
     "",
     0
    ],
    [
     "subscription",
     "SubscriptionSummary",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/responses.py",
   "fks": [],
   "internal": 1,
   "lines": 263,
   "sim": null,
   "simj": null,
   "usage": 0
  },
  "cls:progression|NodeProgress": {
   "base": 0,
   "cases": [
    {
     "cid": "C752",
     "corpus": "api",
     "name": "test_cook_count_is_a_high_water_mark_never_demotes_C752",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C763",
     "corpus": "api",
     "name": "test_profile_tier_floors_when_node_progress_decayed_C763",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C764",
     "corpus": "api",
     "name": "test_backfill_recomputes_node_progress_for_user_C764",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C768",
     "corpus": "api",
     "name": "test_headline_tier_stays_technique_only_C768",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "user_id",
     "uuid.UUID",
     "",
     1
    ],
    [
     "tree_node_id",
     "uuid.UUID",
     "",
     1
    ],
    [
     "cook_count",
     "int",
     "",
     0
    ],
    [
     "last_cooked_at",
     "datetime | None",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ],
    [
     "updated_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Per-user RAW progression signal on a node (roast M2/M3).",
   "file": "apps/api/models/progression.py",
   "fks": [
    [
     "tree_node_id",
     "tree_node.id"
    ],
    [
     "user_id",
     "users.id"
    ]
   ],
   "internal": 3,
   "lines": 152,
   "sim": null,
   "simj": null,
   "usage": 0
  },
  "cls:progression|ProfileSummaryResponse": {
   "base": 0,
   "cases": [
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C744",
     "corpus": "api",
     "name": "test_profile_summary_requires_household_409_C744",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C745",
     "corpus": "api",
     "name": "test_profile_summary_mvp_empty_shape_C745",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C746",
     "corpus": "api",
     "name": "test_profile_summary_landing_aggregate_fields_C746",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1087",
     "corpus": "api",
     "name": "test_cook_route_unlocks_surface_on_profile_C1087",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "tier",
     "str",
     "",
     0
    ],
    [
     "credits_allowance",
     "int",
     "",
     0
    ],
    [
     "credits_remaining",
     "int",
     "",
     0
    ],
    [
     "proficiency_tier",
     "str",
     "",
     0
    ],
    [
     "proficiency_tier_level",
     "int | None",
     "",
     0
    ],
    [
     "tier_recomputed_at",
     "datetime | None",
     "",
     0
    ],
    [
     "tree_mastery",
     "list[TreeMasterySummary]",
     "",
     0
    ],
    [
     "avg_complexity",
     "float",
     "",
     0
    ],
    [
     "recipes_cooked",
     "int",
     "",
     0
    ],
    [
     "streak_days",
     "int",
     "",
     0
    ],
    [
     "distinct_ingredients_used",
     "int",
     "",
     0
    ],
    [
     "cuisines_explored",
     "list[str]",
     "",
     0
    ],
    [
     "techniques_mastered",
     "list[str]",
     "",
     0
    ],
    [
     "weekly_rhythm",
     "list[WeeklyRhythmPoint]",
     "",
     0
    ],
    [
     "complexity_distribution",
     "list[ComplexityBucket]",
     "",
     0
    ],
    [
     "top_types",
     "list[LabeledCount]",
     "",
     0
    ],
    [
     "top_techniques",
     "list[LabeledCount]",
     "",
     0
    ],
    [
     "recent_unlocks",
     "list[SkillUnlockSummary]",
     "",
     0
    ],
    [
     "history_summary",
     "HistorySummary",
     "",
     0
    ],
    [
     "dietary",
     "DietaryBlock",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/responses.py",
   "fks": [],
   "internal": 4,
   "lines": 263,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:progression|SettingsResponse": {
   "base": 0,
   "cases": [
    {
     "cid": "C372",
     "corpus": "api",
     "name": "test_patch_exploration_requires_household_409_C372",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C373",
     "corpus": "api",
     "name": "test_patch_exploration_updates_and_returns_block_C373",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C374",
     "corpus": "api",
     "name": "test_patch_exploration_path_a_plus_round_trips_C374",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C375",
     "corpus": "api",
     "name": "test_patch_exploration_bad_comfort_time_422_C375",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C376",
     "corpus": "api",
     "name": "test_patch_exploration_bad_complexity_cap_422_C376",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C377",
     "corpus": "api",
     "name": "test_patch_exploration_wholesale_replace_clears_omitted_C377",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 33,
   "cols": [
    [
     "household_format",
     "HouseholdFormatBlock",
     "",
     0
    ],
    [
     "user_format",
     "UserFormatBlock",
     "",
     0
    ],
    [
     "dietary",
     "DietaryBlock",
     "",
     0
    ],
    [
     "privacy",
     "PrivacyBlock",
     "",
     0
    ],
    [
     "notifications",
     "NotificationBlock",
     "",
     0
    ],
    [
     "subscription",
     "SubscriptionSummary",
     "",
     0
    ],
    [
     "exploration",
     "ExplorationBlock",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/responses.py",
   "fks": [],
   "internal": 1,
   "lines": 263,
   "sim": "PreferencesSummary",
   "simj": 0.86,
   "usage": 0
  },
  "cls:progression|SkillProgress": {
   "base": 0,
   "cases": [
    {
     "cid": "C1082",
     "corpus": "api",
     "name": "test_technique_and_ingredient_unlock_at_threshold_C1082",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C1084",
     "corpus": "api",
     "name": "test_below_threshold_stays_attempted_C1084",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "user_id",
     "uuid.UUID",
     "",
     1
    ],
    [
     "skill_kind",
     "str",
     "technique | ingredient",
     1
    ],
    [
     "skill_code",
     "str",
     "",
     1
    ],
    [
     "cook_count",
     "int",
     "",
     0
    ],
    [
     "status",
     "str",
     "",
     0
    ],
    [
     "learned_at",
     "datetime | None",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ],
    [
     "updated_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "A user's progress toward learning one technique or ingredient (REQ-14).",
   "file": "apps/api/models/skill.py",
   "fks": [
    [
     "user_id",
     "users.id"
    ]
   ],
   "internal": 3,
   "lines": 67,
   "sim": null,
   "simj": null,
   "usage": 0
  },
  "cls:progression|SkillTree": {
   "base": 1,
   "cases": [
    {
     "cid": "C750",
     "corpus": "api",
     "name": "test_seed_is_idempotent_and_covers_the_taxonomy_C750",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C763",
     "corpus": "api",
     "name": "test_profile_tier_floors_when_node_progress_decayed_C763",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C764",
     "corpus": "api",
     "name": "test_backfill_recomputes_node_progress_for_user_C764",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C766",
     "corpus": "api",
     "name": "test_seed_creates_all_five_trees_C766",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C768",
     "corpus": "api",
     "name": "test_headline_tier_stays_technique_only_C768",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "tree_kind",
     "str",
     "",
     1
    ],
    [
     "rollup_grain",
     "str",
     "",
     0
    ],
    [
     "display_es",
     "str",
     "",
     0
    ],
    [
     "display_en",
     "str",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ],
    [
     "updated_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "A progression tree (config) \u2014 one per kind (technique, region, diet, flavor).",
   "file": "apps/api/models/progression.py",
   "fks": [],
   "internal": 3,
   "lines": 152,
   "sim": "TreeNode",
   "simj": 0.5,
   "usage": 2
  },
  "cls:progression|TreeEdge": {
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "skill_tree_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "from_node_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "to_node_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "relationship_kind",
     "str",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "A prerequisite/suggests edge between nodes \u2014 EMPTY at MVP (roast M5); here for the DAG.",
   "file": "apps/api/models/progression.py",
   "fks": [
    [
     "from_node_id",
     "tree_node.id"
    ],
    [
     "skill_tree_id",
     "skill_tree.id"
    ],
    [
     "to_node_id",
     "tree_node.id"
    ]
   ],
   "internal": 0,
   "lines": 152,
   "sim": null,
   "simj": null,
   "usage": 0
  },
  "cls:progression|TreeNode": {
   "base": 0,
   "cases": [
    {
     "cid": "C750",
     "corpus": "api",
     "name": "test_seed_is_idempotent_and_covers_the_taxonomy_C750",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C752",
     "corpus": "api",
     "name": "test_cook_count_is_a_high_water_mark_never_demotes_C752",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C757",
     "corpus": "api",
     "name": "test_seeded_nodes_exist_for_core_techniques_C757[fry]",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C763",
     "corpus": "api",
     "name": "test_profile_tier_floors_when_node_progress_decayed_C763",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C764",
     "corpus": "api",
     "name": "test_backfill_recomputes_node_progress_for_user_C764",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C766",
     "corpus": "api",
     "name": "test_seed_creates_all_five_trees_C766",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 1,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "skill_tree_id",
     "uuid.UUID",
     "",
     1
    ],
    [
     "node_code",
     "str",
     "taxonomy code (e.g. \"fry\")",
     1
    ],
    [
     "display_es",
     "str",
     "",
     0
    ],
    [
     "display_en",
     "str",
     "",
     0
    ],
    [
     "sort_order",
     "int",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ],
    [
     "updated_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "A node in a tree \u2014 one taxonomy code, seeded from the taxonomy (M5 pure extractor).",
   "file": "apps/api/models/progression.py",
   "fks": [
    [
     "skill_tree_id",
     "skill_tree.id"
    ]
   ],
   "internal": 3,
   "lines": 152,
   "sim": "Restriction",
   "simj": 0.56,
   "usage": 3
  },
  "cls:recipe|AvisoResponse": {
   "base": 1,
   "cases": [
    {
     "cid": "C434",
     "corpus": "api",
     "name": "test_cold_start_with_region_pref_floats_match_and_keeps_rest_C434",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C435",
     "corpus": "api",
     "name": "test_cold_start_no_prefs_is_newest_first_C435",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C436",
     "corpus": "api",
     "name": "test_warm_nueva_cocina_region_pref_floats_member_match_C436",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C437",
     "corpus": "api",
     "name": "test_cold_start_comfort_time_floats_duration_match_C437",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C438",
     "corpus": "api",
     "name": "test_cold_start_skill_cap_sinks_over_cap_recipe_C438",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C439",
     "corpus": "api",
     "name": "test_cold_start_taste_pref_floats_matching_recipe_C439",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 22,
   "cols": [
    [
     "aviso_code",
     "str",
     "",
     0
    ],
    [
     "severity",
     "str",
     "'danger' | 'caution'",
     0
    ],
    [
     "message_es",
     "str",
     "",
     0
    ],
    [
     "source_kind",
     "str",
     "'official' | 'ai_default'",
     0
    ],
    [
     "source_ref",
     "str",
     "",
     0
    ],
    [
     "state_tag",
     "str | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "A derived food-safety advisory for a recipe (Future-Features SAFE) \u2014 the SOFT \"how not to mishandle\" layer, DISTINCT from the hard allergen list (`restriction_codes`). `source_kind` drives the client provenance badge: 'official' shows the `source_ref` citation; 'ai_default' shows an AI-suggested disclosure. `state_tag` is null for intrinsic advisories, the prep state (e.g. 'crudo' / 'mal-cocido') ",
   "file": "apps/api/schemas/recipe.py",
   "fks": [],
   "internal": 1,
   "lines": 480,
   "sim": "ContextualWarningRule",
   "simj": 0.67,
   "usage": 1
  },
  "cls:recipe|CanonicalIngredient": {
   "base": 1,
   "cases": [
    {
     "cid": "C159",
     "corpus": "api",
     "name": "test_seed_canonical_ingredients_C159",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C886",
     "corpus": "api",
     "name": "test_ingredient_delta_upsert_insert_only_C886",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C981",
     "corpus": "api",
     "name": "test_apply_create_new_ingredient_C981",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "code",
     "str",
     "",
     1
    ],
    [
     "category_code",
     "str",
     "",
     0
    ],
    [
     "display_es",
     "str",
     "",
     0
    ],
    [
     "display_en",
     "str",
     "",
     0
    ],
    [
     "sort_order",
     "int",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "A canonical ingredient entry. Referenced by pantry items (Batch 3+).",
   "file": "apps/api/models/catalog.py",
   "fks": [],
   "internal": 6,
   "lines": 326,
   "sim": "Restriction",
   "simj": 0.86,
   "usage": 0
  },
  "cls:recipe|CreationRequestResponse": {
   "base": 1,
   "cases": [
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C556",
     "corpus": "api",
     "name": "test_manual_create_with_stages_roundtrip_C556",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C557",
     "corpus": "api",
     "name": "test_manual_create_stage_validation_C557",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C785",
     "corpus": "api",
     "name": "test_recipes_availability_end_to_end_C785",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C958",
     "corpus": "api",
     "name": "test_list_recipe_time_effort_and_ingredient_counts_C958",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C959",
     "corpus": "api",
     "name": "test_list_recipe_exposes_predominant_techniques_C959",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 9,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "request_type",
     "str",
     "",
     0
    ],
    [
     "status",
     "str",
     "",
     0
    ],
    [
     "result_recipe_id",
     "uuid.UUID | None",
     "",
     0
    ],
    [
     "error_detail",
     "str | None",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ],
    [
     "completed_at",
     "datetime | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/recipe.py",
   "fks": [],
   "internal": 1,
   "lines": 480,
   "sim": "RecipeCreationRequest",
   "simj": 0.7,
   "usage": 2
  },
  "cls:recipe|CupoAttachRequest": {
   "base": 1,
   "cases": [
    {
     "cid": "C8139",
     "corpus": "api",
     "name": "test_cupo_attach_list_release_roundtrip_C8139",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C8140",
     "corpus": "api",
     "name": "test_cupo_attach_rejects_non_taxonomy_type_C8140",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C8141",
     "corpus": "api",
     "name": "test_cupo_attach_is_user_scoped_C8141",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C8142",
     "corpus": "api",
     "name": "test_plan_with_cupo_stamps_the_link_C8142",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "dish_type",
     "str",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "PUT /recipe-filter-modes/{mode_id}/cupo body: the taxonomy ``tipo`` code to attach.",
   "file": "apps/api/schemas/repertorio.py",
   "fks": [],
   "internal": 1,
   "lines": 38,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:recipe|CupoResponse": {
   "base": 1,
   "cases": [
    {
     "cid": "C8139",
     "corpus": "api",
     "name": "test_cupo_attach_list_release_roundtrip_C8139",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C8140",
     "corpus": "api",
     "name": "test_cupo_attach_rejects_non_taxonomy_type_C8140",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C8141",
     "corpus": "api",
     "name": "test_cupo_attach_is_user_scoped_C8141",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C8142",
     "corpus": "api",
     "name": "test_plan_with_cupo_stamps_the_link_C8142",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "",
     "corpus": "e2e",
     "name": "4 case(s)",
     "state": "file",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "mode_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "name",
     "str",
     "",
     0
    ],
    [
     "color",
     "str | None",
     "",
     0
    ],
    [
     "dish_type",
     "str",
     "",
     0
    ],
    [
     "planeadas",
     "int",
     "",
     0
    ],
    [
     "cocinadas",
     "int",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "One cupo-bearing saved mode with both derived counters.",
   "file": "apps/api/schemas/repertorio.py",
   "fks": [],
   "internal": 1,
   "lines": 38,
   "sim": null,
   "simj": null,
   "usage": 2
  },
  "cls:recipe|CuposResponse": {
   "base": 0,
   "cases": [
    {
     "cid": "C8139",
     "corpus": "api",
     "name": "test_cupo_attach_list_release_roundtrip_C8139",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C8142",
     "corpus": "api",
     "name": "test_plan_with_cupo_stamps_the_link_C8142",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "",
     "corpus": "e2e",
     "name": "4 case(s)",
     "state": "file",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "cupos",
     "list[CupoResponse]",
     "",
     0
    ],
    [
     "max_slots",
     "int",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "The user's cupos plus the tier-derived slot cap (ONE pool with Saved Modes, D186).",
   "file": "apps/api/schemas/repertorio.py",
   "fks": [],
   "internal": 1,
   "lines": 38,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:recipe|ExploreResponse": {
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "cols": [
    [
     "mode",
     "str",
     "",
     0
    ],
    [
     "recipes",
     "list[RecipeListItem]",
     "",
     0
    ],
    [
     "count",
     "int",
     "",
     0
    ],
    [
     "fallback",
     "str | None",
     "",
     0
    ],
    [
     "preference_shaped",
     "bool",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Novelty-filtered explore results for one mode (Phase 16, REQ-09).",
   "file": "apps/api/schemas/recipe.py",
   "fks": [],
   "internal": 1,
   "lines": 480,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:recipe|GustifyCreateRequest": {
   "base": 1,
   "cases": [
    {
     "cid": "C72",
     "corpus": "api",
     "name": "test_gustify_requires_auth_C72",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C73",
     "corpus": "api",
     "name": "test_gustify_requires_idempotency_key_C73",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C74",
     "corpus": "api",
     "name": "test_gustify_invalid_mode_400_C74",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C75",
     "corpus": "api",
     "name": "test_gustify_cold_start_surfaces_candidates_with_grace_C75",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C76",
     "corpus": "api",
     "name": "test_gustify_completed_with_seeded_ledger_C76",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C77",
     "corpus": "api",
     "name": "test_gustify_idempotent_replay_C77",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 14,
   "cols": [
    [
     "mode",
     "str",
     "",
     0
    ],
    [
     "model_tier",
     "Literal['lite', 'full']",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Body for ``POST /recipe-creation/gustify`` \u2014 the explore mode to generate for. ``model_tier`` (D95) picks the Gemini tier: lite (default, flash-lite, 1 credit) | full (flash, 3 credits). Additive with a default \u2192 OpenAPI stays additive.",
   "file": "apps/api/schemas/recipe.py",
   "fks": [],
   "internal": 1,
   "lines": 480,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:recipe|GustifyCreationResponse": {
   "base": 0,
   "cases": [
    {
     "cid": "C72",
     "corpus": "api",
     "name": "test_gustify_requires_auth_C72",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C73",
     "corpus": "api",
     "name": "test_gustify_requires_idempotency_key_C73",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C74",
     "corpus": "api",
     "name": "test_gustify_invalid_mode_400_C74",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C75",
     "corpus": "api",
     "name": "test_gustify_cold_start_surfaces_candidates_with_grace_C75",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C76",
     "corpus": "api",
     "name": "test_gustify_completed_with_seeded_ledger_C76",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C77",
     "corpus": "api",
     "name": "test_gustify_idempotent_replay_C77",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 15,
   "cols": [
    [
     "request",
     "CreationRequestResponse",
     "",
     0
    ],
    [
     "mode",
     "str",
     "",
     0
    ],
    [
     "status",
     "str",
     "",
     0
    ],
    [
     "candidates",
     "list[GeneratedCandidateOut]",
     "",
     0
    ],
    [
     "fallback",
     "str | None",
     "",
     0
    ],
    [
     "deferred_reason",
     "str | None",
     "",
     0
    ],
    [
     "usage",
     "GustifyUsage | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Result of an AI generation attempt (D-GU3 pipeline).",
   "file": "apps/api/schemas/recipe.py",
   "fks": [],
   "internal": 1,
   "lines": 480,
   "sim": null,
   "simj": null,
   "usage": 2
  },
  "cls:recipe|ManualRecipeCreate": {
   "base": 0,
   "cases": [
    {
     "cid": "C690",
     "corpus": "api",
     "name": "test_create_recipe_manual_recovers_from_key_race_C690",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C691",
     "corpus": "api",
     "name": "test_create_recipe_manual_reraises_when_winner_unresolvable_C691",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C940",
     "corpus": "api",
     "name": "test_create_recipe_manual_persists_chosen_language_C940",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C1104",
     "corpus": "api",
     "name": "test_manual_create_normalizes_ingredient_code_C1104",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C556",
     "corpus": "api",
     "name": "test_manual_create_with_stages_roundtrip_C556",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C557",
     "corpus": "api",
     "name": "test_manual_create_stage_validation_C557",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C785",
     "corpus": "api",
     "name": "test_recipes_availability_end_to_end_C785",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C958",
     "corpus": "api",
     "name": "test_list_recipe_time_effort_and_ingredient_counts_C958",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C959",
     "corpus": "api",
     "name": "test_list_recipe_exposes_predominant_techniques_C959",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 8,
   "cols": [
    [
     "title",
     "str",
     "",
     0
    ],
    [
     "description",
     "str | None",
     "",
     0
    ],
    [
     "origin_code",
     "str | None",
     "",
     0
    ],
    [
     "tipo_code",
     "str | None",
     "",
     0
    ],
    [
     "complexity",
     "int",
     "",
     0
    ],
    [
     "time_code",
     "str | None",
     "",
     0
    ],
    [
     "servings",
     "int",
     "",
     0
    ],
    [
     "ingredients",
     "list[RecipeIngredientInput]",
     "",
     0
    ],
    [
     "steps",
     "list[RecipeStepInput]",
     "",
     0
    ],
    [
     "restriction_codes",
     "list[str]",
     "",
     0
    ],
    [
     "taxonomy_tags",
     "dict[str, Any] | None",
     "",
     0
    ],
    [
     "stages",
     "list[RecipeStageInput] | None",
     "",
     0
    ],
    [
     "language",
     "Literal['es', 'en']",
     "",
     0
    ],
    [
     "storage_methods",
     "list[str]",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/recipe.py",
   "fks": [],
   "internal": 2,
   "lines": 480,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:recipe|PlanRecipeRequest": {
   "base": 1,
   "cases": [
    {
     "cid": "C674",
     "corpus": "api",
     "name": "test_from_planned_and_add_to_list_C674",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C8142",
     "corpus": "api",
     "name": "test_plan_with_cupo_stamps_the_link_C8142",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "cupo_id",
     "uuid.UUID | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Optional POST /recipes/{id}/plan body (F6, additive): the cupo slot this plan is made through. Omitted/None = the pre-F6 manual plan, unchanged.",
   "file": "apps/api/schemas/recipe.py",
   "fks": [],
   "internal": 1,
   "lines": 480,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:recipe|PlannedRecipe": {
   "base": 0,
   "cases": [
    {
     "cid": "C595",
     "corpus": "api",
     "name": "test_regenerate_replaces_batch_cleans_stale_keeps_manual_C595",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C599",
     "corpus": "api",
     "name": "test_gap_excludes_archived_and_allergenic_planned_C599",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C1105",
     "corpus": "api",
     "name": "test_planned_shopping_excludes_ingredient_allergen_C1105",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "household_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "recipe_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "planned_by_user_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "cupo_id",
     "uuid.UUID | None",
     "",
     0
    ],
    [
     "status",
     "str",
     "",
     0
    ],
    [
     "plan_id",
     "uuid.UUID | None",
     "",
     0
    ],
    [
     "day_index",
     "int | None",
     "",
     0
    ],
    [
     "plan_generated_at",
     "datetime | None",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "A recipe planned for cooking \u2014 household-scoped.",
   "file": "apps/api/models/recipe.py",
   "fks": [
    [
     "cupo_id",
     "recipe_filter_modes.id"
    ],
    [
     "household_id",
     "households.id"
    ],
    [
     "planned_by_user_id",
     "users.id"
    ],
    [
     "recipe_id",
     "recipes.id"
    ]
   ],
   "internal": 8,
   "lines": 493,
   "sim": "PlannedRecipeResponse",
   "simj": 0.6,
   "usage": 0
  },
  "cls:recipe|PlannedRecipeResponse": {
   "base": 1,
   "cases": [
    {
     "cid": "C674",
     "corpus": "api",
     "name": "test_from_planned_and_add_to_list_C674",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C8142",
     "corpus": "api",
     "name": "test_plan_with_cupo_stamps_the_link_C8142",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "recipe_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "planned_by_user_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "cupo_id",
     "uuid.UUID | None",
     "",
     0
    ],
    [
     "status",
     "str",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/recipe.py",
   "fks": [],
   "internal": 1,
   "lines": 480,
   "sim": "PlannedRecipe",
   "simj": 0.6,
   "usage": 1
  },
  "cls:recipe|Recipe": {
   "base": 0,
   "cases": [
    {
     "cid": "C13",
     "corpus": "api",
     "name": "test_delete_me_wipes_every_seeded_table_and_spares_system_recipe_C13",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C215",
     "corpus": "api",
     "name": "test_cookability_archived_recipe_drops_from_both_counts_C215",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C241",
     "corpus": "api",
     "name": "test_complete_stored_defaults_to_recipe_hint_C241",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C268",
     "corpus": "api",
     "name": "test_user_delete_cascades_to_cooking_photo_C268",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C312",
     "corpus": "api",
     "name": "test_composes_with_another_facet_and_keeps_count_parity_C312",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C446",
     "corpus": "api",
     "name": "test_iter_candidate_recipes_batches_complete_and_safe_C446",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 61,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "title",
     "str",
     "",
     0
    ],
    [
     "title_norm",
     "str | None",
     "",
     0
    ],
    [
     "slug",
     "str | None",
     "",
     0
    ],
    [
     "description",
     "str | None",
     "",
     0
    ],
    [
     "creator_type",
     "str",
     "",
     0
    ],
    [
     "creator_user_id",
     "uuid.UUID | None",
     "",
     0
    ],
    [
     "origin_code",
     "str | None",
     "",
     0
    ],
    [
     "tipo_code",
     "str | None",
     "",
     0
    ],
    [
     "language",
     "str",
     "",
     0
    ],
    [
     "complexity",
     "int",
     "",
     0
    ],
    [
     "time_code",
     "str | None",
     "",
     0
    ],
    [
     "servings",
     "int",
     "",
     0
    ],
    [
     "taxonomy_tags",
     "dict[str, Any] | None",
     "",
     0
    ],
    [
     "restriction_codes",
     "dict[str, Any] | None",
     "",
     0
    ],
    [
     "diet_codes",
     "list[str] | None",
     "",
     0
    ],
    [
     "avisos",
     "list[str] | None",
     "",
     0
    ],
    [
     "storage_methods",
     "list[str] | None",
     "",
     0
    ],
    [
     "stages",
     "list[dict[str, Any]] | None",
     "",
     0
    ],
    [
     "active_minutes",
     "int",
     "",
     0
    ],
    [
     "total_minutes",
     "int",
     "",
     0
    ],
    [
     "predominant_techniques",
     "list[str] | None",
     "",
     0
    ],
    [
     "content_hash",
     "str | None",
     "",
     0
    ],
    [
     "sweet",
     "int | None",
     "",
     0
    ],
    [
     "salty",
     "int | None",
     "",
     0
    ],
    [
     "sour",
     "int | None",
     "",
     0
    ],
    [
     "bitter",
     "int | None",
     "",
     0
    ],
    [
     "umami",
     "int | None",
     "",
     0
    ],
    [
     "fat",
     "int | None",
     "",
     0
    ],
    [
     "piquant",
     "int | None",
     "",
     0
    ],
    [
     "cooling",
     "int | None",
     "",
     0
    ],
    [
     "textures",
     "list[str] | None",
     "",
     0
    ],
    [
     "temperature",
     "str | None",
     "",
     0
    ],
    [
     "taste_profile_source",
     "str | None",
     "",
     0
    ],
    [
     "sensory_note",
     "str | None",
     "",
     0
    ],
    [
     "status",
     "str",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ],
    [
     "updated_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "A recipe \u2014 system-seeded, user-created (manual), or Gustify AI generated.",
   "file": "apps/api/models/recipe.py",
   "fks": [
    [
     "creator_user_id",
     "users.id"
    ]
   ],
   "internal": 29,
   "lines": 493,
   "sim": "RecipeDetailResponse",
   "simj": 0.64,
   "usage": 9
  },
  "cls:recipe|RecipeAvailability": {
   "base": 1,
   "cases": [
    {
     "cid": "C316",
     "corpus": "api",
     "name": "test_exclude_equipment_unknown_code_is_400_C316",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C434",
     "corpus": "api",
     "name": "test_cold_start_with_region_pref_floats_match_and_keeps_rest_C434",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C435",
     "corpus": "api",
     "name": "test_cold_start_no_prefs_is_newest_first_C435",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C436",
     "corpus": "api",
     "name": "test_warm_nueva_cocina_region_pref_floats_member_match_C436",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C437",
     "corpus": "api",
     "name": "test_cold_start_comfort_time_floats_duration_match_C437",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C438",
     "corpus": "api",
     "name": "test_cold_start_skill_cap_sinks_over_cap_recipe_C438",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 27,
   "cols": [
    [
     "have_all",
     "bool",
     "",
     0
    ],
    [
     "missing_count",
     "int",
     "",
     0
    ],
    [
     "total_required",
     "int",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Pantry-availability projection for a recipe (Phase 13 T4).",
   "file": "apps/api/schemas/recipe.py",
   "fks": [],
   "internal": 3,
   "lines": 480,
   "sim": null,
   "simj": null,
   "usage": 3
  },
  "cls:recipe|RecipeCreationRequest": {
   "base": 0,
   "cases": [
    {
     "cid": "C84",
     "corpus": "api",
     "name": "test_gustify_persists_default_lite_tier_C84",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C88",
     "corpus": "api",
     "name": "test_gustify_poisoned_key_recovers_after_ttl_C88",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C690",
     "corpus": "api",
     "name": "test_create_recipe_manual_recovers_from_key_race_C690",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C691",
     "corpus": "api",
     "name": "test_create_recipe_manual_reraises_when_winner_unresolvable_C691",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C1116",
     "corpus": "api",
     "name": "test_stream_disconnect_persists_nothing_C1116",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "user_id",
     "uuid.UUID",
     "",
     1
    ],
    [
     "idempotency_key",
     "str",
     "",
     1
    ],
    [
     "request_type",
     "str",
     "",
     0
    ],
    [
     "status",
     "str",
     "",
     0
    ],
    [
     "result_recipe_id",
     "uuid.UUID | None",
     "",
     0
    ],
    [
     "request_payload",
     "dict[str, Any] | None",
     "",
     0
    ],
    [
     "error_detail",
     "str | None",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ],
    [
     "completed_at",
     "datetime | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "A recipe creation request \u2014 manual or Gustify AI.",
   "file": "apps/api/models/recipe.py",
   "fks": [
    [
     "result_recipe_id",
     "recipes.id"
    ],
    [
     "user_id",
     "users.id"
    ]
   ],
   "internal": 5,
   "lines": 493,
   "sim": "CreationRequestResponse",
   "simj": 0.7,
   "usage": 0
  },
  "cls:recipe|RecipeDemand": {
   "base": 0,
   "cases": [
    {
     "cid": "C972",
     "corpus": "api",
     "name": "test_post_recipe_demand_captures_search_C972",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C969",
     "corpus": "api",
     "name": "test_recipe_manual_create_disabled_returns_403_C969",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C971",
     "corpus": "api",
     "name": "test_recipe_gustify_create_disabled_returns_403_C971",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C972",
     "corpus": "api",
     "name": "test_post_recipe_demand_captures_search_C972",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C973",
     "corpus": "api",
     "name": "test_post_recipe_demand_allows_empty_note_C973",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C974",
     "corpus": "api",
     "name": "test_post_recipe_demand_rejects_long_note_C974",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C975",
     "corpus": "api",
     "name": "test_post_recipe_demand_rate_limited_one_per_hour_C975",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "user_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "household_id",
     "uuid.UUID | None",
     "",
     0
    ],
    [
     "search_criteria",
     "dict[str, Any]",
     "",
     0
    ],
    [
     "free_text",
     "str | None",
     "",
     0
    ],
    [
     "language",
     "str",
     "",
     0
    ],
    [
     "status",
     "str",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ],
    [
     "fulfilled_at",
     "datetime | None",
     "",
     0
    ],
    [
     "fulfilled_recipe_slug",
     "str | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Captured DEMAND from a 0-result recipe search (2026-06-22). When a search returns nothing, the user can explicitly ask Gustify to create recipes for it: we record the UNMET SEARCH (the filter selection that returned 0) + an optional \u2264140-char note, for later ON-DEMAND authoring \u2014 NOT real-time generation. status: pending \u2192 fulfilled. household nullable (context only).",
   "file": "apps/api/models/recipe.py",
   "fks": [
    [
     "household_id",
     "households.id"
    ],
    [
     "user_id",
     "users.id"
    ]
   ],
   "internal": 1,
   "lines": 493,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:recipe|RecipeDemandCreate": {
   "base": 1,
   "cases": [
    {
     "cid": "C969",
     "corpus": "api",
     "name": "test_recipe_manual_create_disabled_returns_403_C969",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C971",
     "corpus": "api",
     "name": "test_recipe_gustify_create_disabled_returns_403_C971",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C972",
     "corpus": "api",
     "name": "test_post_recipe_demand_captures_search_C972",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C973",
     "corpus": "api",
     "name": "test_post_recipe_demand_allows_empty_note_C973",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C974",
     "corpus": "api",
     "name": "test_post_recipe_demand_rejects_long_note_C974",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C975",
     "corpus": "api",
     "name": "test_post_recipe_demand_rate_limited_one_per_hour_C975",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "search_criteria",
     "dict[str, Any]",
     "",
     0
    ],
    [
     "free_text",
     "str | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "POST body for capturing a 0-result search demand (\"Pedir recetas\", 2026-06-22).",
   "file": "apps/api/schemas/recipe.py",
   "fks": [],
   "internal": 1,
   "lines": 480,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:recipe|RecipeDemandResponse": {
   "base": 1,
   "cases": [
    {
     "cid": "C969",
     "corpus": "api",
     "name": "test_recipe_manual_create_disabled_returns_403_C969",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C971",
     "corpus": "api",
     "name": "test_recipe_gustify_create_disabled_returns_403_C971",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C972",
     "corpus": "api",
     "name": "test_post_recipe_demand_captures_search_C972",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C973",
     "corpus": "api",
     "name": "test_post_recipe_demand_allows_empty_note_C973",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C974",
     "corpus": "api",
     "name": "test_post_recipe_demand_rejects_long_note_C974",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C975",
     "corpus": "api",
     "name": "test_post_recipe_demand_rate_limited_one_per_hour_C975",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "status",
     "str",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Acknowledgement of a captured demand (the row is fulfilled later, off-band).",
   "file": "apps/api/schemas/recipe.py",
   "fks": [],
   "internal": 1,
   "lines": 480,
   "sim": "Household",
   "simj": 0.5,
   "usage": 1
  },
  "cls:recipe|RecipeDetailResponse": {
   "base": 0,
   "cases": [
    {
     "cid": "C434",
     "corpus": "api",
     "name": "test_cold_start_with_region_pref_floats_match_and_keeps_rest_C434",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C435",
     "corpus": "api",
     "name": "test_cold_start_no_prefs_is_newest_first_C435",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C436",
     "corpus": "api",
     "name": "test_warm_nueva_cocina_region_pref_floats_member_match_C436",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C437",
     "corpus": "api",
     "name": "test_cold_start_comfort_time_floats_duration_match_C437",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C438",
     "corpus": "api",
     "name": "test_cold_start_skill_cap_sinks_over_cap_recipe_C438",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C439",
     "corpus": "api",
     "name": "test_cold_start_taste_pref_floats_matching_recipe_C439",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 22,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "title",
     "str",
     "",
     0
    ],
    [
     "description",
     "str | None",
     "",
     0
    ],
    [
     "sensory_note",
     "str | None",
     "",
     0
    ],
    [
     "creator_type",
     "str",
     "",
     0
    ],
    [
     "origin_code",
     "str | None",
     "",
     0
    ],
    [
     "tipo_code",
     "str | None",
     "",
     0
    ],
    [
     "complexity",
     "int",
     "",
     0
    ],
    [
     "time_code",
     "str | None",
     "",
     0
    ],
    [
     "servings",
     "int",
     "",
     0
    ],
    [
     "language",
     "str",
     "",
     0
    ],
    [
     "taxonomy_tags",
     "dict[str, Any] | None",
     "",
     0
    ],
    [
     "restriction_codes",
     "list[str] | None",
     "",
     0
    ],
    [
     "storage_methods",
     "list[str] | None",
     "",
     0
    ],
    [
     "stages",
     "list[dict[str, Any]] | None",
     "",
     0
    ],
    [
     "status",
     "str",
     "",
     0
    ],
    [
     "availability",
     "RecipeAvailability | None",
     "",
     0
    ],
    [
     "ingredients",
     "list[RecipeIngredientResponse]",
     "",
     0
    ],
    [
     "steps",
     "list[RecipeStepResponse]",
     "",
     0
    ],
    [
     "notes",
     "list[str]",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ],
    [
     "favorite",
     "bool",
     "",
     0
    ],
    [
     "archived",
     "bool",
     "",
     0
    ],
    [
     "planned",
     "bool",
     "",
     0
    ],
    [
     "cooked",
     "bool",
     "",
     0
    ],
    [
     "avisos",
     "list[AvisoResponse]",
     "",
     0
    ],
    [
     "equipment",
     "list[RecipeEquipmentItem]",
     "",
     0
    ],
    [
     "active_minutes",
     "int",
     "",
     0
    ],
    [
     "total_minutes",
     "int",
     "",
     0
    ],
    [
     "sweet",
     "int | None",
     "",
     0
    ],
    [
     "salty",
     "int | None",
     "",
     0
    ],
    [
     "sour",
     "int | None",
     "",
     0
    ],
    [
     "bitter",
     "int | None",
     "",
     0
    ],
    [
     "umami",
     "int | None",
     "",
     0
    ],
    [
     "fat",
     "int | None",
     "",
     0
    ],
    [
     "piquant",
     "int | None",
     "",
     0
    ],
    [
     "cooling",
     "int | None",
     "",
     0
    ],
    [
     "textures",
     "list[str] | None",
     "",
     0
    ],
    [
     "temperature",
     "str | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/recipe.py",
   "fks": [],
   "internal": 1,
   "lines": 480,
   "sim": "Recipe",
   "simj": 0.64,
   "usage": 1
  },
  "cls:recipe|RecipeEquipment": {
   "base": 0,
   "cases": [
    {
     "cid": "C895",
     "corpus": "api",
     "name": "test_recipe_equipment_seeded_and_roundtrip_C895",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C962",
     "corpus": "api",
     "name": "test_recipe_detail_http_surfaces_equipment_and_group_name_C962",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "recipe_id",
     "uuid.UUID",
     "",
     1
    ],
    [
     "equipment_code",
     "str",
     "",
     1
    ],
    [
     "alternative",
     "str | None",
     "",
     0
    ],
    [
     "sort_order",
     "int",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "A critical piece of equipment a recipe needs (Phase 9 / SCHEMA-ENRICH, migration 0044).",
   "file": "apps/api/models/recipe.py",
   "fks": [
    [
     "recipe_id",
     "recipes.id"
    ]
   ],
   "internal": 3,
   "lines": 493,
   "sim": "RecipeEquipmentItem",
   "simj": 0.6,
   "usage": 0
  },
  "cls:recipe|RecipeEquipmentItem": {
   "base": 1,
   "cases": [
    {
     "cid": "C434",
     "corpus": "api",
     "name": "test_cold_start_with_region_pref_floats_match_and_keeps_rest_C434",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C435",
     "corpus": "api",
     "name": "test_cold_start_no_prefs_is_newest_first_C435",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C436",
     "corpus": "api",
     "name": "test_warm_nueva_cocina_region_pref_floats_member_match_C436",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C437",
     "corpus": "api",
     "name": "test_cold_start_comfort_time_floats_duration_match_C437",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C438",
     "corpus": "api",
     "name": "test_cold_start_skill_cap_sinks_over_cap_recipe_C438",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C439",
     "corpus": "api",
     "name": "test_cold_start_taste_pref_floats_matching_recipe_C439",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 22,
   "cols": [
    [
     "equipment_code",
     "str",
     "",
     0
    ],
    [
     "alternative",
     "str | None",
     "",
     0
    ],
    [
     "sort_order",
     "int",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "One critical piece of equipment a recipe needs (Phase 9 / SCHEMA-ENRICH).",
   "file": "apps/api/schemas/recipe.py",
   "fks": [],
   "internal": 1,
   "lines": 480,
   "sim": "RecipeEquipment",
   "simj": 0.6,
   "usage": 1
  },
  "cls:recipe|RecipeFilterMode": {
   "base": 0,
   "cases": [
    {
     "cid": "C13",
     "corpus": "api",
     "name": "test_delete_me_wipes_every_seeded_table_and_spares_system_recipe_C13",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "user_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "name",
     "str",
     "",
     0
    ],
    [
     "color",
     "str | None",
     "",
     0
    ],
    [
     "selection",
     "dict[str, Any]",
     "",
     0
    ],
    [
     "cupo_dish_type",
     "str | None",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ],
    [
     "updated_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "One saved recipe-filter preset for a user (a \"slot\").",
   "file": "apps/api/models/recipe_filter_mode.py",
   "fks": [
    [
     "user_id",
     "users.id"
    ]
   ],
   "internal": 2,
   "lines": 54,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:recipe|RecipeFlagsResponse": {
   "base": 1,
   "cases": [
    {
     "cid": "C859",
     "corpus": "api",
     "name": "test_patch_flags_and_list_detail_end_to_end_C859",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C860",
     "corpus": "api",
     "name": "test_patch_flags_missing_recipe_404_C860",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C861",
     "corpus": "api",
     "name": "test_flags_do_not_leak_across_users_via_api_C861",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C867",
     "corpus": "api",
     "name": "test_list_route_carries_total_and_favorite_filter_C867",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "favorite",
     "bool",
     "",
     0
    ],
    [
     "archived",
     "bool",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "The resulting per-user flags after a PATCH (D93).",
   "file": "apps/api/schemas/recipe.py",
   "fks": [],
   "internal": 1,
   "lines": 480,
   "sim": "RecipeFlagsUpdate",
   "simj": 1.0,
   "usage": 1
  },
  "cls:recipe|RecipeFlagsUpdate": {
   "base": 1,
   "cases": [
    {
     "cid": "C859",
     "corpus": "api",
     "name": "test_patch_flags_and_list_detail_end_to_end_C859",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C860",
     "corpus": "api",
     "name": "test_patch_flags_missing_recipe_404_C860",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C861",
     "corpus": "api",
     "name": "test_flags_do_not_leak_across_users_via_api_C861",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C867",
     "corpus": "api",
     "name": "test_list_route_carries_total_and_favorite_filter_C867",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "favorite",
     "bool | None",
     "",
     0
    ],
    [
     "archived",
     "bool | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "PATCH body for per-user recipe flags (D93). Only the provided fields are set; an omitted (None) field leaves the existing value untouched (partial update).",
   "file": "apps/api/schemas/recipe.py",
   "fks": [],
   "internal": 1,
   "lines": 480,
   "sim": "RecipeFlagsResponse",
   "simj": 1.0,
   "usage": 1
  },
  "cls:recipe|RecipeIngredient": {
   "base": 0,
   "cases": [
    {
     "cid": "C573",
     "corpus": "api",
     "name": "test_have_all_keeps_only_fully_available_C573",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C660",
     "corpus": "api",
     "name": "test_build_cooked_ledger_C660",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C661",
     "corpus": "api",
     "name": "test_cooked_ledger_uses_snapshot_immune_to_recipe_edit_C661",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C662",
     "corpus": "api",
     "name": "test_cooked_ledger_mixes_snapshot_and_live_fallback_C662",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C663",
     "corpus": "api",
     "name": "test_explore_never_returns_allergen_recipe_C663",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C732",
     "corpus": "api",
     "name": "test_fish_allergen_excluded_via_ingredient_join_C732",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 8,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "recipe_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "ingredient_code",
     "str",
     "",
     0
    ],
    [
     "display_name",
     "str",
     "",
     0
    ],
    [
     "quantity",
     "float",
     "",
     0
    ],
    [
     "unit_code",
     "str",
     "",
     0
    ],
    [
     "sort_order",
     "int",
     "",
     0
    ],
    [
     "is_optional",
     "bool",
     "",
     0
    ],
    [
     "group_name",
     "str | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "An ingredient line in a recipe.",
   "file": "apps/api/models/recipe.py",
   "fks": [
    [
     "recipe_id",
     "recipes.id"
    ]
   ],
   "internal": 13,
   "lines": 493,
   "sim": "RecipeIngredientResponse",
   "simj": 0.8,
   "usage": 1
  },
  "cls:recipe|RecipeIngredientResponse": {
   "base": 1,
   "cases": [
    {
     "cid": "C434",
     "corpus": "api",
     "name": "test_cold_start_with_region_pref_floats_match_and_keeps_rest_C434",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C435",
     "corpus": "api",
     "name": "test_cold_start_no_prefs_is_newest_first_C435",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C436",
     "corpus": "api",
     "name": "test_warm_nueva_cocina_region_pref_floats_member_match_C436",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C437",
     "corpus": "api",
     "name": "test_cold_start_comfort_time_floats_duration_match_C437",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C438",
     "corpus": "api",
     "name": "test_cold_start_skill_cap_sinks_over_cap_recipe_C438",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C439",
     "corpus": "api",
     "name": "test_cold_start_taste_pref_floats_matching_recipe_C439",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 22,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "ingredient_code",
     "str",
     "",
     0
    ],
    [
     "display_name",
     "str",
     "",
     0
    ],
    [
     "quantity",
     "float",
     "",
     0
    ],
    [
     "unit_code",
     "str",
     "",
     0
    ],
    [
     "sort_order",
     "int",
     "",
     0
    ],
    [
     "is_optional",
     "bool",
     "",
     0
    ],
    [
     "in_pantry",
     "bool",
     "",
     0
    ],
    [
     "group_name",
     "str | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/recipe.py",
   "fks": [],
   "internal": 1,
   "lines": 480,
   "sim": "RecipeIngredient",
   "simj": 0.8,
   "usage": 1
  },
  "cls:recipe|RecipeListItem": {
   "base": 0,
   "cases": [
    {
     "cid": "C316",
     "corpus": "api",
     "name": "test_exclude_equipment_unknown_code_is_400_C316",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C569",
     "corpus": "api",
     "name": "test_no_mode_leaves_match_score_null_C569",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C785",
     "corpus": "api",
     "name": "test_recipes_availability_end_to_end_C785",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C834",
     "corpus": "api",
     "name": "test_cooked_field_on_list_and_detail_route_C834",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C859",
     "corpus": "api",
     "name": "test_patch_flags_and_list_detail_end_to_end_C859",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C861",
     "corpus": "api",
     "name": "test_flags_do_not_leak_across_users_via_api_C861",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 3,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "title",
     "str",
     "",
     0
    ],
    [
     "creator_type",
     "str",
     "",
     0
    ],
    [
     "origin_code",
     "str | None",
     "",
     0
    ],
    [
     "tipo_code",
     "str | None",
     "",
     0
    ],
    [
     "complexity",
     "int",
     "",
     0
    ],
    [
     "time_code",
     "str | None",
     "",
     0
    ],
    [
     "servings",
     "int",
     "",
     0
    ],
    [
     "status",
     "str",
     "",
     0
    ],
    [
     "language",
     "str",
     "",
     0
    ],
    [
     "availability",
     "RecipeAvailability | None",
     "",
     0
    ],
    [
     "favorite",
     "bool",
     "",
     0
    ],
    [
     "archived",
     "bool",
     "",
     0
    ],
    [
     "cooked",
     "bool",
     "",
     0
    ],
    [
     "storage_methods",
     "list[str] | None",
     "",
     0
    ],
    [
     "active_minutes",
     "int",
     "",
     0
    ],
    [
     "total_minutes",
     "int",
     "",
     0
    ],
    [
     "predominant_techniques",
     "list[str]",
     "",
     0
    ],
    [
     "required_count",
     "int",
     "",
     0
    ],
    [
     "available_count",
     "int",
     "",
     0
    ],
    [
     "sweet",
     "int | None",
     "",
     0
    ],
    [
     "salty",
     "int | None",
     "",
     0
    ],
    [
     "sour",
     "int | None",
     "",
     0
    ],
    [
     "bitter",
     "int | None",
     "",
     0
    ],
    [
     "umami",
     "int | None",
     "",
     0
    ],
    [
     "fat",
     "int | None",
     "",
     0
    ],
    [
     "piquant",
     "int | None",
     "",
     0
    ],
    [
     "cooling",
     "int | None",
     "",
     0
    ],
    [
     "textures",
     "list[str] | None",
     "",
     0
    ],
    [
     "temperature",
     "str | None",
     "",
     0
    ],
    [
     "match_score",
     "int | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/recipe.py",
   "fks": [],
   "internal": 2,
   "lines": 480,
   "sim": "RecipeDetailResponse",
   "simj": 0.63,
   "usage": 2
  },
  "cls:recipe|RecipeListResponse": {
   "base": 0,
   "cases": [
    {
     "cid": "C316",
     "corpus": "api",
     "name": "test_exclude_equipment_unknown_code_is_400_C316",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C569",
     "corpus": "api",
     "name": "test_no_mode_leaves_match_score_null_C569",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C785",
     "corpus": "api",
     "name": "test_recipes_availability_end_to_end_C785",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C834",
     "corpus": "api",
     "name": "test_cooked_field_on_list_and_detail_route_C834",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C859",
     "corpus": "api",
     "name": "test_patch_flags_and_list_detail_end_to_end_C859",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C861",
     "corpus": "api",
     "name": "test_flags_do_not_leak_across_users_via_api_C861",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 3,
   "cols": [
    [
     "recipes",
     "list[RecipeListItem]",
     "",
     0
    ],
    [
     "count",
     "int",
     "",
     0
    ],
    [
     "total",
     "int",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/recipe.py",
   "fks": [],
   "internal": 1,
   "lines": 480,
   "sim": null,
   "simj": null,
   "usage": 1
  },
  "cls:recipe|RecipeStep": {
   "base": 0,
   "cases": [
    {
     "cid": "C13",
     "corpus": "api",
     "name": "test_delete_me_wipes_every_seeded_table_and_spares_system_recipe_C13",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C877",
     "corpus": "api",
     "name": "test_seeded_step_attention_survives_reseed_C877",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C879",
     "corpus": "api",
     "name": "test_update_in_place_keeps_id_C879",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C888",
     "corpus": "api",
     "name": "test_reseed_skipped_while_cooking_session_active_C888",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C915",
     "corpus": "api",
     "name": "test_seeded_recipe_stores_technique_and_predominant_C915",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C926",
     "corpus": "api",
     "name": "test_seeded_step_attention_is_derived_from_technique_C926",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 1,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "recipe_id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "step_number",
     "int",
     "",
     0
    ],
    [
     "title",
     "str",
     "",
     0
    ],
    [
     "detail",
     "str | None",
     "",
     0
    ],
    [
     "duration_minutes",
     "int | None",
     "",
     0
    ],
    [
     "technique",
     "str | None",
     "",
     0
    ],
    [
     "attention",
     "str | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "An ordered step in a recipe.",
   "file": "apps/api/models/recipe.py",
   "fks": [
    [
     "recipe_id",
     "recipes.id"
    ]
   ],
   "internal": 5,
   "lines": 493,
   "sim": "RecipeStepResponse",
   "simj": 0.75,
   "usage": 1
  },
  "cls:recipe|RecipeStepResponse": {
   "base": 1,
   "cases": [
    {
     "cid": "C434",
     "corpus": "api",
     "name": "test_cold_start_with_region_pref_floats_match_and_keeps_rest_C434",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C435",
     "corpus": "api",
     "name": "test_cold_start_no_prefs_is_newest_first_C435",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C436",
     "corpus": "api",
     "name": "test_warm_nueva_cocina_region_pref_floats_member_match_C436",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C437",
     "corpus": "api",
     "name": "test_cold_start_comfort_time_floats_duration_match_C437",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C438",
     "corpus": "api",
     "name": "test_cold_start_skill_cap_sinks_over_cap_recipe_C438",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C439",
     "corpus": "api",
     "name": "test_cold_start_taste_pref_floats_matching_recipe_C439",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 22,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "step_number",
     "int",
     "",
     0
    ],
    [
     "title",
     "str",
     "",
     0
    ],
    [
     "detail",
     "str | None",
     "",
     0
    ],
    [
     "duration_minutes",
     "int | None",
     "",
     0
    ],
    [
     "technique",
     "str | None",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "",
   "file": "apps/api/schemas/recipe.py",
   "fks": [],
   "internal": 1,
   "lines": 480,
   "sim": "RecipeStep",
   "simj": 0.75,
   "usage": 1
  },
  "cls:recipe|UserRecipeFlag": {
   "base": 0,
   "cases": [
    {
     "cid": "C215",
     "corpus": "api",
     "name": "test_cookability_archived_recipe_drops_from_both_counts_C215",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C854",
     "corpus": "api",
     "name": "test_upsert_creates_then_updates_C854",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C997",
     "corpus": "api",
     "name": "test_reset_and_seed_sandbox_builds_the_demo_graph_C997",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C999",
     "corpus": "api",
     "name": "test_reset_and_seed_sandbox_is_idempotent_C999",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "cols": [
    [
     "id",
     "uuid.UUID",
     "",
     0
    ],
    [
     "user_id",
     "uuid.UUID",
     "",
     1
    ],
    [
     "recipe_id",
     "uuid.UUID",
     "",
     1
    ],
    [
     "favorite",
     "bool",
     "",
     0
    ],
    [
     "archived",
     "bool",
     "",
     0
    ],
    [
     "created_at",
     "datetime",
     "",
     0
    ],
    [
     "updated_at",
     "datetime",
     "",
     0
    ]
   ],
   "cols_more": 0,
   "doc": "Per-user favorite/archived flags for a (platform-shared) recipe (D93, Phase 41c).",
   "file": "apps/api/models/recipe.py",
   "fks": [
    [
     "recipe_id",
     "recipes.id"
    ],
    [
     "user_id",
     "users.id"
    ]
   ],
   "internal": 2,
   "lines": 493,
   "sim": null,
   "simj": null,
   "usage": 0
  },
  "ep:auth|DELETE /me": {
   "cases": [
    {
     "cid": "C12",
     "corpus": "api",
     "name": "test_delete_me_requires_auth_C12",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C13",
     "corpus": "api",
     "name": "test_delete_me_wipes_every_seeded_table_and_spares_system_recipe_C13",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C14",
     "corpus": "api",
     "name": "test_delete_me_still_204s_when_firebase_delete_fails_C14",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C15",
     "corpus": "api",
     "name": "test_delete_me_multi_member_household_survives_C15",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "Delete the caller's account \u2014 Settings \"Zona de peligro\" (founder 2026-07-09).",
   "file": "apps/api/api/setup.py",
   "lines": 254,
   "status": "HTTP_204_NO_CONTENT"
  },
  "ep:auth|GET /me": {
   "cases": [
    {
     "cid": "C387",
     "corpus": "api",
     "name": "test_me_surfaces_empty_exploration_for_no_row_C387",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C388",
     "corpus": "api",
     "name": "test_me_surfaces_written_exploration_C388",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C2139",
     "corpus": "api",
     "name": "test_me_carries_the_auto_discount_flag_C2139",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1049",
     "corpus": "api",
     "name": "test_setup_complete_success_then_me_reads_back_C1049",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1053",
     "corpus": "api",
     "name": "test_me_pre_setup_returns_setup_required_C1053",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1054",
     "corpus": "api",
     "name": "test_me_unauthenticated_returns_401_C1054",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "",
     "corpus": "web",
     "name": "15 case(s)",
     "state": "file",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/setup.py",
   "lines": 254,
   "status": "200"
  },
  "ep:auth|GET /settings": {
   "cases": [
    {
     "cid": "C381",
     "corpus": "api",
     "name": "test_settings_get_surfaces_empty_exploration_for_no_row_C381",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C382",
     "corpus": "api",
     "name": "test_settings_get_surfaces_written_path_a_plus_C382",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C385",
     "corpus": "api",
     "name": "test_settings_get_surfaces_written_sensory_C385",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C386",
     "corpus": "api",
     "name": "test_settings_get_surfaces_written_exploration_C386",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1027",
     "corpus": "api",
     "name": "test_settings_requires_household_409_C1027",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1028",
     "corpus": "api",
     "name": "test_settings_get_after_setup_C1028",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C2137",
     "corpus": "api",
     "name": "test_patch_household_auto_discount_round_trips_C2137",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "",
     "corpus": "web",
     "name": "5 case(s)",
     "state": "file",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/user_settings.py",
   "lines": 247,
   "status": "200"
  },
  "ep:auth|PATCH /settings/exploration": {
   "cases": [
    {
     "cid": "C372",
     "corpus": "api",
     "name": "test_patch_exploration_requires_household_409_C372",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C373",
     "corpus": "api",
     "name": "test_patch_exploration_updates_and_returns_block_C373",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C374",
     "corpus": "api",
     "name": "test_patch_exploration_path_a_plus_round_trips_C374",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C375",
     "corpus": "api",
     "name": "test_patch_exploration_bad_comfort_time_422_C375",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C376",
     "corpus": "api",
     "name": "test_patch_exploration_bad_complexity_cap_422_C376",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C377",
     "corpus": "api",
     "name": "test_patch_exploration_wholesale_replace_clears_omitted_C377",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C378",
     "corpus": "api",
     "name": "test_patch_exploration_unknown_code_422_C378",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C379",
     "corpus": "api",
     "name": "test_patch_exploration_too_many_422_C379",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 15,
   "doc": "D109 Path A \u2014 wholesale-replace the caller's two exploration bias lists.",
   "file": "apps/api/api/user_settings.py",
   "lines": 247,
   "status": "200"
  },
  "ep:auth|PATCH /settings/household": {
   "cases": [
    {
     "cid": "C1027",
     "corpus": "api",
     "name": "test_settings_requires_household_409_C1027",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1029",
     "corpus": "api",
     "name": "test_patch_household_partial_update_C1029",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C2137",
     "corpus": "api",
     "name": "test_patch_household_auto_discount_round_trips_C2137",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C2138",
     "corpus": "api",
     "name": "test_patch_household_auto_discount_explicit_null_422_C2138",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C2139",
     "corpus": "api",
     "name": "test_me_carries_the_auto_discount_flag_C2139",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1030",
     "corpus": "api",
     "name": "test_patch_household_bad_serving_422_C1030",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1031",
     "corpus": "api",
     "name": "test_patch_household_empty_body_noop_C1031",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/user_settings.py",
   "lines": 247,
   "status": "200"
  },
  "ep:auth|PATCH /settings/preferences": {
   "cases": [
    {
     "cid": "C1027",
     "corpus": "api",
     "name": "test_settings_requires_household_409_C1027",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1032",
     "corpus": "api",
     "name": "test_patch_preferences_updates_dietary_C1032",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1033",
     "corpus": "api",
     "name": "test_patch_preferences_diet_folds_into_existing_preferences_C1033",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1034",
     "corpus": "api",
     "name": "test_patch_preferences_too_many_allergens_422_C1034",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1035",
     "corpus": "api",
     "name": "test_patch_preferences_clear_allergens_with_empty_list_C1035",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1036",
     "corpus": "api",
     "name": "test_patch_preferences_null_allergens_rejected_C1036",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1037",
     "corpus": "api",
     "name": "test_patch_preferences_unknown_field_422_C1037",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "",
     "corpus": "web",
     "name": "5 case(s)",
     "state": "file",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/user_settings.py",
   "lines": 247,
   "status": "200"
  },
  "ep:auth|POST /setup/complete": {
   "cases": [
    {
     "cid": "C218",
     "corpus": "api",
     "name": "test_overview_returns_cookability_fields_C218",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C251",
     "corpus": "api",
     "name": "test_complete_rejects_stored_over_total_C251",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C389",
     "corpus": "api",
     "name": "test_setup_complete_with_exploration_creates_row_C389",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C390",
     "corpus": "api",
     "name": "test_setup_complete_folds_in_path_a_plus_C390",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C391",
     "corpus": "api",
     "name": "test_setup_complete_without_exploration_creates_empty_row_C391",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C392",
     "corpus": "api",
     "name": "test_setup_complete_replay_is_idempotent_no_duplicate_C392",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C555",
     "corpus": "api",
     "name": "test_advance_and_due_routes_C555",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 19,
   "doc": "\u2014",
   "file": "apps/api/api/setup.py",
   "lines": 254,
   "status": "200"
  },
  "ep:cooking|DELETE /cooking/sessions/{session_id}/photos/{slot}": {
   "cases": [],
   "cases_more": 0,
   "doc": "Delete one cook photo. Active, owned sessions only; a missing slot 404s.",
   "file": "apps/api/api/cooking.py",
   "lines": 585,
   "status": "HTTP_204_NO_CONTENT"
  },
  "ep:cooking|GET /cooking/active": {
   "cases": [
    {
     "cid": "C236",
     "corpus": "api",
     "name": "test_cooking_requires_auth_C236",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C253",
     "corpus": "api",
     "name": "test_slot_replace_swaps_bytes_and_keeps_row_count_stable_C253",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C265",
     "corpus": "api",
     "name": "test_active_sessions_response_carries_photo_refs_without_bytes_C265",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C266",
     "corpus": "api",
     "name": "test_active_sessions_response_carries_recipe_title_C266",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C283",
     "corpus": "api",
     "name": "test_timer_patch_api_round_trip_C283",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "",
     "corpus": "web",
     "name": "6 case(s)",
     "state": "file",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/cooking.py",
   "lines": 585,
   "status": "200"
  },
  "ep:cooking|GET /cooking/reminders/due": {
   "cases": [
    {
     "cid": "C555",
     "corpus": "api",
     "name": "test_advance_and_due_routes_C555",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "Pending long-prep stage reminders past their due_at (the client polls this; SC-07).",
   "file": "apps/api/api/cooking.py",
   "lines": 585,
   "status": "200"
  },
  "ep:cooking|GET /cooking/sessions/{session_id}/photos/{slot}": {
   "cases": [],
   "cases_more": 0,
   "doc": "Return the raw photo bytes. Any session status \u2014 a completed cook keeps its photos (dish history reaches them via session_id). Honors If-None-Match against the photo's id (the ETag) -> 304 with no body when unchanged.",
   "file": "apps/api/api/cooking.py",
   "lines": 585,
   "status": "200"
  },
  "ep:cooking|PATCH /cooking/sessions/{session_id}/readiness": {
   "cases": [
    {
     "cid": "C675",
     "corpus": "api",
     "name": "test_cooking_stage_readiness_routes_C675",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/cooking.py",
   "lines": 585,
   "status": "200"
  },
  "ep:cooking|PATCH /cooking/sessions/{session_id}/stage": {
   "cases": [
    {
     "cid": "C675",
     "corpus": "api",
     "name": "test_cooking_stage_readiness_routes_C675",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C677",
     "corpus": "api",
     "name": "test_stage_unknown_session_404_C677",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/cooking.py",
   "lines": 585,
   "status": "200"
  },
  "ep:cooking|PATCH /cooking/sessions/{session_id}/steps/{step_id}": {
   "cases": [],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/cooking.py",
   "lines": 585,
   "status": "200"
  },
  "ep:cooking|PATCH /cooking/sessions/{session_id}/timer": {
   "cases": [
    {
     "cid": "C283",
     "corpus": "api",
     "name": "test_timer_patch_api_round_trip_C283",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C284",
     "corpus": "api",
     "name": "test_timer_patch_mixed_body_api_returns_422_C284",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C285",
     "corpus": "api",
     "name": "test_timer_patch_unknown_session_returns_404_C285",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "Start/replace or clear a session's per-step timer (H7). Ownership scoped exactly like step-progress (user_id + household_id + status active in one query) \u2014 a stranger's or inactive session 404s. A mixed body (one of step_id/duration_seconds null) 422s at the schema layer (SessionTimerRequest).",
   "file": "apps/api/api/cooking.py",
   "lines": 585,
   "status": "200"
  },
  "ep:cooking|POST /cooking/sessions": {
   "cases": [
    {
     "cid": "C237",
     "corpus": "api",
     "name": "test_session_requires_idempotency_key_C237",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C267",
     "corpus": "api",
     "name": "test_start_session_response_carries_recipe_title_C267",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C283",
     "corpus": "api",
     "name": "test_timer_patch_api_round_trip_C283",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C284",
     "corpus": "api",
     "name": "test_timer_patch_mixed_body_api_returns_422_C284",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C555",
     "corpus": "api",
     "name": "test_advance_and_due_routes_C555",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C675",
     "corpus": "api",
     "name": "test_cooking_stage_readiness_routes_C675",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1087",
     "corpus": "api",
     "name": "test_cook_route_unlocks_surface_on_profile_C1087",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 1,
   "doc": "\u2014",
   "file": "apps/api/api/cooking.py",
   "lines": 585,
   "status": "HTTP_201_CREATED"
  },
  "ep:cooking|POST /cooking/sessions/{session_id}/advance-stage": {
   "cases": [
    {
     "cid": "C555",
     "corpus": "api",
     "name": "test_advance_and_due_routes_C555",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "Advance a long-prep session to the next stage (REQ-16). Optimistically concurrent on ``expected_stage`` so a retry/double-tap can't skip a stage.",
   "file": "apps/api/api/cooking.py",
   "lines": 585,
   "status": "200"
  },
  "ep:cooking|POST /cooking/sessions/{session_id}/cancel": {
   "cases": [
    {
     "cid": "C262",
     "corpus": "api",
     "name": "test_upload_rejected_on_non_active_session_C262",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C263",
     "corpus": "api",
     "name": "test_cancel_wipes_photos_C263",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "Abandon an active cook (status -> 'cancelled'); it drops out of GET /cooking/active. Ownership-scoped + idempotent. No dish history / no CookedMealCreated is produced. H8: cancel_session wipes the session's photos (delete_session_photos) in the same transaction, so the refs fetched below come back empty.",
   "file": "apps/api/api/cooking.py",
   "lines": 585,
   "status": "200"
  },
  "ep:cooking|POST /cooking/sessions/{session_id}/complete": {
   "cases": [
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C251",
     "corpus": "api",
     "name": "test_complete_rejects_stored_over_total_C251",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C264",
     "corpus": "api",
     "name": "test_complete_keeps_photos_C264",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1087",
     "corpus": "api",
     "name": "test_cook_route_unlocks_surface_on_profile_C1087",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "",
     "corpus": "web",
     "name": "15 case(s)",
     "state": "file",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/cooking.py",
   "lines": 585,
   "status": "200"
  },
  "ep:cooking|PUT /cooking/sessions/{session_id}/photos/{slot}": {
   "cases": [],
   "cases_more": 0,
   "doc": "Upload/replace one cook photo. RAW binary body (no multipart) \u2014 the Content-Type header IS the photo's mime type. A re-upload of the same slot REPLACES the row in place (never a second row) and never counts against the per-session cap. Response code: 201 on a NEW slot, 200 on a replace. Active, owned sessions only (404 otherwise \u2014 house style for \"not yours\" mirrors the sibling session routes).",
   "file": "apps/api/api/cooking.py",
   "lines": 585,
   "status": "200"
  },
  "ep:legal-consent|GET /account/export": {
   "cases": [
    {
     "cid": "C18",
     "corpus": "api",
     "name": "test_account_export_returns_the_user_data_C18",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C8122",
     "corpus": "api",
     "name": "test_account_export_serializes_a_renamed_column_C8122",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C19",
     "corpus": "api",
     "name": "test_account_export_requires_setup_C19",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "The user's complete data as a downloadable JSON bundle (L6).",
   "file": "apps/api/api/account.py",
   "lines": 53,
   "status": "200"
  },
  "ep:legal-consent|GET /consent": {
   "cases": [
    {
     "cid": "C210",
     "corpus": "api",
     "name": "test_consent_required_then_accepted_C210",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/consent.py",
   "lines": 56,
   "status": "200"
  },
  "ep:legal-consent|POST /consent": {
   "cases": [
    {
     "cid": "C210",
     "corpus": "api",
     "name": "test_consent_required_then_accepted_C210",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C211",
     "corpus": "api",
     "name": "test_consent_stamps_server_version_not_client_claim_C211",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C212",
     "corpus": "api",
     "name": "test_consent_is_append_only_C212",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1056",
     "corpus": "api",
     "name": "test_setup_complete_with_consent_200_C1056",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1057",
     "corpus": "api",
     "name": "test_setup_complete_reject_then_accept_retry_same_key_200_C1057",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/consent.py",
   "lines": 56,
   "status": "200"
  },
  "ep:pantry|DELETE /pantry/items/{item_id}": {
   "cases": [
    {
     "cid": "C699",
     "corpus": "api",
     "name": "test_delete_item_used_logs_consumo_event_C699",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C700",
     "corpus": "api",
     "name": "test_delete_item_removed_no_history_event_C700",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C701",
     "corpus": "api",
     "name": "test_delete_item_idempotent_replay_C701",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C702",
     "corpus": "api",
     "name": "test_delete_item_not_found_404_C702",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C703",
     "corpus": "api",
     "name": "test_delete_item_bad_reason_400_C703",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C704",
     "corpus": "api",
     "name": "test_delete_item_requires_auth_C704",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C705",
     "corpus": "api",
     "name": "test_delete_item_cross_household_404_C705",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "Soft-delete a single pantry item with a reason (Phase 53, D98).",
   "file": "apps/api/api/pantry.py",
   "lines": 562,
   "status": "200"
  },
  "ep:pantry|DELETE /pantry/locations/{location_id}": {
   "cases": [],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/pantry.py",
   "lines": 562,
   "status": "HTTP_204_NO_CONTENT"
  },
  "ep:pantry|GET /pantry/frequent-ingredients": {
   "cases": [
    {
     "cid": "C147",
     "corpus": "api",
     "name": "test_frequent_ingredients_requires_auth_C147",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C148",
     "corpus": "api",
     "name": "test_frequent_ingredients_empty_when_no_history_C148",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C149",
     "corpus": "api",
     "name": "test_frequent_ingredients_orders_by_add_count_C149",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "The household's most-frequently-added canonical ingredients (batch-add quick-pick strip).",
   "file": "apps/api/api/pantry.py",
   "lines": 562,
   "status": "200"
  },
  "ep:pantry|GET /pantry/history": {
   "cases": [],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/pantry.py",
   "lines": 562,
   "status": "200"
  },
  "ep:pantry|GET /pantry/locations": {
   "cases": [
    {
     "cid": "C8112",
     "corpus": "api",
     "name": "test_principal_location_cannot_be_deactivated_C8112",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C692",
     "corpus": "api",
     "name": "test_location_create_with_color_icon_round_trips_C692",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C694",
     "corpus": "api",
     "name": "test_principal_despensa_has_default_color_icon_C694",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C729",
     "corpus": "api",
     "name": "test_locations_requires_auth_C729",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/pantry.py",
   "lines": 562,
   "status": "200"
  },
  "ep:pantry|GET /pantry/overview": {
   "cases": [
    {
     "cid": "C218",
     "corpus": "api",
     "name": "test_overview_returns_cookability_fields_C218",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C541",
     "corpus": "api",
     "name": "test_pantry_overview_localizes_canonical_display_name_C541",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C699",
     "corpus": "api",
     "name": "test_delete_item_used_logs_consumo_event_C699",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C706",
     "corpus": "api",
     "name": "test_confirm_bought_route_creates_pantry_item_C706",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C707",
     "corpus": "api",
     "name": "test_confirm_bought_route_idempotent_replay_C707",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C709",
     "corpus": "api",
     "name": "test_reset_apply_route_keep_discard_C709",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C727",
     "corpus": "api",
     "name": "test_pantry_overview_requires_setup_C727",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 2,
   "doc": "\u2014",
   "file": "apps/api/api/pantry.py",
   "lines": 562,
   "status": "200"
  },
  "ep:pantry|GET /shopping": {
   "cases": [
    {
     "cid": "C674",
     "corpus": "api",
     "name": "test_from_planned_and_add_to_list_C674",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1077",
     "corpus": "api",
     "name": "test_shopping_requires_auth_C1077",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/shopping.py",
   "lines": 143,
   "status": "200"
  },
  "ep:pantry|PATCH /pantry/items/{item_id}": {
   "cases": [
    {
     "cid": "",
     "corpus": "web",
     "name": "4 case(s)",
     "state": "file",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/pantry.py",
   "lines": 562,
   "status": "200"
  },
  "ep:pantry|PATCH /pantry/locations/{location_id}": {
   "cases": [
    {
     "cid": "C8110",
     "corpus": "api",
     "name": "test_location_patch_persists_order_C8110",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C8111",
     "corpus": "api",
     "name": "test_location_patch_persists_active_C8111",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C8112",
     "corpus": "api",
     "name": "test_principal_location_cannot_be_deactivated_C8112",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C695",
     "corpus": "api",
     "name": "test_location_patch_changes_color_icon_C695",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C698",
     "corpus": "api",
     "name": "test_location_patch_unknown_color_422_C698",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/pantry.py",
   "lines": 562,
   "status": "200"
  },
  "ep:pantry|POST /pantry/items": {
   "cases": [
    {
     "cid": "C682",
     "corpus": "api",
     "name": "test_assign_location_C682",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C785",
     "corpus": "api",
     "name": "test_recipes_availability_end_to_end_C785",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C958",
     "corpus": "api",
     "name": "test_list_recipe_time_effort_and_ingredient_counts_C958",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "",
     "corpus": "web",
     "name": "15 case(s)",
     "state": "file",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/pantry.py",
   "lines": 562,
   "status": "HTTP_201_CREATED"
  },
  "ep:pantry|POST /pantry/items/batch": {
   "cases": [
    {
     "cid": "C137",
     "corpus": "api",
     "name": "test_create_batch_requires_auth_C137",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C143",
     "corpus": "api",
     "name": "test_create_batch_creates_all_rows_C143",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C144",
     "corpus": "api",
     "name": "test_create_batch_rejects_foreign_location_per_row_C144",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C145",
     "corpus": "api",
     "name": "test_create_batch_empty_is_rejected_C145",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C146",
     "corpus": "api",
     "name": "test_create_batch_caps_item_count_C146",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C149",
     "corpus": "api",
     "name": "test_frequent_ingredients_orders_by_add_count_C149",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C150",
     "corpus": "api",
     "name": "test_frequent_ingredients_respects_limit_C150",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C8133",
     "corpus": "api",
     "name": "test_create_batch_honours_prepared_kind_C8133",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "Create many confirmed pantry items in ONE transaction (Phase 58, D101).",
   "file": "apps/api/api/pantry.py",
   "lines": 562,
   "status": "HTTP_201_CREATED"
  },
  "ep:pantry|POST /pantry/items/{item_id}/assign-location": {
   "cases": [
    {
     "cid": "C682",
     "corpus": "api",
     "name": "test_assign_location_C682",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C683",
     "corpus": "api",
     "name": "test_assign_location_unknown_item_404_C683",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "Assign a pantry item to a location (removes it from the no-location projection).",
   "file": "apps/api/api/pantry.py",
   "lines": 562,
   "status": "200"
  },
  "ep:pantry|POST /pantry/locations": {
   "cases": [
    {
     "cid": "C682",
     "corpus": "api",
     "name": "test_assign_location_C682",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C683",
     "corpus": "api",
     "name": "test_assign_location_unknown_item_404_C683",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C692",
     "corpus": "api",
     "name": "test_location_create_with_color_icon_round_trips_C692",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C693",
     "corpus": "api",
     "name": "test_location_create_without_color_icon_is_null_C693",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C695",
     "corpus": "api",
     "name": "test_location_patch_changes_color_icon_C695",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C696",
     "corpus": "api",
     "name": "test_location_create_unknown_color_422_C696",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C697",
     "corpus": "api",
     "name": "test_location_create_unknown_icon_422_C697",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C698",
     "corpus": "api",
     "name": "test_location_patch_unknown_color_422_C698",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/pantry.py",
   "lines": 562,
   "status": "HTTP_201_CREATED"
  },
  "ep:pantry|POST /pantry/reset/apply": {
   "cases": [
    {
     "cid": "C709",
     "corpus": "api",
     "name": "test_reset_apply_route_keep_discard_C709",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C710",
     "corpus": "api",
     "name": "test_reset_apply_route_requires_idempotency_key_C710",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C711",
     "corpus": "api",
     "name": "test_reset_apply_route_idempotent_replay_C711",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C730",
     "corpus": "api",
     "name": "test_reset_requires_idempotency_key_C730",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "",
     "corpus": "web",
     "name": "15 case(s)",
     "state": "file",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/pantry.py",
   "lines": 562,
   "status": "200"
  },
  "ep:pantry|POST /pantry/reset/preview": {
   "cases": [],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/pantry.py",
   "lines": 562,
   "status": "200"
  },
  "ep:pantry|POST /pantry/resolve-batch": {
   "cases": [
    {
     "cid": "C136",
     "corpus": "api",
     "name": "test_resolve_batch_requires_auth_C136",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C138",
     "corpus": "api",
     "name": "test_resolve_batch_matches_seeded_ingredients_C138",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C139",
     "corpus": "api",
     "name": "test_resolve_batch_rejects_empty_lines_C139",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C140",
     "corpus": "api",
     "name": "test_resolve_batch_caps_line_count_C140",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C141",
     "corpus": "api",
     "name": "test_resolve_batch_rejects_oversized_line_C141",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C142",
     "corpus": "api",
     "name": "test_resolve_batch_accepts_at_cap_line_C142",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "Resolve raw typed lines to ranked canonical candidates + confidence (deterministic matcher).",
   "file": "apps/api/api/pantry.py",
   "lines": 562,
   "status": "200"
  },
  "ep:pantry|POST /shopping/from-planned-recipes": {
   "cases": [
    {
     "cid": "C674",
     "corpus": "api",
     "name": "test_from_planned_and_add_to_list_C674",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C676",
     "corpus": "api",
     "name": "test_p14_routes_require_auth_C676",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/shopping.py",
   "lines": 143,
   "status": "HTTP_201_CREATED"
  },
  "ep:pantry|POST /shopping/items": {
   "cases": [
    {
     "cid": "C706",
     "corpus": "api",
     "name": "test_confirm_bought_route_creates_pantry_item_C706",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C707",
     "corpus": "api",
     "name": "test_confirm_bought_route_idempotent_replay_C707",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/shopping.py",
   "lines": 143,
   "status": "HTTP_201_CREATED"
  },
  "ep:pantry|POST /shopping/items/{item_id}/confirm-bought": {
   "cases": [
    {
     "cid": "C706",
     "corpus": "api",
     "name": "test_confirm_bought_route_creates_pantry_item_C706",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C707",
     "corpus": "api",
     "name": "test_confirm_bought_route_idempotent_replay_C707",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C708",
     "corpus": "api",
     "name": "test_confirm_bought_route_unknown_404_C708",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "",
     "corpus": "web",
     "name": "15 case(s)",
     "state": "file",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/shopping.py",
   "lines": 143,
   "status": "200"
  },
  "ep:pantry|POST /shopping/items/{source_id}/add-to-list": {
   "cases": [
    {
     "cid": "C674",
     "corpus": "api",
     "name": "test_from_planned_and_add_to_list_C674",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/shopping.py",
   "lines": 143,
   "status": "HTTP_201_CREATED"
  },
  "ep:progression|GET /profile/summary": {
   "cases": [
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C744",
     "corpus": "api",
     "name": "test_profile_summary_requires_household_409_C744",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C745",
     "corpus": "api",
     "name": "test_profile_summary_mvp_empty_shape_C745",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C746",
     "corpus": "api",
     "name": "test_profile_summary_landing_aggregate_fields_C746",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1087",
     "corpus": "api",
     "name": "test_cook_route_unlocks_surface_on_profile_C1087",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/profile.py",
   "lines": 31,
   "status": "200"
  },
  "ep:progression|POST /account/export": {
   "cases": [
    {
     "cid": "C684",
     "corpus": "api",
     "name": "test_account_export_stub_C684",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C685",
     "corpus": "api",
     "name": "test_account_export_requires_household_409_C685",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/account.py",
   "lines": 53,
   "status": "HTTP_202_ACCEPTED"
  },
  "ep:recipe|DELETE /": {
   "cases": [],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/recipe_filter_modes.py",
   "lines": 115,
   "status": "HTTP_204_NO_CONTENT"
  },
  "ep:recipe|DELETE /planned-recipes/{planned_id}": {
   "cases": [],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/recipe_plan.py",
   "lines": 132,
   "status": "HTTP_204_NO_CONTENT"
  },
  "ep:recipe|DELETE /recipe-filter-modes/{mode_id}/cupo": {
   "cases": [
    {
     "cid": "C8139",
     "corpus": "api",
     "name": "test_cupo_attach_list_release_roundtrip_C8139",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "Release the CUPO, keep the slot (D183: nothing earned is lost \u2014 counters derive).",
   "file": "apps/api/api/repertorio.py",
   "lines": 112,
   "status": "HTTP_204_NO_CONTENT"
  },
  "ep:recipe|DELETE /recipes/{recipe_id}/plan": {
   "cases": [],
   "cases_more": 0,
   "doc": "Remove a recipe from the household's Planeadas \u2014 the recipe-scoped inverse of ``POST /recipes/{id}/plan`` (the \"Quitar del plan\" popup action, U4). Deletes every manual PlannedRecipe row for this recipe in the household. IDEMPOTENT: an already-unplanned recipe returns 204 too (0 rows removed) \u2014 no 404 \u2014 so a double-tap or a stale UI never errors.",
   "file": "apps/api/api/recipe_plan.py",
   "lines": 132,
   "status": "HTTP_204_NO_CONTENT"
  },
  "ep:recipe|GET /": {
   "cases": [],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/recipe_filter_modes.py",
   "lines": 115,
   "status": "200"
  },
  "ep:recipe|GET /catalog/{domain}": {
   "cases": [
    {
     "cid": "C169",
     "corpus": "api",
     "name": "test_get_catalog_units_C169",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C170",
     "corpus": "api",
     "name": "test_get_catalog_restrictions_C170",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C171",
     "corpus": "api",
     "name": "test_get_catalog_ingredients_C171",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C172",
     "corpus": "api",
     "name": "test_get_catalog_invalid_domain_C172",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C678",
     "corpus": "api",
     "name": "test_catalog_prepared_foods_C678",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C679",
     "corpus": "api",
     "name": "test_catalog_recipe_taxonomy_and_icons_registered_C679",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C680",
     "corpus": "api",
     "name": "test_catalog_unknown_domain_404_C680",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C681",
     "corpus": "api",
     "name": "test_catalog_requires_auth_C681",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "Return all items for a catalog domain.",
   "file": "apps/api/api/catalog.py",
   "lines": 174,
   "status": "200"
  },
  "ep:recipe|GET /recipe-creation/gustify/stream": {
   "cases": [
    {
     "cid": "C1106",
     "corpus": "api",
     "name": "test_sse_completed_streams_full_sequence_C1106",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1107",
     "corpus": "api",
     "name": "test_sse_cold_start_streams_completed_with_grace_C1107",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1108",
     "corpus": "api",
     "name": "test_sse_real_mode_streams_deferred_not_error_C1108",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1109",
     "corpus": "api",
     "name": "test_sse_invalid_mode_is_error_event_not_400_C1109",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1110",
     "corpus": "api",
     "name": "test_sse_invalid_model_tier_is_error_event_C1110",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1111",
     "corpus": "api",
     "name": "test_sse_insufficient_credits_is_error_event_C1111",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1112",
     "corpus": "api",
     "name": "test_sse_missing_token_rejected_C1112",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C1113",
     "corpus": "api",
     "name": "test_sse_empty_token_unauthorized_C1113",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 3,
   "doc": "SSE stream of the D-GU3 pipeline (REQ-10 web transport). Auth + idempotency key arrive as query params (EventSource has no header API). Pipeline failures arrive as ``error`` events in the stream, not HTTP statuses \u2014 the 200 status line is committed the moment streaming starts. Setup/auth pre-conditions still gate before the stream opens (401 invalid token via the dependency; 409 if setup incomplet",
   "file": "apps/api/api/recipe_stream.py",
   "lines": 251,
   "status": "200"
  },
  "ep:recipe|GET /recipe-creation/{request_id}": {
   "cases": [
    {
     "cid": "",
     "corpus": "web",
     "name": "15 case(s)",
     "state": "file",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/recipe_creation.py",
   "lines": 302,
   "status": "200"
  },
  "ep:recipe|GET /recipes": {
   "cases": [
    {
     "cid": "C316",
     "corpus": "api",
     "name": "test_exclude_equipment_unknown_code_is_400_C316",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C569",
     "corpus": "api",
     "name": "test_no_mode_leaves_match_score_null_C569",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C785",
     "corpus": "api",
     "name": "test_recipes_availability_end_to_end_C785",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C834",
     "corpus": "api",
     "name": "test_cooked_field_on_list_and_detail_route_C834",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C859",
     "corpus": "api",
     "name": "test_patch_flags_and_list_detail_end_to_end_C859",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C861",
     "corpus": "api",
     "name": "test_flags_do_not_leak_across_users_via_api_C861",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C957",
     "corpus": "api",
     "name": "test_recipes_requires_auth_C957",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C958",
     "corpus": "api",
     "name": "test_list_recipe_time_effort_and_ingredient_counts_C958",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 1,
   "doc": "Search recipes with D17 allergen exclusion + taxonomy filters + per-user flags.",
   "file": "apps/api/api/recipes.py",
   "lines": 671,
   "status": "200"
  },
  "ep:recipe|GET /recipes/explore": {
   "cases": [],
   "cases_more": 0,
   "doc": "Novelty post-filter (REQ-09/D-GU2): recipes that introduce exactly one novel element for ``mode``, over the user's cooked-meal ledger. Composes the D-GU3 order \u2014 allergen hard-filter FIRST, then novelty. NOTE: this route MUST be declared before ``/recipes/{recipe_id}`` so 'explore' is not parsed as an id.",
   "file": "apps/api/api/recipe_explore.py",
   "lines": 178,
   "status": "200"
  },
  "ep:recipe|GET /recipes/{recipe_id}": {
   "cases": [
    {
     "cid": "C434",
     "corpus": "api",
     "name": "test_cold_start_with_region_pref_floats_match_and_keeps_rest_C434",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C435",
     "corpus": "api",
     "name": "test_cold_start_no_prefs_is_newest_first_C435",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C436",
     "corpus": "api",
     "name": "test_warm_nueva_cocina_region_pref_floats_member_match_C436",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C437",
     "corpus": "api",
     "name": "test_cold_start_comfort_time_floats_duration_match_C437",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C438",
     "corpus": "api",
     "name": "test_cold_start_skill_cap_sinks_over_cap_recipe_C438",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C439",
     "corpus": "api",
     "name": "test_cold_start_taste_pref_floats_matching_recipe_C439",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C440",
     "corpus": "api",
     "name": "test_cold_start_temperature_pref_floats_exact_match_C440",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C441",
     "corpus": "api",
     "name": "test_sensory_pref_only_flags_preference_shaped_C441",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 20,
   "doc": "\u2014",
   "file": "apps/api/api/recipe_detail.py",
   "lines": 210,
   "status": "200"
  },
  "ep:recipe|GET /repertorio/cupos": {
   "cases": [
    {
     "cid": "C8139",
     "corpus": "api",
     "name": "test_cupo_attach_list_release_roundtrip_C8139",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C8142",
     "corpus": "api",
     "name": "test_plan_with_cupo_stamps_the_link_C8142",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "",
     "corpus": "e2e",
     "name": "4 case(s)",
     "state": "file",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "The user's cupos with derived planeadas/cocinadas, plus the shared slot cap.",
   "file": "apps/api/api/repertorio.py",
   "lines": 112,
   "status": "200"
  },
  "ep:recipe|GET /taxonomy": {
   "cases": [
    {
     "cid": "C167",
     "corpus": "api",
     "name": "test_get_taxonomy_empty_C167",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C168",
     "corpus": "api",
     "name": "test_get_taxonomy_seeded_C168",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C173",
     "corpus": "api",
     "name": "test_get_catalog_requires_auth_C173",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "Return the full taxonomy tree (dimensions + values).",
   "file": "apps/api/api/catalog.py",
   "lines": 174,
   "status": "200"
  },
  "ep:recipe|PATCH /recipes/{recipe_id}/flags": {
   "cases": [
    {
     "cid": "C859",
     "corpus": "api",
     "name": "test_patch_flags_and_list_detail_end_to_end_C859",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C860",
     "corpus": "api",
     "name": "test_patch_flags_missing_recipe_404_C860",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C861",
     "corpus": "api",
     "name": "test_flags_do_not_leak_across_users_via_api_C861",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C867",
     "corpus": "api",
     "name": "test_list_route_carries_total_and_favorite_filter_C867",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "UPSERT the caller's per-user favorite/archived flags for a recipe (D93).",
   "file": "apps/api/api/recipe_detail.py",
   "lines": 210,
   "status": "200"
  },
  "ep:recipe|POST /": {
   "cases": [],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/recipe_filter_modes.py",
   "lines": 115,
   "status": "HTTP_201_CREATED"
  },
  "ep:recipe|POST /recipe-creation/gustify": {
   "cases": [
    {
     "cid": "C72",
     "corpus": "api",
     "name": "test_gustify_requires_auth_C72",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C73",
     "corpus": "api",
     "name": "test_gustify_requires_idempotency_key_C73",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C74",
     "corpus": "api",
     "name": "test_gustify_invalid_mode_400_C74",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C75",
     "corpus": "api",
     "name": "test_gustify_cold_start_surfaces_candidates_with_grace_C75",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C76",
     "corpus": "api",
     "name": "test_gustify_completed_with_seeded_ledger_C76",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C77",
     "corpus": "api",
     "name": "test_gustify_idempotent_replay_C77",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C78",
     "corpus": "api",
     "name": "test_gustify_real_mode_returns_deferred_C78",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C79",
     "corpus": "api",
     "name": "test_gustify_blocked_by_spend_cap_C79",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 12,
   "doc": "Generate AI recipe suggestions via the D-GU3 pipeline (REQ-08 structure).",
   "file": "apps/api/api/recipe_creation.py",
   "lines": 302,
   "status": "HTTP_201_CREATED"
  },
  "ep:recipe|POST /recipe-creation/manual": {
   "cases": [
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C556",
     "corpus": "api",
     "name": "test_manual_create_with_stages_roundtrip_C556",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C557",
     "corpus": "api",
     "name": "test_manual_create_stage_validation_C557",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C785",
     "corpus": "api",
     "name": "test_recipes_availability_end_to_end_C785",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C958",
     "corpus": "api",
     "name": "test_list_recipe_time_effort_and_ingredient_counts_C958",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C959",
     "corpus": "api",
     "name": "test_list_recipe_exposes_predominant_techniques_C959",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C960",
     "corpus": "api",
     "name": "test_recipe_creation_requires_key_C960",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C965",
     "corpus": "api",
     "name": "test_recipe_manual_create_persists_language_en_over_http_C965",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 6,
   "doc": "\u2014",
   "file": "apps/api/api/recipe_creation.py",
   "lines": 302,
   "status": "HTTP_201_CREATED"
  },
  "ep:recipe|POST /recipe-creation/{request_id}/relief-accept": {
   "cases": [
    {
     "cid": "C89",
     "corpus": "api",
     "name": "test_relief_accept_never_charges_credits_C89",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C90",
     "corpus": "api",
     "name": "test_relief_accept_relaxes_novelty_keeps_allergen_safety_C90",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C91",
     "corpus": "api",
     "name": "test_relief_accept_unknown_request_404_C91",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "Filter-relief continue: re-run relaxing the novelty rule (allergen safety stays). Real generation still returns the deferred shape (PENDING #22).",
   "file": "apps/api/api/recipe_creation.py",
   "lines": 302,
   "status": "200"
  },
  "ep:recipe|POST /recipes/demand": {
   "cases": [
    {
     "cid": "C969",
     "corpus": "api",
     "name": "test_recipe_manual_create_disabled_returns_403_C969",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C971",
     "corpus": "api",
     "name": "test_recipe_gustify_create_disabled_returns_403_C971",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C972",
     "corpus": "api",
     "name": "test_post_recipe_demand_captures_search_C972",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C973",
     "corpus": "api",
     "name": "test_post_recipe_demand_allows_empty_note_C973",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C974",
     "corpus": "api",
     "name": "test_post_recipe_demand_rejects_long_note_C974",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C975",
     "corpus": "api",
     "name": "test_post_recipe_demand_rate_limited_one_per_hour_C975",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "Capture a 0-result recipe search as DEMAND (\"Pedir recetas\", founder 2026-06-22). Records the unmet search criteria + the optional \u2264140-char note for later on-demand authoring \u2014 NO recipe is generated here. Household is context-only (None when the user has no household yet).",
   "file": "apps/api/api/recipe_demand.py",
   "lines": 67,
   "status": "HTTP_201_CREATED"
  },
  "ep:recipe|POST /recipes/{recipe_id}/plan": {
   "cases": [
    {
     "cid": "C674",
     "corpus": "api",
     "name": "test_from_planned_and_add_to_list_C674",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C8142",
     "corpus": "api",
     "name": "test_plan_with_cupo_stamps_the_link_C8142",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/recipe_plan.py",
   "lines": 132,
   "status": "HTTP_201_CREATED"
  },
  "ep:recipe|PUT /": {
   "cases": [],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/recipe_filter_modes.py",
   "lines": 115,
   "status": "200"
  },
  "ep:recipe|PUT /recipe-filter-modes/{mode_id}/cupo": {
   "cases": [
    {
     "cid": "C8139",
     "corpus": "api",
     "name": "test_cupo_attach_list_release_roundtrip_C8139",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C8140",
     "corpus": "api",
     "name": "test_cupo_attach_rejects_non_taxonomy_type_C8140",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C8141",
     "corpus": "api",
     "name": "test_cupo_attach_is_user_scoped_C8141",
     "state": "pass",
     "tier": "route"
    },
    {
     "cid": "C8142",
     "corpus": "api",
     "name": "test_plan_with_cupo_stamps_the_link_C8142",
     "state": "pass",
     "tier": "route"
    }
   ],
   "cases_more": 0,
   "doc": "Attach (or overwrite) the dish type on an owned slot, making it a cupo.",
   "file": "apps/api/api/repertorio.py",
   "lines": 112,
   "status": "200"
  },
  "fn:allergen|_build_settings": {
   "api": 0,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/user_settings.py",
   "flines": 247,
   "god": 1,
   "internal": 1,
   "layer": "api",
   "lines": 61,
   "returns": "SettingsResponse",
   "sim": null,
   "usage": 0
  },
  "fn:allergen|_canonical_exists": {
   "api": 0,
   "async": 1,
   "base": 1,
   "cases": [],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/services/reconciliation.py",
   "flines": 237,
   "god": 0,
   "internal": 1,
   "layer": "services",
   "lines": 6,
   "returns": "bool",
   "sim": null,
   "usage": 0
  },
  "fn:allergen|apply_reconciliation": {
   "api": 0,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C980",
     "corpus": "api",
     "name": "test_apply_alias_to_existing_C980",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C981",
     "corpus": "api",
     "name": "test_apply_create_new_ingredient_C981",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C982",
     "corpus": "api",
     "name": "test_apply_create_requires_violates_C982",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C983",
     "corpus": "api",
     "name": "test_apply_alias_to_nonexistent_rejected_C983",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C984",
     "corpus": "api",
     "name": "test_apply_dry_run_writes_nothing_C984",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C985",
     "corpus": "api",
     "name": "test_apply_ignore_C985",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "doc": "Apply triage decisions to the reconciliation queue. dry_run=True (default) rolls back so the caller can preview (roast S7). 'create' REQUIRES an explicit `violates` list (validated against known restriction codes) so a new ingredient never enters the catalog with silently missing allergen tags. Resolved rows are stamped with status + resolved_by/at (audit, S8).",
   "file": "apps/api/services/reconciliation.py",
   "flines": 237,
   "god": 1,
   "internal": 0,
   "layer": "services",
   "lines": 93,
   "returns": "ReconcileResult",
   "sim": null,
   "usage": 0
  },
  "fn:allergen|enqueue_unknown_ingredients": {
   "api": 0,
   "async": 1,
   "base": 1,
   "cases": [
    {
     "cid": "C977",
     "corpus": "api",
     "name": "test_enqueue_inserts_unknowns_C977",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C978",
     "corpus": "api",
     "name": "test_enqueue_is_idempotent_increment_C978",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C979",
     "corpus": "api",
     "name": "test_enqueue_no_unknowns_is_noop_C979",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "doc": "Upsert every UNKNOWN ingredient across the candidates into the reconciliation queue (occurrence_count++). Returns the count of distinct unknowns seen (0 if none). Never raises \u2014 best-effort (roast S5).",
   "file": "apps/api/services/reconciliation.py",
   "flines": 237,
   "god": 0,
   "internal": 2,
   "layer": "services",
   "lines": 38,
   "returns": "int",
   "sim": null,
   "usage": 0
  },
  "fn:allergen|get_active": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C236",
     "corpus": "api",
     "name": "test_cooking_requires_auth_C236",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C253",
     "corpus": "api",
     "name": "test_slot_replace_swaps_bytes_and_keeps_row_count_stable_C253",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C265",
     "corpus": "api",
     "name": "test_active_sessions_response_carries_photo_refs_without_bytes_C265",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C266",
     "corpus": "api",
     "name": "test_active_sessions_response_carries_recipe_title_C266",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C283",
     "corpus": "api",
     "name": "test_timer_patch_api_round_trip_C283",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "",
     "corpus": "web",
     "name": "6 case(s)",
     "state": "file",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/cooking.py",
   "flines": 585,
   "god": 0,
   "internal": 2,
   "layer": "api",
   "lines": 26,
   "returns": "ActiveCookingResponse",
   "sim": null,
   "usage": 1
  },
  "fn:allergen|get_pantry_overview": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C218",
     "corpus": "api",
     "name": "test_overview_returns_cookability_fields_C218",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C541",
     "corpus": "api",
     "name": "test_pantry_overview_localizes_canonical_display_name_C541",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C699",
     "corpus": "api",
     "name": "test_delete_item_used_logs_consumo_event_C699",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C706",
     "corpus": "api",
     "name": "test_confirm_bought_route_creates_pantry_item_C706",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C707",
     "corpus": "api",
     "name": "test_confirm_bought_route_idempotent_replay_C707",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 4,
   "doc": "\u2014",
   "file": "apps/api/api/pantry.py",
   "flines": 562,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 33,
   "returns": "PantryOverviewResponse",
   "sim": null,
   "usage": 1
  },
  "fn:allergen|load_user_allergens": {
   "api": 4,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "Load a user's allergen codes from their dietary profile (D17 R8).",
   "file": "apps/api/services/recipes.py",
   "flines": 409,
   "god": 0,
   "internal": 6,
   "layer": "services",
   "lines": 20,
   "returns": "list[str] | None",
   "sim": null,
   "usage": 4
  },
  "fn:allergen|patch_session_timer": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C283",
     "corpus": "api",
     "name": "test_timer_patch_api_round_trip_C283",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C284",
     "corpus": "api",
     "name": "test_timer_patch_mixed_body_api_returns_422_C284",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C285",
     "corpus": "api",
     "name": "test_timer_patch_unknown_session_returns_404_C285",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "Start/replace or clear a session's per-step timer (H7). Ownership scoped exactly like step-progress (user_id + household_id + status active in one query) \u2014 a stranger's or inactive session 404s. A mixed body (one of step_id/duration_seconds null) 422s at the schema layer (SessionTimerRequest).",
   "file": "apps/api/api/cooking.py",
   "flines": 585,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 29,
   "returns": "CookingSessionResponse",
   "sim": null,
   "usage": 1
  },
  "fn:allergen|post_complete": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C251",
     "corpus": "api",
     "name": "test_complete_rejects_stored_over_total_C251",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C264",
     "corpus": "api",
     "name": "test_complete_keeps_photos_C264",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1087",
     "corpus": "api",
     "name": "test_cook_route_unlocks_surface_on_profile_C1087",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "",
     "corpus": "web",
     "name": "15 case(s)",
     "state": "file",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/cooking.py",
   "flines": 585,
   "god": 1,
   "internal": 0,
   "layer": "api",
   "lines": 50,
   "returns": "CompletionResponse",
   "sim": null,
   "usage": 1
  },
  "fn:allergen|post_start_session": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C237",
     "corpus": "api",
     "name": "test_session_requires_idempotency_key_C237",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C267",
     "corpus": "api",
     "name": "test_start_session_response_carries_recipe_title_C267",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C283",
     "corpus": "api",
     "name": "test_timer_patch_api_round_trip_C283",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C284",
     "corpus": "api",
     "name": "test_timer_patch_mixed_body_api_returns_422_C284",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C555",
     "corpus": "api",
     "name": "test_advance_and_due_routes_C555",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 3,
   "doc": "\u2014",
   "file": "apps/api/api/cooking.py",
   "flines": 585,
   "god": 1,
   "internal": 0,
   "layer": "api",
   "lines": 53,
   "returns": "CookingSessionResponse",
   "sim": null,
   "usage": 1
  },
  "fn:allergen|reconcile_recipe_restrictions": {
   "api": 0,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C986",
     "corpus": "api",
     "name": "test_reconcile_heals_a_drifted_fish_recipe_C986",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C987",
     "corpus": "api",
     "name": "test_reconcile_is_idempotent_C987",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C988",
     "corpus": "api",
     "name": "test_reconcile_leaves_ai_recipes_untouched_C988",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "doc": "Re-derive restriction_codes from the catalog and UPDATE any DRIFTED slugged recipe row. Returns ``(updated, scanned)`` \u2014 updated = rows whose stored codes differed (so a clean DB is a no-op), scanned = catalog recipes with a slug. Idempotent. Testable: tests call it directly. ``files`` defaults to the on-disk catalog; the startup path passes a pre-loaded list.",
   "file": "apps/api/services/restriction_seed.py",
   "flines": 171,
   "god": 0,
   "internal": 1,
   "layer": "services",
   "lines": 30,
   "returns": "tuple[int, int]",
   "sim": null,
   "usage": 0
  },
  "fn:allergen|search_recipes": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C316",
     "corpus": "api",
     "name": "test_exclude_equipment_unknown_code_is_400_C316",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C569",
     "corpus": "api",
     "name": "test_no_mode_leaves_match_score_null_C569",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C785",
     "corpus": "api",
     "name": "test_recipes_availability_end_to_end_C785",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C834",
     "corpus": "api",
     "name": "test_cooked_field_on_list_and_detail_route_C834",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C859",
     "corpus": "api",
     "name": "test_patch_flags_and_list_detail_end_to_end_C859",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C861",
     "corpus": "api",
     "name": "test_flags_do_not_leak_across_users_via_api_C861",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 3,
   "doc": "Search recipes with D17 allergen exclusion + taxonomy filters + per-user flags.",
   "file": "apps/api/api/recipes.py",
   "flines": 671,
   "god": 1,
   "internal": 0,
   "layer": "api",
   "lines": 628,
   "returns": "RecipeListResponse",
   "sim": null,
   "usage": 1
  },
  "fn:allergen|seed_recipe_restrictions_on_startup": {
   "api": 0,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "Reconcile the R8 allergen wall from the in-image catalog on deploy. TWO closures, both fed by the catalog files (mirrors seed_recipe_sensory_on_startup \u2014 DEPLOY-ONLY, advisory-locked, NON-FATAL, so a failure logs LOUDLY but never crash-loops boot): 1. BROWSE path \u2014 re-derive each slugged recipe's stored ``restriction_codes`` (drifted rows). 2. AI-GENERATION path \u2014 UNION the catalog-delta ingredien",
   "file": "apps/api/services/restriction_seed.py",
   "flines": 171,
   "god": 0,
   "internal": 0,
   "layer": "services",
   "lines": 49,
   "returns": "None",
   "sim": null,
   "usage": 0
  },
  "fn:auth|_build_me_response": {
   "api": 0,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "Build the /me payload from the auth context + preference lookups.",
   "file": "apps/api/api/setup.py",
   "flines": 254,
   "god": 1,
   "internal": 1,
   "layer": "api",
   "lines": 100,
   "returns": "MeResponse",
   "sim": null,
   "usage": 0
  },
  "fn:auth|_load_setup_result": {
   "api": 0,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "Read-only re-derivation of a completed setup graph (REPLAY / already-set-up).",
   "file": "apps/api/services/setup.py",
   "flines": 407,
   "god": 1,
   "internal": 1,
   "layer": "services",
   "lines": 80,
   "returns": "SetupResult",
   "sim": null,
   "usage": 0
  },
  "fn:auth|_me_response_from_result": {
   "api": 0,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/setup.py",
   "flines": 254,
   "god": 0,
   "internal": 1,
   "layer": "api",
   "lines": 20,
   "returns": "MeResponse",
   "sim": null,
   "usage": 0
  },
  "fn:auth|_upsert_dietary": {
   "api": 0,
   "async": 1,
   "base": 1,
   "cases": [],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/services/setup.py",
   "flines": 407,
   "god": 0,
   "internal": 2,
   "layer": "services",
   "lines": 18,
   "returns": "UserDietaryProfile",
   "sim": null,
   "usage": 0
  },
  "fn:auth|_upsert_exploration": {
   "api": 0,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "D109: thin wrapper over the exploration service's get-or-create upsert.",
   "file": "apps/api/services/setup.py",
   "flines": 407,
   "god": 0,
   "internal": 1,
   "layer": "services",
   "lines": 10,
   "returns": "UserExplorationPreferences",
   "sim": null,
   "usage": 0
  },
  "fn:auth|delete_me": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C12",
     "corpus": "api",
     "name": "test_delete_me_requires_auth_C12",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C13",
     "corpus": "api",
     "name": "test_delete_me_wipes_every_seeded_table_and_spares_system_recipe_C13",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C14",
     "corpus": "api",
     "name": "test_delete_me_still_204s_when_firebase_delete_fails_C14",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C15",
     "corpus": "api",
     "name": "test_delete_me_multi_member_household_survives_C15",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "Delete the caller's account \u2014 Settings \"Zona de peligro\" (founder 2026-07-09).",
   "file": "apps/api/api/setup.py",
   "flines": 254,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 38,
   "returns": "Response",
   "sim": null,
   "usage": 1
  },
  "fn:auth|get_me": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C387",
     "corpus": "api",
     "name": "test_me_surfaces_empty_exploration_for_no_row_C387",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C388",
     "corpus": "api",
     "name": "test_me_surfaces_written_exploration_C388",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C2139",
     "corpus": "api",
     "name": "test_me_carries_the_auto_discount_flag_C2139",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1049",
     "corpus": "api",
     "name": "test_setup_complete_success_then_me_reads_back_C1049",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1053",
     "corpus": "api",
     "name": "test_me_pre_setup_returns_setup_required_C1053",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1054",
     "corpus": "api",
     "name": "test_me_unauthenticated_returns_401_C1054",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 1,
   "doc": "\u2014",
   "file": "apps/api/api/setup.py",
   "flines": 254,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 6,
   "returns": "MeResponse",
   "sim": null,
   "usage": 1
  },
  "fn:auth|get_settings_route": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C381",
     "corpus": "api",
     "name": "test_settings_get_surfaces_empty_exploration_for_no_row_C381",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C382",
     "corpus": "api",
     "name": "test_settings_get_surfaces_written_path_a_plus_C382",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C385",
     "corpus": "api",
     "name": "test_settings_get_surfaces_written_sensory_C385",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C386",
     "corpus": "api",
     "name": "test_settings_get_surfaces_written_exploration_C386",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1027",
     "corpus": "api",
     "name": "test_settings_requires_household_409_C1027",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1028",
     "corpus": "api",
     "name": "test_settings_get_after_setup_C1028",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 2,
   "doc": "\u2014",
   "file": "apps/api/api/user_settings.py",
   "flines": 247,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 7,
   "returns": "SettingsResponse",
   "sim": "get_profile_summary",
   "usage": 1
  },
  "fn:auth|patch_exploration": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C372",
     "corpus": "api",
     "name": "test_patch_exploration_requires_household_409_C372",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C373",
     "corpus": "api",
     "name": "test_patch_exploration_updates_and_returns_block_C373",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C374",
     "corpus": "api",
     "name": "test_patch_exploration_path_a_plus_round_trips_C374",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C375",
     "corpus": "api",
     "name": "test_patch_exploration_bad_comfort_time_422_C375",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C376",
     "corpus": "api",
     "name": "test_patch_exploration_bad_complexity_cap_422_C376",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C377",
     "corpus": "api",
     "name": "test_patch_exploration_wholesale_replace_clears_omitted_C377",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 17,
   "doc": "D109 Path A \u2014 wholesale-replace the caller's two exploration bias lists.",
   "file": "apps/api/api/user_settings.py",
   "flines": 247,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 27,
   "returns": "SettingsResponse",
   "sim": null,
   "usage": 1
  },
  "fn:auth|patch_household_settings": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C1027",
     "corpus": "api",
     "name": "test_settings_requires_household_409_C1027",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1029",
     "corpus": "api",
     "name": "test_patch_household_partial_update_C1029",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C2137",
     "corpus": "api",
     "name": "test_patch_household_auto_discount_round_trips_C2137",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C2138",
     "corpus": "api",
     "name": "test_patch_household_auto_discount_explicit_null_422_C2138",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C2139",
     "corpus": "api",
     "name": "test_me_carries_the_auto_discount_flag_C2139",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1030",
     "corpus": "api",
     "name": "test_patch_household_bad_serving_422_C1030",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 1,
   "doc": "\u2014",
   "file": "apps/api/api/user_settings.py",
   "flines": 247,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 24,
   "returns": "SettingsResponse",
   "sim": null,
   "usage": 1
  },
  "fn:auth|patch_preferences": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C1027",
     "corpus": "api",
     "name": "test_settings_requires_household_409_C1027",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1032",
     "corpus": "api",
     "name": "test_patch_preferences_updates_dietary_C1032",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1033",
     "corpus": "api",
     "name": "test_patch_preferences_diet_folds_into_existing_preferences_C1033",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1034",
     "corpus": "api",
     "name": "test_patch_preferences_too_many_allergens_422_C1034",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1035",
     "corpus": "api",
     "name": "test_patch_preferences_clear_allergens_with_empty_list_C1035",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1036",
     "corpus": "api",
     "name": "test_patch_preferences_null_allergens_rejected_C1036",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 2,
   "doc": "\u2014",
   "file": "apps/api/api/user_settings.py",
   "flines": 247,
   "god": 1,
   "internal": 1,
   "layer": "api",
   "lines": 73,
   "returns": "SettingsResponse",
   "sim": null,
   "usage": 1
  },
  "fn:auth|setup_complete": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C218",
     "corpus": "api",
     "name": "test_overview_returns_cookability_fields_C218",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C251",
     "corpus": "api",
     "name": "test_complete_rejects_stored_over_total_C251",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C389",
     "corpus": "api",
     "name": "test_setup_complete_with_exploration_creates_row_C389",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C390",
     "corpus": "api",
     "name": "test_setup_complete_folds_in_path_a_plus_C390",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C391",
     "corpus": "api",
     "name": "test_setup_complete_without_exploration_creates_empty_row_C391",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 21,
   "doc": "\u2014",
   "file": "apps/api/api/setup.py",
   "flines": 254,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 21,
   "returns": "MeResponse",
   "sim": null,
   "usage": 1
  },
  "fn:cooking|_attach_photos": {
   "api": 0,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "Populate ``resp.photos`` via ONE grouped ``list_photo_refs`` query, and ``resp.recipe_title`` via ONE ``Recipe`` lookup (the active-cook card must never fall back to a placeholder title just because the recipe is off the loaded catalog page) \u2014 every CookingSessionResponse constructor site calls this (never N+1, H8).",
   "file": "apps/api/api/cooking.py",
   "flines": 585,
   "god": 0,
   "internal": 2,
   "layer": "api",
   "lines": 17,
   "returns": "CookingSessionResponse",
   "sim": null,
   "usage": 0
  },
  "fn:cooking|_recipe_titles": {
   "api": 0,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "``Recipe.title`` for each id, in ONE query \u2014 reused by both the single-response sites (a list of one) and ``get_active`` (the full batch), so neither ever N+1s.",
   "file": "apps/api/api/cooking.py",
   "flines": 585,
   "god": 0,
   "internal": 1,
   "layer": "api",
   "lines": 11,
   "returns": "dict[_uuid.UUID, str]",
   "sim": null,
   "usage": 0
  },
  "fn:cooking|_replay_completion": {
   "api": 0,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "Reconstruct an already-completed session's result from its stored summary.",
   "file": "apps/api/services/cooking.py",
   "flines": 707,
   "god": 0,
   "internal": 1,
   "layer": "services",
   "lines": 37,
   "returns": "CompletionResult",
   "sim": null,
   "usage": 0
  },
  "fn:cooking|_resolve_storage_method": {
   "api": 0,
   "async": 0,
   "base": 1,
   "cases": [],
   "cases_more": 0,
   "doc": "Pick the storage method for a stored portion: the user's choice, else the recipe's first hint (Phase 69), else fridge. Unknown/absent codes fall through so we never store a phantom.",
   "file": "apps/api/services/cooking.py",
   "flines": 707,
   "god": 0,
   "internal": 1,
   "layer": "services",
   "lines": 10,
   "returns": "str",
   "sim": null,
   "usage": 0
  },
  "fn:cooking|_stages": {
   "api": 0,
   "async": 0,
   "base": 1,
   "cases": [],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/services/long_prep.py",
   "flines": 204,
   "god": 0,
   "internal": 2,
   "layer": "services",
   "lines": 11,
   "returns": "list[dict[str, Any]]",
   "sim": null,
   "usage": 0
  },
  "fn:cooking|advance_stage": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C548",
     "corpus": "api",
     "name": "test_advance_schedules_next_stage_C548",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C549",
     "corpus": "api",
     "name": "test_advance_is_idempotent_on_stale_expected_C549",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C550",
     "corpus": "api",
     "name": "test_advance_terminal_is_noop_C550",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C553",
     "corpus": "api",
     "name": "test_malformed_hold_hours_does_not_crash_C553",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C554",
     "corpus": "api",
     "name": "test_advance_on_completed_session_is_noop_C554",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "doc": "Advance a long-prep session one stage. Optimistically concurrent: only advances when ``expected_stage`` matches the session's current stage, so a retry/double-tap is a safe no-op replay (returns the current state). Terminal-stage advance is also a no-op.",
   "file": "apps/api/services/long_prep.py",
   "flines": 204,
   "god": 1,
   "internal": 0,
   "layer": "services",
   "lines": 67,
   "returns": "tuple[CookingSession, CookingStageReminder | None]",
   "sim": null,
   "usage": 1
  },
  "fn:cooking|complete_session": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C121",
     "corpus": "api",
     "name": "test_completion_retry_safe_C121",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C229",
     "corpus": "api",
     "name": "test_complete_session_atomic_C229",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C230",
     "corpus": "api",
     "name": "test_complete_session_idempotent_C230",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C231",
     "corpus": "api",
     "name": "test_complete_not_found_C231",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C232",
     "corpus": "api",
     "name": "test_dish_history_created_C232",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C238",
     "corpus": "api",
     "name": "test_complete_stored_creates_prepared_item_C238",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 8,
   "doc": "Atomic completion: session + dish history + ingredient consumption.",
   "file": "apps/api/services/cooking.py",
   "flines": 707,
   "god": 1,
   "internal": 1,
   "layer": "services",
   "lines": 164,
   "returns": "CompletionResult",
   "sim": null,
   "usage": 1
  },
  "fn:cooking|delete_session_photo": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "Delete one cook photo. Active, owned sessions only; a missing slot 404s.",
   "file": "apps/api/api/cooking.py",
   "flines": 585,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 21,
   "returns": "Response",
   "sim": null,
   "usage": 1
  },
  "fn:cooking|get_active": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C236",
     "corpus": "api",
     "name": "test_cooking_requires_auth_C236",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C253",
     "corpus": "api",
     "name": "test_slot_replace_swaps_bytes_and_keeps_row_count_stable_C253",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C265",
     "corpus": "api",
     "name": "test_active_sessions_response_carries_photo_refs_without_bytes_C265",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C266",
     "corpus": "api",
     "name": "test_active_sessions_response_carries_recipe_title_C266",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C283",
     "corpus": "api",
     "name": "test_timer_patch_api_round_trip_C283",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "",
     "corpus": "web",
     "name": "6 case(s)",
     "state": "file",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/cooking.py",
   "flines": 585,
   "god": 0,
   "internal": 2,
   "layer": "api",
   "lines": 26,
   "returns": "ActiveCookingResponse",
   "sim": null,
   "usage": 1
  },
  "fn:cooking|get_due_reminders": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C555",
     "corpus": "api",
     "name": "test_advance_and_due_routes_C555",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "Pending long-prep stage reminders past their due_at (the client polls this; SC-07).",
   "file": "apps/api/api/cooking.py",
   "flines": 585,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 11,
   "returns": "DueRemindersResponse",
   "sim": null,
   "usage": 1
  },
  "fn:cooking|get_session_photo": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "Return the raw photo bytes. Any session status \u2014 a completed cook keeps its photos (dish history reaches them via session_id). Honors If-None-Match against the photo's id (the ETag) -> 304 with no body when unchanged.",
   "file": "apps/api/api/cooking.py",
   "flines": 585,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 31,
   "returns": "Response",
   "sim": null,
   "usage": 1
  },
  "fn:cooking|patch_readiness": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C675",
     "corpus": "api",
     "name": "test_cooking_stage_readiness_routes_C675",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/cooking.py",
   "flines": 585,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 35,
   "returns": "CookingSessionResponse",
   "sim": null,
   "usage": 1
  },
  "fn:cooking|patch_session_timer": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C283",
     "corpus": "api",
     "name": "test_timer_patch_api_round_trip_C283",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C284",
     "corpus": "api",
     "name": "test_timer_patch_mixed_body_api_returns_422_C284",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C285",
     "corpus": "api",
     "name": "test_timer_patch_unknown_session_returns_404_C285",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "Start/replace or clear a session's per-step timer (H7). Ownership scoped exactly like step-progress (user_id + household_id + status active in one query) \u2014 a stranger's or inactive session 404s. A mixed body (one of step_id/duration_seconds null) 422s at the schema layer (SessionTimerRequest).",
   "file": "apps/api/api/cooking.py",
   "flines": 585,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 29,
   "returns": "CookingSessionResponse",
   "sim": null,
   "usage": 1
  },
  "fn:cooking|patch_stage": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C675",
     "corpus": "api",
     "name": "test_cooking_stage_readiness_routes_C675",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C677",
     "corpus": "api",
     "name": "test_stage_unknown_session_404_C677",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/cooking.py",
   "flines": 585,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 22,
   "returns": "CookingSessionResponse",
   "sim": null,
   "usage": 1
  },
  "fn:cooking|patch_step_progress": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/cooking.py",
   "flines": 585,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 25,
   "returns": "StepProgressResponse",
   "sim": null,
   "usage": 1
  },
  "fn:cooking|post_advance_stage": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C555",
     "corpus": "api",
     "name": "test_advance_and_due_routes_C555",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "Advance a long-prep session to the next stage (REQ-16). Optimistically concurrent on ``expected_stage`` so a retry/double-tap can't skip a stage.",
   "file": "apps/api/api/cooking.py",
   "flines": 585,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 25,
   "returns": "AdvanceStageResponse",
   "sim": null,
   "usage": 1
  },
  "fn:cooking|post_cancel": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C262",
     "corpus": "api",
     "name": "test_upload_rejected_on_non_active_session_C262",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C263",
     "corpus": "api",
     "name": "test_cancel_wipes_photos_C263",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "Abandon an active cook (status -> 'cancelled'); it drops out of GET /cooking/active. Ownership-scoped + idempotent. No dish history / no CookedMealCreated is produced. H8: cancel_session wipes the session's photos (delete_session_photos) in the same transaction, so the refs fetched below come back empty.",
   "file": "apps/api/api/cooking.py",
   "flines": 585,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 21,
   "returns": "CookingSessionResponse",
   "sim": null,
   "usage": 1
  },
  "fn:cooking|post_complete": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C251",
     "corpus": "api",
     "name": "test_complete_rejects_stored_over_total_C251",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C264",
     "corpus": "api",
     "name": "test_complete_keeps_photos_C264",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1087",
     "corpus": "api",
     "name": "test_cook_route_unlocks_surface_on_profile_C1087",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "",
     "corpus": "web",
     "name": "15 case(s)",
     "state": "file",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/cooking.py",
   "flines": 585,
   "god": 1,
   "internal": 0,
   "layer": "api",
   "lines": 50,
   "returns": "CompletionResponse",
   "sim": null,
   "usage": 1
  },
  "fn:cooking|post_start_session": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C237",
     "corpus": "api",
     "name": "test_session_requires_idempotency_key_C237",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C267",
     "corpus": "api",
     "name": "test_start_session_response_carries_recipe_title_C267",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C283",
     "corpus": "api",
     "name": "test_timer_patch_api_round_trip_C283",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C284",
     "corpus": "api",
     "name": "test_timer_patch_mixed_body_api_returns_422_C284",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C555",
     "corpus": "api",
     "name": "test_advance_and_due_routes_C555",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 3,
   "doc": "\u2014",
   "file": "apps/api/api/cooking.py",
   "flines": 585,
   "god": 1,
   "internal": 0,
   "layer": "api",
   "lines": 53,
   "returns": "CookingSessionResponse",
   "sim": null,
   "usage": 1
  },
  "fn:cooking|put_session_photo": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "Upload/replace one cook photo. RAW binary body (no multipart) \u2014 the Content-Type header IS the photo's mime type. A re-upload of the same slot REPLACES the row in place (never a second row) and never counts against the per-session cap. Response code: 201 on a NEW slot, 200 on a replace. Active, owned sessions only (404 otherwise \u2014 house style for \"not yours\" mirrors the sibling session routes).",
   "file": "apps/api/api/cooking.py",
   "flines": 585,
   "god": 1,
   "internal": 0,
   "layer": "api",
   "lines": 52,
   "returns": "CookingPhotoRef",
   "sim": null,
   "usage": 1
  },
  "fn:cooking|refresh_profile_projection": {
   "api": 0,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C631",
     "corpus": "api",
     "name": "test_profile_projection_empty_C631",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C632",
     "corpus": "api",
     "name": "test_profile_projection_idempotent_C632",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "doc": "Recompute profile projection from dish history + creation requests.",
   "file": "apps/api/services/notifications.py",
   "flines": 234,
   "god": 1,
   "internal": 0,
   "layer": "services",
   "lines": 62,
   "returns": "ProfileProjection",
   "sim": null,
   "usage": 0
  },
  "fn:cooking|seed_stage_schedule": {
   "api": 0,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "On session start for a staged recipe: set current_stage=0 + schedule stage 1's reminder. No-op (returns None) for a recipe with fewer than 2 stages (no between-stage interval).",
   "file": "apps/api/services/long_prep.py",
   "flines": 204,
   "god": 0,
   "internal": 2,
   "layer": "services",
   "lines": 13,
   "returns": "CookingStageReminder | None",
   "sim": null,
   "usage": 0
  },
  "fn:cooking|set_session_timer": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C269",
     "corpus": "api",
     "name": "test_start_timer_sets_fields_and_schedules_notification_C269",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C270",
     "corpus": "api",
     "name": "test_start_timer_falls_back_to_recipe_title_when_step_missing_C270",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C271",
     "corpus": "api",
     "name": "test_replace_deletes_old_pending_leaves_exactly_one_C271",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C272",
     "corpus": "api",
     "name": "test_clear_nulls_fields_and_deletes_pending_C272",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C273",
     "corpus": "api",
     "name": "test_delivered_past_notification_survives_clear_C273",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C274",
     "corpus": "api",
     "name": "test_set_timer_mixed_raises_value_error_C274",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 4,
   "doc": "Start/replace or clear a session's per-step timer (H7, founder-locked 2026-07-08).",
   "file": "apps/api/services/cooking.py",
   "flines": 707,
   "god": 1,
   "internal": 1,
   "layer": "services",
   "lines": 84,
   "returns": "CookingSession",
   "sim": null,
   "usage": 1
  },
  "fn:cooking|start_session": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C120",
     "corpus": "api",
     "name": "test_active_cooking_cache_payload_C120",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C121",
     "corpus": "api",
     "name": "test_completion_retry_safe_C121",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C219",
     "corpus": "api",
     "name": "test_start_session_C219",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C220",
     "corpus": "api",
     "name": "test_start_session_idempotent_C220",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C221",
     "corpus": "api",
     "name": "test_start_session_invalid_recipe_C221",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C222",
     "corpus": "api",
     "name": "test_get_active_sessions_C222",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 34,
   "doc": "\u2014",
   "file": "apps/api/services/cooking.py",
   "flines": 707,
   "god": 1,
   "internal": 0,
   "layer": "services",
   "lines": 67,
   "returns": "CookingSession",
   "sim": null,
   "usage": 1
  },
  "fn:legal-consent|_serialize": {
   "api": 0,
   "async": 0,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "Every mapped column of a row \u2192 a JSON-safe dict, keyed by its DB column name.",
   "file": "apps/api/services/account_export.py",
   "flines": 111,
   "god": 0,
   "internal": 1,
   "layer": "services",
   "lines": 20,
   "returns": "dict[str, Any]",
   "sim": null,
   "usage": 0
  },
  "fn:legal-consent|build_account_export": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "The user's complete data bundle (JSON-safe).",
   "file": "apps/api/services/account_export.py",
   "flines": 111,
   "god": 0,
   "internal": 0,
   "layer": "services",
   "lines": 37,
   "returns": "dict[str, Any]",
   "sim": null,
   "usage": 1
  },
  "fn:legal-consent|delete_account": {
   "api": 1,
   "async": 1,
   "base": 1,
   "cases": [],
   "cases_more": 0,
   "doc": "Wipe every DB row owned by ``user_id`` (+ its household, if this was the last member).",
   "file": "apps/api/services/account.py",
   "flines": 100,
   "god": 1,
   "internal": 0,
   "layer": "services",
   "lines": 54,
   "returns": "None",
   "sim": null,
   "usage": 1
  },
  "fn:legal-consent|get_account_export": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C18",
     "corpus": "api",
     "name": "test_account_export_returns_the_user_data_C18",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C8122",
     "corpus": "api",
     "name": "test_account_export_serializes_a_renamed_column_C8122",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C19",
     "corpus": "api",
     "name": "test_account_export_requires_setup_C19",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "The user's complete data as a downloadable JSON bundle (L6).",
   "file": "apps/api/api/account.py",
   "flines": 53,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 11,
   "returns": "JSONResponse",
   "sim": null,
   "usage": 1
  },
  "fn:legal-consent|get_consent": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C210",
     "corpus": "api",
     "name": "test_consent_required_then_accepted_C210",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/consent.py",
   "flines": 56,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 5,
   "returns": "ConsentStatusResponse",
   "sim": null,
   "usage": 1
  },
  "fn:legal-consent|post_consent": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C210",
     "corpus": "api",
     "name": "test_consent_required_then_accepted_C210",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C211",
     "corpus": "api",
     "name": "test_consent_stamps_server_version_not_client_claim_C211",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C212",
     "corpus": "api",
     "name": "test_consent_is_append_only_C212",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1056",
     "corpus": "api",
     "name": "test_setup_complete_with_consent_200_C1056",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1057",
     "corpus": "api",
     "name": "test_setup_complete_reject_then_accept_retry_same_key_200_C1057",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/consent.py",
   "flines": 56,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 11,
   "returns": "ConsentStatusResponse",
   "sim": null,
   "usage": 1
  },
  "fn:pantry|_planned_required_ingredients": {
   "api": 0,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "Required (non-optional) ingredients across the household's planned recipes.",
   "file": "apps/api/services/shopping.py",
   "flines": 477,
   "god": 0,
   "internal": 1,
   "layer": "services",
   "lines": 47,
   "returns": "list[RecipeIngredient]",
   "sim": null,
   "usage": 0
  },
  "fn:pantry|_resolve_item_meta": {
   "api": 0,
   "async": 1,
   "base": 1,
   "cases": [],
   "cases_more": 0,
   "doc": "Best display_name + unit_code for a bare ingredient_code (most-recent purchase, else a planned-recipe ingredient, else the code itself).",
   "file": "apps/api/services/shopping.py",
   "flines": 477,
   "god": 0,
   "internal": 1,
   "layer": "services",
   "lines": 37,
   "returns": "tuple[str, str]",
   "sim": null,
   "usage": 0
  },
  "fn:pantry|assign_location": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C682",
     "corpus": "api",
     "name": "test_assign_location_C682",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C683",
     "corpus": "api",
     "name": "test_assign_location_unknown_item_404_C683",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "Assign a pantry item to a location (removes it from the no-location projection).",
   "file": "apps/api/api/pantry.py",
   "flines": 562,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 36,
   "returns": "PantryItemResponse",
   "sim": null,
   "usage": 1
  },
  "fn:pantry|compute_cookability_summary": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C213",
     "corpus": "api",
     "name": "test_cookability_no_profile_parity_and_sparse_pantry_C213",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C214",
     "corpus": "api",
     "name": "test_cookability_allergen_delta_strictly_smaller_C214",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C215",
     "corpus": "api",
     "name": "test_cookability_archived_recipe_drops_from_both_counts_C215",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C216",
     "corpus": "api",
     "name": "test_cookability_empty_pantry_zero_cookable_C216",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C217",
     "corpus": "api",
     "name": "test_cookability_benchmark_baseline_C217",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "doc": "Return ``(cookable_count, catalog_total)`` for the pantry overview (F1.1).",
   "file": "apps/api/services/recipe_availability.py",
   "flines": 109,
   "god": 0,
   "internal": 1,
   "layer": "services",
   "lines": 34,
   "returns": "tuple[int, int]",
   "sim": null,
   "usage": 1
  },
  "fn:pantry|compute_recipe_availability": {
   "api": 2,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C782",
     "corpus": "api",
     "name": "test_availability_have_all_and_missing_C782",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C783",
     "corpus": "api",
     "name": "test_availability_empty_recipe_ids_C783",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "doc": "Return ``{recipe_id: (total_required, missing_count)}`` for the given recipes.",
   "file": "apps/api/services/recipe_availability.py",
   "flines": 109,
   "god": 0,
   "internal": 1,
   "layer": "services",
   "lines": 31,
   "returns": "dict[uuid.UUID, tuple[int, int]]",
   "sim": null,
   "usage": 2
  },
  "fn:pantry|create_location": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C682",
     "corpus": "api",
     "name": "test_assign_location_C682",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C683",
     "corpus": "api",
     "name": "test_assign_location_unknown_item_404_C683",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C692",
     "corpus": "api",
     "name": "test_location_create_with_color_icon_round_trips_C692",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C693",
     "corpus": "api",
     "name": "test_location_create_without_color_icon_is_null_C693",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C695",
     "corpus": "api",
     "name": "test_location_patch_changes_color_icon_C695",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C696",
     "corpus": "api",
     "name": "test_location_create_unknown_color_422_C696",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 2,
   "doc": "\u2014",
   "file": "apps/api/api/pantry.py",
   "flines": 562,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 9,
   "returns": "LocationResponse",
   "sim": null,
   "usage": 1
  },
  "fn:pantry|create_pantry_item": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C682",
     "corpus": "api",
     "name": "test_assign_location_C682",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C785",
     "corpus": "api",
     "name": "test_recipes_availability_end_to_end_C785",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C958",
     "corpus": "api",
     "name": "test_list_recipe_time_effort_and_ingredient_counts_C958",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "",
     "corpus": "web",
     "name": "15 case(s)",
     "state": "file",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/pantry.py",
   "flines": 562,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 9,
   "returns": "PantryItemResponse",
   "sim": "create_shopping_item",
   "usage": 1
  },
  "fn:pantry|create_pantry_items_batch": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C137",
     "corpus": "api",
     "name": "test_create_batch_requires_auth_C137",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C143",
     "corpus": "api",
     "name": "test_create_batch_creates_all_rows_C143",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C144",
     "corpus": "api",
     "name": "test_create_batch_rejects_foreign_location_per_row_C144",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C145",
     "corpus": "api",
     "name": "test_create_batch_empty_is_rejected_C145",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C146",
     "corpus": "api",
     "name": "test_create_batch_caps_item_count_C146",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C149",
     "corpus": "api",
     "name": "test_frequent_ingredients_orders_by_add_count_C149",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 2,
   "doc": "Create many confirmed pantry items in ONE transaction (Phase 58, D101).",
   "file": "apps/api/api/pantry.py",
   "flines": 562,
   "god": 1,
   "internal": 0,
   "layer": "api",
   "lines": 75,
   "returns": "CreateBatchResponse",
   "sim": null,
   "usage": 1
  },
  "fn:pantry|create_shopping_item": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C706",
     "corpus": "api",
     "name": "test_confirm_bought_route_creates_pantry_item_C706",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C707",
     "corpus": "api",
     "name": "test_confirm_bought_route_idempotent_replay_C707",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/shopping.py",
   "flines": 143,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 9,
   "returns": "ShoppingItemResponse",
   "sim": "create_pantry_item",
   "usage": 1
  },
  "fn:pantry|delete_pantry_item": {
   "api": 1,
   "async": 1,
   "base": 1,
   "cases": [],
   "cases_more": 0,
   "doc": "Soft-delete a pantry item with a reason. Returns (item, history_logged) or None if the item does not exist in this household.",
   "file": "apps/api/services/pantry.py",
   "flines": 231,
   "god": 1,
   "internal": 0,
   "layer": "services",
   "lines": 56,
   "returns": "tuple[PantryItem, bool] | None",
   "sim": null,
   "usage": 1
  },
  "fn:pantry|delete_pantry_item_route": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C699",
     "corpus": "api",
     "name": "test_delete_item_used_logs_consumo_event_C699",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C700",
     "corpus": "api",
     "name": "test_delete_item_removed_no_history_event_C700",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C701",
     "corpus": "api",
     "name": "test_delete_item_idempotent_replay_C701",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C702",
     "corpus": "api",
     "name": "test_delete_item_not_found_404_C702",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C703",
     "corpus": "api",
     "name": "test_delete_item_bad_reason_400_C703",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C704",
     "corpus": "api",
     "name": "test_delete_item_requires_auth_C704",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 1,
   "doc": "Soft-delete a single pantry item with a reason (Phase 53, D98).",
   "file": "apps/api/api/pantry.py",
   "flines": 562,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 37,
   "returns": "ItemDeleteResponse",
   "sim": null,
   "usage": 1
  },
  "fn:pantry|get_frequent_ingredients": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C147",
     "corpus": "api",
     "name": "test_frequent_ingredients_requires_auth_C147",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C148",
     "corpus": "api",
     "name": "test_frequent_ingredients_empty_when_no_history_C148",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C149",
     "corpus": "api",
     "name": "test_frequent_ingredients_orders_by_add_count_C149",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "The household's most-frequently-added canonical ingredients (batch-add quick-pick strip).",
   "file": "apps/api/api/pantry.py",
   "flines": 562,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 25,
   "returns": "FrequentIngredientsResponse",
   "sim": null,
   "usage": 1
  },
  "fn:pantry|get_ingredient_history": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/pantry.py",
   "flines": 562,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 16,
   "returns": "IngredientHistoryPage",
   "sim": null,
   "usage": 1
  },
  "fn:pantry|get_locations": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C8112",
     "corpus": "api",
     "name": "test_principal_location_cannot_be_deactivated_C8112",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C692",
     "corpus": "api",
     "name": "test_location_create_with_color_icon_round_trips_C692",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C694",
     "corpus": "api",
     "name": "test_principal_despensa_has_default_color_icon_C694",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C729",
     "corpus": "api",
     "name": "test_locations_requires_auth_C729",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/pantry.py",
   "flines": 562,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 10,
   "returns": "LocationListResponse",
   "sim": null,
   "usage": 1
  },
  "fn:pantry|get_pantry_ingredient_codes": {
   "api": 1,
   "async": 1,
   "base": 1,
   "cases": [
    {
     "cid": "C784",
     "corpus": "api",
     "name": "test_pantry_codes_exclude_zero_qty_and_inactive_C784",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "doc": "Household pantry ingredient codes available for recipe matching (Phase 13 T4).",
   "file": "apps/api/services/recipe_availability.py",
   "flines": 109,
   "god": 0,
   "internal": 4,
   "layer": "services",
   "lines": 19,
   "returns": "set[str]",
   "sim": null,
   "usage": 1
  },
  "fn:pantry|get_pantry_overview": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C218",
     "corpus": "api",
     "name": "test_overview_returns_cookability_fields_C218",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C541",
     "corpus": "api",
     "name": "test_pantry_overview_localizes_canonical_display_name_C541",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C699",
     "corpus": "api",
     "name": "test_delete_item_used_logs_consumo_event_C699",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C706",
     "corpus": "api",
     "name": "test_confirm_bought_route_creates_pantry_item_C706",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C707",
     "corpus": "api",
     "name": "test_confirm_bought_route_idempotent_replay_C707",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 4,
   "doc": "\u2014",
   "file": "apps/api/api/pantry.py",
   "flines": 562,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 33,
   "returns": "PantryOverviewResponse",
   "sim": null,
   "usage": 1
  },
  "fn:pantry|get_shopping_dashboard": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C674",
     "corpus": "api",
     "name": "test_from_planned_and_add_to_list_C674",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1077",
     "corpus": "api",
     "name": "test_shopping_requires_auth_C1077",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/shopping.py",
   "flines": 143,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 16,
   "returns": "ShoppingDashboardResponse",
   "sim": null,
   "usage": 1
  },
  "fn:pantry|list_frequent_ingredients": {
   "api": 1,
   "async": 1,
   "base": 1,
   "cases": [],
   "cases_more": 0,
   "doc": "The household's most-FREQUENTLY-added canonical ingredients (batch-add quick-pick strip).",
   "file": "apps/api/services/pantry.py",
   "flines": 231,
   "god": 0,
   "internal": 0,
   "layer": "services",
   "lines": 45,
   "returns": "list[tuple[str, str, str]]",
   "sim": null,
   "usage": 1
  },
  "fn:pantry|post_add_to_list": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C674",
     "corpus": "api",
     "name": "test_from_planned_and_add_to_list_C674",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/shopping.py",
   "flines": 143,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 13,
   "returns": "ShoppingItemResponse",
   "sim": null,
   "usage": 1
  },
  "fn:pantry|post_confirm_bought": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C706",
     "corpus": "api",
     "name": "test_confirm_bought_route_creates_pantry_item_C706",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C707",
     "corpus": "api",
     "name": "test_confirm_bought_route_idempotent_replay_C707",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C708",
     "corpus": "api",
     "name": "test_confirm_bought_route_unknown_404_C708",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "",
     "corpus": "web",
     "name": "15 case(s)",
     "state": "file",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/shopping.py",
   "flines": 143,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 30,
   "returns": "BoughtConfirmationResponse",
   "sim": null,
   "usage": 1
  },
  "fn:pantry|post_from_planned_recipes": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C674",
     "corpus": "api",
     "name": "test_from_planned_and_add_to_list_C674",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C676",
     "corpus": "api",
     "name": "test_p14_routes_require_auth_C676",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/shopping.py",
   "flines": 143,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 11,
   "returns": "FromPlannedRecipesResponse",
   "sim": null,
   "usage": 1
  },
  "fn:pantry|post_reset_apply": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C709",
     "corpus": "api",
     "name": "test_reset_apply_route_keep_discard_C709",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C710",
     "corpus": "api",
     "name": "test_reset_apply_route_requires_idempotency_key_C710",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C711",
     "corpus": "api",
     "name": "test_reset_apply_route_idempotent_replay_C711",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C730",
     "corpus": "api",
     "name": "test_reset_requires_idempotency_key_C730",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "",
     "corpus": "web",
     "name": "15 case(s)",
     "state": "file",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/pantry.py",
   "flines": 562,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 25,
   "returns": "ResetApplyResponse",
   "sim": null,
   "usage": 1
  },
  "fn:pantry|post_reset_preview": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/pantry.py",
   "flines": 562,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 14,
   "returns": "ResetPreviewResponse",
   "sim": null,
   "usage": 1
  },
  "fn:pantry|remove_location": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/pantry.py",
   "flines": 562,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 21,
   "returns": "None",
   "sim": null,
   "usage": 1
  },
  "fn:pantry|resolve_batch": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C136",
     "corpus": "api",
     "name": "test_resolve_batch_requires_auth_C136",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C138",
     "corpus": "api",
     "name": "test_resolve_batch_matches_seeded_ingredients_C138",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C139",
     "corpus": "api",
     "name": "test_resolve_batch_rejects_empty_lines_C139",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C140",
     "corpus": "api",
     "name": "test_resolve_batch_caps_line_count_C140",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C141",
     "corpus": "api",
     "name": "test_resolve_batch_rejects_oversized_line_C141",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C142",
     "corpus": "api",
     "name": "test_resolve_batch_accepts_at_cap_line_C142",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "Resolve raw typed lines to ranked canonical candidates + confidence (deterministic matcher).",
   "file": "apps/api/api/pantry.py",
   "flines": 562,
   "god": 1,
   "internal": 0,
   "layer": "api",
   "lines": 59,
   "returns": "ResolveBatchResponse",
   "sim": null,
   "usage": 1
  },
  "fn:pantry|update_location": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C8110",
     "corpus": "api",
     "name": "test_location_patch_persists_order_C8110",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C8111",
     "corpus": "api",
     "name": "test_location_patch_persists_active_C8111",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C8112",
     "corpus": "api",
     "name": "test_principal_location_cannot_be_deactivated_C8112",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C695",
     "corpus": "api",
     "name": "test_location_patch_changes_color_icon_C695",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C698",
     "corpus": "api",
     "name": "test_location_patch_unknown_color_422_C698",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/pantry.py",
   "flines": 562,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 25,
   "returns": "LocationResponse",
   "sim": null,
   "usage": 1
  },
  "fn:pantry|update_pantry_item": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "",
     "corpus": "web",
     "name": "4 case(s)",
     "state": "file",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/pantry.py",
   "flines": 562,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 16,
   "returns": "PantryItemResponse",
   "sim": null,
   "usage": 1
  },
  "fn:progression|_category_map": {
   "api": 0,
   "async": 1,
   "base": 1,
   "cases": [],
   "cases_more": 0,
   "doc": "``ingredient_code \u2192 category_code`` (D4-B rollup) for the given codes \u2014 unknown codes are silently absent (pre-reconciliation ingredients, D72).",
   "file": "apps/api/services/progression.py",
   "flines": 495,
   "god": 0,
   "internal": 1,
   "layer": "services",
   "lines": 13,
   "returns": "dict[str, str]",
   "sim": null,
   "usage": 0
  },
  "fn:progression|_compute_kind_stats": {
   "api": 0,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "One ledger scan \u2192 ``{kind: {code: (distinct cooked-session count, latest occurred_at)}}`` across all five trees. Facts merge snapshot-over-live PER FIELD (roast M4 / #35; the fallback also covers diet for snapshots written before diet_codes existed, and ingredients for pre-0037). ``restrict`` (per-cook) limits each kind to the cook's codes; ``None`` (backfill) keeps all.",
   "file": "apps/api/services/progression.py",
   "flines": 495,
   "god": 1,
   "internal": 2,
   "layer": "services",
   "lines": 94,
   "returns": "dict[str, dict[str, tuple[int, datetime | None]]]",
   "sim": null,
   "usage": 0
  },
  "fn:progression|_cooked_recipe_facts": {
   "api": 0,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "The live facts of the cooked recipe \u2014 the nodes THIS cook touches across trees (roast M3).",
   "file": "apps/api/services/progression.py",
   "flines": 495,
   "god": 0,
   "internal": 1,
   "layer": "services",
   "lines": 25,
   "returns": "_RecipeFacts",
   "sim": null,
   "usage": 0
  },
  "fn:progression|_cooked_recipe_skills": {
   "api": 0,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "The (kind, code) skills the cooked recipe exercises \u2014 its techniques + ingredients.",
   "file": "apps/api/services/skills.py",
   "flines": 217,
   "god": 0,
   "internal": 1,
   "layer": "services",
   "lines": 19,
   "returns": "set[Skill]",
   "sim": null,
   "usage": 0
  },
  "fn:progression|_distinct_session_counts": {
   "api": 0,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C1083",
     "corpus": "api",
     "name": "test_distinct_session_counts_uses_snapshot_immune_to_edit_C1083",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "doc": "Count DISTINCT cooked sessions in the user's dish-history involving each skill.",
   "file": "apps/api/services/skills.py",
   "flines": 217,
   "god": 1,
   "internal": 1,
   "layer": "services",
   "lines": 81,
   "returns": "dict[Skill, int]",
   "sim": null,
   "usage": 0
  },
  "fn:progression|backfill_node_progress_on_startup": {
   "api": 0,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "Read-cutover + Phase-5 precondition: recompute ``node_progress`` for every user with cook history so the profile tier (derived from node_progress) doesn't floor for pre-EXPAND users, and so the new region/diet/ingredient trees populate for existing users. DEPLOY-ONLY (skipped on LOCAL + SQLite; tests call the per-user recompute directly), advisory-locked so replica boots serialize, NON-FATAL, idem",
   "file": "apps/api/services/progression.py",
   "flines": 495,
   "god": 0,
   "internal": 0,
   "layer": "services",
   "lines": 31,
   "returns": "None",
   "sim": null,
   "usage": 0
  },
  "fn:progression|build_profile_summary": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C747",
     "corpus": "api",
     "name": "test_profile_summary_aggregate_C747",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C748",
     "corpus": "api",
     "name": "test_profile_summary_empty_state_C748",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C749",
     "corpus": "api",
     "name": "test_profile_summary_chef_credits_surface_C749",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C763",
     "corpus": "api",
     "name": "test_profile_tier_floors_when_node_progress_decayed_C763",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C768",
     "corpus": "api",
     "name": "test_headline_tier_stays_technique_only_C768",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "doc": "Compute the Perfil landing aggregate for a setup-complete user.",
   "file": "apps/api/services/profile.py",
   "flines": 338,
   "god": 1,
   "internal": 1,
   "layer": "services",
   "lines": 182,
   "returns": "ProfileSummaryResponse",
   "sim": null,
   "usage": 1
  },
  "fn:progression|build_score_input": {
   "api": 1,
   "async": 0,
   "base": 0,
   "cases": [
    {
     "cid": "C575",
     "corpus": "api",
     "name": "test_build_score_input_coverage_and_axes_C575",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "doc": "Project one already-loaded ``Recipe`` row + its ``(total_required, missing)`` availability tuple into the pure scorer's ``ScoreInput``. No query \u2014 reuses the row + the route's tuple.",
   "file": "apps/api/services/match_context.py",
   "flines": 110,
   "god": 0,
   "internal": 1,
   "layer": "services",
   "lines": 31,
   "returns": "ScoreInput",
   "sim": null,
   "usage": 1
  },
  "fn:progression|get_profile_summary": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C744",
     "corpus": "api",
     "name": "test_profile_summary_requires_household_409_C744",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C745",
     "corpus": "api",
     "name": "test_profile_summary_mvp_empty_shape_C745",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C746",
     "corpus": "api",
     "name": "test_profile_summary_landing_aggregate_fields_C746",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1087",
     "corpus": "api",
     "name": "test_cook_route_unlocks_surface_on_profile_C1087",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/profile.py",
   "flines": 31,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 7,
   "returns": "ProfileSummaryResponse",
   "sim": "get_settings_route",
   "usage": 1
  },
  "fn:progression|post_account_export": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C684",
     "corpus": "api",
     "name": "test_account_export_stub_C684",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C685",
     "corpus": "api",
     "name": "test_account_export_requires_household_409_C685",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/account.py",
   "flines": 53,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 10,
   "returns": "AccountExportResponse",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|_query_domain": {
   "api": 0,
   "async": 1,
   "base": 1,
   "cases": [],
   "cases_more": 0,
   "doc": "Query a specific catalog domain and return typed items.",
   "file": "apps/api/api/catalog.py",
   "flines": 174,
   "god": 1,
   "internal": 1,
   "layer": "api",
   "lines": 77,
   "returns": "CatalogDomainResponse",
   "sim": null,
   "usage": 0
  },
  "fn:recipe|apply_recipe_filters": {
   "api": 0,
   "async": 0,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "Apply the shared WHERE/JOIN clauses for a recipe listing onto ``query``.",
   "file": "apps/api/services/recipe_filters.py",
   "flines": 635,
   "god": 1,
   "internal": 3,
   "layer": "services",
   "lines": 300,
   "returns": "Select[Any]",
   "sim": null,
   "usage": 0
  },
  "fn:recipe|attach_cupo": {
   "api": 1,
   "async": 1,
   "base": 1,
   "cases": [
    {
     "cid": "C8134",
     "corpus": "api",
     "name": "test_cupo_capacity_is_the_members_own_pool_C8134",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C8135",
     "corpus": "api",
     "name": "test_cupo_journey_stamps_and_derived_counters_C8135",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C8136",
     "corpus": "api",
     "name": "test_downgrade_forces_keep_one_and_history_survives_C8136",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "doc": "Attach a dish type to the user's own saved-mode row, making that slot a cupo.",
   "file": "apps/api/services/repertorio.py",
   "flines": 232,
   "god": 0,
   "internal": 0,
   "layer": "services",
   "lines": 13,
   "returns": "CupoAttachment",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|build_cooked_ledger": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C660",
     "corpus": "api",
     "name": "test_build_cooked_ledger_C660",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C661",
     "corpus": "api",
     "name": "test_cooked_ledger_uses_snapshot_immune_to_recipe_edit_C661",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C662",
     "corpus": "api",
     "name": "test_cooked_ledger_mixes_snapshot_and_live_fallback_C662",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C663",
     "corpus": "api",
     "name": "test_explore_never_returns_allergen_recipe_C663",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "doc": "Build the familiarity baseline from the user's cooked-dish history.",
   "file": "apps/api/guardrails/novelty.py",
   "flines": 429,
   "god": 1,
   "internal": 3,
   "layer": "services",
   "lines": 68,
   "returns": "CookedLedger",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|cocinadas_for_cupo": {
   "api": 0,
   "async": 1,
   "base": 1,
   "cases": [
    {
     "cid": "C8135",
     "corpus": "api",
     "name": "test_cupo_journey_stamps_and_derived_counters_C8135",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C8136",
     "corpus": "api",
     "name": "test_downgrade_forces_keep_one_and_history_survives_C8136",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "doc": "DERIVED: COUNT of THIS user's cooks of the dish type over the cooking log (D187 R3).",
   "file": "apps/api/services/repertorio.py",
   "flines": 232,
   "god": 0,
   "internal": 1,
   "layer": "services",
   "lines": 20,
   "returns": "int",
   "sim": null,
   "usage": 0
  },
  "fn:recipe|create_recipe_filter_mode": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/recipe_filter_modes.py",
   "flines": 115,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 20,
   "returns": "RecipeFilterModeResponse",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|delete_cupo": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C8139",
     "corpus": "api",
     "name": "test_cupo_attach_list_release_roundtrip_C8139",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "Release the CUPO, keep the slot (D183: nothing earned is lost \u2014 counters derive).",
   "file": "apps/api/api/repertorio.py",
   "flines": 112,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 12,
   "returns": "None",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|delete_plan_recipe": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "Remove a recipe from the household's Planeadas \u2014 the recipe-scoped inverse of ``POST /recipes/{id}/plan`` (the \"Quitar del plan\" popup action, U4). Deletes every manual PlannedRecipe row for this recipe in the household. IDEMPOTENT: an already-unplanned recipe returns 204 too (0 rows removed) \u2014 no 404 \u2014 so a double-tap or a stale UI never errors.",
   "file": "apps/api/api/recipe_plan.py",
   "flines": 132,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 18,
   "returns": "None",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|delete_planned_recipe": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/recipe_plan.py",
   "flines": 132,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 18,
   "returns": "None",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|delete_recipe_filter_mode": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/recipe_filter_modes.py",
   "flines": 115,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 14,
   "returns": "None",
   "sim": "update_recipe_filter_mode",
   "usage": 1
  },
  "fn:recipe|explore_recipes": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "Novelty post-filter (REQ-09/D-GU2): recipes that introduce exactly one novel element for ``mode``, over the user's cooked-meal ledger. Composes the D-GU3 order \u2014 allergen hard-filter FIRST, then novelty. NOTE: this route MUST be declared before ``/recipes/{recipe_id}`` so 'explore' is not parsed as an id.",
   "file": "apps/api/api/recipe_explore.py",
   "flines": 178,
   "god": 1,
   "internal": 0,
   "layer": "api",
   "lines": 123,
   "returns": "ExploreResponse",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|generate_gustify_recipe": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "Run the D-GU3 pipeline for a Gustify AI suggestion. Idempotent on the key. ``model_tier`` (D95) picks the Gemini tier: lite (default, 1 credit) | full (3).",
   "file": "apps/api/services/ai_recipes.py",
   "flines": 579,
   "god": 1,
   "internal": 1,
   "layer": "services",
   "lines": 131,
   "returns": "GustifyOutcome",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|get_catalog": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C169",
     "corpus": "api",
     "name": "test_get_catalog_units_C169",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C170",
     "corpus": "api",
     "name": "test_get_catalog_restrictions_C170",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C171",
     "corpus": "api",
     "name": "test_get_catalog_ingredients_C171",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C172",
     "corpus": "api",
     "name": "test_get_catalog_invalid_domain_C172",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C678",
     "corpus": "api",
     "name": "test_catalog_prepared_foods_C678",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C679",
     "corpus": "api",
     "name": "test_catalog_recipe_taxonomy_and_icons_registered_C679",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 2,
   "doc": "Return all items for a catalog domain.",
   "file": "apps/api/api/catalog.py",
   "flines": 174,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 7,
   "returns": "CatalogDomainResponse",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|get_creation_result": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "",
     "corpus": "web",
     "name": "15 case(s)",
     "state": "file",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/recipe_creation.py",
   "flines": 302,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 17,
   "returns": "CreationRequestResponse",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|get_cupos": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C8139",
     "corpus": "api",
     "name": "test_cupo_attach_list_release_roundtrip_C8139",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C8142",
     "corpus": "api",
     "name": "test_plan_with_cupo_stamps_the_link_C8142",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "",
     "corpus": "e2e",
     "name": "4 case(s)",
     "state": "file",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "The user's cupos with derived planeadas/cocinadas, plus the shared slot cap.",
   "file": "apps/api/api/repertorio.py",
   "flines": 112,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 21,
   "returns": "CuposResponse",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|get_recipe": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C434",
     "corpus": "api",
     "name": "test_cold_start_with_region_pref_floats_match_and_keeps_rest_C434",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C435",
     "corpus": "api",
     "name": "test_cold_start_no_prefs_is_newest_first_C435",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C436",
     "corpus": "api",
     "name": "test_warm_nueva_cocina_region_pref_floats_member_match_C436",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C437",
     "corpus": "api",
     "name": "test_cold_start_comfort_time_floats_duration_match_C437",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C438",
     "corpus": "api",
     "name": "test_cold_start_skill_cap_sinks_over_cap_recipe_C438",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C439",
     "corpus": "api",
     "name": "test_cold_start_taste_pref_floats_matching_recipe_C439",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 22,
   "doc": "\u2014",
   "file": "apps/api/api/recipe_detail.py",
   "flines": 210,
   "god": 1,
   "internal": 0,
   "layer": "api",
   "lines": 121,
   "returns": "RecipeDetailResponse",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|get_recipe_filter_modes": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/recipe_filter_modes.py",
   "flines": 115,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 10,
   "returns": "RecipeFilterModesResponse",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|get_taxonomy": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C167",
     "corpus": "api",
     "name": "test_get_taxonomy_empty_C167",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C168",
     "corpus": "api",
     "name": "test_get_taxonomy_seeded_C168",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C173",
     "corpus": "api",
     "name": "test_get_catalog_requires_auth_C173",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "Return the full taxonomy tree (dimensions + values).",
   "file": "apps/api/api/catalog.py",
   "flines": 174,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 30,
   "returns": "TaxonomyTreeResponse",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|get_user_cooked_recipe_ids": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C832",
     "corpus": "api",
     "name": "test_cooked_field_set_map_and_cross_user_C832",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "doc": "Return the subset of ``recipe_ids`` the user has cooked (F2 per-recipe ``cooked`` field).",
   "file": "apps/api/services/recipe_detail.py",
   "flines": 217,
   "god": 0,
   "internal": 1,
   "layer": "services",
   "lines": 24,
   "returns": "set[uuid.UUID]",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|ingredient_allergen_exclusions": {
   "api": 0,
   "async": 0,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "Build INGREDIENT-DERIVED allergen exclusions for stored recipes (#38 / R8).",
   "file": "apps/api/services/recipe_filters.py",
   "flines": 635,
   "god": 0,
   "internal": 2,
   "layer": "services",
   "lines": 28,
   "returns": "list[Any]",
   "sim": null,
   "usage": 0
  },
  "fn:recipe|ingredient_inclusion_conditions": {
   "api": 0,
   "async": 0,
   "base": 1,
   "cases": [],
   "cases_more": 0,
   "doc": "Build INGREDIENT-INCLUSION conditions (D108 / Workstream B): keep only recipes that CONTAIN each requested ingredient.",
   "file": "apps/api/services/recipe_filters.py",
   "flines": 635,
   "god": 0,
   "internal": 1,
   "layer": "services",
   "lines": 22,
   "returns": "list[Any]",
   "sim": null,
   "usage": 0
  },
  "fn:recipe|list_recipes": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C306",
     "corpus": "api",
     "name": "test_no_equipment_recipe_always_passes_fail_open_C306",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C307",
     "corpus": "api",
     "name": "test_recipe_needing_owned_equipment_passes_C307",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C308",
     "corpus": "api",
     "name": "test_recipe_needing_unowned_equipment_is_dropped_C308",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C309",
     "corpus": "api",
     "name": "test_partial_ownership_is_a_subset_check_C309",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C310",
     "corpus": "api",
     "name": "test_owning_a_superset_passes_C310",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C311",
     "corpus": "api",
     "name": "test_filter_off_is_a_noop_C311",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 76,
   "doc": "List recipes (one page) with taxonomy filters, D17 allergen exclusion, and per-user archived/favorite filtering (D93/D84). Returns ``(page, total)`` where ``total`` is the count of ALL matching recipes ignoring ``limit``/``offset``.",
   "file": "apps/api/services/recipes.py",
   "flines": 409,
   "god": 1,
   "internal": 1,
   "layer": "services",
   "lines": 111,
   "returns": "tuple[list[Recipe], int]",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|load_user_allergens": {
   "api": 4,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "Load a user's allergen codes from their dietary profile (D17 R8).",
   "file": "apps/api/services/recipes.py",
   "flines": 409,
   "god": 0,
   "internal": 6,
   "layer": "services",
   "lines": 20,
   "returns": "list[str] | None",
   "sim": null,
   "usage": 4
  },
  "fn:recipe|patch_recipe_flags": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C859",
     "corpus": "api",
     "name": "test_patch_flags_and_list_detail_end_to_end_C859",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C860",
     "corpus": "api",
     "name": "test_patch_flags_missing_recipe_404_C860",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C861",
     "corpus": "api",
     "name": "test_flags_do_not_leak_across_users_via_api_C861",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C867",
     "corpus": "api",
     "name": "test_list_route_carries_total_and_favorite_filter_C867",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "UPSERT the caller's per-user favorite/archived flags for a recipe (D93).",
   "file": "apps/api/api/recipe_detail.py",
   "flines": 210,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 31,
   "returns": "RecipeFlagsResponse",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|post_create_gustify": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C72",
     "corpus": "api",
     "name": "test_gustify_requires_auth_C72",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C73",
     "corpus": "api",
     "name": "test_gustify_requires_idempotency_key_C73",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C74",
     "corpus": "api",
     "name": "test_gustify_invalid_mode_400_C74",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C75",
     "corpus": "api",
     "name": "test_gustify_cold_start_surfaces_candidates_with_grace_C75",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C76",
     "corpus": "api",
     "name": "test_gustify_completed_with_seeded_ledger_C76",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C77",
     "corpus": "api",
     "name": "test_gustify_idempotent_replay_C77",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 14,
   "doc": "Generate AI recipe suggestions via the D-GU3 pipeline (REQ-08 structure).",
   "file": "apps/api/api/recipe_creation.py",
   "flines": 302,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 45,
   "returns": "GustifyCreationResponse",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|post_create_manual": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C250",
     "corpus": "api",
     "name": "test_cook_complete_history_pantry_loop_C250",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C556",
     "corpus": "api",
     "name": "test_manual_create_with_stages_roundtrip_C556",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C557",
     "corpus": "api",
     "name": "test_manual_create_stage_validation_C557",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C785",
     "corpus": "api",
     "name": "test_recipes_availability_end_to_end_C785",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C958",
     "corpus": "api",
     "name": "test_list_recipe_time_effort_and_ingredient_counts_C958",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C959",
     "corpus": "api",
     "name": "test_list_recipe_exposes_predominant_techniques_C959",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 8,
   "doc": "\u2014",
   "file": "apps/api/api/recipe_creation.py",
   "flines": 302,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 27,
   "returns": "CreationRequestResponse",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|post_plan_recipe": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C674",
     "corpus": "api",
     "name": "test_from_planned_and_add_to_list_C674",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C8142",
     "corpus": "api",
     "name": "test_plan_with_cupo_stamps_the_link_C8142",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/recipe_plan.py",
   "flines": 132,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 45,
   "returns": "PlannedRecipeResponse",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|post_recipe_demand": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C969",
     "corpus": "api",
     "name": "test_recipe_manual_create_disabled_returns_403_C969",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C971",
     "corpus": "api",
     "name": "test_recipe_gustify_create_disabled_returns_403_C971",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C972",
     "corpus": "api",
     "name": "test_post_recipe_demand_captures_search_C972",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C973",
     "corpus": "api",
     "name": "test_post_recipe_demand_allows_empty_note_C973",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C974",
     "corpus": "api",
     "name": "test_post_recipe_demand_rejects_long_note_C974",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C975",
     "corpus": "api",
     "name": "test_post_recipe_demand_rate_limited_one_per_hour_C975",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "Capture a 0-result recipe search as DEMAND (\"Pedir recetas\", founder 2026-06-22). Records the unmet search criteria + the optional \u2264140-char note for later on-demand authoring \u2014 NO recipe is generated here. Household is context-only (None when the user has no household yet).",
   "file": "apps/api/api/recipe_demand.py",
   "flines": 67,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 35,
   "returns": "RecipeDemandResponse",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|post_relief_accept": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C89",
     "corpus": "api",
     "name": "test_relief_accept_never_charges_credits_C89",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C90",
     "corpus": "api",
     "name": "test_relief_accept_relaxes_novelty_keeps_allergen_safety_C90",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C91",
     "corpus": "api",
     "name": "test_relief_accept_unknown_request_404_C91",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "Filter-relief continue: re-run relaxing the novelty rule (allergen safety stays). Real generation still returns the deferred shape (PENDING #22).",
   "file": "apps/api/api/recipe_creation.py",
   "flines": 302,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 34,
   "returns": "GustifyCreationResponse",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|put_cupo": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C8139",
     "corpus": "api",
     "name": "test_cupo_attach_list_release_roundtrip_C8139",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C8140",
     "corpus": "api",
     "name": "test_cupo_attach_rejects_non_taxonomy_type_C8140",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C8141",
     "corpus": "api",
     "name": "test_cupo_attach_is_user_scoped_C8141",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C8142",
     "corpus": "api",
     "name": "test_plan_with_cupo_stamps_the_link_C8142",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 0,
   "doc": "Attach (or overwrite) the dish type on an owned slot, making it a cupo.",
   "file": "apps/api/api/repertorio.py",
   "flines": 112,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 28,
   "returns": "CupoResponse",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|recipe_cooked_by_user": {
   "api": 1,
   "async": 1,
   "base": 1,
   "cases": [
    {
     "cid": "C833",
     "corpus": "api",
     "name": "test_recipe_cooked_by_user_exists_C833",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "doc": "Per-recipe cooked-state for the DETAIL response (F2 ``cooked`` field).",
   "file": "apps/api/services/recipe_detail.py",
   "flines": 217,
   "god": 0,
   "internal": 1,
   "layer": "services",
   "lines": 22,
   "returns": "bool",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|relief_accept": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "Filter-relief continue: re-run the pipeline relaxing novelty (NOT allergen safety).",
   "file": "apps/api/services/ai_recipes.py",
   "flines": 579,
   "god": 1,
   "internal": 0,
   "layer": "services",
   "lines": 107,
   "returns": "GustifyOutcome",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|search_recipes": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C316",
     "corpus": "api",
     "name": "test_exclude_equipment_unknown_code_is_400_C316",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C569",
     "corpus": "api",
     "name": "test_no_mode_leaves_match_score_null_C569",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C785",
     "corpus": "api",
     "name": "test_recipes_availability_end_to_end_C785",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C834",
     "corpus": "api",
     "name": "test_cooked_field_on_list_and_detail_route_C834",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C859",
     "corpus": "api",
     "name": "test_patch_flags_and_list_detail_end_to_end_C859",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C861",
     "corpus": "api",
     "name": "test_flags_do_not_leak_across_users_via_api_C861",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 3,
   "doc": "Search recipes with D17 allergen exclusion + taxonomy filters + per-user flags.",
   "file": "apps/api/api/recipes.py",
   "flines": 671,
   "god": 1,
   "internal": 0,
   "layer": "api",
   "lines": 628,
   "returns": "RecipeListResponse",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|seed_diet_preferences": {
   "api": 0,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C161",
     "corpus": "api",
     "name": "test_seed_diet_preferences_d17_soft_C161",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/services/catalog_seed.py",
   "flines": 381,
   "god": 0,
   "internal": 1,
   "layer": "services",
   "lines": 16,
   "returns": "int",
   "sim": "seed_restrictions",
   "usage": 0
  },
  "fn:recipe|seed_ingredient_restrictions": {
   "api": 0,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C529",
     "corpus": "api",
     "name": "test_load_snapshot_from_db_C529",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C601",
     "corpus": "api",
     "name": "test_get_current_drops_ingredient_derived_recipe_C601",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C602",
     "corpus": "api",
     "name": "test_get_current_drops_via_reconciled_alias_C602",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C981",
     "corpus": "api",
     "name": "test_apply_create_new_ingredient_C981",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C1096",
     "corpus": "api",
     "name": "test_list_recipes_excludes_ingredient_derived_g18_C1096",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C1097",
     "corpus": "api",
     "name": "test_list_recipes_still_honors_self_report_C1097",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 8,
   "doc": "Seed the ingredient\u2192allergen-restriction join table from ``starter_ingredients[].violates`` (#38 / R8). Idempotent \u2014 an existing (ingredient, restriction) pair is skipped. Returns the number of pairs in the taxonomy.",
   "file": "apps/api/services/catalog_seed.py",
   "flines": 381,
   "god": 0,
   "internal": 2,
   "layer": "services",
   "lines": 30,
   "returns": "int",
   "sim": null,
   "usage": 0
  },
  "fn:recipe|seed_restrictions": {
   "api": 0,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C160",
     "corpus": "api",
     "name": "test_seed_restrictions_d17_allergens_C160",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/services/catalog_seed.py",
   "flines": 381,
   "god": 0,
   "internal": 1,
   "layer": "services",
   "lines": 16,
   "returns": "int",
   "sim": "seed_diet_preferences",
   "usage": 0
  },
  "fn:recipe|seed_safety_warnings": {
   "api": 0,
   "async": 1,
   "base": 1,
   "cases": [
    {
     "cid": "C163",
     "corpus": "api",
     "name": "test_seed_safety_warnings_idempotent_and_provenance_C163",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C964",
     "corpus": "api",
     "name": "test_recipe_detail_http_surfaces_avisos_with_provenance_C964",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C990",
     "corpus": "api",
     "name": "test_avisos_for_ingredient_codes_intrinsic_contextual_deduped_C990",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C991",
     "corpus": "api",
     "name": "test_avisos_empty_for_a_safe_recipe_C991",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C993",
     "corpus": "api",
     "name": "test_avisos_cover_duck_and_mussels_C993",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C994",
     "corpus": "api",
     "name": "test_avisos_cover_undercooked_ground_beef_C994",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 2,
   "doc": "Seed the curated food-safety warnings (Future-Features SAFE) into ``ingredient_warnings`` + ``contextual_warning_rules`` from ``reference/safety_warnings.py``. UPSERT (not skip-only): an existing (code, aviso_code[, state_tag]) row is UPDATED to match the source so founder edits to the content propagate on deploy; a missing row is inserted. Returns the total row count.",
   "file": "apps/api/services/catalog_seed.py",
   "flines": 381,
   "god": 0,
   "internal": 1,
   "layer": "services",
   "lines": 46,
   "returns": "int",
   "sim": null,
   "usage": 0
  },
  "fn:recipe|stream_gustify": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C1106",
     "corpus": "api",
     "name": "test_sse_completed_streams_full_sequence_C1106",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1107",
     "corpus": "api",
     "name": "test_sse_cold_start_streams_completed_with_grace_C1107",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1108",
     "corpus": "api",
     "name": "test_sse_real_mode_streams_deferred_not_error_C1108",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1109",
     "corpus": "api",
     "name": "test_sse_invalid_mode_is_error_event_not_400_C1109",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1110",
     "corpus": "api",
     "name": "test_sse_invalid_model_tier_is_error_event_C1110",
     "state": "pass",
     "tier": "via route"
    },
    {
     "cid": "C1111",
     "corpus": "api",
     "name": "test_sse_insufficient_credits_is_error_event_C1111",
     "state": "pass",
     "tier": "via route"
    }
   ],
   "cases_more": 5,
   "doc": "SSE stream of the D-GU3 pipeline (REQ-10 web transport). Auth + idempotency key arrive as query params (EventSource has no header API). Pipeline failures arrive as ``error`` events in the stream, not HTTP statuses \u2014 the 200 status line is committed the moment streaming starts. Setup/auth pre-conditions still gate before the stream opens (401 invalid token via the dependency; 409 if setup incomplet",
   "file": "apps/api/api/recipe_stream.py",
   "flines": 251,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 44,
   "returns": "StreamingResponse",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|update_recipe_filter_mode": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "\u2014",
   "file": "apps/api/api/recipe_filter_modes.py",
   "flines": 115,
   "god": 0,
   "internal": 0,
   "layer": "api",
   "lines": 23,
   "returns": "RecipeFilterModeResponse",
   "sim": "delete_recipe_filter_mode",
   "usage": 1
  },
  "fn:recipe|upsert_exploration_preferences": {
   "api": 1,
   "async": 1,
   "base": 0,
   "cases": [
    {
     "cid": "C365",
     "corpus": "api",
     "name": "test_upsert_creates_then_reads_back_C365",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C366",
     "corpus": "api",
     "name": "test_upsert_roundtrips_path_a_plus_fields_C366",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C367",
     "corpus": "api",
     "name": "test_upsert_roundtrips_sensory_fields_C367",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C368",
     "corpus": "api",
     "name": "test_upsert_wholesale_replace_clears_sensory_C368",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C369",
     "corpus": "api",
     "name": "test_upsert_wholesale_replace_clears_path_a_plus_C369",
     "state": "pass",
     "tier": "direct"
    },
    {
     "cid": "C370",
     "corpus": "api",
     "name": "test_upsert_is_idempotent_no_duplicate_row_C370",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 1,
   "doc": "Get-or-create the user's exploration row and set every bias field (flush, no commit).",
   "file": "apps/api/services/exploration.py",
   "flines": 76,
   "god": 0,
   "internal": 2,
   "layer": "services",
   "lines": 32,
   "returns": "UserExplorationPreferences",
   "sim": null,
   "usage": 1
  },
  "fn:recipe|upsert_ingredient_deltas": {
   "api": 0,
   "async": 1,
   "base": 1,
   "cases": [
    {
     "cid": "C989",
     "corpus": "api",
     "name": "test_boot_seeds_ai_path_delta_restriction_pairs_C989",
     "state": "pass",
     "tier": "direct"
    }
   ],
   "cases_more": 0,
   "doc": "INSERT-ONLY canonical-ingredient + restriction-pair deltas (the D75 contract).",
   "file": "apps/api/services/recipe_seed.py",
   "flines": 375,
   "god": 0,
   "internal": 2,
   "layer": "services",
   "lines": 39,
   "returns": "tuple[int, int]",
   "sim": null,
   "usage": 0
  },
  "fn:recipe|upsert_recipe": {
   "api": 0,
   "async": 1,
   "base": 0,
   "cases": [],
   "cases_more": 0,
   "doc": "Upsert one recipe by slug (update-in-place). Returns \"created\" | \"updated\" | \"skipped_active\". An UPDATE is refused while the recipe has an active cooking session (review 47-1): the wholesale child-row replacement would CASCADE-delete the cook's step progress (cooking_step_progress.recipe_step_id ondelete=CASCADE). Skipped recipes converge on a later re-run once the session completes.",
   "file": "apps/api/services/recipe_seed.py",
   "flines": 375,
   "god": 1,
   "internal": 2,
   "layer": "services",
   "lines": 146,
   "returns": "str",
   "sim": null,
   "usage": 0
  }
 },
 "entities": [
  {
   "counts": {
    "endpoints": 36,
    "files": 24,
    "lines": 6106,
    "models": 6,
    "schemas": 9
   },
   "label": "Allergen",
   "slug": "allergen"
  },
  {
   "counts": {
    "endpoints": 3,
    "files": 32,
    "lines": 4238,
    "models": 2,
    "schemas": 1
   },
   "label": "Auth",
   "slug": "auth"
  },
  {
   "counts": {
    "endpoints": 13,
    "files": 65,
    "lines": 20032,
    "models": 7,
    "schemas": 21
   },
   "label": "Cooking",
   "slug": "cooking"
  },
  {
   "counts": {
    "endpoints": 4,
    "files": 18,
    "lines": 1496,
    "models": 1,
    "schemas": 0
   },
   "label": "Legal/Consent",
   "slug": "legal-consent"
  },
  {
   "counts": {
    "endpoints": 20,
    "files": 87,
    "lines": 18588,
    "models": 5,
    "schemas": 43
   },
   "label": "Pantry",
   "slug": "pantry"
  },
  {
   "counts": {
    "endpoints": 1,
    "files": 41,
    "lines": 8812,
    "models": 5,
    "schemas": 21
   },
   "label": "Progression",
   "slug": "progression"
  },
  {
   "counts": {
    "endpoints": 22,
    "files": 111,
    "lines": 25684,
    "models": 10,
    "schemas": 28
   },
   "label": "Recipe",
   "slug": "recipe"
  }
 ],
 "fn_edges": [
  {
   "conf": "inferred",
   "ds": "auth",
   "rel": "calls",
   "s": "apps/api/api/cooking.py#get_active",
   "ss": "allergen",
   "t": "apps/api/auth/context.py#AuthContext.require_household"
  },
  {
   "conf": "inferred",
   "ds": "auth",
   "rel": "calls",
   "s": "apps/api/api/cooking.py#patch_session_timer",
   "ss": "allergen",
   "t": "apps/api/auth/context.py#AuthContext.require_household"
  },
  {
   "conf": "inferred",
   "ds": "auth",
   "rel": "calls",
   "s": "apps/api/api/cooking.py#post_complete",
   "ss": "allergen",
   "t": "apps/api/auth/context.py#AuthContext.require_household"
  },
  {
   "conf": "inferred",
   "ds": "auth",
   "rel": "calls",
   "s": "apps/api/api/cooking.py#post_start_session",
   "ss": "allergen",
   "t": "apps/api/auth/context.py#AuthContext.require_household"
  },
  {
   "conf": "inferred",
   "ds": "auth",
   "rel": "calls",
   "s": "apps/api/api/pantry.py#get_pantry_overview",
   "ss": "allergen",
   "t": "apps/api/auth/context.py#AuthContext.require_household"
  },
  {
   "conf": "inferred",
   "ds": "pantry",
   "rel": "calls",
   "s": "apps/api/api/pantry.py#get_pantry_overview",
   "ss": "allergen",
   "t": "apps/api/services/recipe_availability.py#compute_cookability_summary"
  },
  {
   "conf": "inferred",
   "ds": "pantry",
   "rel": "calls",
   "s": "apps/api/api/recipe_detail.py#get_recipe",
   "ss": "recipe",
   "t": "apps/api/services/recipe_availability.py#get_pantry_ingredient_codes"
  },
  {
   "conf": "inferred",
   "ds": "allergen",
   "rel": "calls",
   "s": "apps/api/api/recipe_detail.py#get_recipe",
   "ss": "recipe",
   "t": "apps/api/services/recipes.py#load_user_allergens"
  },
  {
   "conf": "inferred",
   "ds": "auth",
   "rel": "calls",
   "s": "apps/api/api/recipe_explore.py#explore_recipes",
   "ss": "recipe",
   "t": "apps/api/auth/context.py#AuthContext.require_household"
  },
  {
   "conf": "inferred",
   "ds": "allergen",
   "rel": "calls",
   "s": "apps/api/api/recipe_explore.py#explore_recipes",
   "ss": "recipe",
   "t": "apps/api/services/recipes.py#load_user_allergens"
  },
  {
   "conf": "inferred",
   "ds": "auth",
   "rel": "calls",
   "s": "apps/api/api/recipe_plan.py#post_plan_recipe",
   "ss": "recipe",
   "t": "apps/api/auth/context.py#AuthContext.require_household"
  },
  {
   "conf": "inferred",
   "ds": "allergen",
   "rel": "calls",
   "s": "apps/api/api/recipe_plan.py#post_plan_recipe",
   "ss": "recipe",
   "t": "apps/api/services/recipes.py#load_user_allergens"
  },
  {
   "conf": "inferred",
   "ds": "pantry",
   "rel": "calls",
   "s": "apps/api/services/ai_recipes.py#generate_gustify_recipe",
   "ss": "recipe",
   "t": "apps/api/services/recipe_availability.py#get_pantry_ingredient_codes"
  },
  {
   "conf": "inferred",
   "ds": "allergen",
   "rel": "calls",
   "s": "apps/api/services/ai_recipes.py#generate_gustify_recipe",
   "ss": "recipe",
   "t": "apps/api/services/recipes.py#load_user_allergens"
  },
  {
   "conf": "inferred",
   "ds": "allergen",
   "rel": "calls",
   "s": "apps/api/services/ai_recipes.py#generate_gustify_recipe",
   "ss": "recipe",
   "t": "apps/api/services/reconciliation.py#enqueue_unknown_ingredients"
  },
  {
   "conf": "inferred",
   "ds": "pantry",
   "rel": "calls",
   "s": "apps/api/services/ai_recipes.py#relief_accept",
   "ss": "recipe",
   "t": "apps/api/services/recipe_availability.py#get_pantry_ingredient_codes"
  },
  {
   "conf": "inferred",
   "ds": "allergen",
   "rel": "calls",
   "s": "apps/api/services/ai_recipes.py#relief_accept",
   "ss": "recipe",
   "t": "apps/api/services/recipes.py#load_user_allergens"
  },
  {
   "conf": "inferred",
   "ds": "allergen",
   "rel": "calls",
   "s": "apps/api/services/ai_recipes.py#relief_accept",
   "ss": "recipe",
   "t": "apps/api/services/reconciliation.py#enqueue_unknown_ingredients"
  },
  {
   "conf": "inferred",
   "ds": "allergen",
   "rel": "calls",
   "s": "apps/api/services/recipe_availability.py#compute_cookability_summary",
   "ss": "pantry",
   "t": "apps/api/services/recipes.py#load_user_allergens"
  },
  {
   "conf": "inferred",
   "ds": "allergen",
   "rel": "calls",
   "s": "apps/web/src/features/auth/screens/InitialSetupScreen.tsx#getSetupFacets",
   "ss": "auth",
   "t": "apps/web/src/features/settings/model/SettingsPreferenceOptions.ts#getDietOptions"
  },
  {
   "conf": "inferred",
   "ds": "allergen",
   "rel": "calls",
   "s": "apps/web/src/features/auth/screens/InitialSetupScreen.tsx#getSetupFacets",
   "ss": "auth",
   "t": "apps/web/src/features/settings/model/SettingsPreferenceOptions.ts#getRestrictionOptions"
  },
  {
   "conf": "inferred",
   "ds": "auth",
   "rel": "calls",
   "s": "apps/web/src/features/cooking/RecipeBrowseContainer.tsx#RecipeBrowseContainer",
   "ss": "recipe",
   "t": "apps/web/src/auth/useAuth.ts#useAuth"
  },
  {
   "conf": "inferred",
   "ds": "progression",
   "rel": "calls",
   "s": "apps/web/src/features/cooking/RecipeBrowseContainer.tsx#RecipeBrowseContainer",
   "ss": "recipe",
   "t": "apps/web/src/features/me/useMe.ts#useMe"
  },
  {
   "conf": "inferred",
   "ds": "cooking",
   "rel": "calls",
   "s": "apps/web/src/features/cooking/components/RecipeFilterPanel.tsx#RecipeFilterPanel",
   "ss": "recipe",
   "t": "apps/web/src/features/cooking/components/filters/RecipeFilterChrome.tsx#buildRecipeFilterFacets"
  },
  {
   "conf": "inferred",
   "ds": "cooking",
   "rel": "calls",
   "s": "apps/web/src/features/cooking/components/RecipeFilterPanel.tsx#RecipeFilterPanel",
   "ss": "recipe",
   "t": "apps/web/src/features/cooking/model/CookingScreenModel.ts#getCookingRecipeFilterActiveCount"
  },
  {
   "conf": "inferred",
   "ds": "progression",
   "rel": "calls",
   "s": "apps/web/src/features/cooking/components/RecipeFilterPanel.tsx#RecipeFilterPanel",
   "ss": "recipe",
   "t": "apps/web/src/features/settings/equipmentSettingsModel.ts#equipmentOptions"
  },
  {
   "conf": "inferred",
   "ds": "progression",
   "rel": "calls",
   "s": "apps/web/src/features/cooking/components/RecipeFilterPanel.tsx#RecipeFilterPanel.handleEquipmentTap",
   "ss": "recipe",
   "t": "apps/web/src/features/settings/equipmentSettingsModel.ts#equipmentOptions"
  },
  {
   "conf": "inferred",
   "ds": "progression",
   "rel": "calls",
   "s": "apps/web/src/features/cooking/components/filters/RecipeFilterChrome.tsx#buildRecipeFilterFacets",
   "ss": "cooking",
   "t": "apps/web/src/features/settings/equipmentSettingsModel.ts#equipmentOptions"
  },
  {
   "conf": "inferred",
   "ds": "allergen",
   "rel": "calls",
   "s": "apps/web/src/features/cooking/components/filters/RecipeFilterChrome.tsx#buildRecipeFilterFacets",
   "ss": "cooking",
   "t": "apps/web/src/features/settings/model/SettingsPreferenceOptions.ts#getRestrictionOptions"
  },
  {
   "conf": "inferred",
   "ds": "cooking",
   "rel": "calls",
   "s": "apps/web/src/features/cooking/renderRecipeBrowseView.tsx#renderRecipeBrowseView",
   "ss": "recipe",
   "t": "apps/web/src/features/cooking/cookingSessionModel.ts#localDateString"
  },
  {
   "conf": "inferred",
   "ds": "allergen",
   "rel": "calls",
   "s": "apps/web/src/features/cooking/renderRecipeBrowseView.tsx#renderRecipeBrowseView",
   "ss": "recipe",
   "t": "apps/web/src/features/settings/model/SettingsPreferenceOptions.ts#getDietOptions"
  },
  {
   "conf": "inferred",
   "ds": "allergen",
   "rel": "calls",
   "s": "apps/web/src/features/cooking/renderRecipeBrowseView.tsx#renderRecipeBrowseView",
   "ss": "recipe",
   "t": "apps/web/src/features/settings/model/SettingsPreferenceOptions.ts#getRestrictionOptions"
  },
  {
   "conf": "inferred",
   "ds": "cooking",
   "rel": "calls",
   "s": "apps/web/src/features/cooking/screens/RecipeDetailScreen.tsx#RecipeDetailScreen",
   "ss": "recipe",
   "t": "apps/web/src/features/cooking/model/CookingScreenModel.ts#getCookingRecipe"
  },
  {
   "conf": "inferred",
   "ds": "auth",
   "rel": "calls",
   "s": "apps/web/src/features/me/useMe.ts#useMe",
   "ss": "progression",
   "t": "apps/web/src/lib/api/client.ts#apiFetch"
  },
  {
   "conf": "inferred",
   "ds": "allergen",
   "rel": "calls",
   "s": "apps/web/src/features/profile/components/settings/SettingsFacetConfig.tsx#getSettingsSelectionConfig",
   "ss": "progression",
   "t": "apps/web/src/features/settings/model/SettingsPreferenceOptions.ts#getDietOptions"
  },
  {
   "conf": "inferred",
   "ds": "allergen",
   "rel": "calls",
   "s": "apps/web/src/features/profile/components/settings/SettingsFacetConfig.tsx#getSettingsSelectionConfig",
   "ss": "progression",
   "t": "apps/web/src/features/settings/model/SettingsPreferenceOptions.ts#getRestrictionOptions"
  },
  {
   "conf": "inferred",
   "ds": "progression",
   "rel": "calls",
   "s": "apps/web/src/features/settings/NotificationsContainer.tsx#NotificationsContainer",
   "ss": "allergen",
   "t": "apps/web/src/features/me/useMe.ts#useMe"
  },
  {
   "conf": "inferred",
   "ds": "auth",
   "rel": "calls",
   "s": "apps/web/src/features/settings/SettingsContainer.tsx#SettingsContainer",
   "ss": "allergen",
   "t": "apps/web/src/auth/useAuth.ts#useAuth"
  },
  {
   "conf": "inferred",
   "ds": "progression",
   "rel": "calls",
   "s": "apps/web/src/features/settings/SettingsContainer.tsx#SettingsContainer",
   "ss": "allergen",
   "t": "apps/web/src/features/me/useMe.ts#useMe"
  }
 ],
 "fn_nodes": [
  {
   "god": false,
   "handler": true,
   "hub": {
    "god": false,
    "usage": 3
   },
   "id": "apps/api/api/cooking.py#get_active",
   "kind": "function",
   "lang": "py",
   "layer": "api",
   "name": "get_active",
   "slug": "allergen",
   "tests": {
    "api": 5,
    "n": 5,
    "red": 0,
    "web": 0
   }
  },
  {
   "god": false,
   "handler": true,
   "hub": {
    "god": false,
    "usage": 1
   },
   "id": "apps/api/api/cooking.py#patch_session_timer",
   "kind": "function",
   "lang": "py",
   "layer": "api",
   "name": "patch_session_timer",
   "slug": "allergen",
   "tests": {
    "api": 3,
    "n": 3,
    "red": 0,
    "web": 0
   }
  },
  {
   "god": true,
   "handler": true,
   "hub": {
    "god": true,
    "usage": 1
   },
   "id": "apps/api/api/cooking.py#post_complete",
   "kind": "function",
   "lang": "py",
   "layer": "api",
   "name": "post_complete",
   "slug": "allergen",
   "tests": {
    "api": 4,
    "n": 4,
    "red": 0,
    "web": 0
   }
  },
  {
   "god": true,
   "handler": true,
   "hub": {
    "god": true,
    "usage": 1
   },
   "id": "apps/api/api/cooking.py#post_start_session",
   "kind": "function",
   "lang": "py",
   "layer": "api",
   "name": "post_start_session",
   "slug": "allergen",
   "tests": {
    "api": 8,
    "n": 8,
    "red": 0,
    "web": 0
   }
  },
  {
   "god": false,
   "handler": true,
   "hub": {
    "god": false,
    "usage": 1
   },
   "id": "apps/api/api/pantry.py#get_pantry_overview",
   "kind": "function",
   "lang": "py",
   "layer": "api",
   "name": "get_pantry_overview",
   "slug": "allergen",
   "tests": {
    "api": 9,
    "n": 9,
    "red": 0,
    "web": 0
   }
  },
  {
   "god": true,
   "handler": true,
   "hub": {
    "god": true,
    "usage": 1
   },
   "id": "apps/api/api/recipes.py#search_recipes",
   "kind": "function",
   "lang": "py",
   "layer": "api",
   "name": "search_recipes",
   "slug": "allergen",
   "tests": {
    "api": 9,
    "n": 9,
    "red": 0,
    "web": 0
   }
  },
  {
   "god": false,
   "handler": false,
   "hub": {
    "god": false,
    "usage": 10
   },
   "id": "apps/api/services/recipes.py#load_user_allergens",
   "kind": "function",
   "lang": "py",
   "layer": "services",
   "name": "load_user_allergens",
   "slug": "allergen"
  },
  {
   "god": false,
   "handler": false,
   "hub": {
    "god": false,
    "usage": 2
   },
   "id": "apps/api/services/reconciliation.py#enqueue_unknown_ingredients",
   "kind": "function",
   "lang": "py",
   "layer": "services",
   "name": "enqueue_unknown_ingredients",
   "slug": "allergen",
   "tests": {
    "api": 3,
    "n": 3,
    "red": 0,
    "web": 0
   }
  },
  {
   "god": false,
   "handler": false,
   "hub": {
    "god": false,
    "usage": 0
   },
   "id": "apps/api/services/restriction_seed.py#seed_recipe_restrictions_on_startup",
   "kind": "function",
   "lang": "py",
   "layer": "services",
   "name": "seed_recipe_restrictions_on_startup",
   "slug": "allergen"
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/features/settings/NotificationsContainer.tsx#NotificationsContainer",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "NotificationsContainer",
   "slug": "allergen"
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/features/settings/SettingsContainer.tsx#SettingsContainer",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "SettingsContainer",
   "slug": "allergen"
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/features/settings/model/SettingsPreferenceOptions.ts#getDietOptions",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "getDietOptions",
   "slug": "allergen"
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/features/settings/model/SettingsPreferenceOptions.ts#getRestrictionOptions",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "getRestrictionOptions",
   "slug": "allergen"
  },
  {
   "god": false,
   "handler": false,
   "hub": {
    "god": false,
    "usage": 11
   },
   "id": "apps/api/auth/context.py#AuthContext.require_household",
   "kind": "method",
   "lang": "py",
   "layer": "services",
   "name": "AuthContext.require_household",
   "slug": "auth"
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/auth/useAuth.ts#useAuth",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "useAuth",
   "slug": "auth"
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/features/auth/screens/InitialSetupScreen.tsx#getSetupFacets",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "getSetupFacets",
   "slug": "auth"
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/lib/api/client.ts#apiFetch",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "apiFetch",
   "slug": "auth"
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/features/cooking/components/filters/RecipeFilterChrome.tsx#buildRecipeFilterFacets",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "buildRecipeFilterFacets",
   "slug": "cooking"
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/features/cooking/cookingSessionModel.ts#localDateString",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "localDateString",
   "slug": "cooking"
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/features/cooking/model/CookingScreenModel.ts#getCookingRecipe",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "getCookingRecipe",
   "slug": "cooking"
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/features/cooking/model/CookingScreenModel.ts#getCookingRecipeFilterActiveCount",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "getCookingRecipeFilterActiveCount",
   "slug": "cooking"
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/features/cooking/model/cookingIcons.ts#buildCookingComplexityStarIcon",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "buildCookingComplexityStarIcon",
   "slug": "cooking"
  },
  {
   "god": false,
   "handler": false,
   "hub": {
    "god": false,
    "usage": 2
   },
   "id": "apps/api/services/recipe_availability.py#compute_cookability_summary",
   "kind": "function",
   "lang": "py",
   "layer": "services",
   "name": "compute_cookability_summary",
   "slug": "pantry",
   "tests": {
    "api": 5,
    "n": 5,
    "red": 0,
    "web": 0
   }
  },
  {
   "god": false,
   "handler": false,
   "hub": {
    "god": false,
    "usage": 5
   },
   "id": "apps/api/services/recipe_availability.py#get_pantry_ingredient_codes",
   "kind": "function",
   "lang": "py",
   "layer": "services",
   "name": "get_pantry_ingredient_codes",
   "slug": "pantry",
   "tests": {
    "api": 1,
    "n": 1,
    "red": 0,
    "web": 0
   }
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/features/pantry/components/batch/BatchAddSheet.tsx#BatchAddSheet.setLocation",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "BatchAddSheet.setLocation",
   "slug": "pantry"
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/features/me/useMe.ts#useMe",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "useMe",
   "slug": "progression"
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/features/profile/components/HomeActionablePanel.tsx#HomeActionablePanel",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "HomeActionablePanel",
   "slug": "progression"
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/features/profile/components/settings/SettingsFacetConfig.tsx#getSettingsSelectionConfig",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "getSettingsSelectionConfig",
   "slug": "progression"
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/features/profile/model/profileHistoryModel.ts#buildDishHistoryFilterFacets",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "buildDishHistoryFilterFacets",
   "slug": "progression"
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/features/settings/equipmentSettingsModel.ts#equipmentOptions",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "equipmentOptions",
   "slug": "progression"
  },
  {
   "god": true,
   "handler": true,
   "hub": {
    "god": true,
    "usage": 1
   },
   "id": "apps/api/api/recipe_detail.py#get_recipe",
   "kind": "function",
   "lang": "py",
   "layer": "api",
   "name": "get_recipe",
   "slug": "recipe",
   "tests": {
    "api": 27,
    "n": 27,
    "red": 0,
    "web": 0
   }
  },
  {
   "god": true,
   "handler": true,
   "hub": {
    "god": true,
    "usage": 1
   },
   "id": "apps/api/api/recipe_explore.py#explore_recipes",
   "kind": "function",
   "lang": "py",
   "layer": "api",
   "name": "explore_recipes",
   "slug": "recipe"
  },
  {
   "god": false,
   "handler": true,
   "hub": {
    "god": false,
    "usage": 1
   },
   "id": "apps/api/api/recipe_plan.py#post_plan_recipe",
   "kind": "function",
   "lang": "py",
   "layer": "api",
   "name": "post_plan_recipe",
   "slug": "recipe",
   "tests": {
    "api": 2,
    "n": 2,
    "red": 0,
    "web": 0
   }
  },
  {
   "god": true,
   "handler": false,
   "hub": {
    "god": true,
    "usage": 2
   },
   "id": "apps/api/services/ai_recipes.py#generate_gustify_recipe",
   "kind": "function",
   "lang": "py",
   "layer": "services",
   "name": "generate_gustify_recipe",
   "slug": "recipe"
  },
  {
   "god": true,
   "handler": false,
   "hub": {
    "god": true,
    "usage": 1
   },
   "id": "apps/api/services/ai_recipes.py#relief_accept",
   "kind": "function",
   "lang": "py",
   "layer": "services",
   "name": "relief_accept",
   "slug": "recipe"
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/features/cooking/RecipeBrowseContainer.tsx#RecipeBrowseContainer",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "RecipeBrowseContainer",
   "slug": "recipe"
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/features/cooking/components/RecipeFilterPanel.tsx#RecipeFilterPanel",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "RecipeFilterPanel",
   "slug": "recipe"
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/features/cooking/components/RecipeFilterPanel.tsx#RecipeFilterPanel.handleEquipmentTap",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "RecipeFilterPanel.handleEquipmentTap",
   "slug": "recipe"
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/features/cooking/model/taxonomy.ts#getCookingTaxonomyOption",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "getCookingTaxonomyOption",
   "slug": "recipe"
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/features/cooking/renderRecipeBrowseView.tsx#renderRecipeBrowseView",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "renderRecipeBrowseView",
   "slug": "recipe"
  },
  {
   "god": false,
   "handler": false,
   "id": "apps/web/src/features/cooking/screens/RecipeDetailScreen.tsx#RecipeDetailScreen",
   "kind": "function",
   "lang": "ts",
   "layer": "web",
   "name": "RecipeDetailScreen",
   "slug": "recipe"
  }
 ],
 "l1_edges": [
  {
   "kinds": {
    "calls": 41,
    "fk": 1
   },
   "s": "allergen",
   "t": "auth"
  },
  {
   "kinds": {
    "calls": 19
   },
   "s": "allergen",
   "t": "cooking"
  },
  {
   "kinds": {
    "calls": 2
   },
   "s": "allergen",
   "t": "legal-consent"
  },
  {
   "kinds": {
    "calls": 16
   },
   "s": "allergen",
   "t": "pantry"
  },
  {
   "kinds": {
    "calls": 12
   },
   "s": "allergen",
   "t": "progression"
  },
  {
   "kinds": {
    "calls": 13
   },
   "s": "allergen",
   "t": "recipe"
  },
  {
   "kinds": {
    "calls": 12
   },
   "s": "auth",
   "t": "allergen"
  },
  {
   "kinds": {
    "calls": 1
   },
   "s": "auth",
   "t": "cooking"
  },
  {
   "kinds": {
    "calls": 3
   },
   "s": "auth",
   "t": "legal-consent"
  },
  {
   "kinds": {
    "calls": 3
   },
   "s": "auth",
   "t": "progression"
  },
  {
   "kinds": {
    "calls": 2
   },
   "s": "auth",
   "t": "recipe"
  },
  {
   "kinds": {
    "calls": 2
   },
   "s": "cooking",
   "t": "allergen"
  },
  {
   "kinds": {
    "calls": 15,
    "fk": 10
   },
   "s": "cooking",
   "t": "auth"
  },
  {
   "kinds": {
    "calls": 4
   },
   "s": "cooking",
   "t": "pantry"
  },
  {
   "kinds": {
    "calls": 6
   },
   "s": "cooking",
   "t": "progression"
  },
  {
   "kinds": {
    "calls": 49,
    "fk": 3,
    "imports": 7
   },
   "s": "cooking",
   "t": "recipe"
  },
  {
   "kinds": {
    "calls": 6,
    "fk": 1
   },
   "s": "legal-consent",
   "t": "auth"
  },
  {
   "kinds": {
    "calls": 2
   },
   "s": "legal-consent",
   "t": "progression"
  },
  {
   "kinds": {
    "calls": 5
   },
   "s": "pantry",
   "t": "allergen"
  },
  {
   "kinds": {
    "calls": 25,
    "fk": 7
   },
   "s": "pantry",
   "t": "auth"
  },
  {
   "kinds": {
    "calls": 2
   },
   "s": "pantry",
   "t": "cooking"
  },
  {
   "kinds": {
    "calls": 3
   },
   "s": "pantry",
   "t": "progression"
  },
  {
   "kinds": {
    "calls": 2
   },
   "s": "pantry",
   "t": "recipe"
  },
  {
   "kinds": {
    "calls": 11
   },
   "s": "progression",
   "t": "allergen"
  },
  {
   "kinds": {
    "calls": 6,
    "fk": 2
   },
   "s": "progression",
   "t": "auth"
  },
  {
   "kinds": {
    "calls": 15
   },
   "s": "progression",
   "t": "cooking"
  },
  {
   "kinds": {
    "calls": 8
   },
   "s": "progression",
   "t": "pantry"
  },
  {
   "kinds": {
    "calls": 13
   },
   "s": "progression",
   "t": "recipe"
  },
  {
   "kinds": {
    "calls": 22
   },
   "s": "recipe",
   "t": "allergen"
  },
  {
   "kinds": {
    "calls": 21,
    "fk": 8
   },
   "s": "recipe",
   "t": "auth"
  },
  {
   "kinds": {
    "calls": 78,
    "imports": 8
   },
   "s": "recipe",
   "t": "cooking"
  },
  {
   "kinds": {
    "calls": 9
   },
   "s": "recipe",
   "t": "pantry"
  },
  {
   "kinds": {
    "calls": 23
   },
   "s": "recipe",
   "t": "progression"
  }
 ],
 "note": "EXAMPLE FIXTURE \u2014 derived read-only from gustify archmap head 430360b8 + graft index e9648ccc778f (2026-08-12). Display lab data, not live. \u00b7 endpoints DEDUPED + reassigned to their URL entity (aspect files no longer duplicate routes).",
 "pieces": {
  "allergen": {
   "communities": {
    "c1\u00b7patch_prefer": [
     "PreferencesPatch",
     "UserDietaryProfile",
     "patch_preferences",
     "post_start_session"
    ],
    "c2\u00b7patch_explor": [
     "ExplorationPreferencesInput",
     "ExplorationPreferencesPatch",
     "patch_exploration"
    ],
    "c3\u00b7patch_househ": [
     "HouseholdFormatPatch",
     "patch_household_settings"
    ],
    "misc": [
     "ContextualWarningRule",
     "DietPreference",
     "IngredientRestriction",
     "IngredientWarning",
     "Restriction",
     "assign_location",
     "create_location",
     "create_pantry_item",
     "create_pantry_items_batch",
     "delete_me",
     "delete_pantry_item_route",
     "delete_session_photo",
     "get_active",
     "get_due_reminders",
     "get_frequent_ingredients",
     "get_ingredient_history",
     "get_locations",
     "get_me",
     "get_pantry_overview",
     "get_session_photo",
     "get_settings_route",
     "patch_readiness",
     "patch_session_timer",
     "patch_stage",
     "patch_step_progress",
     "post_advance_stage",
     "post_cancel",
     "post_complete",
     "post_reset_apply",
     "post_reset_preview",
     "put_session_photo",
     "remove_location",
     "resolve_batch",
     "search_recipes",
     "setup_complete",
     "update_location",
     "update_pantry_item"
    ]
   },
   "endpoints": [],
   "intra": [],
   "models": [
    {
     "cls": "UserDietaryProfile",
     "hub": {
      "god": false,
      "usage": 2
     },
     "nfk": 1,
     "table": "user_dietary_profile",
     "tests": {
      "api": 18,
      "n": 18,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "IngredientRestriction",
     "hub": {
      "god": false,
      "usage": 0
     },
     "nfk": 0,
     "table": "ingredient_restrictions",
     "tests": {
      "api": 8,
      "n": 8,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "IngredientWarning",
     "hub": {
      "god": false,
      "usage": 0
     },
     "nfk": 0,
     "table": "ingredient_warnings",
     "tests": {
      "api": 4,
      "n": 4,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "ContextualWarningRule",
     "hub": {
      "god": false,
      "usage": 0
     },
     "nfk": 0,
     "table": "contextual_warning_rules",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "Restriction",
     "hub": {
      "god": false,
      "usage": 0
     },
     "nfk": 0,
     "table": "restrictions",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "DietPreference",
     "hub": {
      "god": false,
      "usage": 0
     },
     "nfk": 0,
     "table": "diet_preferences",
     "tests": {
      "api": 1,
      "n": 1,
      "red": 0,
      "web": 0
     }
    }
   ],
   "schemas": [
    {
     "cls": "ExplorationPreferencesInput",
     "tests": {
      "api": 59,
      "n": 59,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "ExplorationPreferencesPatch",
     "tests": {
      "api": 30,
      "n": 30,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "HouseholdFormatPatch",
     "tests": {
      "api": 7,
      "n": 7,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "PreferencesPatch",
     "tests": {
      "api": 7,
      "n": 7,
      "red": 0,
      "web": 0
     }
    }
   ],
   "usecases": {},
   "usefns": [
    {
     "fn": "_build_settings",
     "uses": 2
    },
    {
     "fn": "_canonical_exists",
     "uses": 1
    },
    {
     "fn": "apply_reconciliation",
     "uses": 2
    },
    {
     "fn": "reconcile_recipe_restrictions",
     "uses": 1
    }
   ]
  },
  "auth": {
   "communities": {
    "c1\u00b7setup_comple": [
     "SetupCompleteRequest",
     "setup_complete"
    ],
    "misc": [
     "Household",
     "User",
     "delete_me",
     "get_me"
    ]
   },
   "endpoints": [
    {
     "fn": "delete_me",
     "m": "DELETE",
     "p": "/me",
     "resp": "\u2014",
     "tests": {
      "api": 4,
      "n": 4,
      "red": 0,
      "web": 0
     },
     "touch": []
    },
    {
     "fn": "get_me",
     "m": "GET",
     "p": "/me",
     "resp": "MeResponse",
     "tests": {
      "api": 6,
      "n": 6,
      "red": 0,
      "web": 0
     },
     "touch": []
    },
    {
     "fn": "get_settings_route",
     "m": "GET",
     "p": "/settings",
     "resp": "SettingsResponse",
     "tests": {
      "api": 7,
      "n": 7,
      "red": 0,
      "web": 0
     },
     "touch": []
    },
    {
     "fn": "patch_exploration",
     "m": "PATCH",
     "p": "/settings/exploration",
     "resp": "SettingsResponse",
     "tests": {
      "api": 23,
      "n": 23,
      "red": 0,
      "web": 0
     },
     "touch": [
      "ExplorationPreferencesInput",
      "ExplorationPreferencesPatch"
     ]
    },
    {
     "fn": "patch_household_settings",
     "m": "PATCH",
     "p": "/settings/household",
     "resp": "SettingsResponse",
     "tests": {
      "api": 7,
      "n": 7,
      "red": 0,
      "web": 0
     },
     "touch": [
      "HouseholdFormatPatch"
     ]
    },
    {
     "fn": "patch_preferences",
     "m": "PATCH",
     "p": "/settings/preferences",
     "resp": "SettingsResponse",
     "tests": {
      "api": 7,
      "n": 7,
      "red": 0,
      "web": 0
     },
     "touch": [
      "PreferencesPatch",
      "UserDietaryProfile"
     ]
    },
    {
     "fn": "setup_complete",
     "m": "POST",
     "p": "/setup/complete",
     "resp": "MeResponse",
     "tests": {
      "api": 26,
      "n": 26,
      "red": 0,
      "web": 0
     },
     "touch": [
      "SetupCompleteRequest"
     ]
    }
   ],
   "intra": [],
   "models": [
    {
     "cls": "User",
     "hub": {
      "god": false,
      "usage": 19
     },
     "nfk": 0,
     "table": "users",
     "tests": {
      "api": 27,
      "n": 27,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "Household",
     "hub": {
      "god": false,
      "usage": 10
     },
     "nfk": 0,
     "table": "households",
     "tests": {
      "api": 23,
      "n": 23,
      "red": 0,
      "web": 0
     }
    }
   ],
   "schemas": [
    {
     "cls": "SetupCompleteRequest",
     "tests": {
      "api": 30,
      "n": 30,
      "red": 0,
      "web": 0
     }
    }
   ],
   "usecases": {
    "me": {
     "cls": [],
     "eps": [
      "DELETE /me",
      "GET /me"
     ],
     "fns": [
      "delete_me",
      "get_me"
     ]
    },
    "settings": {
     "cls": [
      "ExplorationPreferencesInput",
      "ExplorationPreferencesPatch",
      "HouseholdFormatPatch",
      "PreferencesPatch",
      "UserDietaryProfile"
     ],
     "eps": [
      "GET /settings",
      "PATCH /settings/exploration",
      "PATCH /settings/household",
      "PATCH /settings/preferences"
     ],
     "fns": [
      "get_settings_route",
      "patch_exploration",
      "patch_household_settings",
      "patch_preferences"
     ]
    },
    "setup": {
     "cls": [
      "SetupCompleteRequest"
     ],
     "eps": [
      "POST /setup/complete"
     ],
     "fns": [
      "setup_complete"
     ]
    }
   },
   "usefns": [
    {
     "fn": "_build_me_response",
     "uses": 2
    },
    {
     "fn": "_load_setup_result",
     "uses": 2
    },
    {
     "fn": "_me_response_from_result",
     "uses": 1
    },
    {
     "fn": "_upsert_dietary",
     "uses": 1
    },
    {
     "fn": "_upsert_exploration",
     "uses": 1
    }
   ]
  },
  "cooking": {
   "communities": {
    "c1\u00b7get_active": [
     "ActiveCookingResponse",
     "CookingPhotoRef",
     "CookingSessionResponse",
     "ReadinessUpdate",
     "SessionCreateRequest",
     "SessionTimerRequest",
     "StageUpdate",
     "get_active",
     "patch_readiness",
     "patch_session_timer",
     "patch_stage",
     "post_cancel",
     "post_start_session",
     "put_session_photo"
    ],
    "c2\u00b7CookingSessi": [
     "CookingPhoto",
     "CookingSession",
     "CookingStageReminder",
     "CookingStepProgress",
     "DishHistoryEvent"
    ],
    "c3\u00b7get_due_remi": [
     "DueRemindersResponse",
     "StageReminderResponse",
     "get_due_reminders"
    ],
    "c4\u00b7patch_step_p": [
     "StepProgressResponse",
     "StepProgressUpdate",
     "patch_step_progress"
    ],
    "c5\u00b7post_advance": [
     "AdvanceStageRequest",
     "AdvanceStageResponse",
     "post_advance_stage"
    ],
    "c6\u00b7post_complet": [
     "CompletionRequest",
     "CompletionResponse",
     "post_complete"
    ],
    "misc": [
     "Notification",
     "ProfileProjection",
     "delete_session_photo",
     "get_session_photo"
    ]
   },
   "endpoints": [
    {
     "fn": "get_active",
     "m": "GET",
     "p": "/cooking/active",
     "resp": "ActiveCookingResponse",
     "tests": {
      "api": 5,
      "n": 5,
      "red": 0,
      "web": 0
     },
     "touch": [
      "ActiveCookingResponse",
      "CookingPhotoRef",
      "CookingSessionResponse"
     ]
    },
    {
     "fn": "get_due_reminders",
     "m": "GET",
     "p": "/cooking/reminders/due",
     "resp": "DueRemindersResponse",
     "tests": {
      "api": 1,
      "n": 1,
      "red": 0,
      "web": 0
     },
     "touch": [
      "DueRemindersResponse",
      "StageReminderResponse"
     ]
    },
    {
     "fn": "post_start_session",
     "m": "POST",
     "p": "/cooking/sessions",
     "resp": "CookingSessionResponse",
     "tests": {
      "api": 8,
      "n": 8,
      "red": 0,
      "web": 0
     },
     "touch": [
      "CookingSessionResponse",
      "SessionCreateRequest",
      "UserDietaryProfile"
     ]
    },
    {
     "fn": "post_advance_stage",
     "m": "POST",
     "p": "/cooking/sessions/{session_id}/advance-stage",
     "resp": "AdvanceStageResponse",
     "tests": {
      "api": 1,
      "n": 1,
      "red": 0,
      "web": 0
     },
     "touch": [
      "AdvanceStageRequest",
      "AdvanceStageResponse",
      "StageReminderResponse"
     ]
    },
    {
     "fn": "post_cancel",
     "m": "POST",
     "p": "/cooking/sessions/{session_id}/cancel",
     "resp": "CookingSessionResponse",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     },
     "touch": [
      "CookingSessionResponse"
     ]
    },
    {
     "fn": "post_complete",
     "m": "POST",
     "p": "/cooking/sessions/{session_id}/complete",
     "resp": "CompletionResponse",
     "tests": {
      "api": 4,
      "n": 4,
      "red": 0,
      "web": 0
     },
     "touch": [
      "CompletionRequest",
      "CompletionResponse"
     ]
    },
    {
     "fn": "delete_session_photo",
     "guards": 1,
     "m": "DELETE",
     "p": "/cooking/sessions/{session_id}/photos/{slot}",
     "resp": "\u2014",
     "touch": []
    },
    {
     "fn": "get_session_photo",
     "guards": 1,
     "m": "GET",
     "p": "/cooking/sessions/{session_id}/photos/{slot}",
     "resp": "\u2014",
     "touch": []
    },
    {
     "fn": "put_session_photo",
     "guards": 1,
     "m": "PUT",
     "p": "/cooking/sessions/{session_id}/photos/{slot}",
     "resp": "CookingPhotoRef",
     "touch": [
      "CookingPhotoRef"
     ]
    },
    {
     "fn": "patch_readiness",
     "m": "PATCH",
     "p": "/cooking/sessions/{session_id}/readiness",
     "resp": "CookingSessionResponse",
     "tests": {
      "api": 1,
      "n": 1,
      "red": 0,
      "web": 0
     },
     "touch": [
      "CookingSessionResponse",
      "ReadinessUpdate"
     ]
    },
    {
     "fn": "patch_stage",
     "m": "PATCH",
     "p": "/cooking/sessions/{session_id}/stage",
     "resp": "CookingSessionResponse",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     },
     "touch": [
      "CookingSessionResponse",
      "StageUpdate"
     ]
    },
    {
     "fn": "patch_step_progress",
     "guards": 1,
     "m": "PATCH",
     "p": "/cooking/sessions/{session_id}/steps/{step_id}",
     "resp": "StepProgressResponse",
     "touch": [
      "StepProgressResponse",
      "StepProgressUpdate"
     ]
    },
    {
     "fn": "patch_session_timer",
     "m": "PATCH",
     "p": "/cooking/sessions/{session_id}/timer",
     "resp": "CookingSessionResponse",
     "tests": {
      "api": 3,
      "n": 3,
      "red": 0,
      "web": 0
     },
     "touch": [
      "CookingSessionResponse",
      "SessionTimerRequest"
     ]
    }
   ],
   "intra": [
    {
     "s": "CookingPhoto",
     "t": "CookingSession",
     "via": "session_id"
    },
    {
     "s": "CookingStageReminder",
     "t": "CookingSession",
     "via": "session_id"
    },
    {
     "s": "CookingStepProgress",
     "t": "CookingSession",
     "via": "session_id"
    },
    {
     "s": "DishHistoryEvent",
     "t": "CookingSession",
     "via": "session_id"
    }
   ],
   "models": [
    {
     "cls": "CookingSession",
     "hub": {
      "god": true,
      "usage": 4
     },
     "nfk": 3,
     "table": "cooking_sessions",
     "tests": {
      "api": 7,
      "n": 7,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "CookingStepProgress",
     "hub": {
      "god": false,
      "usage": 0
     },
     "nfk": 2,
     "table": "cooking_step_progress",
     "tests": {
      "api": 1,
      "n": 1,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "DishHistoryEvent",
     "hub": {
      "god": false,
      "usage": 0
     },
     "nfk": 4,
     "table": "dish_history_events",
     "tests": {
      "api": 9,
      "n": 9,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "CookingStageReminder",
     "hub": {
      "god": false,
      "usage": 0
     },
     "nfk": 3,
     "table": "cooking_stage_reminders",
     "tests": {
      "api": 3,
      "n": 3,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "CookingPhoto",
     "hub": {
      "god": false,
      "usage": 0
     },
     "nfk": 3,
     "table": "cooking_photos",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "Notification",
     "hub": {
      "god": false,
      "usage": 0
     },
     "nfk": 1,
     "table": "notifications",
     "tests": {
      "api": 10,
      "n": 10,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "ProfileProjection",
     "hub": {
      "god": false,
      "usage": 0
     },
     "nfk": 1,
     "table": "profile_projections"
    }
   ],
   "schemas": [
    {
     "cls": "ActiveCookingResponse",
     "tests": {
      "api": 5,
      "n": 5,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "AdvanceStageRequest",
     "tests": {
      "api": 1,
      "n": 1,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "AdvanceStageResponse",
     "tests": {
      "api": 1,
      "n": 1,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "CompletionRequest",
     "tests": {
      "api": 5,
      "n": 5,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "CompletionResponse",
     "tests": {
      "api": 4,
      "n": 4,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "CookingPhotoRef",
     "tests": {
      "api": 5,
      "n": 5,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "CookingSessionResponse",
     "tests": {
      "api": 16,
      "n": 16,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "DueRemindersResponse",
     "tests": {
      "api": 1,
      "n": 1,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "ReadinessUpdate",
     "tests": {
      "api": 1,
      "n": 1,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "SessionCreateRequest",
     "tests": {
      "api": 8,
      "n": 8,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "SessionTimerRequest",
     "tests": {
      "api": 7,
      "n": 7,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "StageReminderResponse",
     "tests": {
      "api": 1,
      "n": 1,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "StageUpdate",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "StepProgressResponse"
    },
    {
     "cls": "StepProgressUpdate"
    }
   ],
   "usecases": {
    "cooking/active": {
     "cls": [
      "ActiveCookingResponse",
      "CookingPhotoRef",
      "CookingSessionResponse"
     ],
     "eps": [
      "GET /cooking/active"
     ],
     "fns": [
      "get_active"
     ]
    },
    "cooking/reminders": {
     "cls": [
      "DueRemindersResponse",
      "StageReminderResponse"
     ],
     "eps": [
      "GET /cooking/reminders/due"
     ],
     "fns": [
      "get_due_reminders"
     ]
    },
    "cooking/sessions": {
     "cls": [
      "AdvanceStageRequest",
      "AdvanceStageResponse",
      "CompletionRequest",
      "CompletionResponse",
      "CookingPhotoRef",
      "CookingSessionResponse",
      "ReadinessUpdate",
      "SessionCreateRequest",
      "SessionTimerRequest",
      "StageReminderResponse",
      "StageUpdate",
      "StepProgressResponse",
      "StepProgressUpdate",
      "UserDietaryProfile"
     ],
     "eps": [
      "DELETE /cooking/sessions/{session_id}/photos/{slot}",
      "GET /cooking/sessions/{session_id}/photos/{slot}",
      "PATCH /cooking/sessions/{session_id}/readiness",
      "PATCH /cooking/sessions/{session_id}/stage",
      "PATCH /cooking/sessions/{session_id}/steps/{step_id}",
      "PATCH /cooking/sessions/{session_id}/timer",
      "POST /cooking/sessions",
      "POST /cooking/sessions/{session_id}/advance-stage",
      "POST /cooking/sessions/{session_id}/cancel",
      "POST /cooking/sessions/{session_id}/complete",
      "PUT /cooking/sessions/{session_id}/photos/{slot}"
     ],
     "fns": [
      "delete_session_photo",
      "get_session_photo",
      "patch_readiness",
      "patch_session_timer",
      "patch_stage",
      "patch_step_progress",
      "post_advance_stage",
      "post_cancel",
      "post_complete",
      "post_start_session",
      "put_session_photo"
     ]
    }
   },
   "usefns": [
    {
     "fn": "_attach_photos",
     "uses": 3
    },
    {
     "fn": "_recipe_titles",
     "uses": 1
    },
    {
     "fn": "_replay_completion",
     "uses": 2
    },
    {
     "fn": "_resolve_storage_method",
     "uses": 1
    },
    {
     "fn": "_stages",
     "uses": 1
    },
    {
     "fn": "advance_stage",
     "uses": 3
    },
    {
     "fn": "complete_session",
     "uses": 5
    },
    {
     "fn": "refresh_profile_projection",
     "uses": 3
    },
    {
     "fn": "seed_stage_schedule",
     "uses": 3
    },
    {
     "fn": "set_session_timer",
     "uses": 2
    },
    {
     "fn": "start_session",
     "uses": 2
    }
   ]
  },
  "legal-consent": {
   "communities": {
    "misc": [
     "ConsentRecord",
     "get_account_export",
     "get_consent",
     "post_account_export",
     "post_consent"
    ]
   },
   "endpoints": [
    {
     "fn": "get_account_export",
     "m": "GET",
     "p": "/account/export",
     "resp": "\u2014",
     "tests": {
      "api": 3,
      "n": 3,
      "red": 0,
      "web": 0
     },
     "touch": []
    },
    {
     "fn": "get_consent",
     "m": "GET",
     "p": "/consent",
     "resp": "ConsentStatusResponse",
     "tests": {
      "api": 1,
      "n": 1,
      "red": 0,
      "web": 0
     },
     "touch": []
    },
    {
     "fn": "post_consent",
     "m": "POST",
     "p": "/consent",
     "resp": "ConsentStatusResponse",
     "tests": {
      "api": 5,
      "n": 5,
      "red": 0,
      "web": 0
     },
     "touch": []
    }
   ],
   "intra": [],
   "models": [
    {
     "cls": "ConsentRecord",
     "hub": {
      "god": false,
      "usage": 0
     },
     "nfk": 1,
     "table": "consent_records",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     }
    }
   ],
   "schemas": [],
   "usecases": {
    "account/export": {
     "cls": [],
     "eps": [
      "GET /account/export"
     ],
     "fns": [
      "get_account_export"
     ]
    },
    "consent": {
     "cls": [],
     "eps": [
      "GET /consent",
      "POST /consent"
     ],
     "fns": [
      "get_consent",
      "post_consent"
     ]
    }
   },
   "usefns": [
    {
     "fn": "_serialize",
     "uses": 1
    },
    {
     "fn": "build_account_export",
     "uses": 8
    },
    {
     "fn": "delete_account",
     "uses": 4
    }
   ]
  },
  "pantry": {
   "communities": {
    "c10\u00b7get_shopping": [
     "ItemCandidate",
     "ShoppingDashboardResponse",
     "get_shopping_dashboard"
    ],
    "c11\u00b7post_reset_a": [
     "ResetApplyRequest",
     "ResetApplyResponse",
     "post_reset_apply"
    ],
    "c12\u00b7delete_pantr": [
     "ItemDeleteResponse",
     "delete_pantry_item_route"
    ],
    "c13\u00b7post_confirm": [
     "BoughtConfirmationResponse",
     "post_confirm_bought"
    ],
    "c1\u00b7assign_locat": [
     "AssignLocationRequest",
     "PantryItemCreate",
     "PantryItemResponse",
     "PantryItemUpdate",
     "PantryOverviewResponse",
     "assign_location",
     "create_pantry_item",
     "get_pantry_overview",
     "update_pantry_item"
    ],
    "c2\u00b7create_locat": [
     "LocationCreate",
     "LocationListResponse",
     "LocationResponse",
     "LocationUpdate",
     "create_location",
     "get_locations",
     "update_location"
    ],
    "c3\u00b7create_shopp": [
     "AddToListRequest",
     "FromPlannedRecipesResponse",
     "ShoppingItemCreate",
     "ShoppingItemResponse",
     "create_shopping_item",
     "post_add_to_list",
     "post_from_planned_recipes"
    ],
    "c4\u00b7resolve_batc": [
     "BatchCandidateResponse",
     "BatchResolvedLineResponse",
     "ResolveBatchRequest",
     "ResolveBatchResponse",
     "resolve_batch"
    ],
    "c5\u00b7PantryItem": [
     "Location",
     "PantryItem",
     "PantryResetDecision",
     "PantryResetOperation"
    ],
    "c6\u00b7create_pantr": [
     "BatchItemResult",
     "CreateBatchRequest",
     "CreateBatchResponse",
     "create_pantry_items_batch"
    ],
    "c7\u00b7post_reset_p": [
     "ResetPreviewItem",
     "ResetPreviewRequest",
     "ResetPreviewResponse",
     "post_reset_preview"
    ],
    "c8\u00b7get_frequent": [
     "FrequentIngredient",
     "FrequentIngredientsResponse",
     "get_frequent_ingredients"
    ],
    "c9\u00b7get_ingredie": [
     "IngredientHistoryPage",
     "IngredientHistoryResponse",
     "get_ingredient_history"
    ],
    "misc": [
     "IngredientHistoryEvent",
     "remove_location"
    ]
   },
   "endpoints": [
    {
     "fn": "get_frequent_ingredients",
     "m": "GET",
     "p": "/pantry/frequent-ingredients",
     "resp": "FrequentIngredientsResponse",
     "tests": {
      "api": 3,
      "n": 3,
      "red": 0,
      "web": 0
     },
     "touch": [
      "FrequentIngredient",
      "FrequentIngredientsResponse"
     ]
    },
    {
     "fn": "get_ingredient_history",
     "guards": 1,
     "m": "GET",
     "p": "/pantry/history",
     "resp": "IngredientHistoryPage",
     "touch": [
      "IngredientHistoryPage",
      "IngredientHistoryResponse"
     ]
    },
    {
     "fn": "create_pantry_item",
     "m": "POST",
     "p": "/pantry/items",
     "resp": "PantryItemResponse",
     "tests": {
      "api": 3,
      "n": 3,
      "red": 0,
      "web": 0
     },
     "touch": [
      "PantryItemCreate",
      "PantryItemResponse"
     ]
    },
    {
     "fn": "create_pantry_items_batch",
     "m": "POST",
     "p": "/pantry/items/batch",
     "resp": "CreateBatchResponse",
     "tests": {
      "api": 8,
      "n": 8,
      "red": 0,
      "web": 0
     },
     "touch": [
      "BatchItemResult",
      "CreateBatchRequest",
      "CreateBatchResponse",
      "Location",
      "PantryItemCreate",
      "PantryItemResponse"
     ]
    },
    {
     "fn": "delete_pantry_item_route",
     "m": "DELETE",
     "p": "/pantry/items/{item_id}",
     "resp": "ItemDeleteResponse",
     "tests": {
      "api": 7,
      "n": 7,
      "red": 0,
      "web": 0
     },
     "touch": [
      "ItemDeleteResponse"
     ]
    },
    {
     "fn": "update_pantry_item",
     "m": "PATCH",
     "p": "/pantry/items/{item_id}",
     "resp": "PantryItemResponse",
     "touch": [
      "PantryItemResponse",
      "PantryItemUpdate"
     ]
    },
    {
     "fn": "assign_location",
     "m": "POST",
     "p": "/pantry/items/{item_id}/assign-location",
     "resp": "PantryItemResponse",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     },
     "touch": [
      "AssignLocationRequest",
      "Location",
      "PantryItemResponse",
      "PantryItemUpdate"
     ]
    },
    {
     "fn": "get_locations",
     "m": "GET",
     "p": "/pantry/locations",
     "resp": "LocationListResponse",
     "tests": {
      "api": 4,
      "n": 4,
      "red": 0,
      "web": 0
     },
     "touch": [
      "LocationListResponse",
      "LocationResponse"
     ]
    },
    {
     "fn": "create_location",
     "m": "POST",
     "p": "/pantry/locations",
     "resp": "LocationResponse",
     "tests": {
      "api": 8,
      "n": 8,
      "red": 0,
      "web": 0
     },
     "touch": [
      "LocationCreate",
      "LocationResponse"
     ]
    },
    {
     "fn": "remove_location",
     "guards": 1,
     "m": "DELETE",
     "p": "/pantry/locations/{location_id}",
     "resp": "\u2014",
     "touch": []
    },
    {
     "fn": "update_location",
     "m": "PATCH",
     "p": "/pantry/locations/{location_id}",
     "resp": "LocationResponse",
     "tests": {
      "api": 5,
      "n": 5,
      "red": 0,
      "web": 0
     },
     "touch": [
      "LocationResponse",
      "LocationUpdate"
     ]
    },
    {
     "fn": "get_pantry_overview",
     "m": "GET",
     "p": "/pantry/overview",
     "resp": "PantryOverviewResponse",
     "tests": {
      "api": 9,
      "n": 9,
      "red": 0,
      "web": 0
     },
     "touch": [
      "PantryItemResponse",
      "PantryOverviewResponse"
     ]
    },
    {
     "fn": "post_reset_apply",
     "m": "POST",
     "p": "/pantry/reset/apply",
     "resp": "ResetApplyResponse",
     "tests": {
      "api": 4,
      "n": 4,
      "red": 0,
      "web": 0
     },
     "touch": [
      "ResetApplyRequest",
      "ResetApplyResponse"
     ]
    },
    {
     "fn": "post_reset_preview",
     "guards": 1,
     "m": "POST",
     "p": "/pantry/reset/preview",
     "resp": "ResetPreviewResponse",
     "touch": [
      "ResetPreviewItem",
      "ResetPreviewRequest",
      "ResetPreviewResponse"
     ]
    },
    {
     "fn": "resolve_batch",
     "m": "POST",
     "p": "/pantry/resolve-batch",
     "resp": "ResolveBatchResponse",
     "tests": {
      "api": 6,
      "n": 6,
      "red": 0,
      "web": 0
     },
     "touch": [
      "BatchCandidateResponse",
      "BatchResolvedLineResponse",
      "ResolveBatchRequest",
      "ResolveBatchResponse"
     ]
    },
    {
     "fn": "get_shopping_dashboard",
     "m": "GET",
     "p": "/shopping",
     "resp": "ShoppingDashboardResponse",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     },
     "touch": [
      "ItemCandidate",
      "ShoppingDashboardResponse",
      "ShoppingItemResponse"
     ]
    },
    {
     "fn": "post_from_planned_recipes",
     "m": "POST",
     "p": "/shopping/from-planned-recipes",
     "resp": "FromPlannedRecipesResponse",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     },
     "touch": [
      "FromPlannedRecipesResponse",
      "ShoppingItemResponse"
     ]
    },
    {
     "fn": "create_shopping_item",
     "m": "POST",
     "p": "/shopping/items",
     "resp": "ShoppingItemResponse",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     },
     "touch": [
      "ShoppingItemCreate",
      "ShoppingItemResponse"
     ]
    },
    {
     "fn": "post_confirm_bought",
     "m": "POST",
     "p": "/shopping/items/{item_id}/confirm-bought",
     "resp": "BoughtConfirmationResponse",
     "tests": {
      "api": 3,
      "n": 3,
      "red": 0,
      "web": 0
     },
     "touch": [
      "BoughtConfirmationResponse"
     ]
    },
    {
     "fn": "post_add_to_list",
     "m": "POST",
     "p": "/shopping/items/{source_id}/add-to-list",
     "resp": "ShoppingItemResponse",
     "tests": {
      "api": 1,
      "n": 1,
      "red": 0,
      "web": 0
     },
     "touch": [
      "AddToListRequest",
      "ShoppingItemResponse"
     ]
    }
   ],
   "intra": [
    {
     "s": "PantryItem",
     "t": "Location",
     "via": "location_id"
    },
    {
     "s": "PantryResetDecision",
     "t": "Location",
     "via": "move_to_location_id"
    },
    {
     "s": "PantryResetDecision",
     "t": "PantryItem",
     "via": "pantry_item_id"
    },
    {
     "s": "PantryResetDecision",
     "t": "PantryResetOperation",
     "via": "reset_operation_id"
    },
    {
     "s": "PantryResetOperation",
     "t": "Location",
     "via": "scope_location_id"
    }
   ],
   "models": [
    {
     "cls": "PantryItem",
     "hub": {
      "god": true,
      "usage": 1
     },
     "nfk": 3,
     "table": "pantry_items",
     "tests": {
      "api": 14,
      "n": 14,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "IngredientHistoryEvent",
     "hub": {
      "god": false,
      "usage": 0
     },
     "nfk": 2,
     "table": "ingredient_history_events",
     "tests": {
      "api": 9,
      "n": 9,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "PantryResetOperation",
     "hub": {
      "god": false,
      "usage": 1
     },
     "nfk": 3,
     "table": "pantry_reset_operations"
    },
    {
     "cls": "PantryResetDecision",
     "hub": {
      "god": false,
      "usage": 0
     },
     "nfk": 3,
     "table": "pantry_reset_decisions"
    },
    {
     "cls": "Location",
     "hub": {
      "god": false,
      "usage": 5
     },
     "nfk": 1,
     "table": "locations",
     "tests": {
      "api": 15,
      "n": 15,
      "red": 0,
      "web": 0
     }
    }
   ],
   "schemas": [
    {
     "cls": "AddToListRequest",
     "tests": {
      "api": 1,
      "n": 1,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "AssignLocationRequest",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "BatchCandidateResponse",
     "tests": {
      "api": 6,
      "n": 6,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "BatchItemResult",
     "tests": {
      "api": 8,
      "n": 8,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "BatchResolvedLineResponse",
     "tests": {
      "api": 6,
      "n": 6,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "BoughtConfirmationResponse",
     "tests": {
      "api": 3,
      "n": 3,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "CreateBatchRequest",
     "tests": {
      "api": 8,
      "n": 8,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "CreateBatchResponse",
     "tests": {
      "api": 8,
      "n": 8,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "FrequentIngredient",
     "tests": {
      "api": 3,
      "n": 3,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "FrequentIngredientsResponse",
     "tests": {
      "api": 3,
      "n": 3,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "FromPlannedRecipesResponse",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "IngredientHistoryPage"
    },
    {
     "cls": "IngredientHistoryResponse"
    },
    {
     "cls": "ItemCandidate",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "ItemDeleteResponse",
     "tests": {
      "api": 7,
      "n": 7,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "LocationCreate",
     "tests": {
      "api": 11,
      "n": 11,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "LocationListResponse",
     "tests": {
      "api": 4,
      "n": 4,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "LocationResponse",
     "tests": {
      "api": 13,
      "n": 13,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "LocationUpdate",
     "tests": {
      "api": 5,
      "n": 5,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "PantryItemCreate",
     "tests": {
      "api": 20,
      "n": 20,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "PantryItemResponse",
     "tests": {
      "api": 21,
      "n": 21,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "PantryItemUpdate",
     "tests": {
      "api": 4,
      "n": 4,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "PantryOverviewResponse",
     "tests": {
      "api": 9,
      "n": 9,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "ResetApplyRequest",
     "tests": {
      "api": 7,
      "n": 7,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "ResetApplyResponse",
     "tests": {
      "api": 4,
      "n": 4,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "ResetPreviewItem"
    },
    {
     "cls": "ResetPreviewRequest"
    },
    {
     "cls": "ResetPreviewResponse"
    },
    {
     "cls": "ResolveBatchRequest",
     "tests": {
      "api": 6,
      "n": 6,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "ResolveBatchResponse",
     "tests": {
      "api": 6,
      "n": 6,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "ShoppingDashboardResponse",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "ShoppingItemCreate",
     "tests": {
      "api": 7,
      "n": 7,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "ShoppingItemResponse",
     "tests": {
      "api": 5,
      "n": 5,
      "red": 0,
      "web": 0
     }
    }
   ],
   "usecases": {
    "pantry/frequent-ingredients": {
     "cls": [
      "FrequentIngredient",
      "FrequentIngredientsResponse"
     ],
     "eps": [
      "GET /pantry/frequent-ingredients"
     ],
     "fns": [
      "get_frequent_ingredients"
     ]
    },
    "pantry/history": {
     "cls": [
      "IngredientHistoryPage",
      "IngredientHistoryResponse"
     ],
     "eps": [
      "GET /pantry/history"
     ],
     "fns": [
      "get_ingredient_history"
     ]
    },
    "pantry/items": {
     "cls": [
      "AssignLocationRequest",
      "BatchItemResult",
      "CreateBatchRequest",
      "CreateBatchResponse",
      "ItemDeleteResponse",
      "Location",
      "PantryItemCreate",
      "PantryItemResponse",
      "PantryItemUpdate"
     ],
     "eps": [
      "DELETE /pantry/items/{item_id}",
      "PATCH /pantry/items/{item_id}",
      "POST /pantry/items",
      "POST /pantry/items/batch",
      "POST /pantry/items/{item_id}/assign-location"
     ],
     "fns": [
      "assign_location",
      "create_pantry_item",
      "create_pantry_items_batch",
      "delete_pantry_item_route",
      "update_pantry_item"
     ]
    },
    "pantry/locations": {
     "cls": [
      "LocationCreate",
      "LocationListResponse",
      "LocationResponse",
      "LocationUpdate"
     ],
     "eps": [
      "DELETE /pantry/locations/{location_id}",
      "GET /pantry/locations",
      "PATCH /pantry/locations/{location_id}",
      "POST /pantry/locations"
     ],
     "fns": [
      "create_location",
      "get_locations",
      "remove_location",
      "update_location"
     ]
    },
    "pantry/overview": {
     "cls": [
      "PantryItemResponse",
      "PantryOverviewResponse"
     ],
     "eps": [
      "GET /pantry/overview"
     ],
     "fns": [
      "get_pantry_overview"
     ]
    },
    "pantry/reset": {
     "cls": [
      "ResetApplyRequest",
      "ResetApplyResponse",
      "ResetPreviewItem",
      "ResetPreviewRequest",
      "ResetPreviewResponse"
     ],
     "eps": [
      "POST /pantry/reset/apply",
      "POST /pantry/reset/preview"
     ],
     "fns": [
      "post_reset_apply",
      "post_reset_preview"
     ]
    },
    "pantry/resolve-batch": {
     "cls": [
      "BatchCandidateResponse",
      "BatchResolvedLineResponse",
      "ResolveBatchRequest",
      "ResolveBatchResponse"
     ],
     "eps": [
      "POST /pantry/resolve-batch"
     ],
     "fns": [
      "resolve_batch"
     ]
    },
    "shopping": {
     "cls": [
      "ItemCandidate",
      "ShoppingDashboardResponse",
      "ShoppingItemResponse"
     ],
     "eps": [
      "GET /shopping"
     ],
     "fns": [
      "get_shopping_dashboard"
     ]
    },
    "shopping/from-planned-recipes": {
     "cls": [
      "FromPlannedRecipesResponse",
      "ShoppingItemResponse"
     ],
     "eps": [
      "POST /shopping/from-planned-recipes"
     ],
     "fns": [
      "post_from_planned_recipes"
     ]
    },
    "shopping/items": {
     "cls": [
      "AddToListRequest",
      "BoughtConfirmationResponse",
      "ShoppingItemCreate",
      "ShoppingItemResponse"
     ],
     "eps": [
      "POST /shopping/items",
      "POST /shopping/items/{item_id}/confirm-bought",
      "POST /shopping/items/{source_id}/add-to-list"
     ],
     "fns": [
      "create_shopping_item",
      "post_add_to_list",
      "post_confirm_bought"
     ]
    }
   },
   "usefns": [
    {
     "fn": "_planned_required_ingredients",
     "uses": 3
    },
    {
     "fn": "_resolve_item_meta",
     "uses": 3
    },
    {
     "fn": "compute_cookability_summary",
     "uses": 1
    },
    {
     "fn": "compute_recipe_availability",
     "uses": 1
    },
    {
     "fn": "delete_pantry_item",
     "uses": 3
    },
    {
     "fn": "get_pantry_ingredient_codes",
     "uses": 2
    },
    {
     "fn": "list_frequent_ingredients",
     "uses": 3
    }
   ]
  },
  "progression": {
   "communities": {
    "c1\u00b7TreeEdge": [
     "NodeProgress",
     "SkillTree",
     "TreeEdge",
     "TreeNode"
    ],
    "c2\u00b7get_profile_": [
     "ProfileSummaryResponse",
     "get_profile_summary"
    ],
    "misc": [
     "AccountExportResponse",
     "MeResponse",
     "SettingsResponse",
     "SkillProgress"
    ]
   },
   "endpoints": [
    {
     "fn": "post_account_export",
     "m": "POST",
     "p": "/account/export",
     "resp": "AccountExportResponse",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     },
     "touch": []
    },
    {
     "fn": "get_profile_summary",
     "m": "GET",
     "p": "/profile/summary",
     "resp": "ProfileSummaryResponse",
     "tests": {
      "api": 5,
      "n": 5,
      "red": 0,
      "web": 0
     },
     "touch": [
      "ProfileSummaryResponse"
     ]
    }
   ],
   "intra": [
    {
     "s": "NodeProgress",
     "t": "TreeNode",
     "via": "tree_node_id"
    },
    {
     "s": "TreeEdge",
     "t": "SkillTree",
     "via": "skill_tree_id"
    },
    {
     "s": "TreeEdge",
     "t": "TreeNode",
     "via": "from_node_id"
    },
    {
     "s": "TreeEdge",
     "t": "TreeNode",
     "via": "to_node_id"
    },
    {
     "s": "TreeNode",
     "t": "SkillTree",
     "via": "skill_tree_id"
    }
   ],
   "models": [
    {
     "cls": "SkillTree",
     "hub": {
      "god": false,
      "usage": 2
     },
     "nfk": 0,
     "table": "skill_tree",
     "tests": {
      "api": 5,
      "n": 5,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "TreeNode",
     "hub": {
      "god": false,
      "usage": 3
     },
     "nfk": 1,
     "table": "tree_node",
     "tests": {
      "api": 7,
      "n": 7,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "TreeEdge",
     "hub": {
      "god": false,
      "usage": 0
     },
     "nfk": 3,
     "table": "tree_edge"
    },
    {
     "cls": "NodeProgress",
     "hub": {
      "god": false,
      "usage": 0
     },
     "nfk": 2,
     "table": "node_progress",
     "tests": {
      "api": 4,
      "n": 4,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "SkillProgress",
     "hub": {
      "god": false,
      "usage": 0
     },
     "nfk": 1,
     "table": "skill_progress",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     }
    }
   ],
   "schemas": [
    {
     "cls": "AccountExportResponse",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "MeResponse",
     "tests": {
      "api": 31,
      "n": 31,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "ProfileSummaryResponse",
     "tests": {
      "api": 5,
      "n": 5,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "SettingsResponse",
     "tests": {
      "api": 38,
      "n": 38,
      "red": 0,
      "web": 0
     }
    }
   ],
   "usecases": {
    "account": {
     "cls": [
      "AccountExportResponse"
     ],
     "eps": [
      "POST /account/export"
     ],
     "fns": [
      "post_account_export"
     ]
    },
    "profile": {
     "cls": [
      "ProfileSummaryResponse"
     ],
     "eps": [
      "GET /profile/summary"
     ],
     "fns": [
      "get_profile_summary"
     ]
    }
   },
   "usefns": [
    {
     "fn": "_category_map",
     "uses": 1
    },
    {
     "fn": "_compute_kind_stats",
     "uses": 3
    },
    {
     "fn": "_cooked_recipe_facts",
     "uses": 2
    },
    {
     "fn": "_cooked_recipe_skills",
     "uses": 2
    },
    {
     "fn": "_distinct_session_counts",
     "uses": 3
    },
    {
     "fn": "backfill_node_progress_on_startup",
     "uses": 1
    },
    {
     "fn": "build_profile_summary",
     "uses": 11
    },
    {
     "fn": "build_score_input",
     "uses": 1
    }
   ]
  },
  "recipe": {
   "communities": {
    "c1\u00b7Recipe": [
     "PlannedRecipe",
     "Recipe",
     "RecipeCreationRequest",
     "RecipeEquipment",
     "RecipeFilterMode",
     "RecipeIngredient",
     "RecipeStep",
     "UserRecipeFlag"
    ],
    "c2\u00b7explore_reci": [
     "ExploreResponse",
     "RecipeAvailability",
     "RecipeListItem",
     "RecipeListResponse",
     "explore_recipes",
     "search_recipes"
    ],
    "c3\u00b7get_recipe": [
     "AvisoResponse",
     "RecipeDetailResponse",
     "RecipeEquipmentItem",
     "RecipeIngredientResponse",
     "RecipeStepResponse",
     "get_recipe"
    ],
    "c4\u00b7get_cupos": [
     "CupoAttachRequest",
     "CupoResponse",
     "CuposResponse",
     "get_cupos",
     "put_cupo"
    ],
    "c5\u00b7get_creation": [
     "CreationRequestResponse",
     "ManualRecipeCreate",
     "get_creation_result",
     "post_create_manual"
    ],
    "c6\u00b7post_create_": [
     "GustifyCreateRequest",
     "GustifyCreationResponse",
     "post_create_gustify",
     "post_relief_accept"
    ],
    "c7\u00b7post_recipe_": [
     "RecipeDemand",
     "RecipeDemandCreate",
     "RecipeDemandResponse",
     "post_recipe_demand"
    ],
    "c8\u00b7patch_recipe": [
     "RecipeFlagsResponse",
     "RecipeFlagsUpdate",
     "patch_recipe_flags"
    ],
    "c9\u00b7post_plan_re": [
     "PlanRecipeRequest",
     "PlannedRecipeResponse",
     "post_plan_recipe"
    ],
    "misc": [
     "CanonicalIngredient",
     "create_recipe_filter_mode",
     "delete_cupo",
     "delete_plan_recipe",
     "delete_planned_recipe",
     "delete_recipe_filter_mode",
     "get_catalog",
     "get_recipe_filter_modes",
     "get_taxonomy",
     "stream_gustify",
     "update_recipe_filter_mode"
    ]
   },
   "endpoints": [
    {
     "fn": "delete_recipe_filter_mode",
     "guards": 1,
     "m": "DELETE",
     "p": "/",
     "resp": "\u2014",
     "touch": []
    },
    {
     "fn": "get_recipe_filter_modes",
     "guards": 1,
     "m": "GET",
     "p": "/",
     "resp": "RecipeFilterModesResponse",
     "touch": []
    },
    {
     "fn": "create_recipe_filter_mode",
     "guards": 1,
     "m": "POST",
     "p": "/",
     "resp": "RecipeFilterModeResponse",
     "touch": []
    },
    {
     "fn": "update_recipe_filter_mode",
     "guards": 1,
     "m": "PUT",
     "p": "/",
     "resp": "RecipeFilterModeResponse",
     "touch": []
    },
    {
     "fn": "get_catalog",
     "m": "GET",
     "p": "/catalog/{domain}",
     "resp": "CatalogDomainResponse",
     "tests": {
      "api": 8,
      "n": 8,
      "red": 0,
      "web": 0
     },
     "touch": []
    },
    {
     "fn": "delete_planned_recipe",
     "guards": 1,
     "m": "DELETE",
     "p": "/planned-recipes/{planned_id}",
     "resp": "\u2014",
     "touch": []
    },
    {
     "fn": "post_create_gustify",
     "m": "POST",
     "p": "/recipe-creation/gustify",
     "resp": "GustifyCreationResponse",
     "tests": {
      "api": 20,
      "n": 20,
      "red": 0,
      "web": 0
     },
     "touch": [
      "GustifyCreateRequest",
      "GustifyCreationResponse"
     ]
    },
    {
     "fn": "stream_gustify",
     "m": "GET",
     "p": "/recipe-creation/gustify/stream",
     "resp": "\u2014",
     "tests": {
      "api": 11,
      "n": 11,
      "red": 0,
      "web": 0
     },
     "touch": []
    },
    {
     "fn": "post_create_manual",
     "m": "POST",
     "p": "/recipe-creation/manual",
     "resp": "CreationRequestResponse",
     "tests": {
      "api": 14,
      "n": 14,
      "red": 0,
      "web": 0
     },
     "touch": [
      "CreationRequestResponse",
      "ManualRecipeCreate"
     ]
    },
    {
     "fn": "get_creation_result",
     "m": "GET",
     "p": "/recipe-creation/{request_id}",
     "resp": "CreationRequestResponse",
     "touch": [
      "CreationRequestResponse"
     ]
    },
    {
     "fn": "post_relief_accept",
     "m": "POST",
     "p": "/recipe-creation/{request_id}/relief-accept",
     "resp": "GustifyCreationResponse",
     "tests": {
      "api": 3,
      "n": 3,
      "red": 0,
      "web": 0
     },
     "touch": [
      "GustifyCreationResponse"
     ]
    },
    {
     "fn": "delete_cupo",
     "m": "DELETE",
     "p": "/recipe-filter-modes/{mode_id}/cupo",
     "resp": "\u2014",
     "tests": {
      "api": 1,
      "n": 1,
      "red": 0,
      "web": 0
     },
     "touch": []
    },
    {
     "fn": "put_cupo",
     "m": "PUT",
     "p": "/recipe-filter-modes/{mode_id}/cupo",
     "resp": "CupoResponse",
     "tests": {
      "api": 4,
      "n": 4,
      "red": 0,
      "web": 0
     },
     "touch": [
      "CupoAttachRequest",
      "CupoResponse"
     ]
    },
    {
     "fn": "search_recipes",
     "m": "GET",
     "p": "/recipes",
     "resp": "RecipeListResponse",
     "tests": {
      "api": 9,
      "n": 9,
      "red": 0,
      "web": 0
     },
     "touch": [
      "RecipeAvailability",
      "RecipeListItem",
      "RecipeListResponse"
     ]
    },
    {
     "fn": "post_recipe_demand",
     "m": "POST",
     "p": "/recipes/demand",
     "resp": "RecipeDemandResponse",
     "tests": {
      "api": 6,
      "n": 6,
      "red": 0,
      "web": 0
     },
     "touch": [
      "RecipeDemand",
      "RecipeDemandCreate",
      "RecipeDemandResponse"
     ]
    },
    {
     "fn": "explore_recipes",
     "guards": 1,
     "m": "GET",
     "p": "/recipes/explore",
     "resp": "ExploreResponse",
     "touch": [
      "ExploreResponse",
      "Recipe",
      "RecipeAvailability",
      "RecipeIngredient",
      "RecipeListItem"
     ]
    },
    {
     "fn": "get_recipe",
     "m": "GET",
     "p": "/recipes/{recipe_id}",
     "resp": "RecipeDetailResponse",
     "tests": {
      "api": 27,
      "n": 27,
      "red": 0,
      "web": 0
     },
     "touch": [
      "AvisoResponse",
      "RecipeAvailability",
      "RecipeDetailResponse",
      "RecipeEquipmentItem",
      "RecipeIngredientResponse",
      "RecipeStepResponse"
     ]
    },
    {
     "fn": "patch_recipe_flags",
     "m": "PATCH",
     "p": "/recipes/{recipe_id}/flags",
     "resp": "RecipeFlagsResponse",
     "tests": {
      "api": 4,
      "n": 4,
      "red": 0,
      "web": 0
     },
     "touch": [
      "RecipeFlagsResponse",
      "RecipeFlagsUpdate"
     ]
    },
    {
     "fn": "delete_plan_recipe",
     "guards": 1,
     "m": "DELETE",
     "p": "/recipes/{recipe_id}/plan",
     "resp": "\u2014",
     "touch": []
    },
    {
     "fn": "post_plan_recipe",
     "m": "POST",
     "p": "/recipes/{recipe_id}/plan",
     "resp": "PlannedRecipeResponse",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     },
     "touch": [
      "PlanRecipeRequest",
      "PlannedRecipeResponse"
     ]
    },
    {
     "fn": "get_cupos",
     "m": "GET",
     "p": "/repertorio/cupos",
     "resp": "CuposResponse",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     },
     "touch": [
      "CupoResponse",
      "CuposResponse"
     ]
    },
    {
     "fn": "get_taxonomy",
     "m": "GET",
     "p": "/taxonomy",
     "resp": "TaxonomyTreeResponse",
     "tests": {
      "api": 3,
      "n": 3,
      "red": 0,
      "web": 0
     },
     "touch": []
    }
   ],
   "intra": [
    {
     "s": "PlannedRecipe",
     "t": "Recipe",
     "via": "recipe_id"
    },
    {
     "s": "PlannedRecipe",
     "t": "RecipeFilterMode",
     "via": "cupo_id"
    },
    {
     "s": "RecipeCreationRequest",
     "t": "Recipe",
     "via": "result_recipe_id"
    },
    {
     "s": "RecipeEquipment",
     "t": "Recipe",
     "via": "recipe_id"
    },
    {
     "s": "RecipeIngredient",
     "t": "Recipe",
     "via": "recipe_id"
    },
    {
     "s": "RecipeStep",
     "t": "Recipe",
     "via": "recipe_id"
    },
    {
     "s": "UserRecipeFlag",
     "t": "Recipe",
     "via": "recipe_id"
    }
   ],
   "models": [
    {
     "cls": "Recipe",
     "hub": {
      "god": true,
      "usage": 9
     },
     "nfk": 1,
     "table": "recipes",
     "tests": {
      "api": 67,
      "n": 67,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "UserRecipeFlag",
     "hub": {
      "god": false,
      "usage": 0
     },
     "nfk": 2,
     "table": "user_recipe_flags",
     "tests": {
      "api": 4,
      "n": 4,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "RecipeIngredient",
     "hub": {
      "god": false,
      "usage": 1
     },
     "nfk": 1,
     "table": "recipe_ingredients",
     "tests": {
      "api": 14,
      "n": 14,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "RecipeEquipment",
     "hub": {
      "god": false,
      "usage": 0
     },
     "nfk": 1,
     "table": "recipe_equipment",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "RecipeStep",
     "hub": {
      "god": false,
      "usage": 1
     },
     "nfk": 1,
     "table": "recipe_steps",
     "tests": {
      "api": 7,
      "n": 7,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "RecipeCreationRequest",
     "hub": {
      "god": false,
      "usage": 0
     },
     "nfk": 2,
     "table": "recipe_creation_requests",
     "tests": {
      "api": 5,
      "n": 5,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "PlannedRecipe",
     "hub": {
      "god": false,
      "usage": 0
     },
     "nfk": 4,
     "table": "planned_recipes",
     "tests": {
      "api": 3,
      "n": 3,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "RecipeDemand",
     "hub": {
      "god": false,
      "usage": 1
     },
     "nfk": 2,
     "table": "recipe_demands",
     "tests": {
      "api": 6,
      "n": 6,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "CanonicalIngredient",
     "hub": {
      "god": false,
      "usage": 0
     },
     "nfk": 0,
     "table": "canonical_ingredients",
     "tests": {
      "api": 3,
      "n": 3,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "RecipeFilterMode",
     "hub": {
      "god": false,
      "usage": 1
     },
     "nfk": 1,
     "table": "recipe_filter_modes",
     "tests": {
      "api": 1,
      "n": 1,
      "red": 0,
      "web": 0
     }
    }
   ],
   "schemas": [
    {
     "cls": "AvisoResponse",
     "tests": {
      "api": 27,
      "n": 27,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "CreationRequestResponse",
     "tests": {
      "api": 14,
      "n": 14,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "CupoAttachRequest",
     "tests": {
      "api": 4,
      "n": 4,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "CupoResponse",
     "tests": {
      "api": 4,
      "n": 4,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "CuposResponse",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "ExploreResponse"
    },
    {
     "cls": "GustifyCreateRequest",
     "tests": {
      "api": 20,
      "n": 20,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "GustifyCreationResponse",
     "tests": {
      "api": 21,
      "n": 21,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "ManualRecipeCreate",
     "tests": {
      "api": 18,
      "n": 18,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "PlanRecipeRequest",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "PlannedRecipeResponse",
     "tests": {
      "api": 2,
      "n": 2,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "RecipeAvailability",
     "tests": {
      "api": 32,
      "n": 32,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "RecipeDemandCreate",
     "tests": {
      "api": 6,
      "n": 6,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "RecipeDemandResponse",
     "tests": {
      "api": 6,
      "n": 6,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "RecipeDetailResponse",
     "tests": {
      "api": 27,
      "n": 27,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "RecipeEquipmentItem",
     "tests": {
      "api": 27,
      "n": 27,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "RecipeFlagsResponse",
     "tests": {
      "api": 4,
      "n": 4,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "RecipeFlagsUpdate",
     "tests": {
      "api": 4,
      "n": 4,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "RecipeIngredientResponse",
     "tests": {
      "api": 27,
      "n": 27,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "RecipeListItem",
     "tests": {
      "api": 9,
      "n": 9,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "RecipeListResponse",
     "tests": {
      "api": 9,
      "n": 9,
      "red": 0,
      "web": 0
     }
    },
    {
     "cls": "RecipeStepResponse",
     "tests": {
      "api": 27,
      "n": 27,
      "red": 0,
      "web": 0
     }
    }
   ],
   "usecases": {
    "catalog": {
     "cls": [],
     "eps": [
      "GET /catalog/{domain}"
     ],
     "fns": [
      "get_catalog"
     ]
    },
    "planned-recipes": {
     "cls": [],
     "eps": [
      "DELETE /planned-recipes/{planned_id}"
     ],
     "fns": [
      "delete_planned_recipe"
     ]
    },
    "recipe-creation": {
     "cls": [
      "CreationRequestResponse",
      "GustifyCreateRequest",
      "GustifyCreationResponse",
      "ManualRecipeCreate"
     ],
     "eps": [
      "GET /recipe-creation/gustify/stream",
      "GET /recipe-creation/{request_id}",
      "POST /recipe-creation/gustify",
      "POST /recipe-creation/manual",
      "POST /recipe-creation/{request_id}/relief-accept"
     ],
     "fns": [
      "get_creation_result",
      "post_create_gustify",
      "post_create_manual",
      "post_relief_accept",
      "stream_gustify"
     ]
    },
    "recipe-filter-modes": {
     "cls": [
      "CupoAttachRequest",
      "CupoResponse"
     ],
     "eps": [
      "DELETE /recipe-filter-modes/{mode_id}/cupo",
      "PUT /recipe-filter-modes/{mode_id}/cupo"
     ],
     "fns": [
      "delete_cupo",
      "put_cupo"
     ]
    },
    "recipes": {
     "cls": [
      "AvisoResponse",
      "ExploreResponse",
      "PlanRecipeRequest",
      "PlannedRecipeResponse",
      "Recipe",
      "RecipeAvailability",
      "RecipeDemand",
      "RecipeDemandCreate",
      "RecipeDemandResponse",
      "RecipeDetailResponse",
      "RecipeEquipmentItem",
      "RecipeFlagsResponse",
      "RecipeFlagsUpdate",
      "RecipeIngredient",
      "RecipeIngredientResponse",
      "RecipeListItem",
      "RecipeListResponse",
      "RecipeStepResponse"
     ],
     "eps": [
      "DELETE /recipes/{recipe_id}/plan",
      "GET /recipes",
      "GET /recipes/explore",
      "GET /recipes/{recipe_id}",
      "PATCH /recipes/{recipe_id}/flags",
      "POST /recipes/demand",
      "POST /recipes/{recipe_id}/plan"
     ],
     "fns": [
      "delete_plan_recipe",
      "explore_recipes",
      "get_recipe",
      "patch_recipe_flags",
      "post_plan_recipe",
      "post_recipe_demand",
      "search_recipes"
     ]
    },
    "repertorio": {
     "cls": [
      "CupoResponse",
      "CuposResponse"
     ],
     "eps": [
      "GET /repertorio/cupos"
     ],
     "fns": [
      "get_cupos"
     ]
    },
    "root": {
     "cls": [],
     "eps": [
      "DELETE /",
      "GET /",
      "POST /",
      "PUT /"
     ],
     "fns": [
      "create_recipe_filter_mode",
      "delete_recipe_filter_mode",
      "get_recipe_filter_modes",
      "update_recipe_filter_mode"
     ]
    },
    "taxonomy": {
     "cls": [],
     "eps": [
      "GET /taxonomy"
     ],
     "fns": [
      "get_taxonomy"
     ]
    }
   },
   "usefns": [
    {
     "fn": "_query_domain",
     "uses": 3
    },
    {
     "fn": "apply_recipe_filters",
     "uses": 4
    },
    {
     "fn": "attach_cupo",
     "uses": 1
    },
    {
     "fn": "build_cooked_ledger",
     "uses": 3
    },
    {
     "fn": "cocinadas_for_cupo",
     "uses": 3
    },
    {
     "fn": "get_user_cooked_recipe_ids",
     "uses": 1
    },
    {
     "fn": "ingredient_allergen_exclusions",
     "uses": 3
    },
    {
     "fn": "ingredient_inclusion_conditions",
     "uses": 3
    },
    {
     "fn": "list_recipes",
     "uses": 2
    },
    {
     "fn": "load_user_allergens",
     "uses": 1
    },
    {
     "fn": "recipe_cooked_by_user",
     "uses": 1
    },
    {
     "fn": "seed_diet_preferences",
     "uses": 1
    },
    {
     "fn": "seed_ingredient_restrictions",
     "uses": 1
    },
    {
     "fn": "seed_restrictions",
     "uses": 1
    },
    {
     "fn": "seed_safety_warnings",
     "uses": 2
    },
    {
     "fn": "upsert_exploration_preferences",
     "uses": 1
    },
    {
     "fn": "upsert_ingredient_deltas",
     "uses": 2
    },
    {
     "fn": "upsert_recipe",
     "uses": 5
    }
   ]
  }
 },
 "pressure": {
  "cooking|CookingSession": 1,
  "cooking|CookingStepProgress": 1,
  "cooking|DishHistoryEvent": 1,
  "recipe|PlannedRecipe": 1,
  "recipe|RecipeFilterMode": 1
 },
 "schema_owner": {
  "AccountExportResponse": "progression",
  "ActiveCookingResponse": "cooking",
  "AddToListRequest": "pantry",
  "AdvanceStageRequest": "cooking",
  "AdvanceStageResponse": "cooking",
  "AssignLocationRequest": "pantry",
  "AvisoResponse": "recipe",
  "BatchCandidateResponse": "pantry",
  "BatchItemInput": "pantry",
  "BatchItemResult": "pantry",
  "BatchResolvedLineResponse": "pantry",
  "BoughtConfirmationResponse": "pantry",
  "CatalogPublishItem": "pantry",
  "CatalogPublishResponse": "pantry",
  "CompletionRequest": "cooking",
  "CompletionResponse": "cooking",
  "ComplexityBucket": "progression",
  "CookingPhotoRef": "cooking",
  "CookingSessionResponse": "cooking",
  "CreateBatchRequest": "pantry",
  "CreateBatchResponse": "pantry",
  "CreationRequestResponse": "recipe",
  "CupoAttachRequest": "recipe",
  "CupoResponse": "recipe",
  "CuposResponse": "recipe",
  "DegradedReadResult": "pantry",
  "DietaryBlock": "progression",
  "DietaryProfileInput": "allergen",
  "DishHistoryListResponse": "cooking",
  "DishHistoryResponse": "cooking",
  "DueRemindersResponse": "cooking",
  "ExchangeConfig": "pantry",
  "ExplorationBlock": "progression",
  "ExplorationPreferencesInput": "allergen",
  "ExplorationPreferencesPatch": "allergen",
  "ExploreResponse": "recipe",
  "FrequentIngredient": "pantry",
  "FrequentIngredientsResponse": "pantry",
  "FromPlannedRecipesResponse": "pantry",
  "GeneratedCandidateOut": "recipe",
  "GustifyCreateRequest": "recipe",
  "GustifyCreationResponse": "recipe",
  "GustifyUsage": "recipe",
  "HistorySummary": "progression",
  "HouseholdFormatBlock": "progression",
  "HouseholdFormatInput": "allergen",
  "HouseholdFormatPatch": "allergen",
  "HouseholdSummary": "progression",
  "IngredientHistoryPage": "pantry",
  "IngredientHistoryResponse": "pantry",
  "ItemCandidate": "pantry",
  "ItemDeleteResponse": "pantry",
  "LabeledCount": "progression",
  "LocationCreate": "pantry",
  "LocationListResponse": "pantry",
  "LocationResponse": "pantry",
  "LocationUpdate": "pantry",
  "ManualRecipeCreate": "recipe",
  "MarkReadRequest": "cooking",
  "MeResponse": "progression",
  "MembershipSummary": "progression",
  "NotificationBlock": "progression",
  "NotificationListResponse": "cooking",
  "NotificationPreferencesInput": "allergen",
  "NotificationResponse": "cooking",
  "PantryItemCreate": "pantry",
  "PantryItemResponse": "pantry",
  "PantryItemUpdate": "pantry",
  "PantryOverviewResponse": "pantry",
  "PlanRecipeRequest": "recipe",
  "PlannedRecipeResponse": "recipe",
  "PreferencesPatch": "allergen",
  "PreferencesSummary": "progression",
  "PrivacyBlock": "progression",
  "PrivacyPermissionsInput": "allergen",
  "ProfileProjectionResponse": "cooking",
  "ProfileSummaryResponse": "progression",
  "ReadinessUpdate": "cooking",
  "ReceiptIngestRequest": "pantry",
  "ReceiptIngestResult": "pantry",
  "ReceiptItemDTO": "pantry",
  "ReceiptItemsResult": "pantry",
  "RecipeAvailability": "recipe",
  "RecipeDemandCreate": "recipe",
  "RecipeDemandResponse": "recipe",
  "RecipeDetailResponse": "recipe",
  "RecipeEquipmentItem": "recipe",
  "RecipeFlagsResponse": "recipe",
  "RecipeFlagsUpdate": "recipe",
  "RecipeIngredientInput": "recipe",
  "RecipeIngredientResponse": "recipe",
  "RecipeListItem": "recipe",
  "RecipeListResponse": "recipe",
  "RecipeStageInput": "recipe",
  "RecipeStepInput": "recipe",
  "RecipeStepResponse": "recipe",
  "ResetApplyRequest": "pantry",
  "ResetApplyResponse": "pantry",
  "ResetDecisionInput": "pantry",
  "ResetPreviewItem": "pantry",
  "ResetPreviewRequest": "pantry",
  "ResetPreviewResponse": "pantry",
  "ResolveBatchRequest": "pantry",
  "ResolveBatchResponse": "pantry",
  "ResolvedIngredientOut": "recipe",
  "SessionCreateRequest": "cooking",
  "SessionTimerRequest": "cooking",
  "SettingsResponse": "progression",
  "SetupCompleteRequest": "auth",
  "ShoppingDashboardResponse": "pantry",
  "ShoppingItemCreate": "pantry",
  "ShoppingItemResponse": "pantry",
  "SkillUnlockSummary": "progression",
  "StageReminderResponse": "cooking",
  "StageUpdate": "cooking",
  "StepProgressResponse": "cooking",
  "StepProgressUpdate": "cooking",
  "SubscriptionSummary": "progression",
  "TreeMasterySummary": "progression",
  "UserFormatBlock": "progression",
  "UserFormatInput": "allergen",
  "UserSummary": "progression",
  "WeeklyRhythmPoint": "progression"
 },
 "use_edges": [
  {
   "cls": "SettingsResponse",
   "fn": "_build_settings",
   "fs": "allergen",
   "ts": "progression"
  },
  {
   "cls": "UserDietaryProfile",
   "fn": "_build_settings",
   "fs": "allergen",
   "ts": "allergen"
  },
  {
   "cls": "CanonicalIngredient",
   "fn": "_canonical_exists",
   "fs": "allergen",
   "ts": "recipe"
  },
  {
   "cls": "CanonicalIngredient",
   "fn": "apply_reconciliation",
   "fs": "allergen",
   "ts": "recipe"
  },
  {
   "cls": "IngredientRestriction",
   "fn": "apply_reconciliation",
   "fs": "allergen",
   "ts": "allergen"
  },
  {
   "cls": "Recipe",
   "fn": "reconcile_recipe_restrictions",
   "fs": "allergen",
   "ts": "recipe"
  },
  {
   "cls": "MeResponse",
   "fn": "_build_me_response",
   "fs": "auth",
   "ts": "progression"
  },
  {
   "cls": "UserDietaryProfile",
   "fn": "_build_me_response",
   "fs": "auth",
   "ts": "allergen"
  },
  {
   "cls": "User",
   "fn": "_load_setup_result",
   "fs": "auth",
   "ts": "auth"
  },
  {
   "cls": "UserDietaryProfile",
   "fn": "_load_setup_result",
   "fs": "auth",
   "ts": "allergen"
  },
  {
   "cls": "MeResponse",
   "fn": "_me_response_from_result",
   "fs": "auth",
   "ts": "progression"
  },
  {
   "cls": "UserDietaryProfile",
   "fn": "_upsert_dietary",
   "fs": "auth",
   "ts": "allergen"
  },
  {
   "cls": "ExplorationPreferencesInput",
   "fn": "_upsert_exploration",
   "fs": "auth",
   "ts": "allergen"
  },
  {
   "cls": "MeResponse",
   "fn": "get_me",
   "fs": "auth",
   "ts": "progression"
  },
  {
   "cls": "SettingsResponse",
   "fn": "get_settings_route",
   "fs": "auth",
   "ts": "progression"
  },
  {
   "cls": "ExplorationPreferencesInput",
   "fn": "patch_exploration",
   "fs": "auth",
   "ts": "allergen"
  },
  {
   "cls": "ExplorationPreferencesPatch",
   "fn": "patch_exploration",
   "fs": "auth",
   "ts": "allergen"
  },
  {
   "cls": "SettingsResponse",
   "fn": "patch_exploration",
   "fs": "auth",
   "ts": "progression"
  },
  {
   "cls": "HouseholdFormatPatch",
   "fn": "patch_household_settings",
   "fs": "auth",
   "ts": "allergen"
  },
  {
   "cls": "SettingsResponse",
   "fn": "patch_household_settings",
   "fs": "auth",
   "ts": "progression"
  },
  {
   "cls": "PreferencesPatch",
   "fn": "patch_preferences",
   "fs": "auth",
   "ts": "allergen"
  },
  {
   "cls": "SettingsResponse",
   "fn": "patch_preferences",
   "fs": "auth",
   "ts": "progression"
  },
  {
   "cls": "UserDietaryProfile",
   "fn": "patch_preferences",
   "fs": "auth",
   "ts": "allergen"
  },
  {
   "cls": "MeResponse",
   "fn": "setup_complete",
   "fs": "auth",
   "ts": "progression"
  },
  {
   "cls": "SetupCompleteRequest",
   "fn": "setup_complete",
   "fs": "auth",
   "ts": "auth"
  },
  {
   "cls": "CookingPhotoRef",
   "fn": "_attach_photos",
   "fs": "cooking",
   "ts": "cooking"
  },
  {
   "cls": "CookingSessionResponse",
   "fn": "_attach_photos",
   "fs": "cooking",
   "ts": "cooking"
  },
  {
   "cls": "Recipe",
   "fn": "_attach_photos",
   "fs": "cooking",
   "ts": "recipe"
  },
  {
   "cls": "Recipe",
   "fn": "_recipe_titles",
   "fs": "cooking",
   "ts": "recipe"
  },
  {
   "cls": "DishHistoryEvent",
   "fn": "_replay_completion",
   "fs": "cooking",
   "ts": "cooking"
  },
  {
   "cls": "PantryItem",
   "fn": "_replay_completion",
   "fs": "cooking",
   "ts": "pantry"
  },
  {
   "cls": "Recipe",
   "fn": "_resolve_storage_method",
   "fs": "cooking",
   "ts": "recipe"
  },
  {
   "cls": "Recipe",
   "fn": "_stages",
   "fs": "cooking",
   "ts": "recipe"
  },
  {
   "cls": "CookingSession",
   "fn": "advance_stage",
   "fs": "cooking",
   "ts": "cooking"
  },
  {
   "cls": "CookingStageReminder",
   "fn": "advance_stage",
   "fs": "cooking",
   "ts": "cooking"
  },
  {
   "cls": "Recipe",
   "fn": "advance_stage",
   "fs": "cooking",
   "ts": "recipe"
  },
  {
   "cls": "DishHistoryEvent",
   "fn": "complete_session",
   "fs": "cooking",
   "ts": "cooking"
  },
  {
   "cls": "IngredientHistoryEvent",
   "fn": "complete_session",
   "fs": "cooking",
   "ts": "pantry"
  },
  {
   "cls": "PantryItem",
   "fn": "complete_session",
   "fs": "cooking",
   "ts": "pantry"
  },
  {
   "cls": "Recipe",
   "fn": "complete_session",
   "fs": "cooking",
   "ts": "recipe"
  },
  {
   "cls": "RecipeIngredient",
   "fn": "complete_session",
   "fs": "cooking",
   "ts": "recipe"
  },
  {
   "cls": "ActiveCookingResponse",
   "fn": "get_active",
   "fs": "cooking",
   "ts": "cooking"
  },
  {
   "cls": "CookingPhotoRef",
   "fn": "get_active",
   "fs": "cooking",
   "ts": "cooking"
  },
  {
   "cls": "CookingSessionResponse",
   "fn": "get_active",
   "fs": "cooking",
   "ts": "cooking"
  },
  {
   "cls": "Recipe",
   "fn": "get_active",
   "fs": "cooking",
   "ts": "recipe"
  },
  {
   "cls": "CookingSessionResponse",
   "fn": "post_start_session",
   "fs": "cooking",
   "ts": "cooking"
  },
  {
   "cls": "Recipe",
   "fn": "post_start_session",
   "fs": "cooking",
   "ts": "recipe"
  },
  {
   "cls": "SessionCreateRequest",
   "fn": "post_start_session",
   "fs": "cooking",
   "ts": "cooking"
  },
  {
   "cls": "UserDietaryProfile",
   "fn": "post_start_session",
   "fs": "cooking",
   "ts": "allergen"
  },
  {
   "cls": "DishHistoryEvent",
   "fn": "refresh_profile_projection",
   "fs": "cooking",
   "ts": "cooking"
  },
  {
   "cls": "ProfileProjection",
   "fn": "refresh_profile_projection",
   "fs": "cooking",
   "ts": "cooking"
  },
  {
   "cls": "RecipeCreationRequest",
   "fn": "refresh_profile_projection",
   "fs": "cooking",
   "ts": "recipe"
  },
  {
   "cls": "CookingSession",
   "fn": "seed_stage_schedule",
   "fs": "cooking",
   "ts": "cooking"
  },
  {
   "cls": "CookingStageReminder",
   "fn": "seed_stage_schedule",
   "fs": "cooking",
   "ts": "cooking"
  },
  {
   "cls": "Recipe",
   "fn": "seed_stage_schedule",
   "fs": "cooking",
   "ts": "recipe"
  },
  {
   "cls": "Recipe",
   "fn": "set_session_timer",
   "fs": "cooking",
   "ts": "recipe"
  },
  {
   "cls": "RecipeStep",
   "fn": "set_session_timer",
   "fs": "cooking",
   "ts": "recipe"
  },
  {
   "cls": "CookingSession",
   "fn": "start_session",
   "fs": "cooking",
   "ts": "cooking"
  },
  {
   "cls": "Recipe",
   "fn": "start_session",
   "fs": "cooking",
   "ts": "recipe"
  },
  {
   "cls": "Location",
   "fn": "_serialize",
   "fs": "legal-consent",
   "ts": "pantry"
  },
  {
   "cls": "ConsentRecord",
   "fn": "build_account_export",
   "fs": "legal-consent",
   "ts": "legal-consent"
  },
  {
   "cls": "DishHistoryEvent",
   "fn": "build_account_export",
   "fs": "legal-consent",
   "ts": "cooking"
  },
  {
   "cls": "Location",
   "fn": "build_account_export",
   "fs": "legal-consent",
   "ts": "pantry"
  },
  {
   "cls": "PantryItem",
   "fn": "build_account_export",
   "fs": "legal-consent",
   "ts": "pantry"
  },
  {
   "cls": "Recipe",
   "fn": "build_account_export",
   "fs": "legal-consent",
   "ts": "recipe"
  },
  {
   "cls": "RecipeFilterMode",
   "fn": "build_account_export",
   "fs": "legal-consent",
   "ts": "recipe"
  },
  {
   "cls": "User",
   "fn": "build_account_export",
   "fs": "legal-consent",
   "ts": "auth"
  },
  {
   "cls": "UserDietaryProfile",
   "fn": "build_account_export",
   "fs": "legal-consent",
   "ts": "allergen"
  },
  {
   "cls": "DishHistoryEvent",
   "fn": "delete_account",
   "fs": "legal-consent",
   "ts": "cooking"
  },
  {
   "cls": "Household",
   "fn": "delete_account",
   "fs": "legal-consent",
   "ts": "auth"
  },
  {
   "cls": "Recipe",
   "fn": "delete_account",
   "fs": "legal-consent",
   "ts": "recipe"
  },
  {
   "cls": "User",
   "fn": "delete_account",
   "fs": "legal-consent",
   "ts": "auth"
  },
  {
   "cls": "PlannedRecipe",
   "fn": "_planned_required_ingredients",
   "fs": "pantry",
   "ts": "recipe"
  },
  {
   "cls": "Recipe",
   "fn": "_planned_required_ingredients",
   "fs": "pantry",
   "ts": "recipe"
  },
  {
   "cls": "RecipeIngredient",
   "fn": "_planned_required_ingredients",
   "fs": "pantry",
   "ts": "recipe"
  },
  {
   "cls": "IngredientHistoryEvent",
   "fn": "_resolve_item_meta",
   "fs": "pantry",
   "ts": "pantry"
  },
  {
   "cls": "PlannedRecipe",
   "fn": "_resolve_item_meta",
   "fs": "pantry",
   "ts": "recipe"
  },
  {
   "cls": "RecipeIngredient",
   "fn": "_resolve_item_meta",
   "fs": "pantry",
   "ts": "recipe"
  },
  {
   "cls": "Recipe",
   "fn": "compute_cookability_summary",
   "fs": "pantry",
   "ts": "recipe"
  },
  {
   "cls": "RecipeIngredient",
   "fn": "compute_recipe_availability",
   "fs": "pantry",
   "ts": "recipe"
  },
  {
   "cls": "Household",
   "fn": "delete_pantry_item",
   "fs": "pantry",
   "ts": "auth"
  },
  {
   "cls": "IngredientHistoryEvent",
   "fn": "delete_pantry_item",
   "fs": "pantry",
   "ts": "pantry"
  },
  {
   "cls": "PantryItem",
   "fn": "delete_pantry_item",
   "fs": "pantry",
   "ts": "pantry"
  },
  {
   "cls": "Household",
   "fn": "delete_pantry_item_route",
   "fs": "pantry",
   "ts": "auth"
  },
  {
   "cls": "ItemDeleteResponse",
   "fn": "delete_pantry_item_route",
   "fs": "pantry",
   "ts": "pantry"
  },
  {
   "cls": "FrequentIngredient",
   "fn": "get_frequent_ingredients",
   "fs": "pantry",
   "ts": "pantry"
  },
  {
   "cls": "FrequentIngredientsResponse",
   "fn": "get_frequent_ingredients",
   "fs": "pantry",
   "ts": "pantry"
  },
  {
   "cls": "Household",
   "fn": "get_frequent_ingredients",
   "fs": "pantry",
   "ts": "auth"
  },
  {
   "cls": "Household",
   "fn": "get_pantry_ingredient_codes",
   "fs": "pantry",
   "ts": "auth"
  },
  {
   "cls": "PantryItem",
   "fn": "get_pantry_ingredient_codes",
   "fs": "pantry",
   "ts": "pantry"
  },
  {
   "cls": "CanonicalIngredient",
   "fn": "list_frequent_ingredients",
   "fs": "pantry",
   "ts": "recipe"
  },
  {
   "cls": "Household",
   "fn": "list_frequent_ingredients",
   "fs": "pantry",
   "ts": "auth"
  },
  {
   "cls": "IngredientHistoryEvent",
   "fn": "list_frequent_ingredients",
   "fs": "pantry",
   "ts": "pantry"
  },
  {
   "cls": "BatchCandidateResponse",
   "fn": "resolve_batch",
   "fs": "pantry",
   "ts": "pantry"
  },
  {
   "cls": "BatchResolvedLineResponse",
   "fn": "resolve_batch",
   "fs": "pantry",
   "ts": "pantry"
  },
  {
   "cls": "Household",
   "fn": "resolve_batch",
   "fs": "pantry",
   "ts": "auth"
  },
  {
   "cls": "ResolveBatchRequest",
   "fn": "resolve_batch",
   "fs": "pantry",
   "ts": "pantry"
  },
  {
   "cls": "ResolveBatchResponse",
   "fn": "resolve_batch",
   "fs": "pantry",
   "ts": "pantry"
  },
  {
   "cls": "CanonicalIngredient",
   "fn": "_category_map",
   "fs": "progression",
   "ts": "recipe"
  },
  {
   "cls": "DishHistoryEvent",
   "fn": "_compute_kind_stats",
   "fs": "progression",
   "ts": "cooking"
  },
  {
   "cls": "Recipe",
   "fn": "_compute_kind_stats",
   "fs": "progression",
   "ts": "recipe"
  },
  {
   "cls": "RecipeIngredient",
   "fn": "_compute_kind_stats",
   "fs": "progression",
   "ts": "recipe"
  },
  {
   "cls": "Recipe",
   "fn": "_cooked_recipe_facts",
   "fs": "progression",
   "ts": "recipe"
  },
  {
   "cls": "RecipeIngredient",
   "fn": "_cooked_recipe_facts",
   "fs": "progression",
   "ts": "recipe"
  },
  {
   "cls": "Recipe",
   "fn": "_cooked_recipe_skills",
   "fs": "progression",
   "ts": "recipe"
  },
  {
   "cls": "RecipeIngredient",
   "fn": "_cooked_recipe_skills",
   "fs": "progression",
   "ts": "recipe"
  },
  {
   "cls": "DishHistoryEvent",
   "fn": "_distinct_session_counts",
   "fs": "progression",
   "ts": "cooking"
  },
  {
   "cls": "Recipe",
   "fn": "_distinct_session_counts",
   "fs": "progression",
   "ts": "recipe"
  },
  {
   "cls": "RecipeIngredient",
   "fn": "_distinct_session_counts",
   "fs": "progression",
   "ts": "recipe"
  },
  {
   "cls": "DishHistoryEvent",
   "fn": "backfill_node_progress_on_startup",
   "fs": "progression",
   "ts": "cooking"
  },
  {
   "cls": "DishHistoryEvent",
   "fn": "build_profile_summary",
   "fs": "progression",
   "ts": "cooking"
  },
  {
   "cls": "IngredientHistoryEvent",
   "fn": "build_profile_summary",
   "fs": "progression",
   "ts": "pantry"
  },
  {
   "cls": "NodeProgress",
   "fn": "build_profile_summary",
   "fs": "progression",
   "ts": "progression"
  },
  {
   "cls": "ProfileProjection",
   "fn": "build_profile_summary",
   "fs": "progression",
   "ts": "cooking"
  },
  {
   "cls": "ProfileSummaryResponse",
   "fn": "build_profile_summary",
   "fs": "progression",
   "ts": "progression"
  },
  {
   "cls": "Recipe",
   "fn": "build_profile_summary",
   "fs": "progression",
   "ts": "recipe"
  },
  {
   "cls": "RecipeCreationRequest",
   "fn": "build_profile_summary",
   "fs": "progression",
   "ts": "recipe"
  },
  {
   "cls": "SkillProgress",
   "fn": "build_profile_summary",
   "fs": "progression",
   "ts": "progression"
  },
  {
   "cls": "SkillTree",
   "fn": "build_profile_summary",
   "fs": "progression",
   "ts": "progression"
  },
  {
   "cls": "TreeNode",
   "fn": "build_profile_summary",
   "fs": "progression",
   "ts": "progression"
  },
  {
   "cls": "UserDietaryProfile",
   "fn": "build_profile_summary",
   "fs": "progression",
   "ts": "allergen"
  },
  {
   "cls": "Recipe",
   "fn": "build_score_input",
   "fs": "progression",
   "ts": "recipe"
  },
  {
   "cls": "CanonicalIngredient",
   "fn": "_query_domain",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "DietPreference",
   "fn": "_query_domain",
   "fs": "recipe",
   "ts": "allergen"
  },
  {
   "cls": "Restriction",
   "fn": "_query_domain",
   "fs": "recipe",
   "ts": "allergen"
  },
  {
   "cls": "DishHistoryEvent",
   "fn": "apply_recipe_filters",
   "fs": "recipe",
   "ts": "cooking"
  },
  {
   "cls": "PlannedRecipe",
   "fn": "apply_recipe_filters",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "RecipeEquipment",
   "fn": "apply_recipe_filters",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "UserRecipeFlag",
   "fn": "apply_recipe_filters",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "User",
   "fn": "attach_cupo",
   "fs": "recipe",
   "ts": "auth"
  },
  {
   "cls": "DishHistoryEvent",
   "fn": "build_cooked_ledger",
   "fs": "recipe",
   "ts": "cooking"
  },
  {
   "cls": "Recipe",
   "fn": "build_cooked_ledger",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "RecipeIngredient",
   "fn": "build_cooked_ledger",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "DishHistoryEvent",
   "fn": "cocinadas_for_cupo",
   "fs": "recipe",
   "ts": "cooking"
  },
  {
   "cls": "PlannedRecipe",
   "fn": "cocinadas_for_cupo",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "Recipe",
   "fn": "cocinadas_for_cupo",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "AvisoResponse",
   "fn": "get_recipe",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "DishHistoryEvent",
   "fn": "get_recipe",
   "fs": "recipe",
   "ts": "cooking"
  },
  {
   "cls": "PlannedRecipe",
   "fn": "get_recipe",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "Recipe",
   "fn": "get_recipe",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "RecipeAvailability",
   "fn": "get_recipe",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "RecipeDetailResponse",
   "fn": "get_recipe",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "RecipeEquipmentItem",
   "fn": "get_recipe",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "RecipeIngredientResponse",
   "fn": "get_recipe",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "RecipeStepResponse",
   "fn": "get_recipe",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "DishHistoryEvent",
   "fn": "get_user_cooked_recipe_ids",
   "fs": "recipe",
   "ts": "cooking"
  },
  {
   "cls": "IngredientRestriction",
   "fn": "ingredient_allergen_exclusions",
   "fs": "recipe",
   "ts": "allergen"
  },
  {
   "cls": "Recipe",
   "fn": "ingredient_allergen_exclusions",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "RecipeIngredient",
   "fn": "ingredient_allergen_exclusions",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "IngredientRestriction",
   "fn": "ingredient_inclusion_conditions",
   "fs": "recipe",
   "ts": "allergen"
  },
  {
   "cls": "Recipe",
   "fn": "ingredient_inclusion_conditions",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "RecipeIngredient",
   "fn": "ingredient_inclusion_conditions",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "DishHistoryEvent",
   "fn": "list_recipes",
   "fs": "recipe",
   "ts": "cooking"
  },
  {
   "cls": "Recipe",
   "fn": "list_recipes",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "UserDietaryProfile",
   "fn": "load_user_allergens",
   "fs": "recipe",
   "ts": "allergen"
  },
  {
   "cls": "Household",
   "fn": "post_recipe_demand",
   "fs": "recipe",
   "ts": "auth"
  },
  {
   "cls": "RecipeDemand",
   "fn": "post_recipe_demand",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "RecipeDemandCreate",
   "fn": "post_recipe_demand",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "RecipeDemandResponse",
   "fn": "post_recipe_demand",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "DishHistoryEvent",
   "fn": "recipe_cooked_by_user",
   "fs": "recipe",
   "ts": "cooking"
  },
  {
   "cls": "Household",
   "fn": "search_recipes",
   "fs": "recipe",
   "ts": "auth"
  },
  {
   "cls": "PlannedRecipe",
   "fn": "search_recipes",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "Recipe",
   "fn": "search_recipes",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "RecipeAvailability",
   "fn": "search_recipes",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "RecipeListItem",
   "fn": "search_recipes",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "RecipeListResponse",
   "fn": "search_recipes",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "DietPreference",
   "fn": "seed_diet_preferences",
   "fs": "recipe",
   "ts": "allergen"
  },
  {
   "cls": "IngredientRestriction",
   "fn": "seed_ingredient_restrictions",
   "fs": "recipe",
   "ts": "allergen"
  },
  {
   "cls": "Restriction",
   "fn": "seed_restrictions",
   "fs": "recipe",
   "ts": "allergen"
  },
  {
   "cls": "ContextualWarningRule",
   "fn": "seed_safety_warnings",
   "fs": "recipe",
   "ts": "allergen"
  },
  {
   "cls": "IngredientWarning",
   "fn": "seed_safety_warnings",
   "fs": "recipe",
   "ts": "allergen"
  },
  {
   "cls": "ExplorationPreferencesInput",
   "fn": "upsert_exploration_preferences",
   "fs": "recipe",
   "ts": "allergen"
  },
  {
   "cls": "CanonicalIngredient",
   "fn": "upsert_ingredient_deltas",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "IngredientRestriction",
   "fn": "upsert_ingredient_deltas",
   "fs": "recipe",
   "ts": "allergen"
  },
  {
   "cls": "CookingSession",
   "fn": "upsert_recipe",
   "fs": "recipe",
   "ts": "cooking"
  },
  {
   "cls": "Recipe",
   "fn": "upsert_recipe",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "RecipeEquipment",
   "fn": "upsert_recipe",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "RecipeIngredient",
   "fn": "upsert_recipe",
   "fs": "recipe",
   "ts": "recipe"
  },
  {
   "cls": "RecipeStep",
   "fn": "upsert_recipe",
   "fs": "recipe",
   "ts": "recipe"
  }
 ]
};
