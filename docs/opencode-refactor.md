# Refined Plan for Refactoring Duplicate Drag‑and‑Drop Utilities

Below is a trimmed‑down, final‑draft plan that takes the original proposal and adds a few safety nets, type‑safety tweaks, and more explicit testing steps.

---

## 1. Add the shared utilities
*Create* `src/common/utils/dragHelpers.ts` and export the three helpers with full TS typings:

```ts
export interface GridOrigin { left: number; top: number }

export function findFirstFilledCell(piece: PieceType): { x: number; y: number } | null
export function findNearestFilledCell(
  shape: boolean[][],
  fromX: number,
  fromY: number
): { x: number; y: number } | null
export function calculateCellFromPointer(
  pointerX: number,
  pointerY: number,
  boardElement: HTMLElement,
  scale: number,
  cellSize: number,
  gridOrigin?: GridOrigin
): { x: number; y: number }
```

> **Tip** – use the same logic that currently lives in `Board.tsx`, `DndProvider.tsx`, and any test files; copy the implementation exactly before removal.

## 2. Remove local duplicates

| File | Action | Notes |
|---|---|---|
| `src/client/components/Board.tsx` | Delete internal `findFirstFilledCell` | Replace any calls with an import: `import { findFirstFilledCell } from "@/common/utils/dragHelpers"` |
| `src/client/layouts/common/DndProvider.tsx` | Delete internal `findFirstFilledCell` & `findNearestFilledCell` | Import the two functions from the new module; keep `calculateCellFromPointer` if it’s already local but consider moving it too for consistency |
| `src/client/layouts/common/DndProvider.test.tsx` | Update imports | If the test used the local variants, switch to the shared module as above |

> **Reminder** – keep the import paths consistent with the repo’s existing import style (absolute `@/` shortcuts or relative paths depending on the tsconfig).

## 3. Centralise any hard‑coded defaults
If any of the helpers in the original files used magic numbers (e.g., `scale = 1`, `gridOrigin = { left: 0, top: 0 }`), move those defaults into the new `dragHelpers.ts` defaults. This reduces drift.

## 4. Add unit tests for the new module
Create `src/common/utils/dragHelpers.test.ts` (or place tests in `src/common/utils/__tests__/`) that:

* Confirm `findFirstFilledCell` returns the correct first occupied slot for several board configurations, including empty and partial pieces.
* Ensure `findNearestFilledCell` correctly snaps to the nearest filled cell when the pointer is off‑grid.
* Verify `calculateCellFromPointer` maps pointer coordinates to the correct cell indices for a variety of scales, cell sizes, and grid origins.

Run these tests **before** adding the implementation to the production files to catch any differences.

## 5. Run the full test suite
```bash
npm test
```
Verify that *all* Jest tests (unit + integration) still pass. If any tests fail, re‑examine the removed code to make sure every edge‑case is still covered by the new utilities.

## 6. Run Type‑check & Lint
```bash
npm run type-check
npm run lint
```
* Make sure the new file passes type‑checking.
* Adjust any lint rules that flagged the removed code; this should also ensure no unused imports remain.

## 7. Add a duplicate‑function linter rule (optional)
If the project already uses ESLint, add a rule in `.eslintrc.js` or `.eslint.json` (e.g., `no-duplicate-variables` or a custom rule from `eslint-plugin-unused-imports`) to warn if a function is re‑declared elsewhere. For example:

```json
{
  "rules": {
    "no-dupe-keys": "error",
    "no-redeclare": "error"
  }
}
```
Run a lint check to confirm no violations.

## 8. Verify end‑to‑end drag‑and‑drop
* Re‑run the main UI in dev (`npm run dev:all`) and manually test:
  * Desktop drag‑and‑drop from board to board.
  * Mobile‑portrait and mobile‑landscape interactions.
  * ‘Drop on empty cell’ behaviour.
* If using Playwright tests, run:

```bash
npx playwright test
```
Confirm all E2E tests still pass.

## 9. Commit (once you’re ready)
After verifying the above steps, stage the modified files and add a commit that follows the repo’s `<subject> – <description>` style, e.g.:

```
feat – refactor drag‑and‑drop utilities into common module
```
---

## Quick Checklist

- [ ] Create `dragHelpers.ts` with proper typings.
- [ ] Remove all local duplicates, update imports.
- [ ] Add unit tests for the shared utilities.
- [ ] Run `npm test`, `npm run type-check`, `npm run lint`.
- [ ] Verify DR‑and‑drop behaves identically.
- [ ] Add linter rule (optional).
- [ ] Commit changes.
