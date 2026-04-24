import React from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import { ProgressLabel, StyledLinearProgress } from "./ProgressBar.styled";

interface ProgressBarWithLabelProps {
    value: number;
    label: React.ReactNode;
    color?: string;
    labelColor?: string;
    ariaLabel?: string;
}

export const ProgressBarWithLabel: React.FC<ProgressBarWithLabelProps> = ({
    value,
    label,
    color,
    labelColor,
    ariaLabel
}) => {
    const theme = useTheme();
    const resolvedColor = color ?? theme.palette.primary.main;
    const resolvedLabelColor = labelColor ?? theme.palette.getContrastText(resolvedColor);

    return (
        <Box sx={{ position: "relative" }}>
            <StyledLinearProgress
                variant="determinate"
                value={value}
                progressColor={resolvedColor}
                aria-label={ariaLabel}
            />
            <ProgressLabel labelColor={resolvedLabelColor}>{label}</ProgressLabel>
        </Box>
    );
};
