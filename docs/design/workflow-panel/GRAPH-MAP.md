# Does the panel map to the real graph?

Every one of the console's 16 demo elements checked against the live feed. **16 of 16 map to a real
node** — nothing in the panel is invented. Two things are worth knowing before you compare, and one
of them is a station finding rather than a panel one.

## The source, first

The panel is built on **gustify**, the suite's frozen example centre in this repo:

    templates/center/shell/example/codebase-graph-station/c4-graph.js   (window.GABE_C4)
    templates/center/shell/example/codebase-graph-station/levels.json   (fn_nodes)

**Not gastify** — there is no gastify centre in this checkout. If you want the comparison against
gastify instead, that is a different feed and the demo rows would have to be re-extracted from it.

## Open the station beside the panel

    templates/center/shell/example/codebase-graph-station/gabe-universe.html

Add `?panel=<id>` to open straight onto an element. The station reads `panel · link · journey · ent ·
cam · drive` from the URL (`gabe-universe.html:6362`).

## The 16, and where each one lives

| kind | panel element | `?panel=` id | drawn on the field? |
|---|---|---|---|
| `endpoint` | POST /recipe-creation/{request_id}/rel | `endpoint:POST /recipe-creation/{request_id}/relief-accept` | yes |
| `model` | Recipe | `model:Recipe` | yes |
| `component` | RecipeBrowseContainer | `fe:apps/web/src/features/cooking/RecipeBrowseContainer.tsx` | yes |
| `hook` | useRedoSetup | `fe:apps/web/src/features/auth/useRedoSetup.ts#useRedoSetup` | yes |
| `schema` | ShoppingItemResponse | `schema:ShoppingItemResponse` | yes |
| `route` | LegalDocumentPage | `fe:apps/web/src/features/legal/LegalDocumentPage.tsx#Legal` | yes |
| `external` | Auth | `external:auth` | yes |
| `middleware` | IdempotencyMiddleware | `middleware:IdempotencyMiddleware` | yes |
| `flag` | RECIPE_CREATION_ENABLED | `flag:RECIPE_CREATION_ENABLED` | yes |
| `store` | useUiStore | `fe:apps/web/src/store/ui.ts#useUiStore` | yes |
| `module` | cx | `fe:apps/web/src/design-system/cx.ts` | yes |
| `type` | CookingRecipe | `fe:apps/web/src/features/cooking/model/cookingTypes.ts#Coo` | off at boot |
| `web` | useCookingSessions | `web:apps/web/src/features/cooking/useCookingSessions` | **NO** |
| `provider` | gemini | `provider:gemini` | yes |
| `element` | providers.py | `element:apps/api/integrations/providers.py` | yes |
| `function` | _build_settings | `apps/api/api/user_settings.py#_build_settings` | Functions layer |

## Three that you will NOT find by clicking the field

These map to real feed nodes, but the station does not draw them where you would look:

| kind | why |
|---|---|
| **web** | all 33 screen nodes are **absorbed at `:1325`** by the pieces that fetch them — the node exists in the feed and is never a planet |
| **type** | the type layer and its 1,071 typed wires are **stashed at `:1334`** until you toggle Types on |
| **function** | function nodes are **not in `c4-graph.js` at all** — the station mints them at `:2074` from `levels.json`, so they appear only with the Functions layer on |

If the panel shows one of these and the field looks empty, the field is right and the panel is
showing you something the graph knows but does not plot.

## The one genuine mismatch — and it is the station's

`external:auth` is the only node id in the whole feed that appears in **more than one entity block**
— it is in **seven** of them (`allergen · cooking · legal-consent · pantry · progression · recipe ·
settings`). Measured: 1 duplicated id out of 307 distinct.

And `auth` is **not one of the seven**, despite an `auth` entity existing.

The station dedups first-wins (`adapter :1243`, `if (NIDS[p.id]) return`), so which entity Auth
lands in is decided by `Object.entries(c4.l2)` iteration order — today that is **`allergen`**.

- the **panel** says `auth`, reading the node's own id
- the **station** will show `allergen`, reading whichever block came first
- the node is in **neither** by placement, because it is in seven others

Neither is wrong so much as the question is under-determined. Worth a ruling: a shared external
system either belongs to the entity its id names, or it is genuinely multi-homed and the card should
say so — but it should not be decided by dictionary order.

## What matched that I had wrong in my own check

`_build_settings` looked like an entity mismatch until I read the schema: `fn_nodes` carry **`slug`**,
not `entity` or `home`. Its slug is `settings`, which is exactly what the panel claims. My probe was
looking for the wrong key.

