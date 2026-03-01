# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (frontend only). |
| `npm run dev:all` | Start frontend and backend in watch mode. |
| `npm run build` | Build both client and server. |
| `npm run build:client` | Build React app. |
| `npm run build:server` | Bundle Fastify server & worker. |
| `npm run start` | Run compiled server. |
| `npm run test` | Run all Jest tests, type‑check, lint, and E2E. |
| `npm run jest <file|pattern>` | Run Jest on specific file or pattern. |
| `npm run test:e2e` | Run Playwright E2E tests. |
| `npm run test:e2e:headed` | Run E2E tests with browser visible. |
| `npm run test:e2e:ui` | Run E2E tests with Playwright UI. |
| `npm run type-check` | Compile TS without emitting. |
| `npm run eslint` | Lint source and tests. |
| `npm run eslint:fix` | Auto‑fix lint issues. |
| `npm run db:generate` | Generate Drizzle migrations. |
| `npm run db:migrate` | Apply pending migrations. |
| `npm run db:studio` | Open Drizzle Studio. |
| `npm run db:docs` | Generate DB docs. |
| `npm run build:image` | Build Docker image. |
| `npm run deploy:dev` | Build image & run Compose for dev. |
| `npm run deploy:dev:quick` | Quick deploy for dev (skip tests). |
| `npm run deploy:production` | Build image & run Compose for prod. |
| `npm run admin:add` | Add admin user. |
| `npm run admin:remove` | Remove admin user. |

**Running a single unit test**

```bash
npm test -- path/to/__tests__/piece.test.ts
# or
npx jest path/to/__tests__/piece.test.ts
```

**Running E2E tests (Playwright)**

```bash
npm run test:e2e                                 # All E2E tests
npx playwright test                              # All E2E tests
npx playwright test --project mobile-portrait    # Specific layout
npx playwright test test/e2e/drag-drop.spec.ts   # Specific test file
npx playwright test -g "outer cell"              # By test name
```

## Project Structure

```
calendar-puzzle/
├─ src/
│  ├─ client/      # React frontend (UI layer)
│  ├─ server/      # Fastify backend
│  └─ common/      # Pure game logic (NO DOM, NO React)
├─ scripts/        # Build & admin scripts
├─ test/           # Unit & E2E tests
├─ docs/           # Documentation
└─ public/         # Static assets
```

**See [docs/architecture.md](docs/architecture.md) for detailed architecture overview.**

### Frontend (`src/client/`)

**UI layer - React components, DOM interactions, presentation logic.**

- **Tech stack**: React 19 + Vite, Material‑UI, Emotion
- **Layouts**: Three modes in `layouts/` directory (desktop, mobile-portrait, mobile-landscape)
  - Desktop: `layouts/desktop/DesktopLayout.tsx` uses `Game.tsx` with HTML5 drag-and-drop
  - Mobile: `layouts/mobile-portrait/`, `layouts/mobile-landscape/` use `@dnd-kit`
  - Shared mobile: `layouts/common/` — `DndProvider.tsx`, `useGameController.ts`, `PieceCarousel.tsx`, `MobileToolbar.tsx`
- **State management**: React context + `useGameHistory` hook (undo/redo)
- **Components** (`components/`) - React UI components (including `PlayAnotherDialog.tsx`)
- **Hooks** (`hooks/`) - Custom React hooks
  - `useGameHistory.ts` - Undo/redo with immer
  - `useGameSession.ts` - Session persistence
  - `useLayout.ts` - Responsive layout detection
  - `useQueryParam.ts` - URL query parameter management
- **Utils** (`utils/`) - UI utilities
  - `dragHelpers.ts` - DOM-aware drag utilities
  - `pieceColors.ts` - UI color definitions
  - `initialize.ts` - Game initialization
  - `encryption.ts` - Client-side payload encryption
  - `measureUtils.ts` - DOM measurement helpers
- **API client** (`service/`) - REST API calls (`puzzleService.ts`, `logService.ts`)

### Drag-and-Drop Architecture

**Two implementations:**
- **Desktop**: `Game.tsx` uses HTML5 Drag and Drop API
- **Mobile**: `layouts/common/DndProvider.tsx` uses `@dnd-kit` library for touch support; `layouts/common/useGameController.ts` holds shared mobile game logic

**Shared pure utilities** (`src/common/utils/shapeHelpers.ts`):
- `findFirstFilledCell()` - Find top-left filled cell in a shape
- `findNearestFilledCell()` - Snap to nearest filled cell when touching empty cells

**DOM-aware utilities** (`src/client/utils/dragHelpers.ts`):
- `findVisualPieceRect()` - Get accurate dimensions after CSS transforms
- `calculateCellFromPointer()` - Convert pointer coords to board cell

