import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

// Pieces container (the grid that holds all unplaced pieces)
export const PiecesContainer = styled(Box)(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: theme.spacing(2),
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: 8,
    justifyItems: "center",
    maxWidth: 1080,
    marginLeft: "auto",
    marginRight: "auto",
    height: "auto",
    minHeight: 600,
    overflowY: "visible",
    marginBottom: theme.spacing(2),
    // Ensure symmetric padding at the bottom by adding a specific bottom padding
    paddingBottom: theme.spacing(2),
    "& > *": {
        marginBottom: 0
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
    borderRadius: 8,
    width: 250,
    height: 320, // Further increased to ensure controls fit with symmetric padding
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start"
}));
