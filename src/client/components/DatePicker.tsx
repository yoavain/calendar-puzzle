import React, { useState } from "react";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import StarIcon from "@mui/icons-material/Star";
import type { PuzzleDate } from "../../common/types";
import { MONTHS } from "../../common/types";
import { useQueryParam } from "../hooks/useQueryParam";
import { useUser } from "../context/UserContext";

interface DatePickerProps {
    currentDate: PuzzleDate;
    onDateChange: (date: PuzzleDate) => void;
}

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // Using 29 for Feb (leap year max)

export const DatePicker: React.FC<DatePickerProps> = ({ currentDate, onDateChange }) => {
    const { user, completedDates } = useUser();
    const hasValidCode = useQueryParam("code");
    const isLoginRequired = !user && !hasValidCode;
    
    const [isOpen, setIsOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(currentDate.month);
    const [selectedDay, setSelectedDay] = useState(currentDate.day);

    // Check if a date is completed
    const isDateCompleted = (month: number, day: number) => {
        return completedDates.some(d => d.month === month && d.day === day);
    };

    const isCurrentDateCompleted = isDateCompleted(currentDate.month, currentDate.day);

    // Format date as DD/MM
    const formatDate = (date: PuzzleDate): string => {
        const day = String(date.day).padStart(2, "0");
        const month = String(date.month + 1).padStart(2, "0");
        return `${day}/${month}`;
    };

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

    // Generate days array
    const daysInMonth = DAYS_IN_MONTH[selectedMonth];
    const days: number[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const button = (
        <Button
            variant="contained"
            onClick={handleOpen}
            startIcon={<CalendarMonthIcon />}
            endIcon={isCurrentDateCompleted ? <StarIcon /> : null}
            size="small"
            color={isCurrentDateCompleted ? "success" : "primary"}
            disabled={isLoginRequired}
        >
            {formatDate(currentDate)}
        </Button>
    );

    return (
        <>
            {isLoginRequired ? (
                <Tooltip title="Sign-in to select a different date" arrow>
                    <span>{button}</span>
                </Tooltip>
            ) : (
                button
            )}

            <Dialog 
                open={isOpen} 
                onClose={handleClose}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 2 }
                }}
            >
                <DialogTitle sx={{ pb: 1 }}>
                    Select Date
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
                                <Grid size={{ xs: 4, sm: 2 }} key={monthName}>
                                    <Button
                                        fullWidth
                                        size="small"
                                        variant={index === selectedMonth ? "contained" : "outlined"}
                                        onClick={() => handleMonthChange(index)}
                                        sx={{ 
                                            minWidth: 0,
                                            px: 1,
                                            fontSize: "0.75rem",
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
                                                fontSize: "0.8rem",
                                                color: index === selectedMonth ? "white" : "warning.main",
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
                    <Box 
                        sx={{ 
                            display: "grid",
                            gridTemplateColumns: "repeat(7, 1fr)",
                            gap: 0.5
                        }}
                    >
                        {days.map(day => {
                            const completed = isDateCompleted(selectedMonth, day);
                            return (
                                <Button
                                    key={day}
                                    size="small"
                                    variant={day === selectedDay ? "contained" : "text"}
                                    onClick={() => handleDayClick(day)}
                                    sx={{
                                        minWidth: 0,
                                        aspectRatio: "1",
                                        p: 0,
                                        fontSize: "0.875rem",
                                        position: "relative",
                                        bgcolor: day === selectedDay ? "primary.main" : "action.hover",
                                        "&:hover": {
                                            bgcolor: day === selectedDay ? "primary.dark" : "action.selected"
                                        }
                                    }}
                                >
                                    {day}
                                    {completed && (
                                        <StarIcon sx={{ 
                                            position: "absolute", 
                                            top: 2, 
                                            right: 2, 
                                            fontSize: "1.2rem",
                                            color: day === selectedDay ? "white" : "warning.main",
                                            filter: day === selectedDay ? "none" : "drop-shadow(0px 0px 2px rgba(0,0,0,0.3))"
                                        }} />
                                    )}
                                </Button>
                            );
                        })}
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleClose} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} variant="contained">
                        Play This Date
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
