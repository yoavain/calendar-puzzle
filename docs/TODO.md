# TODO List

This document tracks planned features and improvements for the Calendar Puzzle project. Items are organized by category and listed in priority order. See [DESIGN.md](DESIGN.md) for detailed design elaborations on each item.

## Backend

### Authentication
- [ ] Implement OAuth authentication (Google, GitHub — no username/password)

### Database
- [ ] Design database schema (`users`, `users_results` tables)

### API Endpoints (REST)
- [ ] `POST /api/results` — Mark date as completed (logged-in users, server-validated)

## UX/UI Improvements

### High Priority
- [ ] Improve mobile responsiveness (touch controls, pinch-to-zoom, swipe gestures)

### Accessibility
- [ ] High contrast mode

### Visual Polish
- [ ] Confetti animation on puzzle completion

## Features

### Session (Local Storage)
Persist game state locally for all users (regardless of authentication).

- [ ] Save session data: current date + board state
- [ ] On page reload: if saved date matches current date, restore board state
- [ ] If state is completed, player cannot continue playing, and the page is loaded with the "success" popup (just like after completion)
- [ ] On page reload: if saved date doesn't match, ignore saved state
- [ ] On every board change, update the session

### Progress
Display real-time progress during gameplay.

- [ ] Add progress bar showing board coverage
- [ ] Progress = covered cells / total available cells
  - Total cells = 12 (months) + 31 (days) - 2 (blocked for current date) = 41
  - Count covered cells (not pieces, since piece sizes vary: most are 5 cells, one is 6)

### Statistics
Track and display game statistics for all users (stored in session).

**Data Storage:**
- [ ] Store list of completed dates in session (optimization TBD, e.g., binary encoding)

**Success Popup Display:**
- [ ] "Played" — Unique dates started playing
- [ ] "Win %" — Percent of games started that were completed
- [ ] "Current Streak" — Consecutive days completed
- [ ] "Max Streak" — Longest consecutive days completed

### Future Enhancements
- [ ] Personal statistics dashboard (puzzles / 365 completed)

---

## Archived (Completed)

### Backend
- [x] Add Fastify backend server
- [x] Restructure project into `client/`, `server/`, and `common/` folders under the `src/` folder
- [x] Server serves client files and static assets from `build/`
- [x] Move game types to `common/` (available to both client and server)
- [x] Move game validation to `common/` (available to both client and server)
- [x] Keep solver on server only
- [x] Implement hint mechanism on server (returns a random valid move)
- [x] Database schema for solutions caching (`solutions` table with date_key and pieces)
- [x] `GET /api/solution/:date` — Return puzzle solution (currently public, auth pending)
- [x] `GET /api/hint/:date` — Return a single valid move (currently public, auth pending)
- [x] Error handling and logging (Fastify logger enabled, structured error responses)

### UX/UI Improvements
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
