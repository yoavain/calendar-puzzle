import React from "react";
import { styled } from "@mui/material/styles";

const FocusableSpan = styled("span")(({ theme }) => ({
    display: "inline-flex",
    borderRadius: theme.game.radius.sm,
    "&:focus-visible": {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: 2
    }
}));

interface TooltipDisabledWrapperProps {
    disabled?: boolean;
    children: React.ReactNode;
}

/**
 * Wraps a (possibly disabled) MUI button used inside a Tooltip so that keyboard
 * users can focus it and read the tooltip even when the button itself is
 * disabled (disabled native buttons cannot receive focus).
 *
 * When the inner button is enabled the span is removed from tab order so there
 * is no duplicate focus stop.
 */
export const TooltipDisabledWrapper: React.FC<TooltipDisabledWrapperProps> = ({ disabled, children }) => (
    <FocusableSpan tabIndex={disabled ? 0 : -1}>
        {children}
    </FocusableSpan>
);
