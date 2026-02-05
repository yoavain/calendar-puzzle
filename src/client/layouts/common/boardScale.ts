import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";

/**
 * Additional space needed for board border and shadow.
 */
export const BOARD_BORDER_SIZE = 8; // 4px border on each side

/**
 * Extra breathing room for shadows.
 */
export const BOARD_EXTRA_PADDING = 16;

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
    const boardWidth = cellSize * 9 + BOARD_BORDER_SIZE + BOARD_EXTRA_PADDING;
    const boardHeight = cellSize * 9 + BOARD_BORDER_SIZE + BOARD_EXTRA_PADDING;

    const widthScale = availableWidth / boardWidth;
    const heightScale = availableHeight / boardHeight;

    return Math.min(widthScale, heightScale, 1);
}

/**
 * Wrapper that applies scaling to the board.
 * Shared by portrait and landscape mobile layouts.
 */
export const BoardScaleWrapper = styled(Box)<{ scale: number }>(({ scale }) => ({
    transform: `scale(${scale})`,
    transformOrigin: "center center"
}));
