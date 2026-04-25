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
    pointerEvents: "none"
});

export const ScaledBoardWrapper = styled(Box)(({ theme }) => ({
    display: "flex",
    justifyContent: "center",
    position: "relative",
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    // We allow the wrapper to overflow so the piece can be seen outside the board
    // but the DialogContent will catch it.
    "& > .scaling-container": {
        transform: "scale(0.6)",
        transformOrigin: "top center",
        height: theme.game.cellSize * 7 * 0.6 + 40,
        position: "relative",
        [theme.breakpoints.down("sm")]: {
            transform: "scale(0.45)",
            height: theme.game.cellSize * 7 * 0.45 + 30
        }
    }
}));
