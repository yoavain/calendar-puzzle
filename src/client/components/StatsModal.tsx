import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import LinearProgress from "@mui/material/LinearProgress";
import { useUser } from "../context/UserContext.js";
import { calculateStreaks } from "../../common/streakUtils.js";

interface StatsModalProps {
    open: boolean;
    onClose: () => void;
}

const TOTAL_DATES = 366;

interface StatItemProps {
    value: string | number;
    label: string;
}

const StatItem: React.FC<StatItemProps> = ({ value, label }) => (
    <Box sx={{ textAlign: "center", p: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            {value}
        </Typography>
        <Typography variant="caption" sx={{ textTransform: "uppercase", color: "text.secondary" }}>
            {label}
        </Typography>
    </Box>
);

export const StatsModal: React.FC<StatsModalProps> = ({ open, onClose }) => {
    const { completedDates, playedDates } = useUser();
    const playedCount = playedDates.length;

    const stats = calculateStreaks(completedDates);
    const winPercent = playedCount > 0 ? Math.round((completedDates.length / playedCount) * 100) : 0;

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            disableScrollLock
            PaperProps={{
                sx: { 
                    borderRadius: 2,
                    userSelect: "none"
                }
            }}
        >
            <DialogTitle sx={{ m: 0, p: 2, textAlign: "center", fontWeight: "bold" }}>
                STATISTICS
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500]
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid size={3}>
                        <StatItem value={playedCount} label="Played" />
                    </Grid>
                    <Grid size={3}>
                        <StatItem value={winPercent} label="Win %" />
                    </Grid>
                    <Grid size={3}>
                        <StatItem value={stats.current} label="Current Streak" />
                    </Grid>
                    <Grid size={3}>
                        <StatItem value={stats.max} label="Max Streak" />
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3, mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1, textAlign: "center" }}>
                        OVERALL PROGRESS
                    </Typography>
                    <Box sx={{ position: "relative" }}>
                        <LinearProgress 
                            variant="determinate" 
                            value={(completedDates.length / TOTAL_DATES) * 100} 
                            aria-label="Overall completion progress"
                            sx={{ 
                                height: 25, 
                                borderRadius: 12,
                                backgroundColor: (theme) => (theme.palette.mode === "dark" ? "#333" : "#e0e0e0"),
                                "& .MuiLinearProgress-bar": {
                                    borderRadius: 12
                                }
                            }}
                        />
                        <Box sx={{ 
                            position: "absolute", 
                            top: 0, 
                            left: 0, 
                            right: 0, 
                            bottom: 0, 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center",
                            pointerEvents: "none"
                        }}>
                            <Typography variant="caption" sx={{ fontWeight: "bold", color: "#fff", textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)" }}>
                                {completedDates.length} / {TOTAL_DATES}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
                <Button onClick={onClose} variant="contained" fullWidth sx={{ mx: 2 }}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};
