# TODO List

This document tracks planned features and improvements for the Calendar Puzzle project. Items are organized by category and listed in priority order. See [DESIGN.md](DESIGN.md) for detailed design elaborations on each item.

## Backend

### Project Setup
- [x] Add Fastify backend server
- [x] Restructure project into `client/`, `server/`, and `common/` folders under the `src/` folder
- [x] Server serves client files and static assets from `src/resources/`
 

### Shared Game Logic
- [ ] Move game types to `common/` (available to both client and server)
- [ ] Move game validation to `common/` (available to both client and server)
- [ ] Keep solver on server only
- [ ] Implement hint mechanism on server (returns a random valid move)

### Authentication
- [ ] Implement OAuth authentication (Google, GitHub — no username/password)

### Database
- [ ] Design database schema (`users`, `users_results` tables)

### API Endpoints (REST)
- [ ] `POST /api/results` — Mark date as completed (logged-in users, server-validated)
- [ ] `POST /api/solver` — Return puzzle solution (logged-in users only)
- [ ] `POST /api/hint` — Return a single valid move (logged-in users only)

### Infrastructure
- [ ] Error handling and logging

## UX/UI Improvements

### High Priority
- [ ] Reset button next to undo/redo
- [ ] Calendar picker to play different dates (logged-in users only)
- [ ] Visual feedback for invalid moves (shake animation, red highlight)

### Controls & Interaction
- [ ] Enhance piece rotation/flip controls (icons, keyboard shortcuts)
- [ ] Improve drag and drop (overlay valid drop zones, highlight legal cells)
- [ ] Improve mobile responsiveness (touch controls, pinch-to-zoom, swipe gestures)

### Accessibility
- [ ] Add ARIA labels and roles
- [ ] Full keyboard navigation
- [ ] High contrast mode

### Visual Polish
- [ ] Smooth transitions and animations
- [ ] Grid highlight on hover
- [ ] Piece shadows for depth
- [ ] Theme consistency (cohesive colors, smooth theme transitions)

### User Guidance
- [ ] Help system (tutorial overlay, tooltips, help button)
- [ ] Game state feedback (highlight selected piece, distinguish placed/unplaced pieces)
