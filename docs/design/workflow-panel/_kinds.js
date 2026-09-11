
/* ═══════════════════════════════════════════════════════════════════════════
   THE REMAINING KINDS — real feed rows, extracted 2026-09-08.
   store · module · type · web · provider · element · function.

   `function` is the odd one out: function nodes are NOT in c4-graph.js at all.
   The station mints them at :2074 from GABE_LEVELS.fn_nodes, so that row comes
   from levels.json (292 fn_nodes / 427 fn_edges) instead of the c4 feed.

   Three of these are invisible on the field today and the rows say so:
     web       all 33 screen nodes are ABSORBED at :1325 by the pieces that fetch
     type      the type layer + its 1,071 typed wires are stashed at :1334
     provider  the only provider in the feed carries ZERO edges
   ═══════════════════════════════════════════════════════════════════════════ */
ELEMENTS.push({ id:"store-ui", kind:"store", entity:"app-shell",
  label:"useUiStore", short:"useUiStore",
  note:"The richest of the feed's 6 stores \u2014 14 fields, 8 readers across 6 homes. No store carries fields AND via/ops: the one client store (localStorage) has via/ops and no fields.",
  slots:{
    ident:[ r("name","useUiStore"),
            r("kind","store · area store"),
            r("entity","app-shell — a shared frontend bucket, not a backend twin"),
            r("file","apps/web/src/store/ui.ts:68–90") ],
    op:[ r("sig","value type UiState · 14 members"),
         r("fn","— a store is not called; it is read, and written through its own setters","dim"),
         r("delivery","client state — held in the browser, never fetched"),
         r("doc","— no docstring captured","none") ],
    in:[ r("caller","8 uses-store wires — every one on the read channel","ok"),
         r("gate","— a store carries no gate","none"),
         r("payload","— setter arguments are typed in the fields, never captured as a payload","dim"),
         r("read","readers in 6 homes: app-shell 2 · pantry 2 · cooking · design-system · profile · settings") ],
    store:[ r("col","activeTab NavTab · openModalId string|null · toasts Toast[]"),
            r("col","cookingFlowActive boolean · pendingResumeSessionId string|null"),
            r("col","— the other 9 of 14 are setters, demoted to the expander","dim"),
            r("shape","UiState — named on the piece; no fe-type piece carries it, so there is no typed wire","warn") ],
    out:[ r("write","— a store is written by its own setters; all 8 wires that reach it are reads","dim"),
          r("fetch","— reaches no endpoint","none"),
          r("resp","— a store returns nothing; its readers subscribe","none"),
          r("dispatch","— nothing enqueued","none") ],
    ev:[ r("test","— not measured: no frontend piece in the feed carries a test key at all","unmeas"),
         r("journey","— named by no curated workflow","none"),
         r("flag","— not measured for frontend pieces","unmeas") ],
    place:[ r("conn","8 edges — 8 uses-store in · 0 out"),
            r("reach","— fed2w rides only the 45 pieces that reach a write fetch; a store is not one","none"),
            r("home","SHARED — app-shell by the feature layout · users say app-shell 25% of 8 · data abstains","warn"),
            r("above","cluster · root → app-shell → everything") ]
  } });
BADGE["store-ui"] = "STATE";
VITALS["store-ui"] = {
    reach:   vit(0,  4,            "na",     "—", "the FE reach meter is fed2w; the arm attaches it only to the 45 pieces that reach a write fetch"),
    surface: vit(14, VMAX.surface, "ok",     "14 fields", "the store's own fields key — 4 of the 6 stores carry one"),
    tested:  vit(0,  VMAX.tested,  "unmeas", "not measured", "no fe piece carries a test key; the adapter hardcodes tests:0 at :1305"),
    fanin:   vit(8,  VMAX.fanin,   "ok",     "8 readers", "8 uses-store wires, all read-channel"),
  };
