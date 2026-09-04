// DRAFT user workflows — machine-proposed by `/gabe-cc-update curate-workflows` (draft-workflows.py)
// from the committed c4-graph (head 3ea8a8af): every endpoint no curated workflow names, clustered by
// entity · the screen that drives it, steps ordered read→write, level SUGGESTED. Nothing here is curated:
// rename, reorder, set the level, then move an accepted entry into workflows.js — the next run drops it.
// Regenerated wholesale; never hand-edit. Absent or empty → the station shows no drafts.
window.GABE_WORKFLOWS_DRAFT = [
  {
    "name": "CookingFlowContainer · browse (1 endpoint)",
    "level": 1,
    "draft": true,
    "note": "draft — cooking endpoints reached from CookingFlowContainer; writes 0 model(s); level 1 suggested from no writes. Rename, reorder, set the level, then move into workflows.js.",
    "steps": [
      "GET /cooking/sessions/{session_id}/photos/{slot}"
    ],
    "cluster": {
      "entity": "cooking",
      "screen": "CookingFlowContainer"
    },
    "why": {
      "writes": 0,
      "reads": 2,
      "span": [
        "cooking"
      ]
    }
  },
  {
    "name": "Cooking · manage (6 endpoints)",
    "level": 3,
    "draft": true,
    "note": "draft — cooking endpoints reached from CookingRoute; writes 3 model(s) (CookingPhoto, CookingSession, Notification); level 3 suggested from cross-entity writes. Rename, reorder, set the level, then move into workflows.js.",
    "steps": [
      "GET /cooking/active",
      "GET /cooking/reminders/due",
      "GET /history/dishes",
      "POST /cooking/sessions/{session_id}/cancel",
      "PATCH /cooking/sessions/{session_id}/readiness",
      "DELETE /cooking/sessions/{session_id}/photos/{slot}"
    ],
    "cluster": {
      "entity": "cooking",
      "screen": "CookingRoute"
    },
    "why": {
      "writes": 3,
      "reads": 6,
      "span": [
        "cooking",
        "recipe"
      ]
    }
  },
  {
    "name": "Notifications · browse (1 endpoint)",
    "level": 1,
    "draft": true,
    "note": "draft — cooking endpoints reached from NotificationsRoute; writes 0 model(s); level 1 suggested from no writes. Rename, reorder, set the level, then move into workflows.js.",
    "steps": [
      "GET /notifications"
    ],
    "cluster": {
      "entity": "cooking",
      "screen": "NotificationsRoute"
    },
    "why": {
      "writes": 0,
      "reads": 1,
      "span": [
        "cooking"
      ]
    }
  },
  {
    "name": "Setup · browse (1 endpoint)",
    "level": 1,
    "draft": true,
    "note": "draft — legal-consent endpoints reached from SetupRoute; writes 0 model(s); level 1 suggested from no writes. Rename, reorder, set the level, then move into workflows.js.",
    "steps": [
      "GET /consent"
    ],
    "cluster": {
      "entity": "legal-consent",
      "screen": "SetupRoute"
    },
    "why": {
      "writes": 0,
      "reads": 1,
      "span": [
        "legal-consent"
      ]
    }
  },
  {
    "name": "Cooking · add (2 endpoints)",
    "level": 1,
    "draft": true,
    "note": "draft — pantry endpoints reached from CookingRoute; writes 0 model(s); level 1 suggested from no writes. Rename, reorder, set the level, then move into workflows.js.",
    "steps": [
      "GET /pantry/locations",
      "POST /pantry/resolve-batch"
    ],
    "cluster": {
      "entity": "pantry",
      "screen": "CookingRoute"
    },
    "why": {
      "writes": 0,
      "reads": 4,
      "span": [
        "pantry",
        "recipe"
      ]
    }
  },
  {
    "name": "IngredientHistory · browse (1 endpoint)",
    "level": 1,
    "draft": true,
    "note": "draft — pantry endpoints reached from IngredientHistoryRoute; writes 0 model(s); level 1 suggested from no writes. Rename, reorder, set the level, then move into workflows.js.",
    "steps": [
      "GET /pantry/history"
    ],
    "cluster": {
      "entity": "pantry",
      "screen": "IngredientHistoryRoute"
    },
    "why": {
      "writes": 0,
      "reads": 1,
      "span": [
        "pantry"
      ]
    }
  },
  {
    "name": "Pantry · add (3 endpoints)",
    "level": 3,
    "draft": true,
    "note": "draft — pantry endpoints reached from PantryRoute; writes 4 model(s) (IngredientHistoryEvent, PantryItem, PantryResetDecision, PantryResetOperation); level 3 suggested from cross-entity writes. Rename, reorder, set the level, then move into workflows.js.",
    "steps": [
      "GET /pantry/frequent-ingredients",
      "POST /pantry/reset/apply",
      "POST /pantry/reset/preview"
    ],
    "cluster": {
      "entity": "pantry",
      "screen": "PantryRoute"
    },
    "why": {
      "writes": 4,
      "reads": 4,
      "span": [
        "pantry",
        "recipe"
      ]
    }
  },
  {
    "name": "Shopping · add (1 endpoint)",
    "level": 3,
    "draft": true,
    "note": "draft — pantry endpoints reached from ShoppingRoute; writes 1 model(s) (ShoppingItem); level 3 suggested from cross-entity writes. Rename, reorder, set the level, then move into workflows.js.",
    "steps": [
      "POST /shopping/items/{source_id}/add-to-list"
    ],
    "cluster": {
      "entity": "pantry",
      "screen": "ShoppingRoute"
    },
    "why": {
      "writes": 1,
      "reads": 4,
      "span": [
        "pantry",
        "recipe"
      ]
    }
  },
  {
    "name": "Home · browse (1 endpoint)",
    "level": 1,
    "draft": true,
    "note": "draft — progression endpoints reached from HomeRoute; writes 0 model(s); level 1 suggested from no writes. Rename, reorder, set the level, then move into workflows.js.",
    "steps": [
      "GET /profile/summary"
    ],
    "cluster": {
      "entity": "progression",
      "screen": "HomeRoute"
    },
    "why": {
      "writes": 0,
      "reads": 7,
      "span": [
        "allergen",
        "auth",
        "cooking",
        "progression",
        "recipe"
      ]
    }
  },
  {
    "name": "Cooking · browse (1 endpoint)",
    "level": 1,
    "draft": true,
    "note": "draft — recipe endpoints reached from CookingRoute; writes 0 model(s); level 1 suggested from no writes. Rename, reorder, set the level, then move into workflows.js.",
    "steps": [
      "GET /equipment"
    ],
    "cluster": {
      "entity": "recipe",
      "screen": "CookingRoute"
    },
    "why": {
      "writes": 0,
      "reads": 1,
      "span": [
        "recipe"
      ]
    }
  },
  {
    "name": "Setup · edit (2 endpoints)",
    "level": 1,
    "draft": true,
    "note": "draft — settings endpoints reached from SetupRoute; writes 0 model(s); level 1 suggested from no writes. Rename, reorder, set the level, then move into workflows.js.",
    "steps": [
      "PATCH /settings/household",
      "PATCH /settings/preferences"
    ],
    "cluster": {
      "entity": "settings",
      "screen": "SetupRoute"
    },
    "why": {
      "writes": 0,
      "reads": 7,
      "span": [
        "allergen",
        "auth",
        "settings"
      ]
    }
  }
];
