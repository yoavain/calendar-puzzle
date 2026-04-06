import type { LogRequest } from "../../common/restTypes";
import { API_LOG } from "../../common/restPaths.js";
import { getCsrfToken } from "./csrfService.js";

/**
 * Sends a log message to the server for centralized logging.
 *
 * @param logLevel The severity of the log
 * @param message The main log message
 * @param error Optional error object to extract stack trace from
 */
export const logToServer = (
    logLevel: "error" | "info",
    message: string,
    error?: unknown
): void => {
    try {
        const logRequest: LogRequest = {
            logLevel,
            message,
            stack: error instanceof Error ? error.stack : undefined
        };

        // Fire and forget to avoid blocking UI or creating hanging promises if not awaited
        (async () => {
            try {
                const headers: Record<string, string> = {
                    "Content-Type": "application/json"
                };
                const csrfToken = await getCsrfToken();
                if (csrfToken) {
                    headers["X-CSRF-Token"] = csrfToken;
                }
                await fetch(API_LOG, {
                    method: "POST",
                    headers,
                    body: JSON.stringify(logRequest),
                    credentials: "include"
                });
            }
            catch {
                // Fail silently to avoid infinite loops or console noise
            }
        })();
    }
    catch {
        // Fail silently to avoid infinite loops if logging itself fails
    }
};
