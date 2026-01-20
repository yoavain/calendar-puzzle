import type { Piece, PuzzleDate } from "./types";

// Common path params for date-based endpoints
export interface DatePathParams {
    date: string; // Format: MM-DD
}

// ============================================
// GET /api/solution/:date
// Returns the full puzzle solution for a date
// ============================================
export interface SolutionResponse {
    pieces: Piece[]; // All pieces with their positions set
}

// ============================================
// GET /api/hint/:date
// Returns a partial solution (one random piece placed)
// ============================================
export interface HintResponse {
    piece: Piece; // Single piece with position set
}

// ============================================
// GET /api/hint/:date/state
// Returns the hint if it was used, or null
// ============================================
export interface HintStateResponse {
    piece: Piece | null;
}

// ============================================
// PUT /api/hint
// Record hint usage and return the hint piece
// ============================================
export interface HintRequest extends PuzzleDate {}

// ============================================
// POST /api/stats/start
// Record that a user started a puzzle
// ============================================
export interface StartPuzzleRequest extends PuzzleDate {}

// ============================================
// POST /api/stats/complete
// Record that a user completed a puzzle
// ============================================
export interface CompletePuzzleRequest extends PuzzleDate {
    pieces: Piece[];
}

// ============================================
// POST /api/issue
// Submit a bug report or feature request
// ============================================
export type IssueType = "bug" | "enhancement";

export interface IssueRequest {
    title: string;
    description: string;
    type: IssueType;
}

export interface IssueResponse {
    success: boolean;
}

// ============================================
// GET /api/admin/userdata
// Returns user activity statistics for admin dashboard
// ============================================
export interface UserActivity {
    username: string;
    avatarUrl?: string | null;
    daysPlayed: number;
    daysSolved: number;
    daysPlayedWithHint: number;
    daysSolvedWithHint: number;
}

export interface UserDataResponse {
    users: UserActivity[];
}

// Error response for invalid requests
export interface ErrorResponse {
    error: string;
}
