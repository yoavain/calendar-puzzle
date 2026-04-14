# TODO List

This document tracks planned features and improvements for the Calendar Puzzle project. Items are organized by category and listed in priority order. See [DESIGN.md](DESIGN.md) for detailed design elaborations on each item.

## UX/UI Improvements

### High Priority
- [ ] Improve mobile responsiveness (touch controls, pinch-to-zoom, swipe gestures)

### Accessibility
- [ ] High contrast mode

---

## Archived (Completed)

### Security
- [x] Implement CSRF protection layer (e.g., `@fastify/csrf-protection`)

### Features (Progress & Statistics)
- [x] Personal statistics dashboard (puzzles / 366 completed) — Added to Statistics modal
- [x] Add progress bar showing board coverage (covered cells / total available cells)
- [x] Statistics Modal: Display "Played", "Win %", "Current Streak", and "Max Streak"
- [x] Streak calculation logic (consecutive days)
- [x] Real-time progress tracking during gameplay

### Authentication & Database
- [x] Implement OAuth authentication (Google strategy)
- [x] Design database schema (`users`, `solutions`, `user_puzzle_stats` tables)
- [x] Implement persistent session storage with PostgreSQL

### API Endpoints (REST)
- [x] `POST /api/stats/start` — Record when a user starts a puzzle
- [x] `POST /api/stats/complete` — Record when a user completes a puzzle (server-validated)
- [x] `GET /api/auth/me` — Get current user and their statistics
- [x] `GET /api/admin/solution/:date` — Return puzzle solution (admin only)
- [x] `GET /api/hall-of-fame` — Return user activity data (authenticated users)
- [x] `PUT /api/hint` — Get a hint and record its usage
- [x] `GET /api/hint/:date/state` — Check whether a hint was used for a given date

### Session (Local Storage)
Persist game state locally for all users (regardless of authentication). See [SESSION.md](SESSION.md) for details.

- [x] Save session data: current date + board state
- [x] On page reload: if saved date matches current date, restore board state
- [x] If state is completed, player cannot continue playing, and the page is loaded with the "success" popup (just like after completion)
- [x] On page reload: if saved date doesn't match, ignore saved state
- [x] On every board change, update the session

### Backend
- [x] Refactor Piece data structure: shape extracted to `PIECE_DATA` constant, fetched by ID
- [x] Add Fastify backend server
- [x] Restructure project into `client/`, `server/`, and `common/` folders under the `src/` folder
- [x] Server serves client files and static assets from `build/`
- [x] Move game types to `common/` (available to both client and server)
- [x] Move game validation to `common/` (available to both client and server)
- [x] Keep solver on server only
- [x] Implement hint mechanism on server (returns a random valid move)
- [x] Database schema for solutions caching (`solutions` table with date_key and pieces)
- [x] Error handling and logging (Fastify logger enabled, structured error responses)

### UX/UI Improvements
- [x] Implement history pruning in `useGameHistory` (limit `MAX_HISTORY` steps)
- [x] Reset button next to undo/redo
- [x] Calendar picker to play different dates
- [x] Visual feedback for invalid moves (shake animation, red highlight)
- [x] Enhance piece rotation/flip controls (icons, keyboard shortcuts)
- [x] Improve drag and drop (overlay valid drop zones, highlight legal cells)
- [x] Add ARIA labels and roles (partial: controls have aria-labels)
- [x] Full keyboard navigation (Ctrl+Z for undo, Ctrl+Y or Ctrl+Shift+Z for redo)
- [x] Smooth transitions and animations (theme transitions, piece animations, shake animation)
- [x] Grid highlight on hover (playable cells have hover effects)
- [x] Piece shadows for depth (box-shadows on pieces and board)
- [x] Theme consistency (cohesive colors, smooth theme transitions)
- [x] Help system (tutorial overlay, tooltips, help button) (partial: tooltips on controls)
- [x] Game state feedback (highlight selected piece, distinguish placed/unplaced pieces)
- [x] Confetti animation on puzzle completion — `fireConfetti()` in `useGameController.ts` (commit 461048e)
