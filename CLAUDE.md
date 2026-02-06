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
| `npm run test` | Run all Jest tests, type‑check, lint. |
| `npm run jest <file|pattern>` | Run Jest on specific file or pattern. |
| `npm run type-check` | Compile TS without emitting. |
| `npm run eslint` | Lint source and tests. |
| `npm run eslint:fix` | Auto‑fix lint issues. |
| `npm run db:generate` | Generate Drizzle migrations. |
| `npm run db:migrate` | Apply pending migrations. |
| `npm run db:studio` | Open Drizzle Studio. |
| `npm run db:docs` | Generate DB docs. |
| `npm run build:image` | Build Docker image. |
| `npm run deploy:dev` | Build image & run Compose for dev. |
| `npm run deploy:production` | Build image & run Compose for prod. |

**Running a single unit test**

```bash
npm test -- path/to/__tests__/piece.test.ts
# or
npx jest path/to/__tests__/piece.test.ts
```

**Running E2E tests (Playwright)**

```bash
npx playwright test                              # All E2E tests
npx playwright test --project mobile-portrait     # Specific layout
npx playwright test test/e2e/drag-drop.spec.ts    # Specific test file
npx playwright test -g "outer cell"               # By test name
```

## Project Structure

```
calendar-puzzle/
├─ src/
│  ├─ client/      # React frontend
│  ├─ server/      # Fastify backend
│  └─ common/      # Shared types, game logic, solver
├─ scripts/
├─ tests/
├─ docs/
└─ public/
```

### Frontend (`src/client/`)

- React 19 + Vite, Material‑UI, Emotion.
- Drag‑and‑drop via `@dnd‑kit`.
- State via React context + reducer (`GameState`).
- API client in `src/client/service/`.
- Three layout modes: desktop, mobile-portrait, mobile-landscape (`src/client/layouts/`).

### Drag-and-Drop Architecture

The `DndProvider` (`src/client/layouts/common/DndProvider.tsx`) is the central drag-and-drop controller. Key patterns:

- **Portal rendering**: `DragOverlay` is rendered via `createPortal` into `document.body` to escape CSS stacking contexts.
- **Visual rect detection**: `findVisualPieceRect` queries the PieceGrid's `getBoundingClientRect()` for accurate dimensions after CSS rotation/flip transforms.
- **Empty cell handling**: `findNearestFilledCell` snaps the drag anchor to the nearest filled cell when the touch lands on a transparent gap.
- See `docs/drag-drop-guidelines.md` for full details and pitfalls.

### Backend (`src/server/`)

- Fastify 5 with plugins (helmet, csrf, passport, rate‑limit, session, static).
- OAuth via passport‑google‑oauth20 & passport‑github.
- DB with Drizzle ORM (PostgreSQL).
- REST routes under `src/server/rest/`.
- Solver worker `src/server/workers/puzzleSolverWorker.ts`.

### Common (`src/common/`)

- Types (`GameState`, `Piece`, etc.).
- Core game logic (`gameLogic.ts`).
- Solver (`puzzleSolver.ts`).
- Constants (`consts.ts`).

## API Endpoints

| Path | Method | Auth | Purpose |
|---|---|---|---|
| `/api/auth/login/:provider` | GET | No | Initiate OAuth |
| `/api/auth/callback/:provider` | GET | No | OAuth callback |
| `/api/auth/logout` | POST | Yes | Terminate session |
| `/api/auth/me` | GET | Yes | Current user info |
| `/api/results` | POST | Yes | Submit puzzle |
| `/api/results` | GET | Yes | Retrieve history |
| `/api/solver` | POST | Yes | Full solution |
| `/api/hint` | POST | Yes | Single helpful move |

See `docs/DESIGN.md` for schema details.

## Development Workflow

1. Start dev: `npm run dev:all`.
2. Lint & type‑check: `npm run eslint -- --quiet`, `npm run type-check`.
3. Tests: `npm run test` or target file.
4. Build: `npm run build`.
5. Deploy: `npm run deploy:dev` or `npm run deploy:production`.

All commits should follow `<subject> – <description>` style.
