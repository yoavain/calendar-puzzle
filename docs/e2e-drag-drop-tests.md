# E2E Drag-and-Drop Tests

This document describes the deterministic end-to-end drag-and-drop tests for the Calendar Puzzle game. The tests cover all three layouts — **desktop**, **mobile-portrait**, and **mobile-landscape** — with both a happy path and a failing path scenario.

## Overview

| Test | Date | Expected outcome |
|---|---|---|
| Happy path | Jan 1, 2024 | Piece 4 placed at board position (2, 2) |
| Failing path | Oct 11, 2024 | Piece 4 rejected — highlighted cell collision |

Each test runs for all three Playwright projects (`desktop`, `mobile-portrait`, `mobile-landscape`), giving **6 total tests**.

## Piece Under Test

**Piece 4** — the most asymmetric L-shaped piece — is used in all tests. It has 5 filled cells in its default (rotation 0) orientation:

```
. X       → (1, 0)
. X       → (1, 1)
X X       → (0, 2), (1, 2)
X .       → (0, 3)
```

When placed at board position **(2, 2)**, the piece occupies these absolute cells:

| Cell | Board coordinate |
|---|---|
| (1, 0) | (3, 2) |
| (1, 1) | (3, 3) |
| (0, 2) | (2, 4) |
| (1, 2) | (3, 4) |
| (0, 3) | (2, 5) |

## Date Mocking

Tests use a custom `mockDate` helper (via `page.addInitScript`) that overrides only `new Date()` and `Date.now()` — it does **not** freeze `setTimeout`, `setInterval`, or `requestAnimationFrame`. This avoids breaking React rendering and `@dnd-kit` sensor activation, which rely on real timers.

## Happy Path — January 1

### Setup

1. Mock date to January 1, 2024.
2. Clear `localStorage` / `sessionStorage` to prevent stale game state.
3. Navigate to the game and wait for the board to render.
4. On mobile layouts, scroll the piece carousel to piece 4 (index 3).

### Drag with Three Verification Stages

The happy path test uses `dragPieceToBoardWithPause` to pause mid-drag so assertions can be made at each stage:

#### Stage 1 — Pointer position vs board bounds

While the piece is held over the target, verify that the pointer coordinates fall within the board's bounding box.

```
expect(pointerPos.x).toBeGreaterThanOrEqual(boardBox.x)
expect(pointerPos.y).toBeGreaterThanOrEqual(boardBox.y)
```

#### Stage 2 — Hover preview matches piece shape

The board should display exactly 5 translucent preview cells (`data-drag-over="true"`) at the expected coordinates:

```
(3, 2), (3, 3), (2, 4), (3, 4), (2, 5)
```

This confirms that the `DndProvider`'s hover position calculation and the `MobileBoard` / `Board` rendering of the preview are correct.

#### Stage 3 — Final placement after drop

After releasing the piece, verify:

- Exactly 5 board cells carry `data-piece-id="4"`.
- Each of the 5 expected cells has `data-piece-id="4"`.

## Failing Path — October 11

### Why Oct 11 blocks the placement

On October 11:

- **Month "Oct"** (index 9) → cell **(3, 1)** is highlighted.
- **Day 11** → `DAYS_LAYOUT[1][3]` → cell **(3, 3)** is highlighted.

Piece 4 at position (2, 2) occupies cell **(3, 3)**, which collides with the highlighted day cell. The game's `isValidPlacement` function rejects the placement.

### Assertions

1. `pieceCellsOnBoard(4)` has count **0** — the piece was not placed.
2. On mobile layouts, the carousel still contains the piece (it was returned).

## Layout-Specific Mechanics

### Desktop — HTML5 Drag & Drop

Uses Playwright's `locator.dragTo()` for the simple drag, and custom `DragEvent` dispatching with a real `DataTransfer` for the "with pause" variant.

- **Target cell**: `boardCell(2, 2)` — HTML5 DnD uses anchor (0, 0) for pieces dragged from the pool.
- The `Piece.tsx` component creates a drag preview image and sets `setDragImage` offset to the first filled cell.

### Mobile — CDP Touch Events + @dnd-kit TouchSensor

Uses Chrome DevTools Protocol (CDP) `Input.dispatchTouchEvent` to simulate real touch sequences that `@dnd-kit`'s `TouchSensor` can activate.

Touch sequence:

