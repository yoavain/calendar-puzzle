import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import LinearProgress, { linearProgressClasses } from "@mui/material/LinearProgress";

export const ProgressContainer = styled(Box)(({ theme }) => ({
    width: theme.game.cellSize * 7 + theme.game.cellSize * 2 + 8, // Match board width (cells + padding + border)
    marginLeft: "auto",
    marginRight: "auto",
    marginBottom: theme.spacing(2),
    position: "relative"
}));

export interface StyledLinearProgressProps {
    progressColor: string;
}

export const StyledLinearProgress = styled(LinearProgress, {
    shouldForwardProp: (prop) => prop !== "progressColor"
})<StyledLinearProgressProps>(({ theme, progressColor }) => ({
    height: 25,
    borderRadius: 12,
    [`&.${linearProgressClasses.colorPrimary}`]: {
        backgroundColor: theme.palette.mode === "dark" ? "#333" : "#e0e0e0"
    },
    [`& .${linearProgressClasses.bar}`]: {
        borderRadius: 10,
        backgroundColor: progressColor,
        transition: "transform 0.3s ease, background-color 0.3s ease"
    }
}));

export const ProgressLabel = styled(Box)({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: "bold",
    color: "#fff",
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
    pointerEvents: "none",
    userSelect: "none",
    WebkitUserSelect: "none",
    MozUserSelect: "none",
    msUserSelect: "none"
});
