# Low-Level Design: Desktop Responsiveness and Scaling

This document outlines the technical design for making the Calendar Puzzle responsive on desktop environments, focusing on dynamic scaling and layout adaptability.

## Goal
The game should automatically scale its components (Board, Pieces, Controls) to fit the available viewport height, ensuring no vertical scrolling is required on standard desktop resolutions and zoom levels.

---

## Stage 1: Dynamic Cell Scaling

The core of the scaling logic relies on a single source of truth for the "Cell Size," which currently is a fixed 50px. We will move this to a viewport-relative CSS variable.

### 1.1 Global CSS Variable
**File:** `src/client/theme/ColorModeContext.tsx`
**Change:** Add a `:root` variable to `GlobalStyles`.

```css
:root {
  /* 
     - 35px: Minimum readable size
     - 8.5vh: Calculated to fit 7 cells + padding + headers in most laptop screens
     - 60px: Maximum size to prevent excessive growth on 4K monitors
  */
  --game-cell-size: clamp(35px, 8.5vh, 60px);
}
```

### 1.2 Theme Integration
**File:** `src/client/theme/theme.ts`
**Change:** Update `lightGameTokens` and `darkGameTokens`.

Instead of `cellSize: 50`, we use:
```typescript
cellSize: "var(--game-cell-size, 50)" as unknown as number
```
*Note: Using `as unknown as number` is a workaround for the MUI theme interface which expects a number, but CSS variables work fine in styled-components.*

### 1.3 Styled Components Updates
**Files:** 
- `src/client/components/Board.styled.ts`
- `src/client/components/Piece.styled.ts`
- `src/client/components/Game.styled.ts`

**Changes:**
- Ensure all `width` and `height` properties referencing `theme.game.cellSize` handle the value correctly. 
- **CRITICAL:** Since `cellSize` will now be a CSS variable string, we must remove the `px` suffix in styled-components templates where it was previously hardcoded.
  - *Example Change:* `width: ${theme.game.cellSize}` instead of `width: ${theme.game.cellSize}px`.
- Update `PiecePoolWrapper` and `PiecesContainer` in `Game.styled.ts` to remove hardcoded pixel heights (e.g., `height: 600`, `width: 250`).
- `PiecePoolWrapper` should have dimensions relative to the cell size (e.g., `width: calc(var(--game-cell-size) * 5)`).

### 1.4 Test Plan (Stage 1)
1. **Vertical Resize:** Open the app and manually resize the browser window height.
   - **Expectation:** The board and pieces should shrink/grow in sync.
2. **Resolution Check:** Test on a 13" laptop (approx 768px height) vs a 27" monitor (1440px height).
   - **Expectation:** The board should occupy a similar percentage of vertical space on both.
3. **Browser Zoom:** Use `Ctrl +` and `Ctrl -`.
   - **Expectation:** The game should remain centered and visible without vertical overflow until extreme zoom levels (>250%).

---

## Stage 2: Layout Reorganization (Side-by-Side)

On wide screens, the vertical stacking of "Board above Piece Pool" wastes horizontal space and forces pieces to be small.

### 2.1 Responsive Main Container
**File:** `src/client/components/Game.tsx`
**Change:** Update the `Box` containing `<BoardComponent />` and `<PiecesContainer />`.

```tsx
<Box 
  sx={{ 
    display: "flex", 
    flexDirection: { xs: "column", lg: "row" }, 
    alignItems: { xs: "center", lg: "flex-start" },
    gap: 4,
    mt: 2
  }}
>
```

### 2.2 Piece Pool Adjustments
**File:** `src/client/components/Game.styled.ts`
**Change:**
- `PiecesContainer` should switch from a 4-column grid to a 2-column grid (or auto-fill) when in "row" mode.
- Set `overflow-y: auto` and a flexible `height` (e.g., `height: calc(100vh - 200px)`) to allow scrolling through pieces independently of the board.

### 2.3 Test Plan (Stage 2)
1. **Breakpoint Trigger:** Resize the browser width.
   - **Expectation:** At the `lg` breakpoint (1200px), the layout should snap from vertical to horizontal.
2. **Scroll Isolation:** In horizontal mode, scroll the piece pool.
   - **Expectation:** The board should remain fixed while the pieces scroll.
3. **Accessibility:** Ensure buttons (Undo/Redo/Reset) in the top bar remain reachable and don't overlap with the new layout.

---

## Phase 3: Interaction Sync (Optional/Future)
Ensuring that the "Drag Preview" created in `Board.tsx` and `Piece.tsx` also uses the dynamic cell size.

**File:** `src/client/components/Board.tsx` & `src/client/components/Piece.tsx`
**Change:** The `dragPreview` element creation uses `theme.game.cellSize`. Since this will now be a CSS variable string, the helper should be updated to handle it correctly or use `getComputedStyle`.

### 1.5 Test Plan (Stage 3)
1. **Drag Preview Size:** Start dragging a piece at 100% zoom and 150% zoom.
   - **Expectation:** The "ghost" image under the cursor must exactly match the size of the board cells at both zoom levels.