CMDSTATE["store-ui"] = {
    callers:["lit", 8, "8 uses-store wires read it"],
    behind: ["blank", null, "a store has no call tree — the function layer is backend-only"],
    tables: ["blank", null, "a store IS the frontend's table; it reaches no server table"],
    screens:["blank", null, "the emitter never gives a store a screen — fetch sites land on hooks, components and modules"],
    expand: ["blank", null, "not a capsule"],
    walkb:  ["grey", null, "no journey is walking"], walkf:["grey", null, "no journey is walking"],
  };
ELEMENTS.push({ id:"module-cx", kind:"module", entity:"design-system",
  label:"cx", short:"cx",
  note:"154 call wires into a one-export helper \u2014 every one on the chrome channel. The second-widest fan-in in the feed, and its users say it belongs to cooking.",
  slots:{
    ident:[ r("name","cx"),
            r("kind","module · mclass lib"),
            r("entity","design-system — a shared frontend bucket"),
            r("file","apps/web/src/design-system/cx.ts — no span: module pieces carry none") ],
    op:[ r("sig","— a module piece carries no signature, only its export list","dim"),
         r("fn","exports: cx — 1 export"),
         r("delivery","imported and called — presentation plumbing"),
         r("doc","— no docstring captured","none") ],
    in:[ r("caller","154 fecall wires — 150 components · 3 modules · 1 hook","ok"),
         r("gate","— a module carries no gate","none"),
         r("payload","— call arguments are not captured","dim"),
         r("read","channel: chrome on 154 of 154 — the most-called piece in the app is pure chrome") ],
    store:[ r("col","— a module has no columns; its surface is its export list","dim"),
            r("store","— reads no client store","none"),
            r("state","— no local state: a module is not a component","none") ],
    out:[ r("fetch","— names no fetch: 2 of 108 modules carry a screen, this is not one","none"),
          r("write","— no write-channel wires","none"),
          r("resp","— return type not captured","none"),
          r("dispatch","— nothing enqueued","none") ],
    ev:[ r("test","— not measured: no frontend piece carries a test key","unmeas"),
         r("journey","— named by no curated workflow","none"),
         r("flag","— not measured for frontend pieces","unmeas") ],
    place:[ r("conn","154 edges — 154 fecall in · 0 out"),
            r("reach","— no fed2w: a module is never on the write spine","none"),
            r("home","MOVE CANDIDATE → cooking · users say cooking 63% of 154 · data abstains · also used by 5 other entities","warn"),
            r("above","cluster · root → design-system → everything") ]
  } });
BADGE["module-cx"] = "LIB";
VITALS["module-cx"] = {
    reach:   vit(0,  VMAX.reach,   "na",     "—", "a module has no call tree and no fed2w"),
    surface: vit(0,  VMAX.surface, "na",     "—", "a module has no columns; the feed gives it an export list (1) and cols stays 0"),
    tested:  vit(0,  VMAX.tested,  "unmeas", "not measured", "same hardcoded zero — no fe piece carries a test key"),
    fanin:   vit(154,154,          "ok",     "154 callers", "2.5x VMAX.fanin (61) — the max is rescaled to the value; only useT (226) is wider"),
  };
CMDSTATE["module-cx"] = {
    callers:["lit", 154, "154 fecall wires — 150 components, 3 modules, 1 hook"],
    behind: ["blank", null, "no backend call tree — the function layer is .py only"],
    tables: ["blank", null, "a frontend module touches no server table"],
    screens:["grey", 0, "this module names no fetch — 2 of 108 modules do"],
    expand: ["blank", null, "not a capsule"],
    walkb:  ["grey", null, "no journey is walking"], walkf:["grey", null, "no journey is walking"],
  };
