import React from "react";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import type { SxProps, Theme } from "@mui/material/styles";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import { useUser } from "../context/UserContext";

interface SolutionButtonProps {
    onSolve: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    sx?: SxProps<Theme>;
}

export const SolutionButton: React.FC<SolutionButtonProps> = ({
    onSolve,
    isLoading = false,
    disabled = false,
    fullWidth,
    sx
}) => {
    const { user } = useUser();

    if (!user || !user.isAdmin) {
        return null;
    }

    return (
        <Tooltip title="Show solution" arrow>
            <span>
                <Button
                    variant="contained"
                    color="success"
                    onClick={onSolve}
                    disabled={disabled || isLoading}
                    loading={isLoading}
                    loadingPosition="start"
                    startIcon={<AutoFixHighIcon />}
                    size="small"
                    fullWidth={fullWidth}
                    sx={sx}
                >
                    {isLoading ? "Solving..." : "Solution"}
                </Button>
            </span>
        </Tooltip>
    );
};
