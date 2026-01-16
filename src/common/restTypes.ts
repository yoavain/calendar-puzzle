import { Piece } from './types';

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

// Error response for invalid requests
export interface ErrorResponse {
    error: string;
}
