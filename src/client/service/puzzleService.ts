import type { EncryptedPayload, Piece, PuzzleDate } from "../../common/types";
import type {
    CompletePuzzleRequest,
    CompletePuzzleResponse,
    ErrorResponse,
    HintErrorResponse,
    HintRequest,
    HintResponse,
    HintStateResponse,
    IssueRequest,
    SolutionResponse,
    StartPuzzleRequest,
    UserActivity,
    UserDataResponse,
    UserSettings,
    UserSettingsResponse
} from "../../common/restTypes";
import type { HintErrorCode } from "../../common/hintTokens";
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
    API_USER_SETTINGS,
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

/** Build headers for a JSON write: optional encryption, plus the CSRF token. */
const prepareWrite = async <T extends object>(payload: T): Promise<{ body: T | EncryptedPayload; headers: Record<string, string> }> => {
    let body: T | EncryptedPayload = payload;
    const headers: Record<string, string> = { "Content-Type": "application/json" };

    const publicKey = await getPublicKey();
    if (publicKey) {
        body = await encryptPayload(payload, publicKey);
        headers["X-Encrypted"] = "true";
    }

    const csrfToken = await getCsrfToken();
    if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
    }
    return { body, headers };
};

/** A hint request the server refused (409 carries a code) or failed. */
export class HintRequestError extends Error {
    readonly code: HintErrorCode | null;
    readonly tokenBalance: number | null;
    /** HTTP status, when the server answered (429 = rate limited) */
    readonly status: number | null;

    constructor(message: string, code: HintErrorCode | null, tokenBalance: number | null, status: number | null = null) {
        super(message);
        this.name = "HintRequestError";
        this.code = code;
        this.tokenBalance = tokenBalance;
        this.status = status;
    }
}

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
 * Request hint #hintNumber for a date. Hint #2 and later spend a token.
 * Returns every hint so far, in order, and the new balance.
 */
export const getHint = async (date: PuzzleDate, hintNumber: number): Promise<HintResponse> => {
    const { body, headers } = await prepareWrite<HintRequest>({ month: date.month, day: date.day, hintNumber });

    const response = await apiFetch(API_HINT, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
        credentials: "include"
    });

    if (!response.ok) {
        const errorData = await response.json() as Partial<HintErrorResponse>;
        throw new HintRequestError(
            errorData.error || `Failed to get hint: ${response.statusText}`,
            errorData.code ?? null,
            errorData.tokenBalance ?? null,
            response.status
        );
    }

    return await response.json() as HintResponse;
};

/**
 * Every hint the user has already used for a date ([] if none).
 * Throws on failure: callers must never read an error as "no hints".
 */
export const getHintState = async (date: PuzzleDate): Promise<Piece[]> => {
    const response = await apiFetch(getHintStatePath(date), {
        credentials: "include"
    });

    if (!response.ok) {
        throw new Error(`Failed to load hint state: ${response.statusText}`);
    }

    const data = await response.json() as HintStateResponse;
    return data.pieces;
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
export const recordCompletion = async (date: PuzzleDate, pieces: Piece[]): Promise<{ success: boolean; tokenGranted: boolean }> => {
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
    
    if (!response.ok) {
        return { success: false, tokenGranted: false };
    }
    const data = await response.json() as CompletePuzzleResponse;
    return { success: true, tokenGranted: data.tokenGranted === true };
};

/**
 * Merge known settings into the user's stored settings
 */
export const saveUserSettings = async (patch: UserSettings): Promise<UserSettings> => {
    const { body, headers } = await prepareWrite(patch);

    const response = await apiFetch(API_USER_SETTINGS, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
        credentials: "include"
    });

    if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.statusText}`);
    }
    const data = await response.json() as UserSettingsResponse;
    return data.settings;
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
