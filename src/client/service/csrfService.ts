import { API_AUTH_CSRF_TOKEN } from "../../common/restPaths.js";

let cachedCsrfToken: string | null = null;
let csrfTokenPromise: Promise<string | null> | null = null;

export const getCsrfToken = async (): Promise<string | null> => {
    if (cachedCsrfToken) {
        return cachedCsrfToken;
    }
    if (csrfTokenPromise) {
        return csrfTokenPromise;
    }

    csrfTokenPromise = (async () => {
        try {
            const response = await fetch(API_AUTH_CSRF_TOKEN, {
                credentials: "include"
            });
            if (response.ok) {
                const data = await response.json();
                cachedCsrfToken = data.csrfToken;
                return cachedCsrfToken;
            }
        }
        catch {
            // Fail silently — cannot call logToServer here (bootstrapping dependency)
        }
        finally {
            csrfTokenPromise = null;
        }
        return null;
    })();

    return csrfTokenPromise;
};

export const clearCsrfToken = (): void => {
    cachedCsrfToken = null;
    csrfTokenPromise = null;
};