1. `touchStart` at the piece center — fires `onTouchStart` → `TouchSensor` begins 200ms activation delay.
2. Hold still for 300ms — exceeds the 200ms delay, activating the drag.
3. `touchMove` in 10 incremental steps toward the target.
4. `touchEnd` to complete the drop.

- **Target cell**: `boardCell(1, 1)` — compensates for two offsets:
  - The `BoardContainer`'s CSS padding (1 cell width) adds +1 to `calculateCellFromPointer` results.
  - `@dnd-kit`'s `active.rect.current.initial` is null when touch is initiated via CDP, so `cellOffset` defaults to (0, 0).

## File Structure

| File | Purpose |
|---|---|
| `test/e2e/drag-drop.spec.ts` | Happy path and failing path tests (all layouts) |
| `test/e2e/drag-stale-rect.spec.ts` | Stale rect and empty cell snap regression tests (mobile only) |
| `test/e2e/fixtures/gamePage.ts` | Page Object Model — board/piece selectors and assertion helpers |
| `test/e2e/helpers/dragHelpers.ts` | Layout-aware drag functions (desktop HTML5 DnD, mobile CDP touch) |
| `playwright.config.ts` | Playwright project definitions for desktop, mobile-portrait, mobile-landscape |

---

## Stale Rect Regression Tests (`drag-stale-rect.spec.ts`)

A separate test file covers two regression scenarios discovered during mobile drag-and-drop debugging. These tests only run on mobile layouts (portrait and landscape) because the bugs are specific to `@dnd-kit`'s touch drag flow and CSS transform handling.

### Background

Piece rendering uses CSS `transform: rotate()` for visual rotation. CSS transforms do **not** change an element's layout dimensions, so `@dnd-kit`'s cached draggable rect can be stale after rotation. See `docs/drag-drop-guidelines.md` §5 for the full explanation.

### Piece Under Test

**Piece 1** (peach/coral) — a T-shaped piece used because its rotation produces a dramatic layout-vs-visual mismatch.

Base shape (2-col × 4-row):
```
X .
X X
X .
X .
```

After 90° CW CSS rotation (visually 4-col × 2-row):
```
X X X X
. X . .
```

### Test 1: Drag from outer cell after rotation

**Goal:** Verify that starting a drag from a cell that exists in the **visual** piece but falls **outside** the stale layout rect still produces a working `DragOverlay`.

**Steps:**
1. Mock date to Jan 1, 2024.
2. Scroll carousel to piece 1 and rotate 90° CW.
3. Assert the PieceGrid has a CSS transform and is visually wider than tall.
4. Start a CDP touch drag from the **leftmost** cell of the visual grid (outside the wrapper's layout bounds).
5. Move toward the board center.

**Assertions:**
- `DragOverlay` has content (the piece preview) — confirms `findVisualPieceRect` correctly identified the visual bounds.
- Overlay overlaps the board area.
- Exactly 5 `data-drag-over="true"` cells appear on the board.
- After drop, 5 cells on the board carry `data-piece-id="1"`.

### Test 2: Drag from empty cell after rotation

**Goal:** Verify that starting a drag from a **transparent gap** in the piece shape snaps the anchor to the nearest filled cell instead of cancelling the drag.

**Steps:**
1. Same setup as Test 1 (rotate piece 1 by 90° CW).
2. Start a CDP touch drag from the **bottom-left** corner of the visual grid — this is cell (0, 1) which is **empty** in the rotated T-shape.
3. Move toward the board center.

**Assertions:**
- `DragOverlay` has content — confirms `findNearestFilledCell` snapped the anchor to a filled cell.
- 5 hover preview cells appear on the board.
- After drop, 5 cells on the board carry `data-piece-id="1"`.

### File

| File | Purpose |
|---|---|
| `test/e2e/drag-stale-rect.spec.ts` | Stale rect and empty cell snap regression tests |

---

## Running the Tests

```bash
# All tests (happy path + failing path + stale rect regressions)
npx playwright test

# Specific project
npx playwright test --project mobile-portrait

# Specific test file
npx playwright test test/e2e/drag-drop.spec.ts
npx playwright test test/e2e/drag-stale-rect.spec.ts

# By test name
npx playwright test -g "succeeds"
npx playwright test -g "blocked"
npx playwright test -g "outer cell"
npx playwright test -g "empty cell"
```
