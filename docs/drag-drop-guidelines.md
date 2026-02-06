# Drag‑and‑Drop Guidelines

The calendar puzzle uses a custom drag‑and‑drop implementation based on the **@dnd‑kit** library. The goal is to make the finger (or mouse pointer) the single source of truth for positioning a piece. This section explains the user experience, how the anchor is determined, and how the preview shadow is calculated.

## 1. Anchor cell
* Drag can only start from a *filled* cell of a placed piece.
* The cell that the user touches becomes the **anchor** cell.
* The piece’s top‑left corner is positioned so that the anchor cell aligns with the closest board cell when the piece is dropped.

## 2. Drag preview
* When the drag starts, the preview shows the entire piece.
* The preview is offset so that the anchor cell is at the same relative position as the original board cell.
* While dragging, the preview follows the anchor cell and snaps to board cells.
``
## 3. Drop handling
* The drop target calculates the intended top‑left position by subtracting the anchor cell’s board coordinates from the drop coordinates.
* If the calculated position is valid (within bounds and not overlapping another piece), the piece is placed.
* If the drop would result in an invalid placement, the piece snaps back to its original location.

## 4. Mobile compatibility
* The same logic applies to the mobile board (`MobileBoard.tsx`).
* All calculations use the `cellX` and `cellY` data attributes that are set on every board cell.

## 5. Testing notes
* Unit tests verify that:
  * Drag cannot start from an empty cell.
  * The piece snaps to the correct board cell when released.
  * The preview shadow matches the anchor cell.

These guidelines are intentionally lightweight to avoid unnecessary complexity.