**Key patterns:**
- **Portal rendering**: `DragOverlay` is rendered via `createPortal` into `document.body` to escape CSS stacking contexts
- **Visual rect detection**: Uses `findVisualPieceRect` for accurate dimensions after CSS rotation/flip transforms
- **Empty cell handling**: `findNearestFilledCell` snaps the drag anchor to the nearest filled cell when the touch lands on a transparent gap

See [docs/drag-drop-guidelines.md](docs/drag-drop-guidelines.md) for full details and pitfalls.

### Known Issues (Mobile)

#### Carousel/DnD Race Condition — intermittent drag cancellation

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
- `src/client/components/DebugPanel.tsx` — floating overlay (activate with `?debug=1` or admin toggle); dumps logs to `logs/`

**Debugging:** Enable `?debug=1`, reproduce the failed drag, press "Dump Log". Look for a `dnd:dragStart` with 0 `dnd:dragMove` events followed by `dnd:dragEnd` with no `ctrl:handlePieceDrop`. Also check for `carousel:autoReInit` events — each should be followed by a `carousel:reInit` (from `doExplicitReInit`) a few ms later.

### Backend (`src/server/`)

- Fastify 5 with plugins (helmet, csrf, passport, rate‑limit, session, static).
- OAuth via passport‑google‑oauth20.
- DB with Drizzle ORM (PostgreSQL).
- REST routes under `src/server/rest/`.
- Solver worker `src/server/workers/puzzleSolverWorker.ts`.

### Common (`src/common/`)

**Pure game logic layer - NO DOM dependencies, NO React.**

- **Types** (`types.ts`) - `GameState`, `Piece`, etc.
- **Board operations** (`boardOperations.ts`) - Pure board state mutations
  - `rebuildGameState()` - Reconstruct board from saved pieces
  - `updateBoardAndPieces()` - Update board when moving pieces
- **Game logic** (`gameLogic.ts`) - Core rules, validation, transformations
  - `getTransformedShape()` - Apply rotation/flip to piece shapes
  - `isValidPlacement()` - Validate piece placement
  - `puzzleSolvedForDate()` - Check if puzzle is solved
- **Piece data** (`pieceData.ts`) - Piece shape definitions (data only)
- **Solver** (`puzzleSolver.ts`) - DLX-based puzzle solving algorithm
- **Streak logic** (`streakUtils.ts`) - Streak & history calculation
  - `calculateStreaks(history)` - Current and max streaks
  - `findLastUnsolvedDate(completedDates, beforeDate)` - Find most recent unsolved date
- **Utils** (`utils/shapeHelpers.ts`) - Pure shape analysis
  - `findFirstFilledCell()` - Find top-left filled cell
  - `findNearestFilledCell()` - Snap to nearest filled cell
- **Constants** (`consts.ts`) - Game constants
- **REST types** (`restPaths.ts`, `restTypes.ts`) - API contracts

## API Endpoints

### Authentication
| Path | Method | Auth | Purpose |
|---|---|---|---|
| `/auth/google` | GET | No | Initiate Google OAuth |
| `/auth/google/callback` | GET | No | OAuth callback |
| `/auth/logout` | POST | No | Terminate session |
| `/api/auth/me` | GET | No | Current user info & history |
| `/api/auth/csrf-token` | GET | No | Get CSRF token |
| `/api/auth/public-key` | GET | Yes | Get server encryption key |

### Stats & Completion
| Path | Method | Auth | Purpose |
|---|---|---|---|
| `/api/stats/start` | POST | Yes | Record puzzle start |
| `/api/stats/complete` | POST | Yes | Submit puzzle completion |

### Hints & Solutions
| Path | Method | Auth | Purpose |
|---|---|---|---|
| `/api/hint` | PUT | Yes | Get hint & record usage |
| `/api/hint/:date/state` | GET | Yes | Check if hint was used |
| `/api/admin/solution/:date` | GET | Admin | Get full solution (admin only) |

### Hall of Fame & Admin
| Path | Method | Auth | Purpose |
|---|---|---|---|
| `/api/hall-of-fame` | GET | Yes | User activity statistics |

### Other
| Path | Method | Auth | Purpose |
|---|---|---|---|
| `/api/issue` | POST | Yes | Submit bug reports |
| `/api/log` | POST | Yes | Client-side logging |
| `/api/health` | GET | No | Health check |

See `docs/DESIGN.md` for detailed schema information.

## Environments

There are two separate deployed environments, each with its own DNS:

| Environment | Deploy command |
|---|---|
| **Dev** | `npm run deploy:dev` |
| **Production** | `npm run deploy:production` |

**Every change must be deployed to Dev first and manually tested before being promoted to Production.**

## Development Workflow

1. Start dev: `npm run dev:all`.
2. Lint & type‑check: `npm run eslint -- --quiet`, `npm run type-check`.
3. Tests: `npm run test` or target file.
4. Build: `npm run build`.
5. Deploy to Dev: `npm run deploy:dev` — manually test.
6. Deploy to Production: `npm run deploy:production` — only after Dev validation.

All commits should follow `<subject> – <description>` style.
