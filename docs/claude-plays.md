# Claude plays the puzzle — living notes

This is a **living document for Claude** (the AI assistant) to play the Calendar Puzzle through the Claude in Chrome MCP browser tools, **without using the solver in this repo**. Each play session, the assistant should read this file first, then update it after each move with what was learned.

## How to keep this doc alive (read first, every session)

1. **Open this file before the first browser action** in any "play" session. Treat the catalogue and strategy sections as cumulative knowledge from prior sessions.
2. **After every move** (successful or failed):
   - If the move taught you something new about how the UI / DnD / DOM behaves, add a one-liner under the relevant catalogue section.
   - If you learned a strategy heuristic worth keeping, add it under Strategy.
   - Append the move (with outcome) under the **current play session log** at the bottom.
3. **At the end of a session** (puzzle solved, abandoned, or context running out):
   - Move the play-session log into a dated "Past sessions" entry, then summarise it into 2-4 bullet lessons added to the Catalogue / Strategy sections.
   - Trim verbose move logs once their lessons are extracted — the catalogue stays, raw move-by-move history doesn't.
4. **Do not write a solver.** The point of these notes is to think like a human player. Strategy heuristics are fine; pasting in `findSolution()` results is not.
5. **Keep the doc tight.** When a section grows past ~30 lines, refactor: collapse duplicate lessons, keep the principle, drop the example.

## Catalogue — Claude-in-Chrome MCP actions I can use

Loaded via `ToolSearch query "select:mcp__claude-in-chrome__<name>"`. Useful tools confirmed working:

| Tool | What it does | Notes |
|---|---|---|
| `tabs_context_mcp` | List/create MCP tab group | Call once per session before any other browser tool. |
| `tabs_create_mcp` | New empty tab | Use for a fresh page in the same MCP window. |
| `navigate` | Go to URL | Page may report `Page still loading … executeScript waited 45000ms for document_idle` even after the title updates — annoying but transient. Try the next tool call rather than waiting. |
| `javascript_tool` | Run JS in page context | **This is the workhorse for playing.** All board/piece reads and synthetic DnD go through here. Top-level `await` is NOT allowed — use `new Promise(res => setTimeout(...))` instead. |
| `find` | Natural-language element lookup | Not yet used in this project. |
| `get_page_text` | Plain text extract | Useful for sanity-checking what's on screen without a screenshot. |
| `read_console_messages` | Read `console.log` output | Always pass a `pattern` to filter. |
| `computer` | Mouse / keyboard / screenshot | Screenshots tried but kept failing with `Page still loading`. Not needed — synthetic DnD via `javascript_tool` works. |
| `browser_batch` | Sequence of tool calls in one round trip | Recommended by the host when chaining 2+ browser actions. Stops on first failure. |

### Site approval gotcha

First action on a new domain fails with `permission_required: <domain>`. The user must approve the site in the Claude side panel (the extension page lists "Your approved sites"). Once approved, subsequent calls work. On `calendar-puzzle-dev.yoavain.org` this auto-resolved during the first `javascript_tool` call — possibly the approval was granted earlier in the session.

## Catalogue — DOM selectors that work

From inspecting the live page (confirmed against `test/e2e/fixtures/gamePage.ts`):

```text
[data-testid='board']                                      # board container
[data-testid='board'] [data-cell-x='X'][data-cell-y='Y']   # one board cell
[data-testid='piece-N']                                    # piece N (1..8) in the desktop pool / carousel
[data-testid='piece-N'] [data-testid='piece-grid']         # the visual grid of piece N
[data-piece-id='N']                                        # any cell currently rendered as piece N (board OR piece pool)
[data-drag-over='true']                                    # board cells highlighted during a drag preview
[aria-label='Puzzle completion progress']                  # progress bar (aria-valuenow is the % filled)
```

Per-piece controls (rotate/flip) live in an **ancestor wrapper**, not inside `[data-testid='piece-N']`. Walk up the DOM until you find a parent that contains `[data-testid='rotate-button']`. The wrapper contains:

```text
[data-testid='rotate-button']      # rotate clockwise
[data-testid='rotate-ccw-button']  # rotate counter-clockwise
[data-testid='flip-h-button']      # mirror horizontally
[data-testid='flip-v-button']      # mirror vertically
```

