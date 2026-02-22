/**
 * Client-side circular-buffer debug logger.
 *
 * Only active when `?debug=1` is present in the URL.
 * Zero cost in normal usage — all methods are no-ops unless enabled.
 *
 * Usage:
 *   1. Call `debugLogger.init()` once at app startup.
 *   2. Call `debugLogger.log(type, data)` anywhere you want to capture an event.
 *   3. Hit the "Dump Log" button in DebugPanel to download a JSON file.
 */

const MAX_ENTRIES = 2000;

interface LogEntry {
    ts: number;
    type: string;
    data: unknown;
}

let buffer: LogEntry[] = [];
let enabled = false;

export const debugLogger = {
    init: (): void => {
        enabled = new URLSearchParams(location.search).has("debug");
        if (enabled) {
            // eslint-disable-next-line no-console
            console.info("[DebugLogger] enabled — buffer size:", MAX_ENTRIES);
        }
    },

    log: (type: string, data: unknown): void => {
        if (!enabled) {
            return;
        }
        if (buffer.length >= MAX_ENTRIES) {
            buffer.shift();
        }
        buffer.push({ ts: Date.now(), type, data });
    },

    download: (): void => {
        // eslint-disable-next-line n/no-unsupported-features/node-builtins
        const blob = new Blob([JSON.stringify(buffer, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `puzzle-debug-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    clear: (): void => {
        buffer = [];
    },

    count: (): number => buffer.length,

    isEnabled: (): boolean => enabled
};
