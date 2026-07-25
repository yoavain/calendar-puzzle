/**
 * Geometry for the "completed every date" badge: a gold coin struck with the
 * puzzle board, two date cells left lit.
 *
 * Kept as plain data so the React component (`CompletionBadge`) and the canvas
 * renderer (`yearImage`) draw exactly the same shape from one definition.
 */

import { darken, lighten } from "@mui/material/styles";
import { BOARD_HEIGHT, BOARD_WIDTH } from "../../common/consts";

/** All coordinates below are in this square coordinate space. */
export const BADGE_VIEWBOX = 64;

/**
 * Below this rendered size the 7x7 grid stops resolving — each column lands
 * under a pixel once gaps are accounted for — so a simplified form is drawn
 * instead. See docs/plan/2026-07-25 - Year Complete Celebration.md.
 */
export const BADGE_SMALL_FORM_MAX_SIZE = 24;

/** Cells the real board never exposes: two month-row tails and the last-row tail. */
const HIDDEN_CELLS = [6, 13, 45, 46, 47, 48];

/**
 * The two cells a solved board leaves uncovered. Any date would do; these spell
 * out Jul 25 (month index 6 -> row 1 col 0, day 25 -> row 5 col 3).
 */
const LIT_CELLS = [7, 38];

const CELL_SIZE = 5.2;
const CELL_STEP = 5.8;
const GRID_ORIGIN = 12;

export interface BadgeRect {
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
    /** Which palette entry fills this rect. */
    tone: "engraved" | "lit";
}

export interface BadgePalette {
    /** Coin face, light -> deep. */
    faceLight: string;
    faceMid: string;
    faceDeep: string;
    /** Struck-in cells. */
    engraved: string;
    /** The uncovered date cells. */
    lit: string;
}

/**
 * Derives the whole badge palette from the single medal-gold theme token, so
 * the badge stays in step with `theme.game.colors.medal.gold`.
 */
export const buildBadgePalette = (gold: string): BadgePalette => ({
    faceLight: lighten(gold, 0.72),
    faceMid: gold,
    faceDeep: darken(gold, 0.48),
    engraved: darken(gold, 0.78),
    lit: lighten(gold, 0.85)
});

/** The full 7x7 board, drawn at 24px and above. */
const buildFullBoard = (): BadgeRect[] => {
    const rects: BadgeRect[] = [];
    for (let i = 0; i < BOARD_WIDTH * BOARD_HEIGHT; i++) {
        if (HIDDEN_CELLS.includes(i)) {
            continue;
        }
        rects.push({
            x: GRID_ORIGIN + (i % BOARD_WIDTH) * CELL_STEP,
            y: GRID_ORIGIN + Math.floor(i / BOARD_WIDTH) * CELL_STEP,
            width: CELL_SIZE,
            height: CELL_SIZE,
            radius: 1,
            tone: LIT_CELLS.includes(i) ? "lit" : "engraved"
        });
    }
    return rects;
};

/**
 * Avatar-scale form. The 47 individual cells cannot survive below ~24px, but
 * the board's stepped silhouette can — so it is drawn as three butted blocks
 * (the six-wide month rows, the seven-wide day rows, and the three-wide last
 * row) with the two date cells over it. Square corners keep the steps crisp
 * where rounding would leave notches at the seams.
 */
const buildSmallForm = (): BadgeRect[] => {
    const unit = 38 / BOARD_WIDTH;
    const left = 13;
    const top = 13;
    // Blocks overlap by a hair so antialiasing can't leave a seam between them.
    const bleed = 0.4;
    return [
        // Month rows: six wide.
        { x: left, y: top, width: unit * 6, height: unit * 2 + bleed, radius: 0, tone: "engraved" },
        // Day rows: the full seven.
        { x: left, y: top + unit * 2, width: unit * 7, height: unit * 4 + bleed, radius: 0, tone: "engraved" },
        // Final day row: three wide.
        { x: left, y: top + unit * 6, width: unit * 3, height: unit, radius: 0, tone: "engraved" },
        // The two uncovered date cells, enlarged so they still register at 19px.
        { x: 15, y: 15.5, width: 7, height: 6, radius: 1, tone: "lit" },
        { x: 29, y: 37, width: 7, height: 7, radius: 1, tone: "lit" }
    ];
};

/**
 * Shapes to draw on top of the coin, for a badge rendered at `size` pixels.
 */
export const buildBadgeShapes = (size: number): BadgeRect[] =>
    size < BADGE_SMALL_FORM_MAX_SIZE ? buildSmallForm() : buildFullBoard();