ELEMENTS.push({ id:"type-cookrecipe", kind:"type", entity:"fe\u00b7cooking",
  label:"CookingRecipe", short:"CookingRecipe",
  note:"40 members \u2014 wider than the Recipe TABLE (38). And off-field at boot: the type layer and its 1,071 typed wires are stashed at :1334 until Types is on.",
  slots:{
    ident:[ r("name","CookingRecipe"),
            r("kind","type — the feed says fe-type; FE_KIND renames it"),
            r("entity","fe·cooking (frontend twin of cooking)"),
            r("file","apps/web/src/features/cooking/model/cookingTypes.ts:280–355") ],
    op:[ r("sig","— a type is not called; it is worn","dim"),
         r("fn","— no principal function","none"),
         r("delivery","compiler-proven shape — 279 of 508 types carry members, this is one"),
         r("doc","— no docstring captured","none") ],
    in:[ r("caller","72 typed wires — 41 components · 15 modules · 14 types · 1 store · 1 hook","ok"),
         r("gate","— a type carries no gate","none"),
         r("payload","— it IS the shape the payloads are made of","dim"),
         r("read","67 of its 72 users sit in fe·cooking; 5 in profile") ],
    store:[ r("col","id CookingRecipeId · title string · creator CookingRecipeCreator"),
            r("col","favorite boolean · planned boolean · complexity 1|2|3|4|5"),
            r("col","— 34 more of 40 — demoted to the expander","dim"),
            r("shape","6 typed wires out to sibling types in the same file","dim") ],
    out:[ r("resp","— a type returns nothing; it is what other pieces return","none"),
          r("write","— types write nothing","none"),
          r("touch","CookingDietaryTagId · CookingRecipeOriginId · CookingRecipePlanId · +3"),
          r("dispatch","— nothing enqueued","none") ],
    ev:[ r("test","— not measured: no frontend piece carries a test key","unmeas"),
         r("journey","— named by no curated workflow","none"),
         r("flag","— not measured for frontend pieces","unmeas") ],
    place:[ r("conn","78 edges — 72 typed in · 6 typed out; all 78 are stashed at boot (:1334)","warn"),
            r("reach","— no fed2w: a type is never on the write spine","none"),
            r("home","fe·cooking by the feature layout — no home_ev on the piece: the witnesses did not disagree","dim"),
            r("above","cluster · root → fe·cooking → everything") ]
  } });
BADGE["type-cookrecipe"] = "FE-TYPE";
VITALS["type-cookrecipe"] = {
    reach:   vit(0,  VMAX.reach,   "na",     "—", "a type has no call tree"),
    surface: vit(40, 40,           "ok",     "40 members", "wider than the widest TABLE in the feed (Recipe, 38) — the max is rescaled"),
    tested:  vit(0,  VMAX.tested,  "unmeas", "not measured", "no fe piece carries a test key"),
    fanin:   vit(72, 72,           "ok",     "72 typed in", "0 while Types is off — node and wires are stashed at :1334"),
  };
CMDSTATE["type-cookrecipe"] = {
    callers:["lit", 72, "72 typed wires — none of them drawn until Types is toggled on"],
    behind: ["blank", null, "a type has no call tree"],
    tables: ["blank", null, "a type is a shape, not a table"],
    screens:["blank", null, "a type never fetches"],
    neigh:  ["grey", 0, "off-field at boot — no neighbours to reveal until Types is on"],
    expand: ["blank", null, "not a capsule"],
    walkb:  ["grey", null, "no journey is walking"], walkf:["grey", null, "no journey is walking"],
  };
ELEMENTS.push({ id:"web-cooking", kind:"web", entity:"cooking",
  label:"useCookingSessions", short:"useCookingSessions",
  note:"The widest screen node \u2014 10 fetch sites, 10 bridges. And never on the universe's field: all 33 web nodes are ABSORBED at :1325 by the pieces that fetch.",
  slots:{
    ident:[ r("name","useCookingSessions"),
            r("kind","web · a screen — the fetching FILE, not an export"),
            r("entity","cooking"),
            r("file","apps/web/src/features/cooking/useCookingSessions — the id IS the path; no det, no line range","warn") ],
    op:[ r("sig","— no det at all: 5 content keys (id · kind · label · sites · slug) plus x/y","none"),
         r("fn","— none","none"),
         r("delivery","10 fetch sites — the file's own calls into the API"),
         r("doc","— none","none") ],
    in:[ r("caller","0 in-edges — nothing in the graph points at a screen node","none"),
         r("gate","— the gates stand on the endpoints it fetches","dim"),
         r("payload","— not captured","none"),
         r("read","— not captured","none") ],
    store:[ r("col","— a screen node exposes no columns","none"),
            r("store","— none","none"), r("state","— none","none"), r("shape","— none","none") ],
    out:[ r("fetch","10 bridges into cooking — POST /cooking/sessions · POST /…/complete · PATCH /…/timer · +7","warn"),
          r("write","8 of the 10 are write-method fetches (each absorbing hook carries wsites 1)"),
          r("resp","— not captured","none"),
          r("dispatch","— nothing enqueued","none") ],
    ev:[ r("test","— no det at all: there is nothing on the node to hold a case","unmeas"),
         r("journey","— named by no curated workflow","none"),
         r("flag","— not measured: 33 web + 8 external nodes are bare stubs","unmeas") ],
    place:[ r("conn","10 edges — all outbound bridges, 0 in"),
            r("reach","— no call tree on the browser side of the bridge","none"),
            r("home","cooking — the bridge's from_slug; all 10 fetches homed here","dim"),
            r("above","ABSORBED at :1325 — its 10 fetching hooks replace it and the node is deleted before the field draws","warn") ]
  } });