### Reading a piece shape from the DOM

The grid has `columns="C" rows="R"` attributes; children are row-major. **There is no `data-filled` attribute** on the cells — distinguish filled vs empty by `getComputedStyle(el).backgroundColor` (transparent / `rgba(...,0)` ⇒ empty, anything else ⇒ filled).

### Reading the board

Cells expose only `data-cell-x`, `data-cell-y`, `data-testid="board-cell"`. **Highlighted (today's date) and non-playable (dead corner) cells have no data attributes** — visible only via styling and content text. The four dead corners on a 7×7 board are `(6,0), (6,1)` (right of months) and `(3,6), (4,6), (5,6), (6,6)` (right of days 29-31).

## Catalogue — JavaScript helpers that work

Defined on `window.*` inside the page so they survive across `javascript_tool` calls in the same tab:

```js
// Drag piece N to board cell (tx, ty) via synthetic HTML5 DragEvents.
// Grabs at piece center, fires dragstart → 5 dragover steps along path → drop on target → dragend.
window.__dragPieceToCell(pieceId, tx, ty)
//   returns { ok: true, src: {x,y}, dst: {x,y} }
//   Note: ok=true means events fired — NOT that the piece landed.
//   To check landing, query [data-piece-id='N'] on the board.

// Find the per-piece control wrapper that contains rotate/flip buttons.
window.__pieceWrapper(pieceId)         // returns the wrapper Element

// Click a control button inside a piece's wrapper.
window.__clickInWrapper(pieceId, "rotate-button")     // returns true on success
window.__clickInWrapper(pieceId, "flip-h-button")
window.__clickInWrapper(pieceId, "flip-v-button")
```

### Caveat: when does a drag actually place the piece?

Confirmed placements: piece dropped at board cell where its **top-left filled cell of the (transformed) shape** should land. Empirically:
- Piece 1 (`#./#./##/#.`) dropped at (0,0) → placed at (0,0)(0,1)(0,2)(1,2)(0,3) ✓
- Piece 2 rotated 180° (`#.#/###`) dropped at (3,0) → placed at (3,0)(5,0)(3,1)(4,1)(5,1) ✓

So as long as the shape's first filled cell is at column 0 of row 0, dropping at the target board cell snaps the piece's bounding box to (target.x − 0, target.y − 0). For shapes whose first filled cell is NOT at (0,0) of the bounding box, dropping at (tx, ty) lands `firstFilled` at (tx, ty) (i.e. the piece bounding box top-left ends up at (tx − ff.x, ty − ff.y)). **This needs more empirical verification — see "Open questions" below.**

A drag can silently fail (no exception, `ok:true`) — for example, if the destination would overlap an occupied / non-playable / highlighted cell. **Always re-query `[data-piece-id='N']` after a drop to see if it actually landed**, and check the progress bar for forward motion.

### Transforms persist on the piece in the pool

Clicking `rotate-button` updates the piece's `[data-testid='piece-grid']` `transformstyle` attribute (e.g. `scaleY(1) scaleX(1) rotate(180deg)`). The transform persists; subsequent drag uses the transformed shape.

### CRITICAL: the DOM grid shows the BASE shape, not the transformed one

The piece-grid children render the **base** shape with a CSS transform applied for display. The cells themselves are NOT reordered. The game places pieces using the **logical** transformed shape, which you must compute mentally from the base shape + (rotation, flipH, flipV).

If you read the piece grid from the DOM after rotating/flipping and reason as if those cells *are* the shape, you'll target cells that the game's `isValidPlacement` rejects silently (drop fires, returns `ok:true`, piece doesn't land).

To get the **logical** shape after a transform: take the base shape, apply rotation, then flip. Verify it matches what you intend before dragging.

### Rotation / flip math reference (2D shape)

Given base `arr[H][W]`:

```text
rotate 90° CW :  new[i][j] = arr[H-1-j][i]              dims: W × H
rotate 180°   :  new[i][j] = arr[H-1-i][W-1-j]          dims: H × W
rotate 90° CCW:  new[i][j] = arr[j][W-1-i]              dims: W × H
flip horiz    :  new[i][j] = arr[i][W-1-j]              dims: H × W   (mirror left-right)
flip vert     :  new[i][j] = arr[H-1-i][j]              dims: H × W   (mirror top-bottom)
```

The page's per-piece UI exposes both `rotate-button` (CW) and `rotate-ccw-button`, so you can undo a wrong rotation without going around 270°.

## Catalogue — Pieces in this puzzle (8 pieces, 41 cells)

```
Piece 1  (5 cells, 2×4):   #.    Piece 2  (5 cells, 3×2):   ###
                           #.                               #.#
                           ##
                           #.

Piece 3  (5 cells, 3×3):   #..   Piece 4  (5 cells, 2×4):   .#
                           ###                              .#
                           ..#                              ##
                                                            #.

Piece 5  (5 cells, 2×3):   .#    Piece 6  (5 cells, 3×3):   ..#
                           ##                               ..#
                           ##                               ###

Piece 7  (6 cells, 2×3):   ##    Piece 8  (5 cells, 2×4):   #.
                           ##                               #.
                           ##                               #.
                                                            ##
```

Cell sum: 5+5+5+5+5+5+6+5 = **41** ⇒ matches 43 playable − 2 highlighted on May 18.

## Strategy — how to play (no algorithm)

These are heuristics for a human player. They are guidelines, not rules.

1. **Read the date first.** Identify the two highlighted cells (month name, day number). These must stay uncovered.
2. **Identify the "forced shapes" around each highlight.** Cells adjacent to a highlight, bounded by board edges or dead corners, often have only one piece shape (across rotation/flip) that can fit. Identify those *before* placing anything.
   - *Example (May 18):* MAY at (4,0) is bordered by APR/JUN/NOV. The 3×2 region around it minus MAY is the U-pentomino footprint ⇒ piece 2 is forced there.
3. **Pieces are scarce resources, not interchangeable.** Each unique pentomino shape (P=piece 5, U=piece 2, Z=3, N=4, L=6, Y=1, L'=8) appears exactly once. Treat them as keys: the puzzle is choosing *which lock each key unlocks*. If the same key fits two locks, you must decide before opening either.
4. **The "scarce key" trap (today's session lesson).** Both the top-left 2×2-plus-stub and the bottom-left 2×2-plus-stub want a P-pentomino (piece 5). Only one of them gets piece 5. The choice constrains every later placement. Don't decide based on which is more obvious — decide based on which alternative-shape pieces (piece 7 the 2×3 rect; piece 1 the Y-pent) can substitute at the *other* corner. In this session I gave piece 5 to top-left, then realised bottom-left could be a 2×3 rect (piece 7) ⇒ recovered. But the next constraint (the 4×4-minus-(3,4) hole) was unsalvageable from that opening — see below.
5. **Always do a "cell parity / shape-decomposition" check.** When the remaining empty region is N cells, with remaining pieces summing to N: that's necessary but **not sufficient**. Check (a) connectivity — no blob smaller than your smallest piece; (b) shape feasibility — at least one of your remaining pieces actually matches a corner of the region. If neither (a) nor (b) holds, undo *immediately*; don't drop more pieces hoping it works out.
6. **Use the biggest fixed-shape piece (piece 7, the 2×3 rect) where a 2×3 rectangular hole genuinely exists.** It's the most inflexible piece. Common 2×3 sites: top-left of days (2,3,9,10,16,17 — but not on a date), bottom-left (22,23,29,30 area), the right 2×3 of days (5,6,12,13,19,20 area, when 19 or 20 isn't the date).
7. **Bias toward placing in the bottom row early.** Days 29-31 are a 1×3 strip at the bottom-left, connected to the rest only through three cells (one per column). Any piece touching row 6 has very few shapes — usually piece 6 (L-pent), piece 1 (Y), or piece 7 (rect). Knowing which is hard to back out of.
8. **Undo aggressively.** The "Undo" button (no testid, just innerText) works cleanly. Use `__clickByText("Undo")` in the helpers. If a placement creates an isolated 1-3 cell pocket, undo and re-think — don't try to "build a piece around it" because no piece fits 1-3 cells.
9. **When a sub-region cannot be tiled with the remaining pieces, the *opening* is wrong.** The fix isn't a clever piece 3/4/6 placement — it's redistributing those pieces *into* the opening (e.g. piece 1 → bottom-right corner rather than col 0, freeing piece 8 to take col 0).
10. **Don't fight the carousel.** On desktop layout pieces stay in a fixed pool. On mobile layouts the carousel is involved; see `test/e2e/solve.spec.ts` for the right scroll-to-piece dance.

## Drop-cell semantics — confirmed

For desktop (HTML5 DnD), the carousel handler in `src/client/components/Board.tsx:218-225` falls back to `firstFilledCell(transformedShape)` when no `cellX/cellY` is in the drag payload (which is the carousel case). So:

```text
dropPosition = (drop_target_cell.x − firstFilled.x, drop_target_cell.y − firstFilled.y)
```

**This means:** to land the piece's bounding box at board cell `(bx, by)`, drop at `(bx + firstFilled.x, by + firstFilled.y)`. For shapes whose top-left is filled (`firstFilled = (0,0)`) you simply drop at the bbox target. Otherwise compensate.

## Open questions / things to verify next session

- **Does the side carousel position shift after a piece is placed?** Probably yes on mobile layouts. On desktop the pool seems to keep slots fixed (placed pieces vanish from the pool). Re-query selectors before every drag to be safe.
- **What identifies the Undo button?** Need to look up its testid / aria-label so heuristic #7 is actionable.

## Past sessions

### Session 1 (May 18, did not solve)

**Outcome:** Reached 63% (5 of 8 pieces placed correctly: pieces 1, 2, 5, 7, 8) before getting stuck on a 15-cell hole that pieces 3, 4, 6 cannot tile. Did not undo back further to recover.

**Top 3 lessons** (also folded into Catalogue / Strategy):

1. **The DOM piece grid renders the base shape + CSS transform, NOT the logical post-rotation shape.** Computing the logical shape from (rotation, flipH, flipV) by hand is mandatory before targeting a board cell.
2. **`isValidPlacement` rejections are silent.** A `dragstart → drop` flow returns `ok:true` whether or not the piece landed. Always re-query `[data-piece-id='N']` on the board after a drop.
3. **The puzzle's "forced shape" constraints can collide.** Both top-left-of-months and bottom-left-of-days want the unique P-pentomino (piece 5). The opening determines which one gets it — and that determines whether the bottom-right finishing region is tileable at all. The opening I tried (piece 1 covers col 0, piece 5 covers top-left, piece 7 covers bottom-left) leaves Z+N+L for a 4×4-minus-(3,4) region that cannot be tiled. Need a different *opening*, not a different *ending*.

## Current play session

**Date played:** May 18 (today). The page reports "Calendar Puzzle - 18/05". Signed in: no (sign-in is optional; stats won't record but UI works).

### Move log

| # | Piece | Transform | Drop at | Outcome | Notes |
|---|---|---|---|---|---|
| 1 | 1 | none | (0,0) | ✓ (0,0)(0,1)(0,2)(1,2)(0,3). Progress 12.2% | Confirms synthetic DragEvent flow works. |
| 2 | 2 | rotate 180° | (3,0) | ✓ (3,0)(5,0)(3,1)(4,1)(5,1). Progress 24.4%. MAY uncovered. | Wrap the highlight first. |
| 3 | 5 | rotate 180° | (1,0) | ✗ silent reject. Logical shape after 180° is `##/##/#.`; 5th cell hits (1,2) — covered. | Visual DOM was misleading; see catalogue. |
| 4 | 5 | rotate-ccw ×2 + flip-v | (1,0) | ✓ (1,0)(2,0)(1,1)(2,1)(2,2). Progress 36.6% | Needed flip-V, not rotate. |
| 5 | 6 | none | (2,4) | ✓ (2,4)(2,5)(0,6)(1,6)(2,6). Progress 48.8% | Took the 29-30-31 corner. **Later realised this was wrong — see #6.** |
| 6 | — | Undo | — | Piece 6 returned to pool. Progress 36.6%. | Realised after #5 that the bottom-left tooth `(0,4)(1,4)(0,5)(1,5)+(1,3)` is a P-pentomino shape — only piece 5 has that shape, and it's already placed. Need piece 7 (2×3 rect) at bottom-left instead. |
| 7 | 7 | none | (0,4) | ✓ (0,4)(1,4)(0,5)(1,5)(0,6)(1,6). Progress 51.2% | 2×3 rectangle takes the bottom-left chunk. |
| 8 | 8 | rotate 180° | (1,3) | ✓ (1,3)(2,3)(2,4)(2,5)(2,6). Progress 63.4% | L-pent (180° → `##/.#/.#/.#`) hugs the left side of the remaining region; covers (1,3) entry + the (2,*) column. |
| — | — | — | — | **Got stuck.** Remaining 15 cells form 4×4 (cols 3-6, rows 2-5) minus (3,4)=18. Pieces left: 3 (Z), 4 (N), 6 (L). Exhaustively tried every orientation of piece 6 and piece 3 as the "first" placement in that region — every choice either strands (3,5), produces a wrong-sized split, or hits a 3rd-piece shape we don't have. | This region needs more careful planning or a smarter overall sequence. |

### Current board

```
[1] [5] [5] [2]  *MAY*  [2]   ·
[1] [5] [5] [2]  [2]    [2]   ·
[1] [1] [5]  .    .     .     .
[1] [8] [8]  .    .     .     .
[7] [7] [8] *18*  .     .     .
[7] [7] [8]  .    .     .     .
[7] [7] [8]  ·    ·     ·     ·
```
Empty playable cells remaining: 15 (cols 3-6, rows 2-5; the (3,4)=18 hole within). Remaining pieces: 3 (Z), 4 (N), 6 (L). Sum 5+5+5=15 ✓.

### Lessons captured from this session (write to catalogue/strategy on next pass)

- **The "shape jigsaw" intuition really matters.** Each highlight (date cell) creates a forced shape requirement on its neighbours. May 18 has:
  - MAY surround (row 0-1, cols 3-5 minus MAY) ⇒ U-pentomino ⇒ piece 2 forced.
  - Top-left 2×2 + (2,2) [given piece 1 takes col 0 + (1,2)] ⇒ P-pentomino ⇒ piece 5 forced.
  - Bottom-left 2×2 + extension ⇒ would also be a P-pentomino if approached the same way — but piece 5 only exists once. **This means piece 1's placement (which seals (1,2) and (0,3)) and piece 7's placement (2×3 rect bottom-left) are not both free — they constrain each other.** Plan more than one piece ahead.
- **"Single-shape" pieces are bottlenecks.** Piece 5 is the only P-pent; piece 2 is the only U-pent; piece 7 is the only rectangle. Treat them as scarce resources and place them where their shape is *uniquely required*, not opportunistically.
- **Connectivity test after every placement.** After dropping, redraw the empty region in your head and check that:
  1. No empty cell is stranded (zero empty neighbours).
  2. The empty region's component sizes can be expressed as a sum of the remaining pieces' cell counts (e.g. 5+5+5 = 15; not 6+9 with only pentominoes left).
- **The Undo button works** — clicking the visible "Undo" button via `__clickByText("Undo")` cleanly returns a piece to the pool with no side effects. Use it liberally.

### Next-session priorities

1. **Don't carry piece 6 into the bottom-right finishing phase.** Among the 4 unique orientations of piece 6 (base, 90CW, 180°, 90CCW), none gives a clean split of the 4×4-minus-(3,4) region into Z + N + L. Place piece 6 earlier in the game, somewhere in the top portion of the day cells.
2. **Consider a different piece 1 orientation.** If piece 1 covers col 0 + (1,1) instead of col 0 + (1,2) (i.e. piece 1 flip-V), the top-left cluster becomes a U-shape (piece 2) and frees piece 5 to take the bottom-left tooth — which then frees piece 7 for the *right-side* area where its rectangular shape is more useful.
3. **Reset and re-open** rather than salvaging the current state. The current bottom-right 15-cell hole cannot be partitioned into Z+N+L given exhaustive trial (see move log).
