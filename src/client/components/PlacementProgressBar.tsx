import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { PIECE_IDS } from "../../common/pieceData";
import type { PieceId } from "../../common/pieceData";
import { getPieceColor } from "../utils/pieceColors";
import { ProgressContainer } from "./ProgressBar.styled";
import { Segment, SEGMENT_GROW_MS, SegmentLabel, SegmentTrack } from "./PlacementProgressBar.styled";

interface PlacementProgressBarProps {
    /** Ids of the pieces on the board, in placement order (oldest first). */
    order: PieceId[];
}

/**
 * One colored segment per placed piece, left to right in placement order,
 * so the bar tells the story of the solve.
 */
export const PlacementProgressBar: React.FC<PlacementProgressBarProps> = ({ order }) => {
    const theme = useTheme();
    const total = PIECE_IDS.length;
    const percentage = (order.length / total) * 100;

    // Grow-in delay per segment, fixed when the segment first appears. Segments
    // that appear in the same render (first load, restored session) are
    // staggered left to right; a single new placement starts at once. A delay
    // never changes after mount, so a finished animation never replays.
    const [delays, setDelays] = useState<ReadonlyMap<PieceId, number>>(() => new Map());
    const added = order.filter(id => !delays.has(id));
    const hasRemoved = [...delays.keys()].some(id => !order.includes(id));
    if (added.length > 0 || hasRemoved) {
        const next = new Map([...delays].filter(([id]) => order.includes(id)));
        added.forEach((id, i) => next.set(id, i * SEGMENT_GROW_MS));
        setDelays(next);
    }

    return (
        <ProgressContainer>
            <SegmentTrack
                role="progressbar"
                aria-label="Puzzle completion progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percentage}
                aria-valuetext={`${order.length} of ${total} pieces placed`}
            >
                {order.map(id => (
                    <Segment
                        key={id}
                        pieceColor={getPieceColor(id)}
                        data-segment-piece-id={id}
                        style={{ "--segment-delay": `${delays.get(id) ?? 0}ms` } as React.CSSProperties}
                    />
                ))}
                <SegmentLabel labelColor={theme.game.colors.onPieceText} aria-hidden="true">
                    {order.length}/{total}
                </SegmentLabel>
            </SegmentTrack>
        </ProgressContainer>
    );
};
