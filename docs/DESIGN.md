# Design Document

This document provides detailed design elaborations for the features and improvements listed in [TODO.md](TODO.md). Each section describes the rationale, approach, and low-level implementation details for planned work.

---

## Architecture Overview

> **Note:** This section describes the original plan. The project was implemented with three directories under `src/` — `client/`, `server/`, and `common/`. The planned `resources/` subdirectory was never created; static assets are served from `public/` instead. See [ARCHITECTURE.md](ARCHITECTURE.md) for the current layout.

The project was restructured with three main directories under `src/`:

```
calendar-puzzle/
└── src/
    ├── client/      # React frontend
    ├── server/      # Fastify backend (serves client files)
    └── common/      # Shared types and validation logic
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

**Low-level design (as implemented):**
- Created `src/client/`, `src/server/`, `src/common/` directories.
- Moved original `src/` contents (components, hooks, utils, etc.) into `src/client/`.
- Static assets remain in `public/`; Fastify serves the built client app and static assets from `build/` and `public/`.
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

### Original API Design (Historical)

> **Note:** The table below is the original design plan and is superseded by the implemented API.
> See the API Endpoints table in [CLAUDE.md](../CLAUDE.md) for the current routes, methods, and auth requirements.

**Original design (for historical reference):**

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

**Key differences from implementation:**
- OAuth routes are `/auth/google` and `/auth/google/callback` (not `/api/auth/...`)
- `/api/results` was split into `POST /api/stats/start` and `POST /api/stats/complete`
- `/api/solver` became `GET /api/admin/solution/:date`
- `/api/hint` uses `PUT`, not `POST`

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

Add ARIA labels and roles to interactive elements for better screen reader support. Implement full keyboard navigation for all game controls. These changes will make the game more inclusive.

**Low-level design:**
- Audit all interactive elements for ARIA attributes and roles.
- Ensure all controls are reachable and usable via keyboard (tab, enter, space, arrow keys).
- Test with screen readers and keyboard-only navigation.

### High Contrast Mode

Provide a high contrast mode for users with visual impairments, improving visibility and readability.

**Low-level design:**

**Toggle mechanism:**
- Add a high contrast toggle button in the settings/header area
- Store preference in localStorage (`calendar-puzzle-high-contrast`)
- Respect `prefers-contrast: more` media query as default

**Color scheme:**
```css
:root[data-high-contrast="true"] {
  --bg-primary: #000000;
  --bg-secondary: #1a1a1a;
  --text-primary: #ffffff;
  --text-secondary: #e0e0e0;
  --border-color: #ffffff;
  --accent-color: #ffff00;        /* High visibility yellow */
  --success-color: #00ff00;       /* Bright green */
  --error-color: #ff0000;         /* Bright red */
  --piece-border: 2px solid #fff; /* Clear piece boundaries */
}
```

**Visual adjustments:**
- Increase border widths on pieces and board cells (2px minimum)
- Use solid colors instead of gradients
- Ensure minimum 7:1 contrast ratio for text (WCAG AAA)
- Add visible focus indicators (3px outline)
- Remove or simplify shadows that reduce clarity
- Use patterns/textures in addition to colors for piece differentiation

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

### Confetti Animation on Puzzle Completion

Celebrate the user's success with a satisfying confetti animation when they complete the puzzle. This provides positive reinforcement and makes the achievement feel rewarding.

**Low-level design:**
- Use a lightweight confetti library (e.g., `canvas-confetti` or `react-confetti`).
- Trigger the animation when the puzzle is solved (all pieces placed correctly).
- Configure confetti to burst from the center of the screen with puzzle-themed colors.
- Animation should last 2-3 seconds and not block user interaction.
- Ensure the animation respects `prefers-reduced-motion` for accessibility.
- Clean up canvas/DOM elements after animation completes to prevent memory leaks.

---

## Features

### Session (Local Storage)

Persist game state locally for all users (regardless of authentication) to prevent progress loss on page reload.

**Low-level design:**

**Storage key:** `calendar-puzzle-session`

**Implemented data structure** (see `src/client/hooks/useGameSession.ts`):
```typescript
interface SessionData {
  date: PuzzleDate;    // { month: number; day: number }
  pieces: Piece[];     // Full piece array with positions/transforms
  isSolved: boolean;
}
```

> **Note:** The original design included `playedDates` and `completedDates` arrays in localStorage. In the implemented version these are server-side only (stored in the `userPuzzleStats` PostgreSQL table for authenticated users). The session only stores the current day's board state.

**Behavior:**
- **On page load:** Restore today's board state if session date matches today; otherwise start fresh.
- **On board change:** Save the full piece array and solved flag.
- **On solution revealed:** Clear the session (prevent restoring a revealed solution).

---

### Progress

Display real-time progress during gameplay to give users a sense of how close they are to completion.

**Low-level design:**

**Progress calculation:**
```typescript
const TOTAL_CELLS = 12 + 31 - 2;  // 41 playable cells (months + days - 2 blocked)

