# Drag-and-Drop Guidelines

The calendar puzzle uses a custom drag-and-drop implementation based on the **@dnd-kit** library. The goal is to make the finger (or mouse pointer) the single source of truth for positioning a piece. This section explains the user experience, how the anchor is determined, and how the preview shadow is calculated.

## 1. Anchor cell
* Drag can only start from a *filled* cell of a placed piece.
* The cell that the user touches becomes the **anchor** cell (`cellOffset` in the code).
* The piece's top-left corner is positioned so that the anchor cell aligns with the closest board cell when the piece is dropped.

## 2. Drag preview (`DragOverlay`)
* When the drag starts, a `DragOverlay` renders the entire piece as a preview.
* The preview is offset so that the anchor cell is at the same relative position as the original board cell.
* While dragging, the preview follows the anchor cell and snaps to board cells via the `dragOverlayModifier`.

### Portal rendering
The `DragOverlay` is rendered via `React.createPortal` into `document.body` with `zIndex: 9999`. This guarantees the drag preview always appears **above** the board and all other layout elements regardless of CSS stacking contexts created by parent containers (e.g. `PortraitContainer`, `LandscapeContainer`).

> **Why not render inside the DndContext tree?** Mobile layout containers create implicit stacking contexts (`position: relative`, CSS transforms). A `DragOverlay` rendered inside these containers can appear *behind* the board even with a high `z-index`, because stacking contexts are isolated.

## 3. Drop handling
* The drop target calculates the intended top-left position by subtracting the anchor cell's board coordinates from the drop coordinates.
* If the calculated position is valid (within bounds and not overlapping another piece), the piece is placed.
* If the drop would result in an invalid placement, the piece snaps back to its original location.

## 4. Mobile compatibility
* The same logic applies to all mobile layouts (portrait and landscape).
* All calculations use the `cellX` and `cellY` data attributes that are set on every board cell.
* Touch drag uses `@dnd-kit`'s `TouchSensor` with a 200ms activation delay to distinguish drags from carousel swipes.

## 5. CSS transform awareness (visual rect vs layout rect)

Piece rendering uses CSS `transform: rotate()` and `scaleX(-1)` / `scaleY(-1)` for rotation and flipping. **CSS transforms are purely visual — they do not change the element's layout dimensions.** This creates a critical mismatch:

| State | Layout rect (wrapper) | Visual rect (PieceGrid) |
|---|---|---|
| Piece 1, rotation 0 | 2-col × 4-row | 2-col × 4-row |
| Piece 1, rotation 90° CW | 2-col × 4-row (unchanged) | 4-col × 2-row (rotated) |

### The stale rect problem

`@dnd-kit` caches the draggable element's layout rect. After a CSS rotation, this cached rect has the wrong dimensions. If the user starts a drag from a cell that exists in the **visual** piece but falls **outside** the stale layout rect, the `cellOffset` calculation produces out-of-bounds indices, the drag overlay renders empty, and the original piece (at 30% opacity) moves behind the board.

### Solution: `findVisualPieceRect`

In `handleDragStart`, when a piece has a non-trivial CSS transform (`rotation !== 0 || isFlippedH || isFlippedV`), we query the DOM for the inner PieceGrid element (`display: grid`) and use its `getBoundingClientRect()` — which reflects the CSS transform — for `cellOffset` calculation:

```typescript
const hasTransform = piece.rotation !== 0 || piece.isFlippedH || piece.isFlippedV;
const visualRect = hasTransform ? findVisualPieceRect(draggableNode) : null;
const rectForCells = visualRect ?? initialRect; // fall back to layout rect
```

### Key rule

**Always use the PieceGrid's visual bounding rect (not the wrapper's layout rect) when calculating which cell the pointer is over, for any piece that has a CSS transform applied.**

## 6. Empty cell snap-to-nearest

Piece shapes are not rectangular — they have transparent gaps (empty cells). If the user starts a drag from an empty cell within the piece's visual bounds, the `cellOffset` would point to a `false` entry in the piece's shape array. Without handling, this cancels the internal drag state while `@dnd-kit` continues moving the original element, creating a "ghost drag."

### Solution: `findNearestFilledCell`

When `cellOffset` maps to an empty cell, `handleDragStart` snaps it to the nearest filled cell using Manhattan distance:

```typescript
if (!shape[cellOffset.y]?.[cellOffset.x]) {
    const nearest = findNearestFilledCell(shape, cellOffset.x, cellOffset.y);
    if (!nearest) { return; } // no filled cells at all — cancel
    cellOffset = nearest;
}
```

This ensures that:
* The drag is never cancelled due to touching a gap in the piece.
* The overlay snaps to the closest logical cell, producing a natural feel.

## 7. Testing notes
* E2E tests (`test/e2e/drag-drop.spec.ts`) verify the happy path and failure path across desktop, mobile-portrait, and mobile-landscape.
* E2E tests (`test/e2e/drag-stale-rect.spec.ts`) specifically verify:
  * Drag from an outer cell after rotation: overlay must appear on top of the board.
  * Drag from an empty cell after rotation: snaps to the nearest filled cell and places the piece.
* See `docs/e2e-drag-drop-tests.md` for detailed test documentation.
