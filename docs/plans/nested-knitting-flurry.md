# Plan for Drag‑and‑Drop Enhancement

## Goal
Implement a robust drag‑and‑drop behaviour where the finger (or mouse pointer) is the single source of truth:
* Drag can only be initiated from a *filled* cell of a piece.
* The touched cell becomes the *anchor* cell.
* The piece’s top‑left corner is positioned so that this anchor cell aligns with the closest board cell at drop time.
* The drop location must match the calculated shadow position.

## High‑level approach
1. **Enforce anchor cell on drag start** – modify the component that provides the draggable interface (`DraggableBoardCell`) so that it:
   * Adds a `data-cell-x`/`data-cell-y` attribute to every rendered board cell.
   * On `onDragStart` or `onTouchStart` checks whether the event target is a cell that is *filled* in the piece’s shape.
   * If the target is an empty cell, cancels the drag (by not calling `e.dataTransfer.setData`).
   * Calculates the offset from the dragged cell to the piece’s top‑left corner based on the shape and sets this as a custom `data-anchor-offset` on the drag event.
2. **Align anchor to board cell on drag over** – keep the existing `handleDragOver` logic in `Board.tsx` which already calculates the top‑left based on the first filled cell. Adjust it to use the offset supplied by the drag event instead of always assuming the first filled cell.
3. **Mobile board compatibility** – mirror the same logic in `MobileBoard.tsx` (which currently uses a single droppable). Update `isHoverPreviewCell` and related calculations to use the anchor offset from the drag event.
4. **Documentation** – create `docs/drag-drop-guidelines.md` explaining the user‑experience, how the anchor is determined, and how the shadow is computed.
5. **Testing** – add or update unit tests to:
   * Verify that a drag cannot start from an empty cell.
   * Verify that the piece snaps to the correct board cell when released.
   * Verify that the shadow matches the anchor cell.

## Files to modify
| File | Change |
|------|--------|
| `src/client/components/DraggableBoardCell.tsx` | Add cell attributes, guard drag start, compute anchor offset. |
| `src/client/components/Board.tsx` | Adjust `handleDragOver` to read offset from event data; update `handleDragStart` accordingly. |
| `src/client/components/MobileBoard.tsx` | Similar adjustments to `handleDragStart`/`isHoverPreviewCell`. |
| `docs/drag-drop-guidelines.md` | New documentation file. |

## Steps
1. Create `docs/drag-drop-guidelines.md` with clear explanation.
2. Update `DraggableBoardCell.tsx`:
   * Render each cell with `data-cell-x`/`data-cell-y`.
   * In `onDragStart` and `onTouchStart`, check `event.target.dataset.cellX`/`cellY` and the piece shape.
   * If valid, compute offset and set `e.dataTransfer.setData("application/json", JSON.stringify({pieceId, offsetX, offsetY}))`.
3. Update `Board.tsx`:
   * In `handleDragOver`, read the offset from `e.dataTransfer.getData("application/json")` and use it to compute `dragOverCell`.
   * Keep existing logic for anchor calculation if offset absent.
4. Update `MobileBoard.tsx` analogously.
5. Add Jest tests in `tests/dragDrop.spec.ts`.
6. Run `npm run test` to confirm all tests pass.

## Verification
* Manual drag‑and‑drop in browser: start drag from a filled cell, move finger, release – piece snaps to the closest board cell.
* Attempt to start drag from an empty cell – no drag starts.
* Ensure that the shadow preview follows the anchor cell during drag.
* Run unit tests to cover the above behaviours.

---
