# Calendar Puzzle

A daily puzzle game where players arrange pieces on a calendar board to leave only the current date exposed. Built with React and Fastify.

![Calendar Puzzle Game](docs/resources/Screenshot-1.png)

## Game Overview

Each day presents a unique puzzle challenge:
- **Objective**: Place all 8 puzzle pieces on the board so that only the current month and day cells remain uncovered.
- **Daily Challenge**: The puzzle changes every day based on the date.
- **Controls**:
  - **Drag and Drop**: Move pieces onto the board.
  - **Rotate/Flip**: Use the controls on each piece to orient it correctly.
  - **Undo/Redo**: Use `Ctrl+Z` to undo and `Ctrl+Shift+Z` (or `Ctrl+Y`) to redo your moves.
  - **Reset**: Press `Escape` to clear the board.
- **Hint System**: Get help by requesting a hint that places one piece correctly.
- **Solution Reveal**: Stuck? Request the full solution from the server.
- **Statistics**: Track your progress, win percentage, and streaks.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Material UI (MUI), Emotion
- **Backend**: Fastify, Node.js, Passport.js (OAuth)
- **Database**: PostgreSQL with Drizzle ORM
- **Solver**: DLX (Dancing Links) algorithm for exact cover problems, running in a worker thread.

## Project Structure

The project is organized into three main parts under `src/`:

- **`src/client/`**: The React frontend application.
  - `components/`: UI components (Board, Piece, Modals, etc.).
  - `context/`: React context for user and theme management.
  - `hooks/`: Custom hooks for game logic and sessions.
  - `service/`: API client services.
- **`src/server/`**: The Fastify backend server.
  - `auth/`: Passport.js configuration and authentication middleware.
  - `db/`: Database schema, migrations, and repository logic.
  - `rest/`: API route handlers and schemas.
  - `workers/`: Background workers for heavy computations like the puzzle solver.
- **`src/common/`**: Shared code used by both client and server.
  - `gameLogic.ts`: Core game rules and board management.
  - `puzzleSolver.ts`: The DLX-based solver implementation.
  - `types.ts` & `restTypes.ts`: Shared TypeScript interfaces and API definitions.

## Available Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Start Vite dev server (frontend only) |
| `npm run dev:all` | Start both frontend and backend in watch mode |
| `npm run build` | Build both client and server |
| `npm run build:client` | Build the React frontend |
| `npm run build:server` | Build the Fastify backend and worker scripts |
| `npm start` | Run the production server |
| `npm test` | Run all tests (type-check, eslint, jest) |
| `npm run jest` | Run unit tests with Jest |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:studio` | Open Drizzle Studio to explore the database |
| `npm run build:image` | Build the Docker image |
| `npm run deploy:production` | Deploy to production using Docker Compose |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (for production and full backend features)

### Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Copy `.env.example` to `.env` and fill in your database and OAuth credentials.

3. **Run the application**:
   ```bash
   # Run both frontend and backend
   npm run dev:all
   ```

### Production

```bash
# Build everything
npm run build

# Start server
npm start
```

### Docker

```bash
# Build and run with Docker Compose
npm run deploy:production
```

## Documentation

- [TODO.md](docs/TODO.md) — Planned features and improvements.
- [DESIGN.md](docs/DESIGN.md) — Detailed design document and architecture overview.
- [AUTH.md](docs/AUTH.md) — Authentication implementation details.

## License

ISC
