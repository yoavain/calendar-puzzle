import React, { useState, useRef, useEffect } from 'react';
import { PuzzleDate, MONTHS } from '../../common/types';
import { useQueryParam } from '../hooks/useQueryParam';
import './DatePicker.css';

interface DatePickerProps {
    currentDate: PuzzleDate;
    onDateChange: (date: PuzzleDate) => void;
}

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // Using 29 for Feb (leap year max)
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DatePicker: React.FC<DatePickerProps> = ({ currentDate, onDateChange }) => {
    const showButton = useQueryParam('code');
    
    const [isOpen, setIsOpen] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(currentDate.month);
    const [selectedDay, setSelectedDay] = useState(currentDate.day);
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Close popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popupRef.current &&
                !popupRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    // Only render if 'code' query param is present (same as Hint/Solution buttons)
    if (!showButton) {
        return null;
    }

    // Format date as DD/MM
    const formatDate = (date: PuzzleDate): string => {
        const day = String(date.day).padStart(2, '0');
        const month = String(date.month + 1).padStart(2, '0');
        return `${day}/${month}`;
    };

    // Reset selection when opening
    const handleOpen = () => {
        setSelectedMonth(currentDate.month);
        setSelectedDay(currentDate.day);
        setIsOpen(true);
    };

    const handleMonthChange = (month: number) => {
        setSelectedMonth(month);
        // Adjust day if it exceeds days in new month
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

    const handleCancel = () => {
        setIsOpen(false);
    };

    // Generate calendar grid for selected month
    const renderCalendar = () => {
        const daysInMonth = DAYS_IN_MONTH[selectedMonth];
        const days: number[] = [];
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return (
            <div className="date-picker-calendar">
                <div className="date-picker-weekdays">
                    {WEEKDAYS.map(day => (
                        <div key={day} className="date-picker-weekday">{day}</div>
                    ))}
                </div>
                <div className="date-picker-days">
                    {days.map(day => (
                        <button
                            key={day}
                            className={`date-picker-day ${day === selectedDay ? 'selected' : ''}`}
                            onClick={() => handleDayClick(day)}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="date-picker-container">
            <button
                ref={buttonRef}
                className="date-picker-button control-button"
                onClick={handleOpen}
                title="Change playing date"
            >
                📅 {formatDate(currentDate)}
            </button>

            {isOpen && (
                <div className="date-picker-popup" ref={popupRef}>
                    <div className="date-picker-header">
                        <span className="date-picker-title">Select Date</span>
                    </div>

                    <div className="date-picker-month-selector">
                        {MONTHS.map((monthName, index) => (
                            <button
                                key={monthName}
                                className={`date-picker-month ${index === selectedMonth ? 'selected' : ''}`}
                                onClick={() => handleMonthChange(index)}
                            >
                                {monthName}
                            </button>
                        ))}
                    </div>

                    {renderCalendar()}

                    <div className="date-picker-actions">
                        <button className="date-picker-cancel" onClick={handleCancel}>
                            Cancel
                        </button>
                        <button className="date-picker-confirm" onClick={handleConfirm}>
                            Play This Date
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
