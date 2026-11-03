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
    const labelColorOnFill = labelColor ?? theme.palette.getContrastText(resolvedColor);

    return (
        <Box sx={{ position: "relative" }}>
            <StyledLinearProgress
                variant="determinate"
                value={value}
                progressColor={resolvedColor}
                aria-label={ariaLabel}
            />
            {/* The centred label can span both the track and the fill, so one colour
                can't stay readable on both. A second copy, clipped to the fill, takes over there. */}
            <ProgressLabel labelColor={theme.palette.text.primary}>{label}</ProgressLabel>
            <ProgressLabel
                labelColor={labelColorOnFill}
                aria-hidden="true"
                style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
            >
                {label}
            </ProgressLabel>
        </Box>
    );
};
