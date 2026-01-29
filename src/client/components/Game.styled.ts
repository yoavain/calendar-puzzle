import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

// Responsive layout constants
// These values are tuned for the responsive scaling system to ensure proper spacing and sizing
const PIECES_CONTAINER_GAP_MULTIPLIER = 2; // Increased from 1 for better spacing in responsive layout
const PIECE_POOL_WIDTH = 250; // Width of individual piece containers
const PIECE_POOL_HEIGHT = 320; // Increased to accommodate piece controls with symmetric padding
const PIECES_CONTAINER_MIN_HEIGHT = 600; // Minimum height for the pieces grid container
const PIECES_CONTAINER_MAX_WIDTH = 1080; // Maximum width for the pieces grid container
const PIECES_CONTAINER_BORDER_RADIUS = 8; // Border radius for rounded corners
const PIECE_POOL_BORDER_RADIUS = 8; // Border radius for piece pool items

// Pieces container (the grid that holds all unplaced pieces)
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

// Game title
export const GameTitle = styled(Typography)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    fontWeight: "bold",
    userSelect: "none",
    WebkitUserSelect: "none",
    MozUserSelect: "none",
    msUserSelect: "none"
})) as typeof Typography;

// Individual piece wrapper in the pool
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
