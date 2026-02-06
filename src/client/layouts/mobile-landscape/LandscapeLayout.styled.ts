import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { CAROUSEL_WIDTH } from "../common/PieceCarousel.styled";

/** Width of the left toolbar column (vertical strip). Fits "Sign in"/avatar and icons. */
export const TOOLBAR_COLUMN_WIDTH = 140;
/** Approximate height of the disclaimer banner (dense Alert). */
const BETA_BANNER_HEIGHT = 36;
const PROGRESS_BAR_HEIGHT = 32;
const PADDING = 8;

/**
 * Main container for the landscape layout.
 * Row: toolbar column (left) | main content (progress + board + carousel).
 */
export const LandscapeContainer = styled(Box)({
    width: "100%",
    height: "100dvh",
    maxHeight: "100vh",
    display: "flex",
    flexDirection: "row",
    overflow: "hidden",
    // Create an explicit stacking context so the board's transform-based
    // stacking context (from BoardScaleWrapper) is contained here and
    // cannot paint above the DragOverlay (z-index: 999).
    position: "relative",
    zIndex: 0
});

/**
 * Left column: vertical toolbar only.
 * Scrollable so avatar and icons remain visible when space is tight.
 */
export const ToolbarColumn = styled(Box)(({ theme }) => ({
    width: TOOLBAR_COLUMN_WIDTH,
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    borderRight: `1px solid ${theme.palette.divider}`,
    overflowX: "hidden",
    overflowY: "auto"
}));

/**
 * Main content column: content row (board column | carousel).
 */
export const MainColumn = styled(Box)({
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
});

/**
 * Content row: board column (left) and carousel column (right).
 */
export const ContentRow = styled(Box)({
    flex: 1,
    display: "flex",
    flexDirection: "row",
    overflow: "hidden",
    minHeight: 0
});

/**
 * Left column: disclaimer, progress bar, and board area. Width matches board (progress bar is board-width).
 */
export const BoardColumn = styled(Box)(({ theme }) => ({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minWidth: 0,
    padding: theme.spacing(0, 1)
}));

/**
 * Right column: vertical piece carousel.
 */
export const CarouselColumn = styled(Box)({
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
});

/**
 * Container for the board, centers it in available space.
 */
export const BoardArea = styled(Box)({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    minHeight: 0,
    padding: 0
});

/**
 * Progress bar container.
 */
export const ProgressArea = styled(Box)({
    flexShrink: 0,
    padding: "0 4px"
});

/**
 * Get available width for the board area (viewport minus toolbar column, carousel, and padding).
 */
export function getAvailableBoardWidth(viewportWidth: number): number {
    return viewportWidth - TOOLBAR_COLUMN_WIDTH - CAROUSEL_WIDTH - PADDING * 2;
}

/**
 * Get available height for the board area (full height minus disclaimer, progress bar, and padding).
 */
export function getAvailableBoardHeight(viewportHeight: number): number {
    return (
        viewportHeight -
        BETA_BANNER_HEIGHT -
        PROGRESS_BAR_HEIGHT -
        PADDING * 2
    );
}
