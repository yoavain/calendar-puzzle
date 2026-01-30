import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

// Scaling constants for desktop layout
export const BASELINE_SIZE = 1200;
export const BASELINE_HEIGHT = 1350; // Increased to accommodate pieces container and controls
export const MIN_HEIGHT = 800;

// Responsive layout constants
// These values are tuned for the responsive scaling system to ensure proper spacing and sizing
const PIECES_CONTAINER_GAP_MULTIPLIER = 2; // Increased from 1 for better spacing in responsive layout
const PIECES_CONTAINER_MIN_HEIGHT = 600; // Minimum height for the pieces grid container
const PIECES_CONTAINER_MAX_WIDTH = 1080; // Maximum width for the pieces grid container
const PIECES_CONTAINER_BORDER_RADIUS = 8; // Border radius for rounded corners
const PIECE_POOL_BORDER_RADIUS = 8; // Border radius for piece pool items

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
 * Game title styled component.
 */
export const GameTitle = styled(Typography)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    fontWeight: "bold",
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
    borderRadius: PIECES_CONTAINER_BORDER_RADIUS,
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
    borderRadius: PIECE_POOL_BORDER_RADIUS,
    width: `calc(${theme.game.cellSizePx} * 5)`,
    height: `calc(${theme.game.cellSizePx} * 6)`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start"
}));
