/**
 * Layout types for the multi-layout architecture.
 * 
 * The game supports 3 distinct layouts:
 * - desktop: Traditional layout with 4x2 pieces grid below the board
 * - mobile-landscape: Board on left, piece carousel on right
 * - mobile-portrait: Board on top, piece carousel below
 */

export type LayoutType = "desktop" | "mobile-landscape" | "mobile-portrait";

export interface LayoutConfig {
    type: LayoutType;
    cellSize: number; // Computed cell size for this layout
    boardPadding: number;
    controlsSize: "small" | "medium" | "large";
}

export interface LayoutContextValue {
    layout: LayoutType;
    config: LayoutConfig;
}

/**
 * Default configuration for each layout type.
 * These can be overridden based on actual container measurements.
 */
export const DEFAULT_LAYOUT_CONFIGS: Record<LayoutType, LayoutConfig> = {
    desktop: {
        type: "desktop",
        cellSize: 50,
        boardPadding: 50,
        controlsSize: "medium"
    },
    "mobile-landscape": {
        type: "mobile-landscape",
        cellSize: 40,
        boardPadding: 20,
        controlsSize: "large"
    },
    "mobile-portrait": {
        type: "mobile-portrait",
        cellSize: 40,
        boardPadding: 20,
        controlsSize: "large"
    }
};
