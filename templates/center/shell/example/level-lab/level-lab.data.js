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
