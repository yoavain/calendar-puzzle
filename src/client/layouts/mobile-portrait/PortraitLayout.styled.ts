import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { MOBILE_TOOLBAR_HEIGHT } from "../common/MobileToolbar.styled";
import { CAROUSEL_HEIGHT } from "../common/PieceCarousel.styled";

/**
 * Additional space needed for board border and shadow.
 */
const BOARD_BORDER_SIZE = 8; // 4px border on each side
const BOARD_EXTRA_PADDING = 16; // Extra breathing room for shadows

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
 * Wrapper that applies scaling to the board.
 */
export const BoardScaleWrapper = styled(Box)<{ scale: number }>(({ scale }) => ({
    transform: `scale(${scale})`,
    transformOrigin: "center center"
}));

/**
 * Progress bar container.
 */
export const ProgressArea = styled(Box)({
    flexShrink: 0,
    padding: "0 4px"
});

/**
 * Calculate the scale factor for the board based on available space.
 * Board visual dimensions include:
 * - 7 cells for content
 * - 1 cell padding on each side (cellSize * 2)
 * - 4px border on each side (8px total)
 */
export function calculateBoardScale(
    availableWidth: number,
    availableHeight: number,
    cellSize: number
): number {
    // Board dimensions: 7 cells + 1 cell padding each side + border + extra padding
    const boardWidth = cellSize * 9 + BOARD_BORDER_SIZE + BOARD_EXTRA_PADDING;
    const boardHeight = cellSize * 9 + BOARD_BORDER_SIZE + BOARD_EXTRA_PADDING;
    
    const widthScale = availableWidth / boardWidth;
    const heightScale = availableHeight / boardHeight;
    
    // Use the smaller scale to fit within both dimensions
    // Cap at 1 to prevent upscaling
    return Math.min(widthScale, heightScale, 1);
}

/**
 * Get available height for the board area.
 */
export function getAvailableBoardHeight(viewportHeight: number): number {
    // Subtract toolbar, carousel, progress bar, and padding
    const progressBarHeight = 32;
    const padding = 8;
    return viewportHeight - MOBILE_TOOLBAR_HEIGHT - CAROUSEL_HEIGHT - progressBarHeight - padding;
}
