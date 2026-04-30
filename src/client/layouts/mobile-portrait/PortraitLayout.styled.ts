import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { MOBILE_TOOLBAR_HEIGHT } from "../common/MobileToolbar.styled";
import { CAROUSEL_HEIGHT } from "../common/PieceCarousel.styled";

/**
 * Main container for the portrait layout.
 * Uses dynamic viewport height (dvh) for better mobile support.
 */
export const PortraitContainer = styled(Box)({
    width: "100%",
    height: "100dvh", // Use dynamic viewport height for mobile
    maxHeight: "100vh", // Fallback for browsers without dvh support
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    // Create an explicit stacking context so the board's transform-based
    // stacking context (from BoardScaleWrapper) is contained here and
    // cannot paint above the DragOverlay (z-index: 999).
    position: "relative",
    zIndex: 0
});

/**
 * Content area between toolbar and carousel.
 * Contains the board and takes remaining space.
 */
export const ContentArea = styled(Box)(({ theme }) => ({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    padding: theme.spacing(0, 1), // Minimal vertical, some horizontal padding
    minHeight: 0 // Important for flex children to shrink properly
}));

/**
 * Container for the board, centers it in available space.
 */
export const BoardArea = styled(Box)({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible", // Allow board shadow to show
    minHeight: 0,
    padding: 0 // Remove extra padding - let board scale handle sizing
});

/**
 * Progress bar container.
 */
export const ProgressArea = styled(Box)(({ theme }) => ({
    flexShrink: 0,
    padding: theme.spacing(0, 0.5)
}));

/** Approximate height of the Beta disclaimer banner (dense Alert). */
const BETA_BANNER_HEIGHT = 36;

/** Height reserved for the progress bar row (matches ProgressBar visual height). */
const PROGRESS_BAR_HEIGHT = 32;

/** Vertical breathing room (matches theme.spacing(1) = 8px on ContentArea). */
const VERTICAL_GUTTER = 8;

/**
 * Get available height for the board area.
 */
export function getAvailableBoardHeight(viewportHeight: number): number {
    return viewportHeight - MOBILE_TOOLBAR_HEIGHT - CAROUSEL_HEIGHT - PROGRESS_BAR_HEIGHT - BETA_BANNER_HEIGHT - VERTICAL_GUTTER;
}
