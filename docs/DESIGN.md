# Design Document

This document provides detailed design elaborations for the features and improvements listed in [TODO.md](TODO.md). Each section describes the rationale, approach, and low-level implementation details for planned work.

---

## Architecture Overview

The project will be restructured with four main directories under `src/`:

```
calendar-puzzle/
└── src/
    ├── client/      # React frontend
    ├── server/      # Fastify backend (serves client files)
    ├── common/      # Shared types and validation logic
    └── resources/   # Static assets (index.html, images, etc.)
```

### Data Flow

```
┌─────────────────────────────────────────────────┐
│                 Server (Fastify)                 │
│  ┌───────────────┐      ┌───────────────────┐   │
│  │ Serves static │      │    REST API       │   │
│  │ client files  │      │   /api/*          │   │
│  └───────────────┘      └───────────────────┘   │
└──────────────────────────┬──────────────────────┘
                           │ imports
                           ▼
┌─────────────┐      ┌─────────────────────────────┐
│   Client    │      │           Common            │
│   (React)   │─────►│  (Types, Validation, etc.)  │
└─────────────┘      └─────────────────────────────┘
```

---

## Backend

### Project Restructuring

Reorganize the existing `src/` folder into `client/`, `server/`, and `common/` subdirectories. The Fastify server will serve the client build and static files from `public/`.

**Low-level design:**
- Create `src/client/`, `src/server/`, `src/common/`, `src/resources/` directories.
- Move current `src/` contents (components, hooks, utils, etc.) into `src/client/`.
- Move `public/` contents (index.html, images, etc.) into `src/resources/`.
- Configure Fastify to serve the built client app and static assets from `src/resources/`.
- Configure TypeScript project references for shared code.
- Update build scripts and CI/CD pipelines.

### User Authentication

Implement OAuth-based authentication using trusted providers (Google, GitHub). No username/password authentication to reduce security burden.

**Low-level design:**
- Use `@fastify/oauth2` plugin for OAuth flows.
- Support Google and GitHub as initial providers.
- Store user sessions using `@fastify/session` with secure cookie settings.
- Create a `users` table with fields: `id`, `provider`, `provider_id`, `email`, `display_name`, `created_at`, `updated_at`.
- On successful OAuth callback, create or update user record and establish session.
- Provide `/api/auth/login/:provider`, `/api/auth/callback/:provider`, and `/api/auth/logout` endpoints.

### Database Schema

Design a relational schema to track users and their puzzle completion history.

**Low-level design:**
- Use PostgreSQL as the database.
- Tables:
  - `users`: `id` (UUID), `provider`, `provider_id`, `email`, `display_name`, `created_at`, `updated_at`
  - `users_results`: `id` (UUID), `user_id` (FK), `puzzle_date` (DATE), `completed_at` (TIMESTAMP), `solution_state` (JSONB)
- Add unique constraint on `(user_id, puzzle_date)` to prevent duplicate completions.
- Use `solution_state` to store the final board state for verification.

### API Endpoints

RESTful API design for game functionality.

**Low-level design:**

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/login/:provider` | GET | No | Initiate OAuth flow |
| `/api/auth/callback/:provider` | GET | No | OAuth callback handler |
| `/api/auth/logout` | POST | Yes | End user session |
| `/api/auth/me` | GET | Yes | Get current user info |
| `/api/results` | POST | Yes | Submit completed puzzle |
| `/api/results` | GET | Yes | Get user's completion history |
| `/api/solver` | POST | Yes | Get full solution for a date |
| `/api/hint` | POST | Yes | Get a single valid move |

**Request/Response examples:**

```typescript
// POST /api/results
Request: { date: "2025-01-15", boardState: BoardState }
Response: { success: true, completedAt: "2025-01-15T10:30:00Z" }

