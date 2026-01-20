import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Zoom from "@mui/material/Zoom";
import CelebrationIcon from "@mui/icons-material/Celebration";

interface SuccessMessageProps {
    isVisible: boolean;
    onClose: () => void;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ isVisible, onClose }) => {
    return (
        <Dialog
            open={isVisible}
            onClose={onClose}
            onClick={onClose}
            TransitionComponent={Zoom}
            transitionDuration={300}
            disableScrollLock
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    px: 4,
                    py: 3,
                    textAlign: "center",
                    minWidth: 300
                }
            }}
        >
            <DialogContent sx={{ p: 0 }}>
                <Box sx={{ mb: 2 }}>
                    <CelebrationIcon 
                        sx={{ 
                            fontSize: 64, 
                            color: "success.main",
                            animation: "bounce 0.6s ease-in-out infinite alternate",
                            "@keyframes bounce": {
                                "0%": { transform: "translateY(0)" },
                                "100%": { transform: "translateY(-8px)" }
                            }
                        }} 
                    />
                </Box>
                <Typography 
                    variant="h5" 
                    component="h2" 
                    sx={{ 
                        fontWeight: "bold",
                        color: "success.main",
                        mb: 1
                    }}
                >
                    Puzzle Solved!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Congratulations! You've completed today's puzzle.
                </Typography>
            </DialogContent>
        </Dialog>
    );
};
