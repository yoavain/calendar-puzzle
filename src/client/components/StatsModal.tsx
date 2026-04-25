import React from "react";
import DialogTitle from "@mui/material/DialogTitle";
import { BaseDialog } from "./BaseDialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { ProgressBarWithLabel } from "./ProgressBarWithLabel";
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
        <BaseDialog
            open={open}
            onClose={onClose}
            slotProps={{
                paper: { sx: (theme) => ({ borderRadius: `${theme.game.radius.md}px` }) }
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
                    <ProgressBarWithLabel
                        value={(completedDates.length / TOTAL_DATES) * 100}
                        label={`${completedDates.length} / ${TOTAL_DATES}`}
                        ariaLabel="Overall completion progress"
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
                <Button onClick={onClose} variant="contained" fullWidth sx={{ mx: 2 }}>
                    Close
                </Button>
            </DialogActions>
        </BaseDialog>
    );
};
