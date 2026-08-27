/* Curated USER WORKFLOWS for the Gabe Universe journeys picker (the "workflows" tab).
   Each workflow = the operator's user-facing story, expressed as the ordered API endpoints it
   drives; the station walks each endpoint's DRAWN backend chain (handler → calls → writes → models)
   in this order. An endpoint the map has no chain for is COUNTED as unmapped on the row, never
   silently dropped. Labels must match the station's endpoint labels exactly ("METHOD /path").
   Home: the center's own dir beside c4-graph.js — one file per project, honest-empty when absent.
   gustify · curated 2026-08-27 from the operator's list. */
window.GABE_WORKFLOWS = [
  { name: "Initial setup — first run",
    note: "consent first, then the one atomic setup transaction, then the app reads the fresh profile",
    steps: ["POST /consent", "POST /setup/complete", "GET /me", "GET /settings"] },
  { name: "Look for recipes",
    note: "the discovery read path: explore → list → open one recipe",
    steps: ["GET /recipes/explore", "GET /recipes", "GET /recipes/{recipe_id}"] },
  { name: "Filter recipes",
    note: "taxonomy + filter modes (cupos) drive the explore query; flags tune one recipe",
    steps: ["GET /taxonomy", "GET /repertorio/cupos", "PUT /recipe-filter-modes/{mode_id}/cupo", "GET /recipes/explore", "PATCH /recipes/{recipe_id}/flags"] },
  { name: "Cook a recipe — the cooking session",
    note: "start → advance stages/steps → timer → complete (leftovers → pantry, history events)",
    steps: ["POST /cooking/sessions", "PATCH /cooking/sessions/{session_id}/stage", "PATCH /cooking/sessions/{session_id}/steps/{step_id}", "PATCH /cooking/sessions/{session_id}/timer", "POST /cooking/sessions/{session_id}/complete"] },
  { name: "Store ingredients — add to the pantry",
    note: "one item or a batch, edit it, see the overview",
    steps: ["POST /pantry/items", "POST /pantry/items/batch", "PATCH /pantry/items/{item_id}", "GET /pantry/overview"] },
  { name: "Pantry locations",
    note: "create a location, assign an item to it, edit, remove",
    steps: ["POST /pantry/locations", "POST /pantry/items/{item_id}/assign-location", "PATCH /pantry/locations/{location_id}", "DELETE /pantry/locations/{location_id}"] },
  { name: "Shopping list",
    note: "add items (by hand or from planned recipes), see the list, confirm bought → pantry",
    steps: ["POST /shopping/items", "POST /shopping/from-planned-recipes", "GET /shopping", "POST /shopping/items/{item_id}/confirm-bought"] },
  { name: "Plan a recipe",
    note: "plan → shopping from the plan → unplan",
    steps: ["POST /recipes/{recipe_id}/plan", "POST /shopping/from-planned-recipes", "DELETE /recipes/{recipe_id}/plan"] }
];
