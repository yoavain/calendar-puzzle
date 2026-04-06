import type { EncryptedPayload, Piece, PuzzleDate } from "../../common/types";
import type {
    CompletePuzzleRequest,
    ErrorResponse,
    HintRequest,
    HintResponse,
    HintStateResponse,
    IssueRequest,
    SolutionResponse,
    StartPuzzleRequest,
    UserActivity,
    UserDataResponse
} from "../../common/restTypes";
import { encryptPayload } from "../utils/encryption.js";
import { logToServer } from "./logService.js";
import { getCsrfToken, clearCsrfToken } from "./csrfService.js";
import {
    API_AUTH_PUBLIC_KEY,
    API_HALL_OF_FAME,
    API_HINT,
    API_ISSUE,
    API_STATS_COMPLETE,
    API_STATS_START,
    getAdminSolutionPath,
    getHintStatePath
} from "../../common/restPaths.js";

let cachedPublicKey: string | null = null;

/**
 * Custom fetch wrapper to handle 401s and other global concerns.
 * On a 403, if the request carried a CSRF token, the cache is cleared,
 * a fresh token is fetched, and the request is retried once.
 */
const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const response = await fetch(url, options);

    if (response.status === 401) {
        window.dispatchEvent(new CustomEvent("app:unauthorized"));
    }

    const headers = options.headers as Record<string, string> | undefined;
    if (response.status === 403 && headers?.["X-CSRF-Token"]) {
        clearCsrfToken();
        const freshToken = await getCsrfToken();
        if (freshToken) {
            const retryHeaders = { ...headers, "X-CSRF-Token": freshToken };
            const retryResponse = await fetch(url, { ...options, headers: retryHeaders });
            if (retryResponse.status === 401) {
                window.dispatchEvent(new CustomEvent("app:unauthorized"));
            }
            return retryResponse;
        }
    }

    return response;
};

/**
 * Fetches the server's public key once for encryption.
 */
const getPublicKey = async (): Promise<string | null> => {
    if (cachedPublicKey) {
        return cachedPublicKey;
    }
    try {
        const response = await apiFetch(API_AUTH_PUBLIC_KEY, {
            credentials: "include"
        });
        if (response.ok) {
            const data = await response.json();
            cachedPublicKey = data.publicKey;
            return cachedPublicKey;
        }
    }
    catch (error) {
        logToServer("error", "Failed to fetch public key", error);
    }
    return null;
};

/**
 * Get the full puzzle solution for a specific date (Admin only)
 */
export const getSolution = async (date: PuzzleDate): Promise<Piece[]> => {
    const response = await apiFetch(getAdminSolutionPath(date), {
        credentials: "include"
    });
    
    if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || `Failed to get solution: ${response.statusText}`);
    }
    
    const data = await response.json() as SolutionResponse;
    return data.pieces;
};

/**
 * Get a hint (single piece placement) for a specific date
 * This records hint usage in the database.
 */
export const getHint = async (date: PuzzleDate): Promise<Piece> => {
    let body: HintRequest | EncryptedPayload = { month: date.month, day: date.day };
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    const publicKey = await getPublicKey();
    if (publicKey) {
        body = await encryptPayload(body, publicKey);
        headers["X-Encrypted"] = "true";
    }

    const csrfToken = await getCsrfToken();
    if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
    }

    const response = await apiFetch(API_HINT, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
        credentials: "include"
    });
    
    if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || `Failed to get hint: ${response.statusText}`);
    }
    
    const data = await response.json() as HintResponse;
    return data.piece;
};

/**
 * Check if a hint was already used for a specific date
 */
export const getHintState = async (date: PuzzleDate): Promise<Piece | null> => {
    const response = await apiFetch(getHintStatePath(date), {
        credentials: "include"
    });
    
    if (!response.ok) {
        return null;
    }
    
    const data = await response.json() as HintStateResponse;
    return data.piece;
};

/**
 * Record that a user started a puzzle
 */
export const recordStart = async (date: PuzzleDate): Promise<boolean> => {
    let body: StartPuzzleRequest | EncryptedPayload = { month: date.month, day: date.day };
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    const publicKey = await getPublicKey();
    if (publicKey) {
        body = await encryptPayload(body, publicKey);
        headers["X-Encrypted"] = "true";
    }

    const csrfToken = await getCsrfToken();
    if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
    }

    const response = await apiFetch(API_STATS_START, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        credentials: "include"
    });
    
    if (!response.ok) {
        return false;
    }
    return true;
};

/**
 * Record that a user completed a puzzle
 */
export const recordCompletion = async (date: PuzzleDate, pieces: Piece[]): Promise<boolean> => {
    let body: CompletePuzzleRequest | EncryptedPayload = { 
        month: date.month, 
        day: date.day,
        pieces 
    };
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    const publicKey = await getPublicKey();
    if (publicKey) {
        body = await encryptPayload(body, publicKey);
        headers["X-Encrypted"] = "true";
    }

    const csrfToken = await getCsrfToken();
    if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
    }

    const response = await apiFetch(API_STATS_COMPLETE, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        credentials: "include"
    });
    
    return response.ok;
};

/**
 * Submit a bug report or feature request
 */
export const submitIssue = async (issue: IssueRequest): Promise<boolean> => {
    let body: IssueRequest | EncryptedPayload = issue;
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    const publicKey = await getPublicKey();
    if (publicKey) {
        body = await encryptPayload(body, publicKey);
        headers["X-Encrypted"] = "true";
    }

    const csrfToken = await getCsrfToken();
    if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
    }

    const response = await apiFetch(API_ISSUE, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        credentials: "include"
    });
    
    return response.ok;
};

/**
 * Fetch all user activity statistics (Hall of Fame)
 */
export const getUserActivity = async (): Promise<UserActivity[]> => {
    const response = await apiFetch(API_HALL_OF_FAME, {
        credentials: "include"
    });

    if (!response.ok) {
        const errorData = await response.json() as ErrorResponse;
        throw new Error(errorData.error || `Failed to fetch user activity: ${response.statusText}`);
    }

    const data = await response.json() as UserDataResponse;
    return data.users;
};
