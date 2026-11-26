/**
 * `localStorage` throws when the browser blocks storage, which can happen to a frame on another site.
 * These calls keep the game running. A value then lasts for the current visit only.
 */
export const readStorage = (key: string): string | null => {
    try {
        return localStorage.getItem(key);
    }
    catch {
        return null;
    }
};

export const writeStorage = (key: string, value: string): void => {
    try {
        localStorage.setItem(key, value);
    }
    catch {
        // Without storage, the value is not kept
    }
};
