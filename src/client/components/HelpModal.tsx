import React, { useEffect, useMemo, useState } from "react";
import DialogTitle from "@mui/material/DialogTitle";
import { BaseDialog } from "./BaseDialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Board as BoardComponent } from "./Board";
import { initializeBoard } from "../../common/initialize";
import type { PieceId } from "../../common/pieceData";
import { getPieceShape, PIECE_IDS } from "../../common/pieceData";
import { getPieceColor } from "../utils/pieceColors";
import { AnimatedPieceWrapper, ScaledBoardWrapper } from "./HelpModal.styled";

// Simple piece component for the animation that doesn't use complex CSS transforms
const SimplePiece: React.FC<{ pieceId: PieceId }> = ({ pieceId }) => {
    const shape = getPieceShape(pieceId);
    const color = getPieceColor(pieceId);
    
    return (
        <Box sx={{ 
            display: "grid", 
            gridTemplateColumns: `repeat(${shape[0].length}, 50px)`,
            gridTemplateRows: `repeat(${shape.length}, 50px)`,
            gap: 0,
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
        }}>
            {shape.map((row, y) => 
                row.map((filled, x) => (
                    <Box 
                        key={`${x}-${y}`} 
                        sx={{ 
                            width: 50, 
                            height: 50, 
                            backgroundColor: filled ? color : "transparent",
                            visibility: filled ? "visible" : "hidden",
                            boxShadow: filled ? `inset 0 0 0 1px ${color}` : "none"
                        }} 
                    />
                ))
            )}
        </Box>
    );
};

interface HelpModalProps {
    open: boolean;
    onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ open, onClose }) => {
    // January 1st board
    const boardDate = { month: 0, day: 1 };
    const board = useMemo(() => initializeBoard(boardDate), []);
    
    // Pick a random piece ID when the modal opens
    const [randomPieceId, setRandomPieceId] = useState<PieceId>(1);

    useEffect(() => {
        if (open) {
            const randomIndex = Math.floor(Math.random() * PIECE_IDS.length);
            setRandomPieceId(PIECE_IDS[randomIndex]);
        }
    }, [open]);

    // Target cell is "4" (row 2, col 3)
    const targetX = 3;
    const targetY = 2;

    // Calculate the offset to the first filled cell of the piece
    const pieceOffset = useMemo(() => {
        const shape = getPieceShape(randomPieceId);
        let firstFilledX = -1;
        let firstFilledY = -1;
        
        outer: for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    firstFilledX = x;
                    firstFilledY = y;
                    break outer;
                }
            }
        }
        
        return {
            x: firstFilledX * 50,
            y: firstFilledY * 50
        };
    }, [randomPieceId]);

    return (
        <BaseDialog
            open={open}
            onClose={onClose}
            slotProps={{
                paper: {
                    sx: {
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden"
                    }
                }
            }}
        >
            <DialogTitle sx={{ typography: "h5", fontWeight: "bold", pb: 1 }}>How to Play</DialogTitle>
            <DialogContent sx={{ pb: 4, overflow: "hidden" }}>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    <Typography variant="h6" sx={{ lineHeight: 1.4 }}>
                        The goal is to cover all cells on the board except for the current month and day.
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary" component="div">
                        <Box component="span" sx={{ display: "block", mb: 1 }}>• Drag and drop pieces onto the board.</Box>
                        <Box component="span" sx={{ display: "block", mb: 1 }}>• Rotate and flip pieces using the controls.</Box>
                        <Box component="span" sx={{ display: "block" }}>• Every day has at least one solution!</Box>
                    </Typography>

                    <ScaledBoardWrapper>
                        <Box className="scaling-container">
                            <BoardComponent
                                board={board}
                                pieces={[]}
                                onCellClick={() => {}}
                                onPieceDrop={() => {}}
                                draggedPieceId={null}
                                onDragStart={() => {}}
                                onDragEnd={() => {}}
                            />
                            {open && (
                                <AnimatedPieceWrapper sx={{ 
                                    // targetX * 50 + 50 (padding) + 4 (border) - pieceOffset.x
                                    left: (targetX * 50) + 54 - pieceOffset.x, 
                                    // targetY * 50 + 50 (padding) + 4 (border) - pieceOffset.y
                                    top: (targetY * 50) + 54 - pieceOffset.y
                                }}>
                                    <SimplePiece pieceId={randomPieceId} />
                                </AnimatedPieceWrapper>
                            )}
                        </Box>
                    </ScaledBoardWrapper>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary" variant="contained">
                    Got it!
                </Button>
            </DialogActions>
        </BaseDialog>
    );
};
