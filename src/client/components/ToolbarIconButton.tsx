import React from "react";
import type { ButtonProps } from "@mui/material/Button";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import { TooltipDisabledWrapper } from "./TooltipDisabledWrapper";

interface ToolbarIconButtonProps {
    tooltip: string;
    onClick: () => void;
    icon: React.ReactNode;
    ariaLabel: string;
    disabled?: boolean;
    color?: ButtonProps["color"];
}

/**
 * Standard contained icon-only button used in the desktop toolbar.
 * Wraps Tooltip + TooltipDisabledWrapper so the tooltip is reachable by
 * keyboard even when the button is disabled.
 */
export const ToolbarIconButton: React.FC<ToolbarIconButtonProps> = ({
    tooltip,
    onClick,
    icon,
    ariaLabel,
    disabled = false,
    color = "primary"
}) => (
    <Tooltip title={tooltip} arrow>
        <TooltipDisabledWrapper disabled={disabled}>
            <Button
                variant="contained"
                onClick={onClick}
                size="small"
                sx={(theme) => ({ minWidth: 40, px: 1, minHeight: theme.game.toolbarButtonHeight })}
                color={color}
                disabled={disabled}
                aria-label={ariaLabel}
            >
                {icon}
            </Button>
        </TooltipDisabledWrapper>
    </Tooltip>
);
