import React from "react";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import FlipIcon from "@mui/icons-material/Flip";
import type { Piece } from "../../common/types";

interface PieceControlsProps {
    piece: Piece;
    onRotate: () => void;
    onRotateCCW: () => void;
    onFlipH: () => void;
    onFlipV: () => void;
}

export const PieceControls: React.FC<PieceControlsProps> = ({ piece, onRotate, onRotateCCW, onFlipH, onFlipV }) => {
    return (
        <Stack 
            direction="row" 
            spacing={0.5}
            className="piece-controls"
            sx={{
                position: "absolute",
                bottom: 10,
                left: "50%",
                transform: "translateX(-50%)",
                bgcolor: "background.paper",
                borderRadius: 1,
                p: 0.5,
                boxShadow: 1,
                zIndex: 10
            }}
        >
            <Tooltip title="Rotate clockwise" arrow>
                <IconButton 
                    size="small"
                    onClick={onRotate}
                    data-testid="rotate-button"
                    aria-label="rotate piece clockwise"
                    sx={{ 
                        border: 1, 
                        borderColor: "divider",
                        "&:hover": { bgcolor: "action.hover" }
                    }}
                >
                    <RotateRightIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Rotate counter-clockwise" arrow>
                <IconButton 
                    size="small"
                    onClick={onRotateCCW}
                    data-testid="rotate-ccw-button"
                    aria-label="rotate piece counter-clockwise"
                    sx={{ 
                        border: 1, 
                        borderColor: "divider",
                        "&:hover": { bgcolor: "action.hover" }
                    }}
                >
                    <RotateLeftIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Flip horizontal" arrow>
                <IconButton 
                    size="small"
                    onClick={onFlipH}
                    data-testid="flip-h-button"
                    aria-label="flip horizontally"
                    sx={{ 
                        border: 1, 
                        borderColor: "divider",
                        "&:hover": { bgcolor: "action.hover" }
                    }}
                >
                    <FlipIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Flip vertical" arrow>
                <IconButton 
                    size="small"
                    onClick={onFlipV}
                    data-testid="flip-v-button"
                    aria-label="flip vertically"
                    sx={{ 
                        border: 1, 
                        borderColor: "divider",
                        "&:hover": { bgcolor: "action.hover" }
                    }}
                >
                    <FlipIcon fontSize="small" sx={{ transform: "rotate(90deg)" }} />
                </IconButton>
            </Tooltip>
        </Stack>
    );
};
