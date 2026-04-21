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
    borderRadius: theme.game.radius.pill,
    [`&.${linearProgressClasses.colorPrimary}`]: {
        backgroundColor: theme.game.colors.progress.track
    },
    [`& .${linearProgressClasses.bar}`]: {
        borderRadius: theme.game.radius.pill,
        backgroundColor: progressColor,
        transition: "transform 0.3s ease, background-color 0.3s ease"
    }
}));

export interface ProgressLabelProps {
    labelColor: string;
}

export const ProgressLabel = styled(Box, {
    shouldForwardProp: (prop) => prop !== "labelColor"
})<ProgressLabelProps>(({ theme, labelColor }) => ({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: theme.game.fontSize.xs,
    fontWeight: "bold",
    color: labelColor,
    pointerEvents: "none",
    userSelect: "none",
    WebkitUserSelect: "none",
    MozUserSelect: "none",
    msUserSelect: "none"
}));
