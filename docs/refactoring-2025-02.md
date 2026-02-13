# Refactoring: UI/Game Logic Separation (February 2025)

## Overview

This refactoring established clear boundaries between pure game logic and UI code, reducing duplication and improving maintainability.

## Motivation

The codebase had three main issues:

1. **Duplication**: `rebuildGameState()` and `updateBoardAndPieces()` were duplicated in both `useGameController.ts` and `Game.tsx` (~60 lines)
2. **Shape utilities scattered**: `findFirstFilledCell()` appeared in 4 different files
3. **Mixed concerns**: DOM-dependent code (`dragHelpers.ts`) was in the common layer
4. **Colors mixed with shapes**: `pieceData.ts` mixed presentation (colors) with data (shapes)

## Changes Made

### Phase 1: Extract Pure Game Logic

**Created `src/common/boardOperations.ts`**

- `rebuildGameState(pieces, date, isSolved)` - Reconstructs board from saved pieces
- `updateBoardAndPieces(piece, newPosition, currentBoard, currentPieces)` - Updates board when moving pieces

**Updated:**
- `src/client/layouts/common/useGameController.ts` - Now uses shared functions
- `src/client/components/Game.tsx` - Now uses shared functions

**Result**: ~60 lines of duplicate code eliminated

### Phase 2: Consolidate Shape Utilities

**Created `src/common/utils/shapeHelpers.ts`** (pure functions):
- `findFirstFilledCell(shape)` - Find top-left filled cell
- `findFirstFilledCellOfPiece(piece)` - Convenience wrapper
- `findNearestFilledCell(shape, fromX, fromY)` - Snap to nearest filled cell

**Created `src/client/utils/dragHelpers.ts`** (DOM-aware functions):
- `findVisualPieceRect(containerEl)` - Get visual rect after CSS transforms
- `calculateCellFromPointer(...)` - Convert pointer to cell position

**Deleted:**
- `src/common/utils/dragHelpers.ts` - Had DOM dependencies

**Updated:**
- `src/client/components/Board.tsx` - Uses `shapeHelpers`
- `src/client/layouts/common/DndProvider.tsx` - Uses `shapeHelpers` and `dragHelpers`

**Result**: 4 copies of `findFirstFilledCell` → 1 centralized function

### Phase 3: Separate Colors from Piece Data

**Created `src/client/utils/pieceColors.ts`**:
- `PIECE_COLORS` - Color mapping for all pieces
- `getPieceColor(id)` - Get color by piece ID

**Updated `src/common/pieceData.ts`**:
- Removed `color` field from `PieceData` interface
- Removed `getPieceColor()` function
- Now contains only shape data

**Updated imports in 6 files:**
- `Board.tsx`, `Piece.tsx`, `PieceDragPreview.tsx`
- `Piece.styled.ts`, `Board.styled.ts`, `HelpModal.tsx`

**Result**: Clean separation of data (shapes) from presentation (colors)

### Phase 4: Audit Common Layer

**Verified:**
- ✅ No `HTMLElement`, `document`, `window` usage in `src/common/`
- ✅ No React imports in `src/common/`
- ✅ No `getBoundingClientRect()` or `querySelector()` in `src/common/`

**Result**: Common layer is now truly pure

### Phase 5: Testing

**Created `test/common/boardOperations.test.ts`**:
- 15 comprehensive unit tests
- 100% coverage for `boardOperations.ts`
- Tests cover: board reconstruction, piece placement, rotation, immutability

**Verification:**
- ✅ Type checking passes
- ✅ ESLint passes (no warnings)
- ✅ All 53 unit tests pass (38 existing + 15 new)
- ✅ All 10 E2E tests pass (desktop, mobile-portrait, mobile-landscape)

## Benefits

### Code Quality
- **Reduced duplication**: ~150 lines of duplicate code eliminated
- **Better testability**: Pure functions are easy to unit test
- **Clear boundaries**: Common layer has NO DOM dependencies
- **Single source of truth**: Board operations centralized

### Architecture
- **Pure game logic** (`src/common/`) - Framework-agnostic, testable
- **UI layer** (`src/client/`) - React components, DOM interactions
- **Clear separation**: Data (shapes) separate from presentation (colors)

### Maintainability
- **Easier to understand**: Clear module boundaries
- **Easier to modify**: Changes to game logic don't affect UI (and vice versa)
- **Easier to test**: Pure functions can be tested in isolation
- **Dual architecture preserved**: Both desktop and mobile benefit from shared logic

## What Was NOT Changed

Following a low-risk approach:
- ✅ **`Game.tsx`** kept as alternative for desktop (proven, stable)
- ✅ **`useGameController`** not split further (deferred to future work)
- ✅ Both implementations benefit from shared pure functions

## Files Changed

### Created (4 files)
- `src/common/boardOperations.ts`
- `src/common/utils/shapeHelpers.ts`
- `src/client/utils/dragHelpers.ts`
- `src/client/utils/pieceColors.ts`

### Modified (11 files)
- `src/common/pieceData.ts`
- `src/client/layouts/common/useGameController.ts`
- `src/client/components/Game.tsx`
- `src/client/layouts/common/DndProvider.tsx`
- `src/client/components/Board.tsx`
- `src/client/components/Piece.tsx`
- `src/client/components/PieceDragPreview.tsx`
- `src/client/components/Piece.styled.ts`
- `src/client/components/Board.styled.ts`
- `src/client/components/HelpModal.tsx`
- `src/client/layouts/common/DndProvider.test.tsx`

### Deleted (1 file)
- `src/common/utils/dragHelpers.ts`

### Tests Created (1 file)
- `test/common/boardOperations.test.ts` (15 tests, 100% coverage)

## Documentation Updated

- **Created `docs/architecture.md`** - Comprehensive architecture overview
- **Updated `CLAUDE.md`** - Reflects new structure and utilities

## Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Duplicate code | ~150 lines | ~0 lines | -150 lines |
| DOM deps in common | 1 file | 0 files | -1 file |
| Shape utils copies | 4 copies | 1 copy | -3 copies |
| Test coverage | 81.5% | 82.1% | +0.6% |
| Unit tests | 38 | 53 | +15 tests |
| E2E tests | 10 pass | 10 pass | No change |

## Future Work (Optional)

If further refactoring is needed:

1. **Split `useGameController`** (High Risk - NOT DONE)
   - Extract modal state to `useGameModals`
   - Extract server sync to `useServerSync`
   - Extract session persistence to `useSessionPersistence`
   - Extract keyboard shortcuts to `useKeyboardShortcuts`
   - Would reduce from ~988 lines to ~200 lines

2. **Unify Desktop and Mobile**
   - Explore using @dnd-kit for desktop
   - Would eliminate `Game.tsx`
   - Risk: desktop works perfectly now

**Recommendation**: Current architecture is solid. Future refactorings should be motivated by specific pain points, not just "cleaner code."

## References

- [Architecture Overview](./architecture.md) - Detailed architecture documentation
- [Drag-and-Drop Guidelines](./drag-drop-guidelines.md) - DnD implementation details
- [Original Refactoring Plan](./plans/opencode-refactor.md) - Initial planning document
