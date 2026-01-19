import React from "react";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import { useUser } from "../context/UserContext";

interface HintButtonProps {
    onHint: () => void;
    isLoading?: boolean;
    disabled?: boolean;
}

export const HintButton: React.FC<HintButtonProps> = ({ onHint, isLoading = false, disabled = false }) => {
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
        >
            {isLoading ? "Getting hint..." : "Hint"}
        </Button>
    );

    if (isLoginRequired) {
        return (
            <Tooltip title="Sign-in to see hint" arrow>
                <span>{button}</span>
            </Tooltip>
        );
    }

    return button;
};