BADGE["web-cooking"] = "SCREEN";
VITALS["web-cooking"] = {
    reach:   vit(0,  VMAX.reach,   "na",     "—", "a screen node has no call tree"),
    surface: vit(0,  VMAX.surface, "na",     "—", "no det at all — 33 web + 8 external nodes are bare stubs"),
    tested:  vit(0,  VMAX.tested,  "unmeas", "not measured", "no det: nothing on the node can hold a case"),
    fanin:   vit(0,  VMAX.fanin,   "zero",   "0 callers", "nothing points at a screen node — all 10 of its wires leave it"),
  };
CMDSTATE["web-cooking"] = {
    callers:["grey", 0, "0 in-edges — every wire leaves a screen node"],
    behind: ["blank", null, "no call tree on the browser side"],
    tables: ["blank", null, "a screen reaches tables only through the endpoints it fetches"],
    screens:["lit", 10, "10 bridges — it IS the screen"],
    expand: ["blank", null, "not a capsule"],
    walkb:  ["grey", null, "no journey is walking"], walkf:["grey", null, "no journey is walking"],
  };
ELEMENTS.push({ id:"provider-gemini", kind:"provider", entity:"recipe",
  label:"gemini", short:"gemini",
  note:"The only provider in the feed \u2014 and it has ZERO edges. The one thing the graph knows about the LLM is its class.",
  slots:{
    ident:[ r("name","gemini"),
            r("kind","provider · pclass llm"),
            r("entity","recipe"),
            r("file","— a provider has no file: it is the edge of the system","none") ],
    op:[ r("sig","— nothing of it is in the tree","none"),
         r("fn","— none","none"),
         r("delivery","llm — what the SDK root is FOR, one class per root"),
         r("doc","— no note captured; the card falls back to its fixed line about an outside service","dim") ],
    in:[ r("caller","0 in-edges — no call edge in this feed reaches the provider","none"),
         r("gate","— none","none"),
         r("payload","— not captured","none"),
         r("read","— not captured","none") ],
    store:[ r("col","— an outside service exposes no columns to us","none"),
            r("store","— none","none"), r("state","— none","none"), r("shape","— none","none") ],
    out:[ r("resp","— not captured","none"),
          r("write","— not captured","none"),
          r("touch","— nothing: 0 edges in the whole graph","none"),
          r("dispatch","— none","none") ],
    ev:[ r("test","— no cases: det carries pclass and provider, nothing else","unmeas"),
         r("journey","— named by no curated workflow","none"),
         r("flag","— not measured","unmeas") ],
    place:[ r("conn","0 edges — like the 5 elements and 3 middleware, it is drawn beside the graph, not in it","warn"),
            r("reach","— no call tree","none"),
            r("home","recipe — the slug the emitter put on it","dim"),
            r("above","cluster · recipe → everything") ]
  } });
