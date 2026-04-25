import { styled } from "@mui/material/styles";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";

export const PieceControlsContainer = styled(Stack)(({ theme }) => ({
    position: "absolute",
    bottom: 10,
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.game.radius.sm,
    padding: theme.spacing(0.5),
    boxShadow: theme.shadows[1],
    zIndex: 10
}));

export const PieceControlButton = styled(IconButton)(({ theme }) => ({
    border: `1px solid ${theme.palette.divider}`,
    "&:hover": {
        backgroundColor: theme.palette.action.hover
    }
}));
