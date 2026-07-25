import type { Page } from "@playwright/test";
import type { LayoutKind } from "../fixtures/gamePage";

// ─── Layout detection ────────────────────────────────────────

export function layoutFromProject(projectName: string | undefined): LayoutKind {
    if (projectName?.includes("portrait")) {
        return "mobile-portrait";
    }
    if (projectName?.includes("landscape")) {
        return "mobile-landscape";
    }
    return "desktop";
}

// ─── Date mocking via addInitScript ──────────────────────────

/**
 * Mock `new Date()` and `Date.now()` to return a fixed date WITHOUT
 * interfering with setTimeout / setInterval / requestAnimationFrame.
 *
 * This is safer than `page.clock.install()` which freezes all timers
 * and breaks React rendering & @dnd-kit activation delays.
 */
export async function mockDate(page: Page, fakeDate: Date) {
    const ts = fakeDate.getTime();
    await page.addInitScript((timestamp: number) => {
        const RealDate = globalThis.Date;


        function FakeDate(this: any, ...args: any[]) {
            if (new.target) {
                // Called with `new Date(...)`
                if (args.length === 0) {
                    return new RealDate(timestamp);
                }
                // @ts-expect-error – spread into constructor
                return new RealDate(...args);
            }
            // Called as `Date()` without new
            return new RealDate(timestamp).toString();
        }

        FakeDate.prototype = RealDate.prototype;
        FakeDate.now = () => timestamp;
        FakeDate.parse = RealDate.parse.bind(RealDate);
        FakeDate.UTC = RealDate.UTC.bind(RealDate);


        (globalThis as any).Date = FakeDate;
    }, ts);
}

// ─── API route mocking ───────────────────────────────────────

export interface MockApiOptions {
    /**
     * Body to return from `/api/auth/me` as a signed-in session, e.g.
     * `{ user, completedDates, playedDates }`. Omit to stay logged out.
     */
    authMe?: unknown;
}

/**
 * Mock all /api/* routes so the app doesn't hit the real backend.
 * Returns sensible defaults for auth, CSRF, logging, etc.
 */
export async function mockApiRoutes(page: Page, options: MockApiOptions = {}) {
    await page.route("**/api/**", async (route) => {
        const url = route.request().url();
        if (url.includes("/api/auth/me")) {
            if (options.authMe) {
                await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(options.authMe) });
            }
            else {
                // Not logged in
                await route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "Unauthorized" }) });
            }
        }
        else if (url.includes("/api/auth/csrf-token")) {
            await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ csrfToken: "mock-csrf" }) });
        }
        else if (url.includes("/api/auth/public-key")) {
            await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ publicKey: "" }) });
        }
        else if (url.includes("/api/log")) {
            await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
        }
        else {
            // Fallback: 200 with empty JSON for any other API call
            await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
        }
    });
}

// ─── Storage clearing ────────────────────────────────────────

/**
 * Clear localStorage and sessionStorage via addInitScript to
 * prevent stale state from previous test runs.
 */
export async function clearStorage(page: Page) {
    await page.addInitScript(() => {
        try {
            localStorage.clear();
        }
        catch { /* noop */ }
        try {
            sessionStorage.clear();
        }
        catch { /* noop */ }
    });
}
