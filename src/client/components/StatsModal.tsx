import React from "react";
import DialogTitle from "@mui/material/DialogTitle";
import { BaseDialog } from "./BaseDialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { ProgressBarWithLabel } from "./ProgressBarWithLabel";
import { useUser } from "../context/UserContext.js";
import { calculateStreaks } from "../../common/streakUtils.js";
import { TOTAL_DATES } from "../../common/consts.js";
import type { PuzzleDate } from "../../common/types";
import { SOLVE_COPY } from "../copy/solveCopy";
import type { SolveResult } from "../layouts/common/useGameModals";

interface StatsModalProps {
    open: boolean;
    onClose: () => void;
    /** Set when a solve opened the dialog. */
    solveResult?: SolveResult | null;
    onPlayNext?: (date: PuzzleDate) => void;
}

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

export const StatsModal: React.FC<StatsModalProps> = ({ open, onClose, solveResult, onPlayNext }) => {
    const { completedDates, playedDates } = useUser();
    const playedCount = playedDates.length;

    const stats = calculateStreaks(completedDates);
    const winPercent = playedCount > 0 ? Math.round((completedDates.length / playedCount) * 100) : 0;
    const nextDate = solveResult?.nextDate ?? null;

    return (
        <BaseDialog open={open} onClose={onClose}>
            <DialogTitle sx={{ m: 0, p: 2, textAlign: "center", fontWeight: "bold" }}>
                {solveResult ? SOLVE_COPY.solvedTitle(solveResult.solvedDate) : "Statistics"}
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
                        Overall progress
                    </Typography>
                    <ProgressBarWithLabel
                        value={(completedDates.length / TOTAL_DATES) * 100}
                        label={`${completedDates.length} / ${TOTAL_DATES}`}
                        ariaLabel="Overall completion progress"
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit" variant="outlined">
                    Close
                </Button>
                {nextDate && onPlayNext && (
                    <Button onClick={() => onPlayNext(nextDate)} color="primary" variant="contained" autoFocus>
                        {SOLVE_COPY.playDate(nextDate)}
                    </Button>
                )}
            </DialogActions>
        </BaseDialog>
    );
};
