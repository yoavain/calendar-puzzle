import { MONTHS } from "../../common/consts";
import type { PuzzleDate } from "../../common/types";

/** A date in words, such as "Feb 20". */
export const formatDayName = (date: PuzzleDate): string => `${MONTHS[date.month]} ${date.day}`;

export const SOLVE_COPY = {
    solvedTitle: (date: PuzzleDate) => `${formatDayName(date)} solved`,
    playDate: (date: PuzzleDate) => `Play ${formatDayName(date)}`,
    solvedTodayNotice: "You've solved today's puzzle."
};
