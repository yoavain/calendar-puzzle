# Calendar Puzzle

A daily puzzle game where players arrange pieces on a calendar board to leave only the current date exposed. Built with React and Fastify.

## Game Overview

Each day presents a unique puzzle challenge:
- **Objective**: Place all 8 puzzle pieces on the board so that only the current month and day cells remain uncovered
- **Daily Challenge**: The puzzle changes every day based on the date
- **Hint System**: Get help by requesting a hint that places one piece correctly
- **Solution Reveal**: Stuck? Request the full solution from the server

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Fastify, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Solver**: DLX (Dancing Links) algorithm for exact cover problems

## Project Structure

```
src/
├── client/       # React frontend
├── server/       # Fastify backend
├── common/       # Shared types and game logic
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (for production)

### Development

```bash
# Install dependencies
npm install

# Run frontend only
npm run dev

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
npm run start:docker
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server (frontend only) |
| `npm run dev:all` | Start both frontend and backend |
| `npm run build` | Build client and server |
| `npm start` | Run production server |
| `npm test` | Run tests |
| `npm run start:docker` | Build and run with Docker |

## Documentation

- [TODO.md](docs/TODO.md) — Planned features and improvements
- [DESIGN.md](docs/DESIGN.md) — Detailed design document

## License

ISC
