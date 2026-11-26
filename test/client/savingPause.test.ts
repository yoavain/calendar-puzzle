/**
 * @jest-environment jsdom
 */
import React from "react";
import type { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { UserProvider, useUser } from "../../src/client/context/UserContext";
import { addPendingSave, hasPendingSave } from "../../src/client/service/pendingSaves";
import { SERVER_FAILURE_EVENT } from "../../src/client/service/serverStatus";

jest.mock("../../src/client/service/logService", () => ({ logToServer: jest.fn() }));

const JUN_10 = { month: 5, day: 10 };
const user = { id: "u1", isAdmin: false };
const unavailable = { user, accountDataAvailable: false };
const available = (completedDates: unknown[] = []) =>
    ({ user, accountDataAvailable: true, completedDates, playedDates: completedDates, tokenBalance: 2, settings: {} });

let me: unknown;
let health: number;
let solved: boolean;

const json = (status: number, body: unknown) => ({ ok: status < 400, status, statusText: "", json: async () => body }) as Response;

const fetchMock = jest.fn(async (url: string) => {
    if (url === "/api/auth/me") {
        // After the pending solve arrives, the server lists it
        return json(200, solved && (me as { accountDataAvailable: boolean }).accountDataAvailable ? available([JUN_10]) : me);
    }
    if (url === "/api/health") {
        return json(health, {});
    }
    if (url === "/api/stats/complete") {
        solved = true;
        return json(200, { success: true, tokenGranted: true });
    }
    if (url === "/api/auth/public-key") {
        return json(200, { publicKey: "" });
    }
    return json(200, { csrfToken: "csrf" });
});

const wrapper = ({ children }: { children: ReactNode }) => React.createElement(UserProvider, null, children);

const settle = () => act(async () => {
    await jest.advanceTimersByTimeAsync(0);
});
const wait = (ms: number) => act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
});

const renderUser = async () => {
    const hook = renderHook(() => useUser(), { wrapper });
    await settle();
    return hook;
};

describe("saving paused", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        localStorage.clear();
        fetchMock.mockClear();
        global.fetch = fetchMock as unknown as typeof fetch;
        window.history.replaceState(null, "", "/");
        me = available();
        health = 200;
        solved = false;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("starts paused, and signed in, when the account data is not available", async () => {
        me = unavailable;

        const { result } = await renderUser();

        expect(result.current.user).toEqual(user);
        expect(result.current.savingPaused).toBe(true);
        expect(result.current.savingNotice).toBe("paused");
    });

    it("recovers: sends the pending solve, then reads the account again", async () => {
        me = unavailable;
        health = 503;
        addPendingSave({ userId: "u1", date: JUN_10, kind: "complete", pieces: [] });
        const { result } = await renderUser();

        await wait(30_000);
        expect(result.current.savingPaused).toBe(true);
        expect(hasPendingSave("u1", "complete", JUN_10)).toBe(true);

        health = 200;
        me = available();
        await wait(30_000);

        expect(result.current.savingPaused).toBe(false);
        expect(result.current.savingNotice).toBe("back-saved");
        expect(result.current.completedDates).toContainEqual(JUN_10);
        expect(result.current.sentSolves).toContainEqual(JUN_10);
        expect(hasPendingSave("u1", "complete", JUN_10)).toBe(false);
    });

    it("stays signed in when the account read fails during recovery", async () => {
        me = unavailable;
        const { result } = await renderUser();

        fetchMock.mockImplementationOnce(async () => json(200, {}));
        fetchMock.mockImplementationOnce(async () => json(500, {}));
        await wait(30_000);

        expect(result.current.user).toEqual(user);
        expect(result.current.savingPaused).toBe(true);
    });

    it("pauses after a failed call when health answers 503, and keeps the data on screen", async () => {
        me = available([JUN_10]);
        const { result } = await renderUser();

        health = 503;
        act(() => {
            window.dispatchEvent(new CustomEvent(SERVER_FAILURE_EVENT));
        });
        await settle();

        expect(result.current.savingPaused).toBe(true);
        expect(result.current.completedDates).toEqual([JUN_10]);
        expect(result.current.tokenBalance).toBe(2);
    });

    it("keeps the notice about a deferred solve when the pause is detected just after it", async () => {
        const { result } = await renderUser();

        // The order in the app: the solve fails, then health confirms the outage
        health = 503;
        act(() => {
            window.dispatchEvent(new CustomEvent(SERVER_FAILURE_EVENT));
            result.current.showSavingNotice("solved-paused");
        });
        await settle();

        expect(result.current.savingPaused).toBe(true);
        expect(result.current.savingNotice).toBe("solved-paused");
    });

    it("checks once more when the first health answer is still good", async () => {
        const { result } = await renderUser();

        act(() => {
            window.dispatchEvent(new CustomEvent(SERVER_FAILURE_EVENT));
        });
        await settle();
        expect(result.current.savingPaused).toBe(false);

        health = 503;
        await wait(11_000);

        expect(result.current.savingPaused).toBe(true);
    });

    it("never pauses an anonymous visitor", async () => {
        me = { user: null, accountDataAvailable: true, completedDates: [], playedDates: [], tokenBalance: 0, settings: {} };
        const { result } = await renderUser();

        health = 503;
        act(() => {
            window.dispatchEvent(new CustomEvent(SERVER_FAILURE_EVENT));
        });
        await settle();

        expect(result.current.savingPaused).toBe(false);
        expect(result.current.savingNotice).toBeNull();
    });

    it.each([
        ["auth_unavailable", "signin-failed"],
        ["auth_failed", null]
    ])("after sign-in code %s shows the notice %s and removes the code", async (code, notice) => {
        window.history.replaceState(null, "", `/?error=${code}`);

        const { result } = await renderUser();

        expect(result.current.savingNotice).toBe(notice);
        expect(window.location.search).toBe("");
    });
});