// POST /api/hint
Request: { date: "2025-01-15", currentState: BoardState }
Response: { piece: PieceState, position: { row: 2, col: 3 } }
```

### Solver and Hint APIs

Move the puzzle solver to the server and expose it through authenticated endpoints.

**Low-level design:**
- Move `puzzleSolver.ts` to `server/src/services/`.
- Keep solver logic unchanged but run it server-side only.
- Solver endpoint returns the complete solution.
- Hint endpoint:
  - Run solver to find a valid solution.
  - Compare current board state to solution.
  - Return one piece placement that moves toward the solution.
  - Randomize which valid move to return for variety.

### Error Handling and Logging

Implement consistent error handling and structured logging.

**Low-level design:**
- Use `@fastify/sensible` for standardized HTTP errors.
- Create custom error classes for domain-specific errors (e.g., `PuzzleNotSolvableError`).
- Use `pino` (built into Fastify) for structured JSON logging.
- Log levels: `error` for failures, `warn` for retries, `info` for requests, `debug` for development.
- Add request ID tracking for tracing.
- Return user-friendly error messages; log detailed errors server-side.

---

## UX/UI Improvements

### Visual Feedback for Invalid Moves

When a user attempts to place a piece in an invalid position, provide immediate visual feedback such as a brief shake animation and a red highlight on the piece or board cell. This helps users understand why their action was not accepted and improves the learning curve for new players.

**Low-level design:**
- Add a state variable (e.g., `invalidDrop`) to the relevant component to trigger feedback.
- Use CSS animations (e.g., `@keyframes shake`) and conditional class names for the shake and red highlight.
- Reset the feedback state after a short timeout (e.g., 500ms).
- Update the drop handler to set this state when a move is invalid.

### Enhance Piece Rotation and Flip Controls

Add clear visual indicators (such as arrow or flip icons) to the rotation and flip controls. Consider implementing keyboard shortcuts (e.g., R for rotate, H for horizontal flip, V for vertical flip) to make the controls more accessible and efficient for power users.

**Low-level design:**
- Replace text buttons with icon buttons using SVGs or a UI library.
- Add `tabIndex` and `aria-label` for accessibility.
- Add event listeners for keyboard shortcuts in the main game component.
- Show tooltips on hover/focus for each control.

### Improve Drag and Drop

While dragging a piece, overlay the board with a semi-transparent highlight on valid drop zones. When hovering over a legal cell, add a subtle highlight to indicate where the piece can be placed. This makes the drag-and-drop experience more intuitive and user-friendly.

**Low-level design:**
- Calculate valid drop zones in the drag start handler and store them in state.
- Render a semi-transparent overlay on valid cells using conditional class names.
- Add CSS for the highlight effect.
- Clear the overlay state on drag end.

### Improve Mobile Responsiveness

Ensure the UI is touch-friendly for mobile users. Add larger touch targets for controls, implement pinch-to-zoom for the game board, and allow swipe gestures for rotating or flipping pieces. This will make the game more enjoyable and accessible on smartphones and tablets.

**Low-level design:**
- Use CSS media queries to adjust layout and control sizes for small screens.
- Add touch event handlers for drag, rotate, and flip actions.
- Use a library (e.g., Hammer.js) or React hooks for pinch and swipe gestures.
- Test and adjust hit areas for all interactive elements.

### Accessibility Improvements

Add ARIA labels and roles to interactive elements for better screen reader support. Implement full keyboard navigation for all game controls and consider adding a high contrast mode for users with visual impairments. These changes will make the game more inclusive.

**Low-level design:**
- Audit all interactive elements for ARIA attributes and roles.
- Ensure all controls are reachable and usable via keyboard (tab, enter, space, arrow keys).
- Add a toggle for high contrast mode and corresponding CSS variables.
- Test with screen readers and keyboard-only navigation.

### Visual Polish

Add smooth transitions and animations for piece movements, grid highlights when hovering over the board, and subtle shadow effects to pieces to create a sense of depth. These enhancements will make the game feel more modern and visually appealing.

**Low-level design:**
- Add CSS transitions for transform, opacity, and box-shadow on pieces and cells.
- Add hover/focus styles for board cells.
- Use box-shadow or filter for piece depth.
- Optimize animation performance with `will-change` and hardware acceleration.

### Game State Feedback

Clearly indicate the currently selected piece with a highlight or border. Visually distinguish between pieces that have been placed on the board and those still in the pile. Optionally, highlight pieces that can still be moved to help users strategize.

**Low-level design:**
- Add a `selected` state and conditional class for the selected piece.
- Style placed pieces differently (e.g., opacity, border, or color).
- Optionally, add a filter or highlight for movable pieces.
- Update the rendering logic in the board and piece components.

### Help System

Add a tutorial overlay for first-time users, tooltips for game controls, and a help button that explains the game rules and controls. This will lower the barrier to entry for new players and reduce confusion.

**Low-level design:**
- Create a modal or overlay component for the tutorial.
- Store a flag in localStorage to show the tutorial only for new users.
- Add tooltip components to controls using a library or custom implementation.
- Add a persistent help button that opens a rules/instructions modal.

### Theme Consistency

Ensure the color scheme is cohesive and works well in both light and dark modes. Add smooth transitions when toggling themes to create a polished and professional feel throughout the application.

**Low-level design:**
- Define color variables for both light and dark themes in CSS or a theme provider.
- Use CSS transitions for background, color, and border changes.
- Audit all components for theme compatibility and adjust as needed.
- Test theme switching for smoothness and visual consistency.
