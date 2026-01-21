import type { PuzzleDate } from "./types.js";

/**
 * Authentication paths
 */
export const AUTH_GOOGLE = "/auth/google";
export const AUTH_GOOGLE_CALLBACK = "/auth/google/callback";
export const AUTH_LOGOUT = "/auth/logout";
export const API_AUTH_ME = "/api/auth/me";
export const API_AUTH_PUBLIC_KEY = "/api/auth/public-key";
export const API_AUTH_CSRF_TOKEN = "/api/auth/csrf-token";

/**
 * Admin paths
 */
export const API_ADMIN_USERDATA = "/api/admin/userdata";
export const API_ADMIN_SOLUTION = "/api/admin/solution/:date";

/**
 * Hint paths
 */
export const API_HINT = "/api/hint";
export const API_HINT_STATE = "/api/hint/:date/state";

/**
 * Stats paths
 */
export const API_STATS_START = "/api/stats/start";
export const API_STATS_COMPLETE = "/api/stats/complete";

/**
 * Issue & Logging paths
 */
export const API_ISSUE = "/api/issue";
export const API_LOG = "/api/log";

/**
 * Health path
 */
export const API_HEALTH = "/api/health";

/**
 * Helper to format a PuzzleDate object into the API date string format (MM-DD)
 */
const formatDateObjForPath = (date: PuzzleDate): string => {
    const m = String(date.month + 1).padStart(2, "0");
    const d = String(date.day).padStart(2, "0");
    return `${m}-${d}`;
};

/**
 * Helper to build the admin solution path for a specific date
 */
export const getAdminSolutionPath = (date: PuzzleDate): string => {
    return API_ADMIN_SOLUTION.replace(":date", formatDateObjForPath(date));
};

/**
 * Helper to build the hint state path for a specific date
 */
export const getHintStatePath = (date: PuzzleDate): string => {
    return API_HINT_STATE.replace(":date", formatDateObjForPath(date));
};