function calculateProgress(boardState: BoardState): number {
  const coveredCells = countCoveredCells(boardState);
  return coveredCells / TOTAL_CELLS;  // 0.0 to 1.0
}

function countCoveredCells(boardState: BoardState): number {
  // Count unique cells covered by all placed pieces
  // Note: Count cells, not pieces (pieces have different sizes: 5 or 6 cells)
  const coveredSet = new Set<string>();
  for (const piece of boardState.placedPieces) {
    for (const cell of piece.occupiedCells) {
      coveredSet.add(`${cell.row},${cell.col}`);
    }
  }
  return coveredSet.size;
}
```

**UI component:**
- Display a progress bar below or beside the game board
- Show percentage text (e.g., "73%" or "30/41 cells")
- Use color gradient: empty (gray) → partial (blue) → complete (green)
- Animate progress changes smoothly with CSS transitions
- Consider adding milestone markers (25%, 50%, 75%)

**Component location:** Create `ProgressBar.tsx` in `src/client/components/`

---

### Statistics

Track and display game statistics for all users, stored in browser session (localStorage). This works independently of authentication.

**Low-level design:**

**Metrics calculation (from session data):**
```typescript
interface GameStats {
  played: number;        // playedDates.length
  won: number;           // completedDates.length  
  winPercent: number;    // (won / played) * 100
  currentStreak: number; // Consecutive completed days ending today/yesterday
  maxStreak: number;     // Longest consecutive completed days ever
}

function calculateStats(session: SessionData): GameStats {
  const played = session.playedDates.length;
  const won = session.completedDates.length;
  const winPercent = played > 0 ? (won / played) * 100 : 0;
  
  const sortedDates = session.completedDates
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());
  
  const currentStreak = calculateCurrentStreak(sortedDates);
  const maxStreak = calculateMaxStreak(sortedDates);
  
  return { played, won, winPercent, currentStreak, maxStreak };
}
```

**Streak calculation:**
- Current streak: Count consecutive days backwards from today (or yesterday if today not completed)
- Max streak: Iterate through sorted dates, track longest consecutive sequence
- A "day" boundary is midnight local time

**Success popup display:**
- Trigger popup when puzzle is completed (all 41 cells covered)
- Show statistics grid:
  ```
  ┌─────────────┬─────────────┐
  │   Played    │   Win %     │
  │     42      │    85%      │
  ├─────────────┼─────────────┤
  │ Current     │   Max       │
  │ Streak      │   Streak    │
  │     5       │     12      │
  └─────────────┴─────────────┘
  ```
- Include share button (copy stats to clipboard)
- Include "Play next date" button

**Component location:** Create `SuccessPopup.tsx` or update existing completion modal

---

### Personal Statistics Dashboard (Future)

Provide users with a comprehensive dashboard showing their puzzle completion progress across the year.

**Low-level design:**
- Create a new `StatsPage` or `StatsModal` component.
- Display a year calendar heatmap showing completed vs. incomplete dates.
- Show key metrics:
  - Total puzzles completed (X / 365)
  - Completion percentage
  - Current streak
  - Longest streak
  - Average solve time (if tracking time)
- Use color coding: green for completed, gray for incomplete, gold for today.
- Allow clicking on a date to navigate to that puzzle.
- For logged-in users: Fetch stats from `/api/stats` endpoint.
- For anonymous users: Calculate from localStorage session data.
- Cache stats client-side and invalidate on new completion.