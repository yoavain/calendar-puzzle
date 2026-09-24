import { keyframes, styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { PIECE_IDS } from "../../common/pieceData";
import { PIECE_CELL_GRADIENT } from "../utils/pieceColors";
import { ProgressLabel } from "./ProgressBar.styled";

/** Grow-in time per segment. Segments that appear together run back to back. */
export const SEGMENT_GROW_MS = 150;

const segmentIn = keyframes`
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
`;

export const SegmentTrack = styled(Box)(({ theme }) => ({
    position: "relative",
    display: "flex",
    height: 25,
    borderRadius: theme.game.radius.pill,
    overflow: "hidden",
    backgroundColor: theme.game.colors.progress.track,
    // The segments are empty block boxes: without this, a click drops a
    // blinking text caret into them.
    userSelect: "none",
    WebkitUserSelect: "none"
}));

export interface SegmentProps {
    pieceColor: string;
}

// One slot per piece: 8 pieces -> 12.5% each. The inset right edge separates
// neighbours with close hues (teal / olive). Linear timing plus the per-segment
// `--segment-delay` makes a batch of segments read as one left-to-right sweep;
// `backwards` keeps a waiting segment collapsed until its turn.
export const Segment = styled(Box, {
    shouldForwardProp: (prop) => prop !== "pieceColor"
})<SegmentProps>(({ pieceColor }) => ({
    flex: `0 0 ${100 / PIECE_IDS.length}%`,
    background: `${PIECE_CELL_GRADIENT}, ${pieceColor}`,
    boxShadow: "inset -1px 0 0 rgba(0, 0, 0, 0.25)",
    transformOrigin: "left center",
    animation: `${segmentIn} ${SEGMENT_GROW_MS}ms linear backwards`,
    animationDelay: "var(--segment-delay, 0ms)",
    "@media (prefers-reduced-motion: reduce)": {
        animation: "none"
    }
}));

export const SegmentLabel = styled(ProgressLabel)({
    textShadow: "0 0 3px rgba(0, 0, 0, 0.8)"
});
