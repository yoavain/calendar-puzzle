import type { Piece, PuzzleDate } from "../../common/types";

const STORAGE_KEY = "calendar-puzzle-session";

/**
 * Session data stored in localStorage.
 * Contains the current date, piece states, and whether the puzzle was solved.
 */
export interface SessionData {
    date: PuzzleDate;
    pieces: Piece[];
    isSolved: boolean;
}

/**
 * Save session data to localStorage.
 * Silently fails if localStorage is unavailable.
 */
export function saveSession(data: SessionData): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    catch {
        // Silently fail if localStorage is unavailable
    }
}

/**
 * Load session data from localStorage.
 * Returns null if no session exists or if data is corrupted.
 */
export function loadSession(): SessionData | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return null;
        }
        return JSON.parse(stored) as SessionData;
    }
    catch {
        return null;
    }
}

/**
 * Clear session data from localStorage.
 * Silently fails if localStorage is unavailable.
 */
export function clearSession(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    }
    catch {
        // Silently fail
    }
}
