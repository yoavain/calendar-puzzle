import React from "react";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import type { SxProps, Theme } from "@mui/material/styles";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import { useUser } from "../context/UserContext";

interface HintButtonProps {
    onHint: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    sx?: SxProps<Theme>;
}

export const HintButton: React.FC<HintButtonProps> = ({ onHint, isLoading = false, disabled = false, fullWidth, sx }) => {
    const { user } = useUser();

    const isLoginRequired = !user;
    const isActuallyDisabled = disabled || isLoading || isLoginRequired;

    const button = (
        <Button
            variant="contained"
            color="secondary"
            onClick={onHint}
            disabled={isActuallyDisabled}
            loading={isLoading}
            loadingPosition="start"
            startIcon={<LightbulbIcon />}
            size="small"
            fullWidth={fullWidth}
            sx={sx}
        >
            {isLoading ? "Getting hint..." : "Hint"}
        </Button>
    );

    return (
        <Tooltip title={isLoginRequired ? "Sign-in to see hint" : "Get a hint"} arrow>
            <span>{button}</span>
        </Tooltip>
    );
};
