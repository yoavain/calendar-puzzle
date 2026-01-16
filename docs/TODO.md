# TODO LIST 

## BACKEND (by priority)

- [ ] Add backend. Fastify. Move files to "client", "server", "common" folders
- [ ] Implement user authentication (login, registration. Only official, no user/password)
- [ ] Move some of the game logic
  - [ ] Game types should be available both for client and server
  - [ ] Game validation should be available both for client and server
  - [ ] Solver should be available only on server
  - [ ] Hint mechanism should be available only on server (subset of the solver, returns a random "correct" move)

- [ ] Database schema design (users, users_results)
- [ ] API endpoints (REST)
    - [ ] On success - mark date as `completed` in the database (only logged-in users). Need to send result state for server-validation
    - [ ] Solver API - Implement solver functionality on the server (only logged-in users)
    - [ ] Hint API - Implement hint functionality on the server (only logged-in users)
- [ ] Error handling and logging

## UX/UI Improvements (by priority)

- [ ] Reset button next to the undo/redo button
- [ ] Calendar implementation to play a different date (only for logged-in users)
- [ ] Visual feedback for invalid moves (shake animation and red highlight)
- [ ] Enhance piece rotation and flip controls (visual indicators and keyboard shortcuts)
- [ ] Improve drag and drop (overlay valid drop zones, highlight legal cells)
- [ ] Improve mobile responsiveness (touch controls, pinch-to-zoom, swipe gestures)
- [ ] Accessibility improvements (ARIA labels, keyboard navigation, high contrast mode)
- [ ] Visual polish (smooth transitions, grid highlight, piece shadows)
- [ ] Theme consistency (cohesive color scheme, smooth theme transitions)
- [ ] Help system (tutorial overlay, tooltips, help button)
- [ ] Game state feedback (highlight selected piece, distinguish placed/unplaced pieces)

---

