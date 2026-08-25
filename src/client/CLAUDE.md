# Frontend (`src/client/`)

## Styling Convention

- **Sibling `Component.styled.ts` for non-trivial styling.** Any component whose styling exceeds roughly 20 lines (combined `styled()` declarations, `keyframes`, and inline `sx` literals) must move that styling into a sibling `Component.styled.ts` file. The `.tsx` keeps JSX + behavior; the `.styled.ts` exports the styled primitives.
- For components below the threshold, inline `styled()` / `sx` is fine — but if the same `sx` block is repeated more than twice, extract a styled component regardless of file size.
- `keyframes` always belong in the sibling `.styled.ts` (never inline in `.tsx`).
- Prefer theme tokens (`theme.game.radius.*`, `theme.spacing()`, `theme.palette.*`) over raw px / hex values inside `.styled.ts` files.

## Drag-and-Drop Architecture

**Key patterns:**
- **Portal rendering**: `DragOverlay` is rendered via `createPortal` into `document.body` to escape CSS stacking contexts
- **Visual rect detection**: Uses `findVisualPieceRect` for accurate dimensions after CSS rotation/flip transforms
- **Empty cell handling**: `findNearestFilledCell` snaps the drag anchor to the nearest filled cell when the touch lands on a transparent gap

See [docs/drag-drop-guidelines.md](../../docs/drag-drop-guidelines.md) for full details and pitfalls.

## Known Issues (Mobile)

### Carousel/DnD Race Condition — intermittent drag cancellation

**Status: Substantially fixed. Three root causes identified and addressed.**

**Root cause (three compounding issues):**

1. **Embla auto-reinits for EVERY slide count change** — Embla's MutationObserver watches `childList` on the carousel track and fires `reInit()` whenever any slide is added or removed. This happens on every piece placement or removal, not just at option-change thresholds. The auto-reInit fires as a microtask (after React's effects), which can disrupt the dnd-kit / Embla listener state.

2. **`selectedScrollSnap()` mismatch after reInit in loop mode** — After a reInit where `loop` changes, Embla's `selectedScrollSnap()` may point to a duplicate-slide index while the visually centered slide is a different DOM node. `watchDragYieldToActivePiece` uses `slideNodes()[selectedScrollSnap()]` to identify the active slide. If mismatched, it returns the wrong value — Embla intercepts the touch and cancels the drag.

3. **Duplicate dnd-kit draggable IDs in the carousel** — `buildSlides()` duplicates pieces when `pieces.length < MIN_SLIDES_FOR_LOOP=3` (e.g. 1 piece → 3 slides `[p,p,p]`, 2 pieces → 4 slides `[p1,p2,p1,p2]`). All copies render `DraggablePiece` with `id="piece-X"`, causing multiple `useDraggable` registrations with the same ID. dnd-kit's last-mounted instance wins, so when the user touches the first (visible) slide, dnd-kit uses the rect of a different (possibly offscreen) slide for overlay positioning. The DragOverlay appears in the wrong location → user sees the piece "jump away" → lifts finger without moving → 0 moves, no drop.

**Fixes applied:**
- **`doExplicitReInit`**: runs via `setTimeout` (macrotask) after MutationObserver callbacks, ensuring our reInit is final. Also calls `scrollTo(selectedScrollSnap(), true)` after `reInit()` to re-sync the physical/logical snap position (fixes root cause #2). Applied to all count changes via a catch-all `slide-count-change` branch (fixes root cause #1).
- **Unique slide IDs**: `PieceCarousel` now passes `draggableId={\`piece-${piece.id}-slide-${index}\`}` to each `DraggablePiece`, ensuring dnd-kit always uses the correct element's rect even when slides are duplicated (fixes root cause #3).
- **`activatorEvent.target` lookup**: `DndProvider.handleDragStart` now uses `activatorEvent.target.closest('[data-piece-id]')` to find the exact touched element for visual rect calculation, instead of `document.querySelector` which always returns the first DOM node.

**Symptom:** On mobile, after placing or removing a piece (especially when count crosses 1 or 3), the next drag fires `dnd:dragStart` but produces 0 `dnd:dragMove` events and `dnd:dragEnd` with `dropType:"cancel"` and no `ctrl:handlePieceDrop`. The piece doesn't move.

**Transitions covered:**
- `single-to-multi` (1 → 2+): options change (loop/watchDrag) ✅
- `multi-to-single` (2+ → 1): options change (loop/watchDrag) ✅
- `duplication-threshold-crossed` (2 ↔ 3): slide count changes ✅
- `slide-count-change` (all other N → N±1): Embla MutationObserver fires ✅
- `count-jump` (large count increase, e.g. reset) ✅

**Key implementation files:**
- `src/client/layouts/common/PieceCarousel.tsx` — `watchDragYieldToActivePiece`, `doExplicitReInit`, pieces-change effect, and unique `draggableId` per slide
- `src/client/components/DraggablePiece.tsx` — `draggableId` prop for dnd-kit ID override
- `src/client/layouts/common/DndProvider.tsx` — dnd-kit sensor configuration, `activatorEvent.target` lookup
- `src/client/utils/debugLogger.ts` — circular-buffer debug logger
- `src/client/components/DebugPanel.tsx` — floating overlay (activate via the admin "Debug Logging" toggle in the hamburger menu; state persisted in `localStorage` key `puzzle:debugEnabled`); dumps logs to a downloaded JSON file

**Debugging:** Enable debug logging via the admin "Debug Logging" toggle in the hamburger menu, reproduce the failed drag, press "Dump Log". Look for a `dnd:dragStart` with 0 `dnd:dragMove` events followed by `dnd:dragEnd` with no `ctrl:handlePieceDrop`. Also check for `carousel:autoReInit` events — each should be followed by a `carousel:reInit` (from `doExplicitReInit`) a few ms later.
