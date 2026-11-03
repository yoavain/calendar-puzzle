import { keyframes, styled } from "@mui/material/styles";
import Box from "@mui/material/Box";

// Animation cycle:
// 0-10%: Fade in at start position (bottom)
// 10-40%: Move to target position (dragging up)
// 40-45%: Drop effect (slight scale down)
// 45-80%: Stick at target position
// 80-100%: Fade out
export const dragAnimation = keyframes`
  0% {
    transform: translate(0, 400px) scale(1.05);
    opacity: 0;
  }
  10% {
    transform: translate(0, 400px) scale(1.05);
    opacity: 1;
  }
  40% {
    transform: translate(0, 0) scale(1.05);
    opacity: 1;
  }
  45% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  80% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0;
  }
`;

export const AnimatedPieceWrapper = styled(Box)({
    position: "absolute",
    zIndex: 10,
    animation: `${dragAnimation} 5s ease-in-out infinite`,
    pointerEvents: "none",
    // Without the animation, the piece simply rests where it would be placed.
    "@media (prefers-reduced-motion: reduce)": {
        animation: "none"
    }
});

export const ShortcutGrid = styled("div")(({ theme }) => ({
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr) auto minmax(0, 1fr)",
    alignItems: "center",
    gap: theme.spacing(1, 1.5),
    marginTop: theme.spacing(1),
    fontSize: theme.game.fontSize.sm
}));

export const ShortcutKey = styled("kbd")(({ theme }) => ({
    justifySelf: "start",
    padding: theme.spacing(0.25, 0.75),
    border: `1px solid ${theme.game.boardBorderColor}`,
    borderRadius: theme.game.radius.sm,
    backgroundColor: theme.palette.background.default,
    fontFamily: "inherit",
    fontSize: theme.game.fontSize.xs,
    fontWeight: 600,
    whiteSpace: "nowrap"
}));

export const ScaledBoardWrapper = styled(Box)(({ theme }) => {
    // Nine cells tall (seven rows plus the one-cell padding), plus the border.
    const boardSize = theme.game.cellSize * 9 + 8;

    return {
        display: "flex",
        justifyContent: "center",
        position: "relative",
        marginTop: theme.spacing(2),
        // The animated piece starts below the board. The dialog's content has to scroll on
        // short screens, so the clip for that start belongs here.
        overflow: "hidden",
        "& > .scaling-container": {
            transform: "scale(0.6)",
            transformOrigin: "top center",
            height: boardSize * 0.6,
            position: "relative",
            [theme.breakpoints.down("sm")]: {
                transform: "scale(0.45)",
                height: boardSize * 0.45
            }
        }
    };
});
