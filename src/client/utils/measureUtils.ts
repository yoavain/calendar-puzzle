/**
 * Measures the actual rendered cell size from the board, with fallbacks.
 * This is needed because CSS scaling may cause the actual rendered size
 * to differ from the theme's nominal cellSize.
 * 
 * @param themeCellSize - The nominal cell size from theme.game.cellSize
 * @param themeCellSizePx - The cell size as a CSS string (e.g., "50px") from theme.game.cellSizePx
 * @returns The measured cell size, or a fallback if measurement fails
 */
export function getScaledCellSize(themeCellSize: number, themeCellSizePx: string): number {
    const boardElement = document.querySelector("[data-testid=\"board\"]");
    const actualBoardCell = boardElement?.querySelector("[data-testid=\"board-cell\"]");
    
    const measured = actualBoardCell 
        ? (actualBoardCell as HTMLElement).getBoundingClientRect().width 
        : undefined;
    const fallback = Number.parseFloat(themeCellSizePx);
    
    if (measured !== undefined && measured > 0) {
        return measured;
    }
    if (Number.isFinite(fallback)) {
        return fallback;
    }
    return themeCellSize;
}
