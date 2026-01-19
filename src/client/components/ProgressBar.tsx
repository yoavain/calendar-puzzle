import React from "react";
import { ProgressContainer, StyledLinearProgress, ProgressLabel } from "./ProgressBar.styled";

interface ProgressBarProps {
    covered: number;
    total: number;
    percentage: number;
}

/**
 * Get progress bar color based on percentage
 */
const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) {
        return "#22c55e";
    } // Green - Completed
    if (percentage >= 67) {
        return "#84cc16";
    } // Yellow-Green - High
    if (percentage >= 34) {
        return "#f59e0b";
    } // Orange/Amber - Medium
    return "#dc3545"; // Red - Low
};

export const ProgressBar: React.FC<ProgressBarProps> = ({ percentage }) => {
    const progressColor = getProgressColor(percentage);
    
    return (
        <ProgressContainer>
            <StyledLinearProgress 
                variant="determinate" 
                value={percentage} 
                progressColor={progressColor}
            />
            <ProgressLabel>
                {Math.round(percentage)}%
            </ProgressLabel>
        </ProgressContainer>
    );
};
