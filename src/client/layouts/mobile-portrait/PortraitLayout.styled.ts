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
    overflow: "hidden"
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
export const ProgressArea = styled(Box)({
    flexShrink: 0,
    padding: "0 4px"
});

/** Approximate height of the Beta disclaimer banner (dense Alert). */
const BETA_BANNER_HEIGHT = 36;

/**
 * Get available height for the board area.
 */
export function getAvailableBoardHeight(viewportHeight: number): number {
    // Subtract toolbar, carousel, progress bar, beta banner, and padding
    const progressBarHeight = 32;
    const padding = 8;
    return viewportHeight - MOBILE_TOOLBAR_HEIGHT - CAROUSEL_HEIGHT - progressBarHeight - BETA_BANNER_HEIGHT - padding;
}
