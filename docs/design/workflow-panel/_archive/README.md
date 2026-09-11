# Retired proposals A–F

Superseded by [`../g-console-25.html`](../g-console-25.html), which is the centre of operations.
Kept rather than deleted because the measured comparisons in the parent README cite them by name —
the numbers below were read off these files and would otherwise be unverifiable.

| | what it was | the measurement it contributed |
|---|---|---|
| A · instrument row | 7 fixed cells in one row | 1 of 7 slots clips on `Recipe`'s 38 columns |
| B · step ledger | the same 7 as columns, a row per journey step | a full row is 152px → 1.5 of 5 steps fit; compact 66px → 3.5 |
| C · filmstrip + slots | journey strip + fixed 4 × 2 grid | 8 boxes at exactly 116px; 5 of 8 clip on `Recipe` |
| D · console | six unequal regions + a real command card | 176/232/636/212/164/180 = 1600; CARGO cannot clip |
| E · target & focus | two mirrored frames + a relation bar | the mirror is exact: `[148,168,393]` vs `[393,168,148]` |
| F · standing console | a short dock + regions that never blank | 200px dock → 1,120,000 px² of graph, −1.2% |

They are **not maintained**. They still load — they use the shared `_common.css` / `_shell.js` and
leave `window.__ICONMODE` unset, so they keep their word gutters — but no further change will be
retrofitted into them.
