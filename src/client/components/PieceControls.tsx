import React from "react";
import Tooltip from "@mui/material/Tooltip";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import FlipIcon from "@mui/icons-material/Flip";
import type { Piece } from "../../common/types";
import { PieceControlButton, PieceControlsContainer } from "./PieceControls.styled";

interface PieceControlsProps {
    piece: Piece;
    onRotate: () => void;
    onRotateCCW: () => void;
    onFlipH: () => void;
    onFlipV: () => void;
}

export const PieceControls: React.FC<PieceControlsProps> = ({ onRotate, onRotateCCW, onFlipH, onFlipV }) => {
    return (
        <PieceControlsContainer
            direction="row"
            spacing={0.5}
            className="piece-controls"
        >
            <Tooltip title="Rotate clockwise" arrow>
                <PieceControlButton
                    size="small"
                    onClick={onRotate}
                    data-testid="rotate-button"
                    aria-label="rotate piece clockwise"
                >
                    <RotateRightIcon fontSize="small" />
                </PieceControlButton>
            </Tooltip>
            <Tooltip title="Rotate counter-clockwise" arrow>
                <PieceControlButton
                    size="small"
                    onClick={onRotateCCW}
                    data-testid="rotate-ccw-button"
                    aria-label="rotate piece counter-clockwise"
                >
                    <RotateLeftIcon fontSize="small" />
                </PieceControlButton>
            </Tooltip>
            <Tooltip title="Flip horizontal" arrow>
                <PieceControlButton
                    size="small"
                    onClick={onFlipH}
                    data-testid="flip-h-button"
                    aria-label="flip horizontally"
                >
                    <FlipIcon fontSize="small" />
                </PieceControlButton>
            </Tooltip>
            <Tooltip title="Flip vertical" arrow>
                <PieceControlButton
                    size="small"
                    onClick={onFlipV}
                    data-testid="flip-v-button"
                    aria-label="flip vertically"
                >
                    <FlipIcon fontSize="small" sx={{ transform: "rotate(90deg)" }} />
                </PieceControlButton>
            </Tooltip>
        </PieceControlsContainer>
    );
};