BADGE["provider-gemini"] = "LLM";
VITALS["provider-gemini"] = {
    reach:   vit(0,  VMAX.reach,   "na",     "—", "nothing of it is in the tree"),
    surface: vit(0,  VMAX.surface, "na",     "—", "an outside service exposes no columns to us"),
    tested:  vit(0,  VMAX.tested,  "unmeas", "not measured", "det is {pclass, provider} — two keys"),
    fanin:   vit(0,  VMAX.fanin,   "zero",   "0 callers", "no wire reaches it; the only trace of gemini in the function layer is a config reader's name inside a behind list"),
  };
CMDSTATE["provider-gemini"] = {
    callers:["grey", 0, "0 in-edges — nothing reaches it"],
    behind: ["blank", null, "an outside service has no call tree of ours"],
    tables: ["blank", null, "a provider touches no table of ours"],
    screens:["blank", null, "not fetched from the browser"],
    neigh:  ["grey", 0, "0 edges — there are no neighbours to reveal"],
    expand: ["blank", null, "not a capsule"],
    walkb:  ["grey", null, "no journey is walking"], walkf:["grey", null, "no journey is walking"],
  };
ELEMENTS.push({ id:"element-providers", kind:"element", entity:"__unclaimed__",
  label:"providers.py", short:"providers.py",
  note:"The unclaimed-file census: 5 files \u00b7 17 fns \u00b7 0 routes \u00b7 0 tables. This is the widest of them \u2014 9 top-level functions in 79 lines that no entity claims.",
  slots:{
    ident:[ r("name","providers.py"),
            r("kind","element · unmapped: true"),
            r("entity","__unclaimed__ — no entity's code.* claims this file","warn"),
            r("file","apps/api/integrations/providers.py · 79 lines") ],
    op:[ r("sig","— no signature: an element is a FILE, not a callable","dim"),
         r("fn","9 top-level fns — get_ai_adapter · get_pixellab_adapter · get_payment_adapter · +6"),
         r("delivery","— nothing in the graph calls it","none"),
         r("doc","a file under a claim root that no entity claims — an element of nothing until a claim names it","dim") ],
    in:[ r("caller","0 in-edges — the census mints the node, nothing wires it","none"),
         r("gate","— none","none"),
         r("payload","— none","none"),
         r("read","routes: 0 — the census looked","dim") ],
    store:[ r("col","— tables: [] — the census found no table in this file","dim"),
            r("store","— none","none"), r("state","— none","none"), r("shape","— none","none") ],
    out:[ r("resp","— not captured","none"),
          r("write","— tables: 0 · routes: 0","none"),
          r("touch","— nothing: the file is drawn, never wired","none"),
          r("dispatch","— none","none") ],
    ev:[ r("test","— no cases: det is {PURPOSE, file, fns, reason} and nothing else","unmeas"),
         r("journey","— named by no curated workflow","none"),
         r("flag","unclaimed — the blind spot, given a shape on purpose","warn") ],
    place:[ r("conn","0 edges — drawn in the unclaimed area so the blind spot has a size"),
            r("reach","— not walked: the element card has no behind tree","none"),
            r("home","__unclaimed__ — a claim in the entity config moves it home","warn"),
            r("above","cluster · __unclaimed__ → everything") ]
  } });
BADGE["element-providers"] = "UNMAPPED";
VITALS["element-providers"] = {
    reach:   vit(0,  VMAX.reach,   "unmeas", "not walked", "the element card has no behind tree — the census lists 9 fns and stops"),
    surface: vit(0,  VMAX.surface, "na",     "—", "a file has no columns; the census records tables: [] and routes: 0"),
    tested:  vit(0,  VMAX.tested,  "unmeas", "not measured", "det is {PURPOSE, file, fns, reason} — no case can hang on it"),
    fanin:   vit(0,  VMAX.fanin,   "zero",   "0 callers", "the census mints the node from a file glob; no edge is derived for it"),
  };
CMDSTATE["element-providers"] = {
    callers:["grey", 0, "0 edges — an unclaimed file is drawn, never wired"],
    behind: ["unmeas", null, "the element card has no behind tree — 9 fns listed, none walked"],
    tables: ["grey", 0, "tables: [] — the census looked and found none"],
    screens:["blank", null, "a backend file is not fetched"],
    neigh:  ["grey", 0, "0 edges — no neighbours to reveal"],
    expand: ["blank", null, "not a capsule"],
    walkb:  ["grey", null, "no journey is walking"], walkf:["grey", null, "no journey is walking"],
  };
