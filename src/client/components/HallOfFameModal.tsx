import React, { useCallback, useEffect, useMemo, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { getUserActivity } from "../service/puzzleService.js";
import { logToServer } from "../service/logService.js";
import { useUser } from "../context/UserContext.js";
import { TOTAL_DATES } from "../../common/consts.js";
import type { UserActivity } from "../../common/restTypes.js";
import { CompletionBadge } from "./CompletionBadge";
import {
    PlayerCell,
    RankList,
    RankMarker,
    RankRow,
    Score,
    ScoreCaption,
    ScoreDetail,
    VisuallyHidden
} from "./HallOfFameModal.styled";

/** Matches the avatar beside it, so the two read as one pair. */
const COMPLETION_BADGE_SIZE = 32;

interface HallOfFameModalProps {
    open: boolean;
    onClose: () => void;
}

export const HallOfFameModal: React.FC<HallOfFameModalProps> = ({ open, onClose }) => {
    const { user: currentUser } = useUser();
    const [data, setData] = useState<UserActivity[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const users = await getUserActivity();
            setData(users);
        }
        catch (error) {
            logToServer("error", "HallOfFame: Failed to fetch user activity", error);
        }
        finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) {
            fetchData().catch(() => {});
        }
    }, [open, fetchData]);

    const sortedData = useMemo(() => {
        return data
            .filter(row => row.daysSolved >= 1)
            .sort((a, b) => {
                // Primary sort: daysSolved (Descending)
                if (b.daysSolved !== a.daysSolved) {
                    return b.daysSolved - a.daysSolved;
                }
                // Secondary sort: daysSolvedWithHint (Ascending)
                return a.daysSolvedWithHint - b.daysSolvedWithHint;
            });
    }, [data]);

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            slotProps={{
                paper: {
                    sx: { userSelect: "none" }
                }
            }}
        >
            <DialogTitle>
                Hall of Fame
            </DialogTitle>
            <DialogContent>
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                        <CircularProgress aria-label="Loading" />
                    </Box>
                ) : (
                    sortedData.length === 0 ? (
                        <Box sx={{ textAlign: "center", py: 3 }}>No data available</Box>
                    ) : (
                        <>
                            <ScoreCaption aria-hidden="true">Days solved</ScoreCaption>
                            <RankList aria-label="Players by days solved">
                                {sortedData.map((row, index) => {
                                    const avatarUrl = row.isCurrentUser && currentUser?.avatarUrl
                                        ? currentUser.avatarUrl
                                        : `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(row.userKey)}`;

                                    return (
                                        <RankRow key={row.userKey} isCurrentUser={row.isCurrentUser}>
                                            <RankMarker rank={index + 1}>{index + 1}</RankMarker>
                                            <Avatar src={avatarUrl} alt="" sx={{ width: 32, height: 32 }} />
                                            <PlayerCell>
                                                {row.isCurrentUser && "You"}
                                                {row.daysSolved >= TOTAL_DATES && (
                                                    <CompletionBadge
                                                        size={COMPLETION_BADGE_SIZE}
                                                        title="Solved every date"
                                                    />
                                                )}
                                            </PlayerCell>
                                            <Score>
                                                {row.daysSolved}
                                                <VisuallyHidden> days solved</VisuallyHidden>
                                                <ScoreDetail>{row.daysPlayed} played</ScoreDetail>
                                            </Score>
                                        </RankRow>
                                    );
                                })}
                            </RankList>
                        </>
                    )
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit" variant="outlined">Close</Button>
            </DialogActions>
        </Dialog>
    );
};
