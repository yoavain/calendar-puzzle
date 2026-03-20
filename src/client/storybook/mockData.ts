import { initializeBoard, initializePieces } from "../../common/initialize";
import type { PuzzleDate } from "../../common/types";

export const JAN_1: PuzzleDate = { month: 0, day: 1 };
export const STORY_DATE: PuzzleDate = { month: 1, day: 20 }; // Feb 20

export const makeMockBoard = (date: PuzzleDate = JAN_1) => initializeBoard(date);
export const makeMockPieces = () => initializePieces();

export const MOCK_COMPLETED_DATES: PuzzleDate[] = [
    { month: 0, day: 1 },
    { month: 0, day: 2 },
    { month: 1, day: 15 },
    { month: 1, day: 16 },
    { month: 1, day: 17 },
    { month: 1, day: 18 }
];

export const MOCK_PLAYED_DATES: PuzzleDate[] = [...MOCK_COMPLETED_DATES, { month: 1, day: 20 }];
