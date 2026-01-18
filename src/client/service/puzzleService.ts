import { Piece, PuzzleDate, EncryptedPayload } from '../../common/types';
import { SolutionResponse, HintResponse, ErrorResponse, StartPuzzleRequest, CompletePuzzleRequest } from '../../common/restTypes';
import { encryptPayload } from '../utils/encryption.js';

let cachedPublicKey: string | null = null;
let cachedCsrfToken: string | null = null;
let csrfTokenPromise: Promise<string | null> | null = null;

/**
 * Fetches the server's public key once for encryption.
 */
async function getPublicKey(): Promise<string | null> {
    if (cachedPublicKey) return cachedPublicKey;
    try {
        const response = await fetch('/api/auth/public-key', {
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            cachedPublicKey = data.publicKey;
            return cachedPublicKey;
        }
    } catch (error) {
        // Silently fail or handle error as needed
    }
    return null;
}

/**
 * Fetches a CSRF token from the server.
 */
export async function getCsrfToken(): Promise<string | null> {
    if (cachedCsrfToken) return cachedCsrfToken;
    if (csrfTokenPromise) return csrfTokenPromise;

    csrfTokenPromise = (async () => {
        try {
            const response = await fetch('/api/auth/csrf-token', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                cachedCsrfToken = data.csrfToken;
                return cachedCsrfToken;
            }
        } catch (error) {
            // Failed to fetch CSRF token
        } finally {
            csrfTokenPromise = null;
        }
        return null;
    })();

    return csrfTokenPromise;
}

/**
 * Clears the cached CSRF token (useful after logout)
 */
export function clearCsrfToken(): void {
    cachedCsrfToken = null;
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
    const response = await fetch(`/api/solution/${dateStr}`, {
        credentials: 'include'
    });
    
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
    const response = await fetch(`/api/hint/${dateStr}`, {
        credentials: 'include'
    });
    
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
    let body: StartPuzzleRequest | EncryptedPayload = { month: date.month, day: date.day };
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    const publicKey = await getPublicKey();
    if (publicKey) {
        body = await encryptPayload(body, publicKey);
        headers['X-Encrypted'] = 'true';
    }

    const csrfToken = await getCsrfToken();
    if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch('/api/stats/start', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        credentials: 'include'
    });
    
    if (!response.ok) {
        return false;
    }
    return true;
}

/**
 * Record that a user completed a puzzle
 */
export async function recordCompletion(date: PuzzleDate, pieces: Piece[]): Promise<boolean> {
    let body: CompletePuzzleRequest | EncryptedPayload = { 
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

    const csrfToken = await getCsrfToken();
    if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch('/api/stats/complete', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        credentials: 'include'
    });
    
    return response.ok;
}
