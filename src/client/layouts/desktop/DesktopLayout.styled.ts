import { styled } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

// Scaling constants for desktop layout. The toolbar sits outside the scaled
// area, so BASELINE_HEIGHT covers only the title, board and pieces.
export const BASELINE_SIZE = 1200;
export const BASELINE_HEIGHT = 1252;
export const MIN_HEIGHT = 800;

// Responsive layout constants
// These values are tuned for the responsive scaling system to ensure proper spacing and sizing
const PIECES_CONTAINER_GAP_MULTIPLIER = 2; // Increased from 1 for better spacing in responsive layout
const PIECES_CONTAINER_MIN_HEIGHT = 600; // Minimum height for the pieces grid container
const PIECES_CONTAINER_MAX_WIDTH = 1080; // Maximum width for the pieces grid container

/**
 * Main wrapper for the entire app.
 * Handles global drag/drop and viewport overflow.
 */
export const AppWrapper = styled(Box)({
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    overflowX: "hidden"
});

/**
 * Holds the top toolbar outside the scaled area, so its controls keep their
 * full size at every window size.
 */
export const ToolbarContainer = styled(Container)(({ theme }) => ({
    flexShrink: 0,
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2)
}));

/**
 * The toolbar's three groups: information, date and hint, then moves. A narrow
 * window wraps whole groups to a second row.
 */
export const ToolbarGroups = styled("div")(({ theme }) => ({
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    alignItems: "center",
    columnGap: theme.spacing(3.5),
    rowGap: theme.spacing(1),
    minWidth: 0
}));

export const ToolbarGroup = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1)
}));

/** Joins Undo and Redo into one pair, split by a 1px line of the page colour. */
export const UndoRedoPair = styled("div")({
    display: "flex",
    gap: 1,
    "& > span:first-of-type button": {
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0
    },
    "& > span:last-of-type button": {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0
    },
    // Keeps the focus ring above the button it touches.
    "& > span:focus-visible, & button:focus-visible": {
        position: "relative",
        zIndex: 1
    }
});

// Toolbar colours each mean one job, and a disabled button has no fill or
// border, so it can never be mistaken for an enabled one.
export const toolbarButtonSx = (theme: Theme) => ({
    minHeight: theme.game.toolbarButtonHeight,
    "&.Mui-disabled": {
        backgroundColor: "transparent",
        borderColor: "transparent",
        color: theme.game.colors.toolbar.disabledText
    }
});

export const toolbarActionSx = (theme: Theme) => ({
    ...toolbarButtonSx(theme),
    "&:hover": {
        backgroundColor: theme.game.colors.toolbar.actionHover
    }
});

export const toolbarInfoSx = (theme: Theme) => ({
    ...toolbarButtonSx(theme),
    backgroundColor: theme.game.colors.toolbar.info.main,
    color: theme.game.colors.toolbar.info.text,
    "&:hover": {
        backgroundColor: theme.game.colors.toolbar.info.hover
    }
});

export const toolbarResetSx = (theme: Theme) => ({
    ...toolbarButtonSx(theme),
    backgroundColor: theme.game.colors.toolbar.reset.main,
    color: theme.game.colors.toolbar.reset.text,
    "&:hover": {
        backgroundColor: theme.game.colors.toolbar.reset.hover
    }
});

/**
 * Container that applies responsive scaling to its contents.
 * Uses CSS transform to scale the game to fit the viewport.
 */
export const ScaleContainer = styled(Box)<{ scale: number }>(({ scale }) => {
    // Calculate negative margin to compensate for scaled-down content
    // Clamp scale to prevent excessive negative margins on very small screens
    const clampedScale = Math.max(scale, 0.3);
    
    // Use a precise scale to avoid sub-pixel misalignment
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const preciseScale = Math.round(clampedScale * dpr * 1000) / (dpr * 1000);
    const marginValue = preciseScale < 1 ? `calc(${BASELINE_HEIGHT}px * (${preciseScale} - 1))` : 0;
    
    return {
        width: BASELINE_SIZE,
        height: "auto",
        minHeight: BASELINE_HEIGHT,
        transform: `scale(${preciseScale})`,
        transformOrigin: "top center",
        flexShrink: 0,
        marginBottom: marginValue,
        overflow: "visible"
    };
});

/**
 * Game title: the CALENDAR / PUZZLE pixel wordmark from the landing page,
 * set on one line. The images carry the accessible name via their alt text.
 */
export const GameTitle = styled(Typography)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: theme.spacing(1.5),
    "& img": {
        height: 36,
        width: "auto",
        display: "block"
    },
    userSelect: "none",
    WebkitUserSelect: "none",
    MozUserSelect: "none",
    msUserSelect: "none"
})) as typeof Typography;

/**
 * Container for the pieces grid (4x2 layout on desktop).
 * Holds all unplaced pieces.
 */
export const PiecesContainer = styled(Box)(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: theme.spacing(PIECES_CONTAINER_GAP_MULTIPLIER),
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.game.radius.md,
    justifyItems: "center",
    maxWidth: PIECES_CONTAINER_MAX_WIDTH,
    marginLeft: "auto",
    marginRight: "auto",
    height: "auto",
    minHeight: PIECES_CONTAINER_MIN_HEIGHT,
    overflowY: "visible",
    marginBottom: theme.spacing(2),
    // Ensure symmetric padding at the bottom by adding a specific bottom padding
    paddingBottom: theme.spacing(2),
    cursor: "default",
    userSelect: "none",
    WebkitUserSelect: "none",
    MozUserSelect: "none",
    msUserSelect: "none",
    "& > *": {
        marginBottom: 0,
        width: "100%"
    }
}));

/**
 * Wrapper for individual pieces in the pool.
 * Contains both the piece and its controls.
 */
export const PiecePoolWrapper = styled(Box)(({ theme }) => ({
    position: "relative",
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.game.radius.md,
    width: `calc(${theme.game.cellSizePx} * 5)`,
    height: `calc(${theme.game.cellSizePx} * 6)`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start"
}));