ELEMENTS.push({ id:"fn-buildsettings", kind:"function", entity:"settings",
  label:"_build_settings", short:"_build_settings",
  note:"NOT in c4-graph.js: function nodes are minted at :2074 from GABE_LEVELS.fn_nodes. Named in 4 endpoints' behind.names. God-flagged, reads 6 tables \u2014 the one kind whose TABLES cell actually lights.",
  slots:{
    ident:[ r("name","_build_settings"),
            r("kind","function · role accessor · layer api"),
            r("entity","settings — the fn_node's own slug"),
            r("file","apps/api/api/user_settings.py — the mint gives it det {file, doc} only — doc is the empty string","dim") ],
    op:[ r("sig","— not minted: a function node carries no signature, only a file","none"),
         r("fn","_build_settings — god-flagged (hub.god true)","warn"),
         r("delivery","returns schema:SettingsResponse (levels schema_edges)"),
         r("doc","— the mint sets doc to the empty string","none") ],
    in:[ r("caller","4 callers, all conf extracted — get_settings_route · patch_exploration · patch_household_settings · patch_preferences","ok"),
         r("gate","— the gate stands on the four endpoints above it","dim"),
         r("payload","— arguments are not captured","dim"),
         r("dep","1 callee out — get_exploration_preferences (inferred, crosses into recipe)","dim") ],
    store:[ r("read","household_format_preferences · subscription_entitlement · user_dietary_profile","ok"),
            r("read","user_format_preferences · user_notification_preferences · user_privacy_permissions","ok"),
            r("commits","no — access.commits is false: this one only reads","dim"),
            r("col","— a function has no columns of its own","dim") ],
    out:[ r("resp","schema:SettingsResponse — 1 returns wire + 7 uses wires"),
          r("write","— no write ops: 6 reads, commits false","dim"),
          r("touch","serialises 6 blocks — DietaryBlock:93 · HouseholdFormatBlock:91 · UserFormatBlock:92 · +3"),
          r("dispatch","— nothing enqueued","none") ],
    ev:[ r("test","— not measured: the mint hardcodes tests:0 and fn_nodes carry no cases","unmeas"),
         r("journey","— named by no curated workflow","none"),
         r("flag","god — the red raider on the portrait","warn") ],
    place:[ r("conn","19 wires when Functions is ON — 4 calls in · 1 call out · 6 fnreads · 8 schema"),
            r("reach","6 fns behind · depth 3"),
            r("home","settings — 1 of 216 functions carries a move verdict, and it is not this one","dim"),
            r("above","cluster · settings → everything") ]
  } });
BADGE["fn-buildsettings"] = "ACCESSOR";
VITALS["fn-buildsettings"] = {
    reach:   vit(6,  VMAX.reach,   "ok",     "6 fns · depth 3"),
    surface: vit(0,  VMAX.surface, "na",     "—", "a function has no columns; its 6 serialise blocks live in levels.json, not in a surface metric"),
    tested:  vit(0,  VMAX.tested,  "unmeas", "not measured", "the mint sets tests:0 (:2074); fn_nodes carry no cases"),
    fanin:   vit(1,  VMAX.fanin,   "ok",     "1 (hub.usage)", "the ONE kind whose fan-in is not in-degree — the mint reads f.hub.usage; fn_edges name 4 real callers"),
  };
CMDSTATE["fn-buildsettings"] = {
    callers:["lit", 4, "4 drawn call wires in — VITALS fan-in says 1 because the mint reads hub.usage, not in-degree"],
    behind: ["lit", 6, "6 fns · depth 3"],
    tables: ["lit", 6, "6 reads — accessSec reads n.access, and the function mint copies it; the endpoint adapter at :1248 does not"],
    screens:["blank", null, "a backend function is not fetched"],
    expand: ["blank", null, "not a capsule"],
    walkb:  ["grey", null, "no journey is walking"], walkf:["grey", null, "no journey is walking"],
  };
