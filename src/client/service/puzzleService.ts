import { Piece, PuzzleDate } from '../../common/types';
import { SolutionResponse, HintResponse, ErrorResponse } from '../../common/restTypes';
import { encryptPayload } from '../utils/encryption.js';

let cachedPublicKey: string | null = null;

/**
 * Fetches the server's public key once for encryption.
 */
async function getPublicKey(): Promise<string | null> {
    if (cachedPublicKey) return cachedPublicKey;
    try {
        const response = await fetch('/api/auth/public-key');
        if (response.ok) {
            const data = await response.json();
            cachedPublicKey = data.publicKey;
            return cachedPublicKey;
        }
    } catch (error) {
        console.error('Failed to fetch public key:', error);
    }
    return null;
}

/**
 * Format a PuzzleDate to the API date format (MM-DD)
 */
function formatDateForApi(date: PuzzleDate): string {
    const month = String(date.month + 1).padStart(2, '0'); // month is 0-indexed
    const day = String(date.day).padStart(2, '0');
    return `${month}-${day}`;
}

/**
 * Get the full puzzle solution for a specific date
 */
export async function getSolution(date: PuzzleDate): Promise<Piece[]> {
    const dateStr = formatDateForApi(date);
    const response = await fetch(`/api/solution/${dateStr}`);
    
    if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || `Failed to get solution: ${response.statusText}`);
    }
    
    const data = await response.json() as SolutionResponse;
    return data.pieces;
}

/**
 * Get a hint (single piece placement) for a specific date
 */
export async function getHint(date: PuzzleDate): Promise<Piece> {
    const dateStr = formatDateForApi(date);
    const response = await fetch(`/api/hint/${dateStr}`);
    
    if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || `Failed to get hint: ${response.statusText}`);
    }
    
    const data = await response.json() as HintResponse;
    return data.piece;
}

/**
 * Record that a user started a puzzle
 */
export async function recordStart(date: PuzzleDate): Promise<boolean> {
    let body: any = { month: date.month, day: date.day };
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    const publicKey = await getPublicKey();
    if (publicKey) {
        body = await encryptPayload(body, publicKey);
        headers['X-Encrypted'] = 'true';
    }

    const response = await fetch('/api/stats/start', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });
    
    if (!response.ok) {
        console.error('Failed to record start:', response.statusText);
        return false;
    }
    return true;
}

/**
 * Record that a user completed a puzzle
 */
export async function recordCompletion(date: PuzzleDate, pieces: Piece[]): Promise<boolean> {
    let body: any = { 
        month: date.month, 
        day: date.day,
        pieces 
    };
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    const publicKey = await getPublicKey();
    if (publicKey) {
        body = await encryptPayload(body, publicKey);
        headers['X-Encrypted'] = 'true';
    }

    const response = await fetch('/api/stats/complete', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });
    
    return response.ok;
}
