# TODO List

This document tracks planned features and improvements for the Calendar Puzzle project. Items are organized by category and listed in priority order. See [DESIGN.md](DESIGN.md) for detailed design elaborations on each item.

## Backend

### Project Setup
- [x] Add Fastify backend server
- [x] Restructure project into `client/`, `server/`, and `common/` folders under the `src/` folder
- [x] Server serves client files and static assets from `build/`
 

### Shared Game Logic
- [x] Move game types to `common/` (available to both client and server)
- [x] Move game validation to `common/` (available to both client and server)
- [x] Keep solver on server only
- [x] Implement hint mechanism on server (returns a random valid move)

### Authentication
- [ ] Implement OAuth authentication (Google, GitHub — no username/password)

### Database
- [ ] Design database schema (`users`, `users_results` tables)
- [x] Database schema for solutions caching (`solutions` table with date_key and pieces)

### API Endpoints (REST)
- [ ] `POST /api/results` — Mark date as completed (logged-in users, server-validated)
- [x] `GET /api/solution/:date` — Return puzzle solution (currently public, auth pending)
- [x] `GET /api/hint/:date` — Return a single valid move (currently public, auth pending)

### Infrastructure
- [x] Error handling and logging (Fastify logger enabled, structured error responses)

## UX/UI Improvements

### High Priority
- [x] Reset button next to undo/redo
- [x] Calendar picker to play different dates
- [x] Visual feedback for invalid moves (shake animation, red highlight)
- [ ] Improve mobile responsiveness (touch controls, pinch-to-zoom, swipe gestures)

### Controls & Interaction
- [x] Enhance piece rotation/flip controls (icons, keyboard shortcuts)
- [x] Improve drag and drop (overlay valid drop zones, highlight legal cells)

### Accessibility
- [x] Add ARIA labels and roles (partial: controls have aria-labels)
- [x] Full keyboard navigation (Ctrl+Z for undo, Ctrl+Y or Ctrl+Shift+Z for redo)
- [ ] High contrast mode

### Visual Polish
- [x] Smooth transitions and animations (theme transitions, piece animations, shake animation)
- [x] Grid highlight on hover (playable cells have hover effects)
- [x] Piece shadows for depth (box-shadows on pieces and board)
- [x] Theme consistency (cohesive colors, smooth theme transitions)
- [ ] Confetti animation on puzzle completion

### User Guidance
- [x] Help system (tutorial overlay, tooltips, help button) (partial: tooltips on controls)
- [x] Game state feedback (highlight selected piece, distinguish placed/unplaced pieces)

## Features

### Statistics & Progress
- [ ] Solving streak tracking (consecutive days completed)
- [ ] Personal statistics dashboard (puzzles / 365 completed)
