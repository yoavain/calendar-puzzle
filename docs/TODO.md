# TODO List

This document tracks planned features and improvements for the Calendar Puzzle project. Items are organized by category and listed in priority order. See [DESIGN.md](DESIGN.md) for detailed design elaborations on each item.

## UX/UI Improvements

### High Priority
- [ ] Improve mobile responsiveness (touch controls, pinch-to-zoom, swipe gestures)

### Accessibility
- [ ] High contrast mode
- [ ] Touch target audit fails in PageSpeed (Accessibility 95, the only audit left). Elements: the 8 carousel indicator dots (`role="tab"`, `aria-label="Piece N of 8"`) and the rotate and flip icon buttons in `PieceCarousel.tsx`. Lighthouse wants a target of at least 24 by 24 px, or enough space around it. Measure the sizes and gaps first. If the look changes, ask the owner. Pad the hit area and keep the dot size. Test one touch drag after the change: the carousel and dnd-kit race is in `src/client/CLAUDE.md`.
- [ ] Look at the progress bar count and the carousel piece names on a phone in the three layouts. Only the isolated component was checked. The light `progress.placementTrack` (`#757575`) is redundant now that the count sits on a pill. Set it back to `#e0e0e0` in `theme.ts` if the heavy empty bar is not wanted.

### Hint Tokens
- [ ] Reconcile a board restored from browser storage with the server's hints on load. Deferred (PR #153 review): when the server has more hints (used on another device), the Hint button asks for a token the server would not charge, and at 0 tokens the board cannot catch up. Reset already recovers.

### Performance (PageSpeed, mobile)
Findings from the 2026-11-11 PageSpeed work. Prod scores 98. The first-load JS is smaller on Dev (`index` 256 -> 166 KB raw), but the score did not move: `react-dom` (202 KB) and MUI (about 280 KB raw) are the cost, and the first paint needs them.
- [ ] Repeat PageSpeed 3 to 5 times per site and compare medians. Reports so far: TBT 50 ms (prod), 100 ms and 310 ms (Dev), with the Performance score 98, 98 and 92. The long tasks are in `react-DCTAcUCH.js`, which is the same file on both sites. A same-machine check (4x CPU, 6 interleaved cold runs) gave script time 425 ms on prod and 412 ms on Dev, so the rise is most likely runner noise. The PageSpeed API quota is used up. Run it through the page.
- [ ] Deploy to Production, then run PageSpeed on Production and compare with the Dev numbers. Owner step. Check `curl -sI` for `cache-control: no-cache` on Production (verified live on Dev only).
- [ ] Hand-test on Dev what was only checked in a script: Share (copy link, enlarge the QR code), the native share sheet in the year-complete dialog, `TokenConfirmDialog`, two dialogs that open at once, confetti on a solve, and a failed dialog chunk (an old tab after a deploy: the dialog closes and `logToServer` logs it).
- [ ] Decide when the dialog chunks preload. `lazyDialog` fetches them 1.5 s after `window.load`. That falls inside the Lighthouse window and adds 6 KiB to its page weight (265 -> 271 KiB). No metric changes. Option: preload on the first `pointerdown`, `keydown` or `touchstart`. The cost is no head start for a visitor whose first tap opens a dialog. Change `PRELOAD_DELAY_MS` and the trigger in `src/client/components/lazyDialog.tsx` only.
- [ ] Check the back/forward cache in Safari and Firefox. Chrome 159 restores the page with `no-cache`. Chrome with `no-store` only blocks it when a session cookie changes. The `pageshow` listener in `UserProvider` refreshes the user after a restore.
- [ ] Optional: split the `/poster` route. Lazy-load `LandingPage` (about 5 KB raw). A further step replaces `BrowserRouter` with a `location.pathname` check and drops `react-router` (36 KB raw). That removes a dependency and changes navigation from `/poster` to `/` into a page load. Keep the dev `basename` behaviour (`/client` under Vite).
- [ ] Optional: browser bar colour. `theme-color` in `public/index.html` is `#000000`. Two tags with `media="(prefers-color-scheme: ...)"` would match the light and dark themes. It changes the phone browser bar, so the owner decides.
- [ ] Optional: a board skeleton in `public/index.html`. Not added: FCP ignores a background, and a skeleton with text would only move FCP on paper. Re-open if the metric should move.
- [ ] Deferred: lazy-load the three layouts. A phone saves about 10 KB raw. The layouts share almost all their code, and the risk is a rotation flash and the drag race.
- [ ] Deferred: remove the MUI and `react-dom` weight. Only replacing MUI or prerendering would cut the first-load JS further. Both were rejected as out of proportion for a drag-and-drop game (hydration must also work with dnd-kit and embla).
- [ ] Move the durable facts of the local plan (`docs/plan/2026-11-11 - PageSpeed Mobile Performance.md`, gitignored) into `docs/ARCHITECTURE.md`, then delete it: dialogs load lazily through `lazyDialog`; the HTML is `no-cache` and `UserProvider` refreshes on `pageshow`; the inline `<style>` in `public/index.html` copies `background.default` from the theme; the `vendor` chunk stays (comment in `vite.config.ts`).

---

## Archived (Completed)

### Security
- [x] Implement CSRF protection layer (e.g., `@fastify/csrf-protection`)

### Features (Progress & Statistics)
- [x] Personal statistics dashboard (puzzles / 366 completed) — Added to Statistics modal
- [x] Add progress bar showing placed pieces in placement order (one 12.5% segment per piece)
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

### Performance (PageSpeed, mobile)
- [x] Lazy-load the Share, year-complete, Stats, Issue, Help, Hall of Fame and token-confirm dialogs through `lazyDialog` (`lazyDialog.tsx`, `LazyShareDialog.ts`, `LazyYearCompleteDialog.ts`, `lazyDialogs.ts`)
- [x] Load `canvas-confetti` on demand (`loadConfetti` in `useGameController.ts`)
- [x] Serve `index.html` with `Cache-Control: no-cache`, so the back/forward cache stays available, and refresh the user on `pageshow`
- [x] Paint the theme colour on `html` before the script runs (`public/index.html`, `ColorModeContext.tsx`)
- [x] Name the carousel pieces for screen readers (`aria-label` on the `DraggablePiece` wrapper)
- [x] Fix the contrast of the progress bar count: a dark pill (`SegmentLabelPill`) and the tokens `progress.labelBackground` and `progress.placementTrack`. The Stats modal bar keeps `progress.track`: its label is dark text on that track.
- [x] Skipped on purpose: dropping the forced `vendor` chunk (FCP did not change, and `index` would change on every deploy) and allowing the Cloudflare reporting endpoint in the CSP (no console error)
