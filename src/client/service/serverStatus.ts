import { API_HEALTH } from "../../common/restPaths.js";

/** Dispatched on window when an API call gets a 5xx answer or no answer. */
export const SERVER_FAILURE_EVENT = "app:server-failure";

/**
 * "down" only when the server says so. Any other failure, an offline browser included, is "unknown".
 */
export const getDatabaseStatus = async (): Promise<"ok" | "down" | "unknown"> => {
    try {
        const response = await fetch(API_HEALTH, { cache: "no-store" });
        if (response.status === 503) {
            return "down";
        }
        return response.ok ? "ok" : "unknown";
    }
    catch {
        return "unknown";
    }
};
