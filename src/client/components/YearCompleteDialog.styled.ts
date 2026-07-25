import { styled } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import { keyframes } from "@emotion/react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { DAYS_IN_MONTH, MONTHS } from "../../common/consts";
import { PIECE_CELL_GRADIENT } from "../utils/pieceColors";

const COLUMNS = Math.max(...DAYS_IN_MONTH);
const ROWS = MONTHS.length;

/**
 * 31 columns is a lot to fit on a phone, so the gap tightens below `sm` to
 * leave the cells themselves some room. Both grids must use the identical
 * value at every breakpoint or the month labels drift off their rows.
 */
const cellGap = (theme: Theme) => ({
    gap: 1.5,
    [theme.breakpoints.up("sm")]: { gap: 3 }
});

export const ignite = keyframes`
    0%   { opacity: 0; transform: scale(0.35); }
    45%  { opacity: 1; transform: scale(1.18); filter: brightness(1.9); }
    100% { opacity: 1; transform: scale(1); filter: brightness(1); }
`;

export const badgeLand = keyframes`
    0%   { opacity: 0; transform: scale(0.3) rotate(-30deg); }
    60%  { opacity: 1; transform: scale(1.09) rotate(3deg); }
    100% { opacity: 1; transform: scale(1) rotate(0deg); }
`;

export const CelebrationStack = styled(Box)(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(3)
}));

/**
 * Month labels and mosaic rows share one stretched 12-row track set with an
 * identical gap, which is what keeps each label on its own row. `stretch` (not
 * `center`) is load-bearing here.
 */
export const MosaicWrapper = styled(Box)(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.spacing(0, 1.25),
    alignItems: "stretch",
    width: "100%",
    [theme.breakpoints.up("sm")]: { gridTemplateColumns: "auto 1fr" }
}));

/**
 * Hidden on phones: 31 columns and a legible month label can't share a 390px
 * screen, and the labels would otherwise set a floor on row height that forces
 * the cells to overflow their tracks. Twelve rows still read as twelve months,
 * and the grid carries an aria-label either way.
 */
export const MonthLabels = styled(Box)(({ theme }) => ({
    display: "none",
    [theme.breakpoints.up("sm")]: {
        display: "grid",
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        ...cellGap(theme)
    },
    // Deliberately below the `xs` token: a label taller than one mosaic cell
    // (11.6px at the narrowest width labels are shown) makes this column taller
    // than the grid, and the rows stop lining up.
    fontSize: "0.625rem",
    lineHeight: 1,
    color: theme.palette.text.secondary,
    "& > span": {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        letterSpacing: "0.07em",
        // Without these the label's line box becomes the row's min-content
        // height, which the cells' aspect-ratio turns into a width the column
        // track can't hold. The mosaic sets the row height; labels follow it.
        minHeight: 0,
        overflow: "hidden"
    }
}));

export const MosaicGrid = styled(Box)(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
    // Rows must size from the cells, not the other way round: `1fr` rows have no
    // definite height to resolve against here, so the cells' aspect-ratio would
    // win and overflow the column tracks on narrow screens.
    gridTemplateRows: `repeat(${ROWS}, auto)`,
    // Keeps the auto rows from absorbing any spare height in the wrapper, which
    // would stretch the cells and — via their aspect-ratio — widen them past
    // their column tracks.
    alignContent: "start",
    // Lets the parent's `1fr` track shrink below the grid's min-content width.
    minWidth: 0,
    ...cellGap(theme)
}));

export interface MosaicCellProps {
    cellColor: string;
    delayMs: number;
    animate: boolean;
}

export const MosaicCell = styled("span", {
    shouldForwardProp: (prop) => prop !== "cellColor" && prop !== "delayMs" && prop !== "animate"
})<MosaicCellProps>(({ theme, cellColor, delayMs, animate }) => ({
    display: "block",
    aspectRatio: "1",
    borderRadius: theme.game.radius.sm / 2,
    backgroundColor: cellColor,
    backgroundImage: PIECE_CELL_GRADIENT,
    ...(animate
        ? {
            opacity: 0,
            transform: "scale(0.35)",
            animation: `${ignite} 460ms cubic-bezier(0.2, 0.9, 0.3, 1) forwards`,
            animationDelay: `${delayMs}ms`
        }
        : { opacity: 1 })
}));

export interface BadgeSlotProps {
    animate: boolean;
    delayMs: number;
}

export const BadgeSlot = styled(Box, {
    shouldForwardProp: (prop) => prop !== "animate" && prop !== "delayMs"
})<BadgeSlotProps>(({ animate, delayMs }) => ({
    display: "flex",
    ...(animate && {
        opacity: 0,
        animation: `${badgeLand} 760ms cubic-bezier(0.16, 1.1, 0.3, 1) forwards`,
        animationDelay: `${delayMs}ms`
    })
}));

export const CompletionCount = styled(Typography)(({ theme }) => ({
    fontFamily: "ui-monospace, \"Cascadia Mono\", Consolas, monospace",
    fontSize: "clamp(2.2rem, 7vw, 3.4rem)",
    fontWeight: 600,
    lineHeight: 1,
    letterSpacing: "-0.02em",
    fontVariantNumeric: "tabular-nums",
    color: theme.game.colors.medal.gold
}));

export const CompletionTitle = styled(Typography)({
    fontSize: "clamp(1.25rem, 3.4vw, 1.6rem)",
    fontWeight: 600,
    lineHeight: 1.2,
    textAlign: "center",
    textWrap: "balance"
});
