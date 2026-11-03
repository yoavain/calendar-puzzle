import React from "react";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import type { SxProps, Theme } from "@mui/material/styles";
import { TooltipDisabledWrapper } from "./TooltipDisabledWrapper";

interface ToolbarIconButtonProps {
    tooltip: string;
    onClick: () => void;
    icon: React.ReactNode;
    ariaLabel: string;
    disabled?: boolean;
    sx?: SxProps<Theme>;
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
    sx
}) => (
    <Tooltip title={tooltip} arrow>
        <TooltipDisabledWrapper disabled={disabled}>
            <Button
                variant="contained"
                onClick={onClick}
                size="small"
                sx={[{ minWidth: 40, px: 1 }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
                disabled={disabled}
                aria-label={ariaLabel}
            >
                {icon}
            </Button>
        </TooltipDisabledWrapper>
    </Tooltip>
);
