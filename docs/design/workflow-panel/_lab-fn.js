/* GENERATED 2026-09-09 by gen_fn_facts.py (a session-scratchpad script, LOST with that scratchpad — a FROZEN
   SNAPSHOT @ gustify head 8356f531; rewrite the generator before the next kind). Source: the frozen gustify
   feed (levels.json · c4-graph.js) + the station's own lines. Do not edit by hand. */
window.LABFN = {
 "id": "apps/api/api/user_settings.py#_build_settings",
 "name": "_build_settings",
 "slug": "settings",
 "lang": "py",
 "layer": "api",
 "role": "accessor",
 "handler": false,
 "god": true,
 "hub": {
  "god": true,
  "usage": 1
 },
 "file": "apps/api/api/user_settings.py",
 "flines": 61,
 "sig": {
  "async": true,
  "returns": "SettingsResponse"
 },
 "doc": null,
 "behind": {
  "depth": 3,
  "fns": 6,
  "names": [
   "AuthContext.require_household",
   "allowance_for",
   "credits_summary",
   "credits_used_this_month",
   "get_exploration_preferences",
   "month_start"
  ]
 },
 "behind_names": [
  {
   "name": "AuthContext.require_household",
   "resolved": [
    "apps/api/auth/context.py#AuthContext.require_household"
   ],
   "role": "gate",
   "slug": "auth",
   "hidden": false
  },
  {
   "name": "allowance_for",
   "resolved": [],
   "role": null,
   "slug": null,
   "hidden": true
  },
  {
   "name": "credits_summary",
   "resolved": [
    "apps/api/services/ai_credits.py#credits_summary"
   ],
   "role": "pure",
   "slug": "progression",
   "hidden": false
  },
  {
   "name": "credits_used_this_month",
   "resolved": [
    "apps/api/services/ai_credits.py#credits_used_this_month"
   ],
   "role": "pure",
   "slug": "progression",
   "hidden": false
  },
  {
   "name": "get_exploration_preferences",
   "resolved": [
    "apps/api/services/exploration.py#get_exploration_preferences"
   ],
   "role": "accessor",
   "slug": "recipe",
   "hidden": false
  },
  {
   "name": "month_start",
   "resolved": [],
   "role": null,
   "slug": null,
   "hidden": true
  }
 ],
 "access": {
  "commits": false,
  "ops": [
   {
    "model": "HouseholdFormatPreferences",
    "rw": "r",
    "table": "household_format_preferences"
   },
   {
    "model": "SubscriptionEntitlement",
    "rw": "r",
    "table": "subscription_entitlement"
   },
   {
    "model": "UserDietaryProfile",
    "rw": "r",
    "table": "user_dietary_profile"
   },
   {
    "model": "UserFormatPreferences",
    "rw": "r",
    "table": "user_format_preferences"
   },
   {
    "model": "UserNotificationPreferences",
    "rw": "r",
    "table": "user_notification_preferences"
   },
   {
    "model": "UserPrivacyPermissions",
    "rw": "r",
    "table": "user_privacy_permissions"
   }
  ],
  "serializes": [
   {
    "cls": "DietaryBlock",
    "line": 93,
    "model": null
   },
   {
    "cls": "ExplorationBlock",
    "line": 95,
    "model": null
   },
   {
    "cls": "HouseholdFormatBlock",
    "line": 91,
    "model": null
   },
   {
    "cls": "NotificationBlock",
    "line": 100,
    "model": null
   },
   {
    "cls": "PrivacyBlock",
    "line": 99,
    "model": null
   },
   {
    "cls": "UserFormatBlock",
    "line": 92,
    "model": null
   }
  ]
 },
 "d2w": null,
 "sinks": null,
 "flags": null,
 "callers": [
  {
   "id": "apps/api/api/user_settings.py#get_settings_route",
   "fn": "get_settings_route",
   "conf": "extracted",
   "rel": "calls",
   "entity": "settings",
   "endpoint": "GET /settings",
   "endpoint_id": "endpoint:GET /settings",
   "ep_behind": {
    "depth": 4,
    "fns": 7,
    "names": [
     "AuthContext.require_household",
     "_build_settings",
     "allowance_for",
     "credits_summary",
     "credits_used_this_month",
     "get_exploration_preferences",
     "month_start"
    ]
   },
   "ep_tests": null,
   "guards": 5,
   "tests_piece": {
    "api": 7,
    "n": 7,
    "red": 0,
    "web": 0
   }
  },
  {
   "id": "apps/api/api/user_settings.py#patch_exploration",
   "fn": "patch_exploration",
   "conf": "extracted",
   "rel": "calls",
   "entity": "settings",
   "endpoint": "PATCH /settings/exploration",
   "endpoint_id": "endpoint:PATCH /settings/exploration",
   "ep_behind": {
    "depth": 4,
    "fns": 8,
    "names": [
     "AuthContext.require_household",
     "_build_settings",
     "allowance_for",
     "credits_summary",
     "credits_used_this_month",
     "get_exploration_preferences",
     "month_start",
     "upsert_exploration_preferences"
    ]
   },
   "ep_tests": null,
   "guards": 5,
   "tests_piece": {
    "api": 23,
    "n": 23,
    "red": 0,
    "web": 0
   }
  },
  {
   "id": "apps/api/api/user_settings.py#patch_household_settings",
   "fn": "patch_household_settings",
   "conf": "extracted",
   "rel": "calls",
   "entity": "settings",
   "endpoint": "PATCH /settings/household",
   "endpoint_id": "endpoint:PATCH /settings/household",
   "ep_behind": {
    "depth": 4,
    "fns": 7,
    "names": [
     "AuthContext.require_household",
     "_build_settings",
     "allowance_for",
     "credits_summary",
     "credits_used_this_month",
     "get_exploration_preferences",
     "month_start"
    ]
   },
   "ep_tests": null,
   "guards": 5,
   "tests_piece": {
    "api": 7,
    "n": 7,
    "red": 0,
    "web": 0
   }
  },
  {
   "id": "apps/api/api/user_settings.py#patch_preferences",
   "fn": "patch_preferences",
   "conf": "extracted",
   "rel": "calls",
   "entity": "settings",
   "endpoint": "PATCH /settings/preferences",
   "endpoint_id": "endpoint:PATCH /settings/preferences",
   "ep_behind": {
    "depth": 4,
    "fns": 8,
    "names": [
     "AuthContext.require_household",
     "_build_settings",
     "allowance_for",
     "clean_tags",
     "credits_summary",
     "credits_used_this_month",
     "get_exploration_preferences",
     "month_start"
    ]
   },
   "ep_tests": null,
   "guards": 5,
   "tests_piece": {
    "api": 7,
    "n": 7,
    "red": 0,
    "web": 0
   }
  }
 ],
 "callees": [
  {
   "id": "apps/api/services/exploration.py#get_exploration_preferences",
   "fn": "get_exploration_preferences",
   "conf": "inferred",
   "rel": "calls",
   "entity": "recipe",
   "crosses": true
  }
 ],
 "above_endpoints": [
  {
   "id": "endpoint:GET /settings",
   "label": "GET /settings",
   "behind": {
    "depth": 4,
    "fns": 7,
    "names": [
     "AuthContext.require_household",
     "_build_settings",
     "allowance_for",
     "credits_summary",
     "credits_used_this_month",
     "get_exploration_preferences",
     "month_start"
    ]
   }
  },
  {
   "id": "endpoint:PATCH /settings/exploration",
   "label": "PATCH /settings/exploration",
   "behind": {
    "depth": 4,
    "fns": 8,
    "names": [
     "AuthContext.require_household",
     "_build_settings",
     "allowance_for",
     "credits_summary",
     "credits_used_this_month",
     "get_exploration_preferences",
     "month_start",
     "upsert_exploration_preferences"
    ]
   }
  },
  {
   "id": "endpoint:PATCH /settings/household",
   "label": "PATCH /settings/household",
   "behind": {
    "depth": 4,
    "fns": 7,
    "names": [
     "AuthContext.require_household",
     "_build_settings",
     "allowance_for",
     "credits_summary",
     "credits_used_this_month",
     "get_exploration_preferences",
     "month_start"
    ]
   }
  },
  {
   "id": "endpoint:PATCH /settings/preferences",
   "label": "PATCH /settings/preferences",
   "behind": {
    "depth": 4,
    "fns": 8,
    "names": [
     "AuthContext.require_household",
     "_build_settings",
     "allowance_for",
     "clean_tags",
     "credits_summary",
     "credits_used_this_month",
     "get_exploration_preferences",
     "month_start"
    ]
   }
  }
 ],
 "schemas": {
  "returns": [
   "schema:SettingsResponse"
  ],
  "uses": [
   "schema:DietaryBlock",
   "schema:ExplorationBlock",
   "schema:HouseholdFormatBlock",
   "schema:NotificationBlock",
   "schema:PrivacyBlock",
   "schema:SubscriptionSummary",
   "schema:UserFormatBlock"
  ],
  "other": []
 },
 "use_edges": [
  {
   "cls": "UserDietaryProfile",
   "fn": "_build_settings",
   "fs": "settings",
   "ts": "allergen"
  },
  {
   "cls": "SubscriptionEntitlement",
   "fn": "_build_settings",
   "fs": "settings",
   "ts": "auth"
  },
  {
   "cls": "DietaryBlock",
   "fn": "_build_settings",
   "fs": "settings",
   "ts": "recipe"
  },
  {
   "cls": "ExplorationBlock",
   "fn": "_build_settings",
   "fs": "settings",
   "ts": "recipe"
  },
  {
   "cls": "HouseholdFormatBlock",
   "fn": "_build_settings",
   "fs": "settings",
   "ts": "recipe"
  },
  {
   "cls": "NotificationBlock",
   "fn": "_build_settings",
   "fs": "settings",
   "ts": "recipe"
  },
  {
   "cls": "PrivacyBlock",
   "fn": "_build_settings",
   "fs": "settings",
   "ts": "recipe"
  },
  {
   "cls": "SubscriptionSummary",
   "fn": "_build_settings",
   "fs": "settings",
   "ts": "recipe"
  },
  {
   "cls": "UserFormatBlock",
   "fn": "_build_settings",
   "fs": "settings",
   "ts": "recipe"
  }
 ],
 "cross_entities": [
  "allergen",
  "auth",
  "recipe"
 ],
 "homing": null,
 "homing_fn_verdicts": {
  "stay": 63,
  "shared": 2,
  "move": 1
 },
 "via_callers": {
  "cases": 38,
  "case_states": {
   "pass": 38
  },
  "journeys": 17,
  "per": [
   {
    "fn": "get_settings_route",
    "endpoint": "GET /settings",
    "cases": 7,
    "case_files": 3,
    "journeys": 6,
    "states": {
     "pass": 7
    }
   },
   {
    "fn": "patch_exploration",
    "endpoint": "PATCH /settings/exploration",
    "cases": 23,
    "case_files": 0,
    "journeys": 6,
    "states": {
     "pass": 23
    }
   },
   {
    "fn": "patch_household_settings",
    "endpoint": "PATCH /settings/household",
    "cases": 7,
    "case_files": 1,
    "journeys": 6,
    "states": {
     "pass": 7
    }
   },
   {
    "fn": "patch_preferences",
    "endpoint": "PATCH /settings/preferences",
    "cases": 7,
    "case_files": 3,
    "journeys": 6,
    "states": {
     "pass": 7
    }
   }
  ],
  "curated_mentions": 3,
  "curated_initial_setup": true
 },
 "model_homes": {
  "derived": "d:household_format_preferences"
 },
 "god_rule_lines": 50,
 "rel_feed": {
  "calls": 344,
  "depends": 81,
  "dispatches": 2
 },
 "hidden": {
  "entity": 8,
  "feed": 2150,
  "behind_hidden": [
   "allowance_for",
   "month_start"
  ]
 },
 "names_more": null,
 "names_cap_hit_feed": 39,
 "screens_via_callers": {
  "bridges": 4,
  "hooks": [
   "fetch"
  ],
  "screens": [
   "web:apps/web/src/features/auth/useRedoSetup",
   "web:apps/web/src/features/profile/useExplorationPrefs",
   "web:apps/web/src/features/settings/useSettings"
  ],
  "per": [
   {
    "from": "web:apps/web/src/features/settings/useSettings",
    "via": "fetch",
    "to": "endpoint:GET /settings"
   },
   {
    "from": "web:apps/web/src/features/auth/useRedoSetup",
    "via": "fetch",
    "to": "endpoint:PATCH /settings/household"
   },
   {
    "from": "web:apps/web/src/features/auth/useRedoSetup",
    "via": "fetch",
    "to": "endpoint:PATCH /settings/preferences"
   },
   {
    "from": "web:apps/web/src/features/profile/useExplorationPrefs",
    "via": "fetch",
    "to": "endpoint:PATCH /settings/exploration"
   }
  ]
 },
 "gates_via_callers": [
  {
   "endpoint": "GET /settings",
   "gates": [
    "get_auth_context"
   ],
   "middleware": [
    "get_auth_context",
    "get_session",
    "get_settings"
   ]
  },
  {
   "endpoint": "PATCH /settings/exploration",
   "gates": [
    "get_auth_context"
   ],
   "middleware": [
    "get_auth_context",
    "get_session",
    "get_settings"
   ]
  },
  {
   "endpoint": "PATCH /settings/household",
   "gates": [
    "get_auth_context"
   ],
   "middleware": [
    "get_auth_context",
    "get_session",
    "get_settings"
   ]
  },
  {
   "endpoint": "PATCH /settings/preferences",
   "gates": [
    "get_auth_context"
   ],
   "middleware": [
    "get_auth_context",
    "get_session",
    "get_settings"
   ]
  }
 ],
 "communities": [],
 "usecases": [],
 "homing_rule": {
  "move_min_users": 2,
  "move_share": 0.6,
  "shared_min": 3,
  "text": "agree = every witness names the file's entity · move candidate = ≥60% of ≥2 users in ONE other entity, data agrees or abstains · shared = ≥3 consuming entities, none ≥60% · stay = below both bars, the file wins · evidence only, nothing re-homed"
 },
 "inflight": {
  "commit": "a99719f3",
  "touched_n": 28,
  "touches_file": false,
  "touches_fn": false,
  "stages": [
   "commit",
   "execute",
   "red",
   "review"
  ]
 },
 "entity_counts": {
  "endpoints": 5,
  "files": 4,
  "hidden_fns": 8,
  "lines": 647,
  "models": 5,
  "schemas": 5
 },
 "behind_p95_feed": 38,
 "behind_notch_console": 30,
 "join": {
  "detail_key": "fn:settings|_build_settings",
  "file_matches_id": true,
  "feed_mismatches": 0
 },
 "homing_stats_function": {
  "move": 1,
  "pieces": 216,
  "shared": 2
 },
 "in_degree": 4,
 "out_degree": 1,
 "feed": {
  "fn_nodes": 292,
  "fn_edges": 427,
  "schema_edges": 77,
  "use_edges": 173,
  "details": 291,
  "in_degree_p95": 3,
  "in_degree_max": 78,
  "behind_p95": 30,
  "behind_max": 135,
  "roles": {
   "caller": 95,
   "pure": 36,
   "accessor": 156,
   "gate": 5
  },
  "gods": 42
 },
 "station": {
  "mint_line": 2104,
  "det_line": 2110,
  "card_line": 5760,
  "card_order": [
   "usage",
   "modelRow",
   "accessSec",
   "liveConns",
   "behindTree",
   "testsSec",
   "identSec",
   "sigSec",
   "docSec",
   "fileRowSec"
  ],
  "helpers": {
   "usage": 5517,
   "usageN": 5736,
   "accessSec": 5692,
   "liveConns": 5699,
   "behindTree": 5669,
   "testsSec": 5552,
   "identSec": 5741,
   "sigSec": 5712,
   "docSec": 5727,
   "fileRowSec": 5728,
   "modelRow": 5829
  },
  "mint_copies": [
   "id",
   "kind",
   "ent=slug",
   "label=name",
   "role",
   "access",
   "sinks",
   "d2w",
   "m.behind",
   "m.depth",
   "m.tests=0",
   "m.cols=0",
   "m.fanin=hub.usage",
   "m.god",
   "det.file",
   "det.doc=\"\""
  ],
  "mint_drops": [
   "detail.sig (async · returns)",
   "detail.flines",
   "detail.doc",
   "layer (rewritten to KINDS.function.layer = 'api' for all 292)",
   "handler",
   "lang",
   "flags",
   "fn_edges conf (every call wire loses extracted/inferred)",
   "fn_edges in-degree (fanin reads hub.usage instead)"
  ]
 },
 "feedwide": {
  "name": "292/292",
  "file": "292/292",
  "lines": "288/292",
  "sig": "288/292",
  "async": "258/292",
  "doc": "200/292",
  "role": "292/292",
  "layer": "292/292",
  "handler": "80/292",
  "god": "42/292",
  "entity": "292/292",
  "callers": "201/292",
  "callees": "145/292",
  "behind": "189/292",
  "tables": "158/292",
  "commits": "64/292",
  "serializes": "9/292",
  "schemas": "26/292",
  "uses": "89/292",
  "d2w": "152/292",
  "sinks": "1/292",
  "flags": "4/292",
  "tests": "0/292",
  "journeys": "0/292",
  "homing": "66/292",
  "pressure": "0/292"
 }
};
