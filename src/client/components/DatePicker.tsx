import React, { useState } from "react";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import StarIcon from "@mui/icons-material/Star";
import { toPuzzleDate } from "../../common/types";
import type { PuzzleDate } from "../../common/types";
import { DAYS_IN_MONTH, MONTHS } from "../../common/consts";
import { useUser } from "../context/UserContext";
import { TooltipDisabledWrapper } from "./TooltipDisabledWrapper";
import { formatDayName } from "../copy/solveCopy";
import {
    DayFelt,
    DayTile,
    EmptyTile,
    Legend,
    LegendItem,
    SolvedSwatch,
    StartedSwatch,
    TodayStatusMark,
    TodaySwatch
} from "./DatePicker.styled";
import type { DayStatus } from "./DatePicker.styled";

// Five rows of seven, the same shape for every month.
const DAY_GRID_CELLS = 35;

// Format date as DD/MM
const formatDate = (date: PuzzleDate): string => {
    const day = String(date.day).padStart(2, "0");
    const month = String(date.month + 1).padStart(2, "0");
    return `${day}/${month}`;
};

const describeDay = (month: number, day: number, isToday: boolean, status: DayStatus): string => {
    const parts = [formatDayName({ month, day })];
    if (isToday) {
        parts.push("today");
    }
    if (status !== "none") {
        parts.push(status);
    }
    return parts.join(", ");
};

interface DatePickerProps {
    currentDate: PuzzleDate;
    onDateChange: (date: PuzzleDate) => void;
    fullWidth?: boolean;
    sx?: SxProps<Theme>;
}

export const DatePicker: React.FC<DatePickerProps> = ({ currentDate, onDateChange, fullWidth, sx }) => {
    const theme = useTheme();
    const { user, completedDates, playedDates } = useUser();
    const isLoginRequired = !user;
    
    const [isOpen, setIsOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(currentDate.month);
    const [selectedDay, setSelectedDay] = useState(currentDate.day);

    // Check if a date is completed
    const isDateCompleted = (month: number, day: number) => {
        return completedDates.some(d => d.month === month && d.day === day);
    };

    // Check if a date was played
    const isDatePlayed = (month: number, day: number) => {
        return playedDates.some(d => d.month === month && d.day === day);
    };

    const isCurrentDateCompleted = isDateCompleted(currentDate.month, currentDate.day);
    const isCurrentDatePlayed = isDatePlayed(currentDate.month, currentDate.day);

    const handleOpen = () => {
        setSelectedMonth(currentDate.month);
        setSelectedDay(currentDate.day);
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleMonthChange = (month: number) => {
        setSelectedMonth(month);
        const maxDays = DAYS_IN_MONTH[month];
        if (selectedDay > maxDays) {
            setSelectedDay(maxDays);
        }
    };

    const handleDayClick = (day: number) => {
        setSelectedDay(day);
    };

    const handleConfirm = () => {
        onDateChange({ month: selectedMonth, day: selectedDay });
        setIsOpen(false);
    };

    const today = toPuzzleDate(new Date());

    // Generate days array
    const daysInMonth = DAYS_IN_MONTH[selectedMonth];
    const days: number[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }
    const emptyCells = Array.from({ length: DAY_GRID_CELLS - daysInMonth }, (_, i) => daysInMonth + i + 1);

    const button = (
        <Button
            variant="contained"
            onClick={handleOpen}
            startIcon={<CalendarMonthIcon />}
            size="small"
            color={isCurrentDateCompleted ? "success" : "primary"}
            fullWidth={fullWidth}
            sx={[
                {
                    ...(isCurrentDatePlayed && !isCurrentDateCompleted && {
                        bgcolor: theme.game.extensionColor,
                        color: theme.palette.getContrastText(theme.game.extensionColor),
                        "&:hover": {
                            bgcolor: theme.game.extensionColor,
                            opacity: 0.9
                        }
                    })
                },
                ...(Array.isArray(sx) ? sx : sx ? [sx] : [])
            ]}
            disabled={isLoginRequired}
        >
            {formatDate(currentDate)}
        </Button>
    );

    return (
        <>
            <Tooltip title={isLoginRequired ? "Sign in to select a different date" : "Change date"} arrow>
                <TooltipDisabledWrapper disabled={isLoginRequired}>{button}</TooltipDisabledWrapper>
            </Tooltip>

            <Dialog 
                open={isOpen} 
                onClose={handleClose}
                maxWidth="xs"
                fullWidth
                slotProps={{
                    paper: {
                        sx: { userSelect: "none" }
                    }
                }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    Select date
                </DialogTitle>
                
                <DialogContent sx={{ pt: 1 }}>
                    {/* Month Selector */}
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Month
                    </Typography>
                    <Grid container spacing={0.5} sx={{ mb: 2 }}>
                        {MONTHS.map((monthName, index) => {
                            // Check if the entire month is completed
                            const daysInThisMonth = DAYS_IN_MONTH[index];
                            const completedDaysInMonth = completedDates.filter(d => d.month === index).length;
                            const isMonthFullyCompleted = completedDaysInMonth === daysInThisMonth;
                            
                            return (
                                <Grid size={2} key={monthName}>
                                    <Button
                                        fullWidth
                                        size="small"
                                        color={index === selectedMonth ? "primary" : "inherit"}
                                        variant={index === selectedMonth ? "contained" : "outlined"}
                                        onClick={() => handleMonthChange(index)}
                                        sx={{
                                            minWidth: 0,
                                            borderColor: alpha(theme.palette.text.primary, 0.23),
                                            px: 0.5,
                                            fontSize: theme.game.fontSize.xs,
                                            position: "relative",
                                            overflow: "hidden" // Ensure star doesn't spill out
                                        }}
                                    >
                                        {monthName}
                                        {isMonthFullyCompleted && (
                                            <StarIcon sx={{
                                                position: "absolute",
                                                top: 0,
                                                right: 0,
                                                fontSize: theme.game.fontSize.xs,
                                                color: index === selectedMonth ? "white" : theme.game.starColor,
                                                filter: index === selectedMonth ? "none" : "drop-shadow(0px 0px 2px rgba(0,0,0,0.5))"
                                            }} />
                                        )}
                                    </Button>
                                </Grid>
                            );
                        })}
                    </Grid>

                    {/* Day Selector */}
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Day
                    </Typography>
                    <DayFelt role="group" aria-label={`Days in ${MONTHS[selectedMonth]}`}>
                        {days.map(day => {
                            const status: DayStatus = isDateCompleted(selectedMonth, day)
                                ? "solved"
                                : isDatePlayed(selectedMonth, day) ? "started" : "none";
                            const isToday = selectedMonth === today.month && day === today.day;
                            const isSelected = day === selectedDay;

                            return (
                                <DayTile
                                    key={day}
                                    status={status}
                                    isToday={isToday}
                                    isSelected={isSelected}
                                    aria-pressed={isSelected}
                                    aria-label={describeDay(selectedMonth, day, isToday, status)}
                                    onClick={() => handleDayClick(day)}
                                >
                                    {day}
                                    {isToday && status !== "none" && <TodayStatusMark status={status} />}
                                </DayTile>
                            );
                        })}
                        {emptyCells.map(cell => <EmptyTile key={cell} aria-hidden="true" />)}
                    </DayFelt>
                    <Legend>
                        <LegendItem><SolvedSwatch />Solved</LegendItem>
                        <LegendItem><StartedSwatch />Started</LegendItem>
                        <LegendItem><TodaySwatch />Today</LegendItem>
                    </Legend>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClose} color="inherit" variant="outlined">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} variant="contained">
                        Play this date
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
