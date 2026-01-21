import type { LogRequest } from "../../common/restTypes";
import { API_LOG } from "../../common/restPaths.js";

/**
 * Sends a log message to the server for centralized logging.
 * 
 * @param logLevel The severity of the log
 * @param message The main log message
 * @param error Optional error object to extract stack trace from
 * @param user Optional user identifier, defaults to "anonymous"
 */
export const logToServer = (
    logLevel: "error" | "info",
    message: string,
    error?: unknown,
    user: string = "anonymous"
): void => {
    try {
        const logRequest: LogRequest = {
            user,
            logLevel,
            message,
            stack: error instanceof Error ? error.stack : undefined
        };

        // Fire and forget to avoid blocking UI or creating hanging promises if not awaited
        fetch(API_LOG, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(logRequest)
        }).catch(() => {
            // Fail silently to avoid infinite loops or console noise
        });
    }
    catch (err) {
        // Fail silently to avoid infinite loops if logging itself fails
    }
};
