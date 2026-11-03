import React from "react";
import { styled } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { GOAL_SENTENCE } from "../copy/goalCopy";
import { useFirstVisitGoal } from "../layouts/common/useFirstVisitGoal";

const GoalText = styled(Typography, {
    shouldForwardProp: (prop) => prop !== "shown"
})<{ shown: boolean }>(({ theme, shown }) => ({
    flexShrink: 0,
    textAlign: "center",
    textWrap: "balance",
    fontWeight: 500,
    // Two lines must fit the height that the mobile board calculation leaves free.
    lineHeight: 1.3,
    paddingBottom: theme.spacing(0.25),
    opacity: shown ? 1 : 0,
    visibility: shown ? "visible" : "hidden",
    transition: "opacity 0.2s ease, visibility 0.2s",
    "@media (prefers-reduced-motion: reduce)": {
        transition: "none"
    }
}));

interface GoalHintProps {
    /** Number of pieces on the board. The first placement hides the sentence. */
    placedCount: number;
    sx?: SxProps<Theme>;
}

/** Tells a new player the goal, until the first piece lands on the board. */
export const GoalHint: React.FC<GoalHintProps> = ({ placedCount, sx }) => {
    const { hasSlot, shown } = useFirstVisitGoal(placedCount);
    if (!hasSlot) {
        return null;
    }
    return (
        <GoalText variant="body2" shown={shown} sx={sx} data-testid="goal-hint">
            {GOAL_SENTENCE}
        </GoalText>
    );
};
