import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import TableSortLabel from "@mui/material/TableSortLabel";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { getUserActivity } from "../service/puzzleService.js";
import { logToServer } from "../service/logService.js";
import type { UserActivity } from "../../common/restTypes.js";

interface AdminDashboardModalProps {
    open: boolean;
    onClose: () => void;
}

type Order = "asc" | "desc";

interface HeadCell {
    id: keyof UserActivity;
    label: string;
}

const headCells: HeadCell[] = [
    { id: "username", label: "Username" },
    { id: "daysPlayed", label: "Days Played" },
    { id: "daysSolved", label: "Days Solved" },
    { id: "daysPlayedWithHint", label: "Played w/ Hint" },
    { id: "daysSolvedWithHint", label: "Solved w/ Hint" }
];

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({ open, onClose }) => {
    const [data, setData] = useState<UserActivity[]>([]);
    const [loading, setLoading] = useState(false);
    const [orderBy, setOrderBy] = useState<keyof UserActivity>("daysPlayed");
    const [order, setOrder] = useState<Order>("desc");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const users = await getUserActivity();
            setData(users);
        }
        catch (error) {
            logToServer("error", "AdminDashboard: Failed to fetch user activity", error);
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

    const handleRequestSort = (property: keyof UserActivity) => {
        const isAsc = orderBy === property && order === "asc";
        setOrder(isAsc ? "desc" : "asc");
        setOrderBy(property);
    };

    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => {
            const valA = a[orderBy];
            const valB = b[orderBy];

            if (valA === undefined || valB === undefined || valA === null || valB === null) {
                return 0;
            }

            if (valA < valB) {
                return order === "asc" ? -1 : 1;
            }
            if (valA > valB) {
                return order === "asc" ? 1 : -1;
            }
            return 0;
        });
    }, [data, order, orderBy]);

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2 }
            }}
        >
            <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                User Statistics
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
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer component={Paper} elevation={0}>
                        <Table stickyHeader aria-label="user statistics table">
                            <TableHead>
                                <TableRow>
                                    <TableCell />
                                    {headCells.map((headCell) => (
                                        <TableCell
                                            key={headCell.id}
                                            align={headCell.id === "username" ? "left" : "center"}
                                            sortDirection={orderBy === headCell.id ? order : false}
                                        >
                                            <TableSortLabel
                                                active={orderBy === headCell.id}
                                                direction={orderBy === headCell.id ? order : "asc"}
                                                onClick={() => handleRequestSort(headCell.id)}
                                            >
                                                {headCell.label}
                                            </TableSortLabel>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedData.map((row, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell sx={{ width: 40, pr: 0 }}>
                                            <Avatar 
                                                src={row.avatarUrl || undefined} 
                                                sx={{ width: 24, height: 24, fontSize: "0.75rem" }}
                                            >
                                                {row.username.charAt(0).toUpperCase()}
                                            </Avatar>
                                        </TableCell>
                                        <TableCell component="th" scope="row">
                                            {row.username}
                                        </TableCell>
                                        <TableCell align="center">{row.daysPlayed}</TableCell>
                                        <TableCell align="center">{row.daysSolved}</TableCell>
                                        <TableCell align="center">{row.daysPlayedWithHint}</TableCell>
                                        <TableCell align="center">{row.daysSolvedWithHint}</TableCell>
                                    </TableRow>
                                ))}
                                {sortedData.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
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
