import React, { useCallback, useEffect, useMemo, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { getUserActivity } from "../service/puzzleService.js";
import { logToServer } from "../service/logService.js";
import { useUser } from "../context/UserContext.js";
import { TOTAL_DATES } from "../../common/consts.js";
import type { UserActivity } from "../../common/restTypes.js";
import { CompletionBadge } from "./CompletionBadge";

/** Matches the avatar beside it, so the two columns read as one pair. */
const COMPLETION_BADGE_SIZE = 32;

interface HallOfFameModalProps {
    open: boolean;
    onClose: () => void;
}

interface HeadCell {
    id: string;
    label: string;
}

const headCells: HeadCell[] = [
    { id: "rank", label: "" },
    { id: "userId", label: "User" },
    { id: "daysPlayed", label: "Days Played" },
    { id: "daysSolved", label: "Days Solved" }
];

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
            fetchData();
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
            maxWidth="md"
            fullWidth
            slotProps={{
                paper: {
                    sx: (theme) => ({
                        borderRadius: `${theme.game.radius.md}px`,
                        userSelect: "none"
                    })
                }
            }}
        >
            <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Hall of Fame
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{ color: (theme) => theme.palette.grey[500] }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                        <CircularProgress aria-label="Loading" />
                    </Box>
                ) : (
                    <TableContainer component={Paper} elevation={0}>
                        <Table stickyHeader aria-label="hall of fame table">
                            <TableHead>
                                <TableRow>
                                    {headCells.map((headCell) => (
                                        <TableCell
                                            key={headCell.id}
                                            align="center"
                                        >
                                            {headCell.label}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedData.map((row, index) => {
                                    const isCurrentUser = row.isCurrentUser;
                                    const avatarUrl = isCurrentUser && currentUser?.avatarUrl
                                        ? currentUser.avatarUrl
                                        : `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(row.userKey)}`;

                                    return (
                                        <TableRow key={index} hover selected={isCurrentUser}>
                                            <TableCell align="center">
                                                {row.daysSolved >= TOTAL_DATES && (
                                                    <CompletionBadge
                                                        size={COMPLETION_BADGE_SIZE}
                                                        title="Solved every date"
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Avatar 
                                                    src={avatarUrl}
                                                    alt="Player avatar"
                                                    sx={{ width: 32, height: 32, margin: "0 auto" }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">{row.daysPlayed}</TableCell>
                                            <TableCell align="center">{row.daysSolved}</TableCell>
                                        </TableRow>
                                    );
                                })}
                                {sortedData.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                            No data available
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};
