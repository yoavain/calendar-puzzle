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

interface TooltipDisabledWrapperProps extends React.ComponentPropsWithRef<"span"> {
    disabled?: boolean;
}

/**
 * Wraps a (possibly disabled) MUI button used inside a Tooltip so that keyboard
 * users can focus it and read the tooltip even when the button itself is
 * disabled (disabled native buttons cannot receive focus).
 *
 * Tooltip attaches its hover and focus handlers, its ref and its label to this
 * wrapper, so they must all reach the span.
 *
 * When the inner button is enabled the span is removed from tab order so there
 * is no duplicate focus stop, and it carries no label because the button names
 * itself. When disabled the span is the focus stop, so it takes the label.
 */
export const TooltipDisabledWrapper: React.FC<TooltipDisabledWrapperProps> = ({
    disabled,
    children,
    "aria-label": ariaLabel,
    ...spanProps
}) => (
    <FocusableSpan
        {...spanProps}
        tabIndex={disabled ? 0 : -1}
        role={disabled ? "group" : undefined}
        aria-label={disabled ? ariaLabel : undefined}
    >
        {children}
    </FocusableSpan>
);
