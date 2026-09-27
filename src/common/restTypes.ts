import type { Piece, PuzzleDate } from "./types";
import type { HintErrorCode } from "./hintTokens";

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
// GET /api/hint/:date/state
// Returns every hint the user has used for the date (possibly none)
// ============================================
export interface HintStateResponse {
    pieces: Piece[];
}

// ============================================
// PUT /api/hint
// Request hint #hintNumber. Returns all hints so far and the new balance.
// ============================================
export interface HintRequest extends PuzzleDate {
    hintNumber: number; // 1..MAX_HINTS
}

export interface HintResponse {
    pieces: Piece[]; // hints 1..n, in order
    tokenBalance: number;
}

// 409 body for a refused hint
export interface HintErrorResponse extends ErrorResponse {
    code: HintErrorCode;
    tokenBalance: number;
}

// 500 body for a failed hint; tokenBalance is set when the token spend had already committed
export interface HintFailureResponse extends ErrorResponse {
    tokenBalance?: number;
}

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

export interface CompletePuzzleResponse {
    success: true;
    tokenGranted: boolean; // true only when this request recorded the first solve of the date
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
// GET /api/hall-of-fame
// Returns user activity statistics (authenticated users, not admin-only)
// ============================================
export interface UserActivity {
    userKey: string;
    isCurrentUser: boolean;
    daysPlayed: number;
    daysSolved: number;
    daysPlayedWithHint: number;
    daysSolvedWithHint: number;
}

export interface UserDataResponse {
    users: UserActivity[];
}

// ============================================
// POST /api/log
// Log client-side errors or info messages
// ============================================
export interface LogRequest {
    logLevel: "error" | "info";
    message: string;
    stack?: string;
}

// ============================================
// Per-user settings, stored in users.settings (jsonb)
// ============================================
export interface UserSettings {
    tokenIntroSeen?: boolean;
    skipTokenConfirm?: boolean;
}

// PATCH /api/user/settings — body is a partial UserSettings
export interface UserSettingsResponse {
    settings: UserSettings;
}

// Error response for invalid requests
export interface ErrorResponse {
    error: string;
}

// Used by logout, stats/start, stats/complete
export interface SuccessResponse {
    success: true;
}

// Used by GET /api/auth/public-key
export interface PublicKeyResponse {
    publicKey: string;
}

// Used by GET /api/auth/csrf-token
export interface CsrfTokenResponse {
    csrfToken: string;
}
