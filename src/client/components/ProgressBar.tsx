import React from "react";
import { useTheme } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import { ProgressContainer } from "./ProgressBar.styled";
import { ProgressBarWithLabel } from "./ProgressBarWithLabel";

interface ProgressBarProps {
    covered: number;
    total: number;
    percentage: number;
}

const getProgressColor = (percentage: number, theme: Theme): string => {
    const { progress } = theme.game.colors;
    if (percentage >= 100) {
        return progress.complete;
    }
    if (percentage >= 67) {
        return progress.high;
    }
    if (percentage >= 34) {
        return progress.medium;
    }
    return progress.low;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({ percentage }) => {
    const theme = useTheme();
    const progressColor = getProgressColor(percentage, theme);

    return (
        <ProgressContainer>
            <ProgressBarWithLabel
                value={percentage}
                label={`${Math.round(percentage)}%`}
                color={progressColor}
                ariaLabel="Puzzle completion progress"
            />
        </ProgressContainer>
    );
};
