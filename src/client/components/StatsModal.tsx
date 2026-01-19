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
import type { PuzzleDate } from "../../common/types.js";

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

    // Calculate streaks
    const calculateStreaks = (history: PuzzleDate[]) => {
        if (history.length === 0) {
            return { current: 0, max: 0 };
        }

        // Convert to absolute day of year for easier streak calculation
        // Note: This is a simplified version that doesn't account for years/leap years perfectly
        // but works for the current month/day structure.
        const getDayOfYear = (d: PuzzleDate) => {
            const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            let day = d.day;
            for (let i = 0; i < d.month; i++) {
                day += daysInMonth[i];
            }
            return day;
        };

        const sortedDays = [...new Set(history.map(getDayOfYear))].sort((a, b) => b - a);
        
        let currentStreak = 0;
        let maxStreak = 0;
        let tempStreak = 0;

        // Today's day of year
        const now = new Date();
        const todayDay = getDayOfYear({ month: now.getMonth(), day: now.getDate() });
        const yesterdayDay = todayDay - 1;

        // Current streak (must include today or yesterday)
        if (sortedDays[0] === todayDay || sortedDays[0] === yesterdayDay) {
            currentStreak = 1;
            for (let i = 0; i < sortedDays.length - 1; i++) {
                if (sortedDays[i] - sortedDays[i + 1] === 1) {
                    currentStreak++;
                }
                else {
                    break;
                }
            }
        }

        // Max streak
        if (sortedDays.length > 0) {
            tempStreak = 1;
            maxStreak = 1;
            const ascDays = [...sortedDays].sort((a, b) => a - b);
            for (let i = 0; i < ascDays.length - 1; i++) {
                if (ascDays[i + 1] - ascDays[i] === 1) {
                    tempStreak++;
                }
                else {
                    maxStreak = Math.max(maxStreak, tempStreak);
                    tempStreak = 1;
                }
            }
            maxStreak = Math.max(maxStreak, tempStreak);
        }

        return { current: currentStreak, max: maxStreak };
    };

    const stats = calculateStreaks(completedDates);
    const winPercent = playedCount > 0 ? Math.round((completedDates.length / playedCount) * 100) : 0;

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2 }
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
