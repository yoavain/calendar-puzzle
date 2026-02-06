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
| `test/e2e/drag-drop.spec.ts` | Test specification with happy path and failing path |
| `test/e2e/fixtures/gamePage.ts` | Page Object Model — board/piece selectors and assertion helpers |
| `test/e2e/helpers/dragHelpers.ts` | Layout-aware drag functions (desktop HTML5 DnD, mobile CDP touch) |
| `playwright.config.ts` | Playwright project definitions for desktop, mobile-portrait, mobile-landscape |

## Running the Tests

```bash
# All 6 tests
npx playwright test

# Specific project
npx playwright test --project mobile-portrait

# Specific test
npx playwright test -g "succeeds"
npx playwright test -g "blocked"
```
