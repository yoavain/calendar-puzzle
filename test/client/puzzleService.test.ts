/**
 * @jest-environment jsdom
 */
import { getHint, getHintState, HintRequestError, recordCompletion, saveUserSettings } from "../../src/client/service/puzzleService";
import type { Piece } from "../../src/common/types";

jest.mock("../../src/client/service/logService", () => ({ logToServer: jest.fn() }));

const piece: Piece = { id: 1, position: { x: 0, y: 0 }, isFlippedH: false, isFlippedV: false, rotation: 0 };

const json = (status: number, body: unknown) =>
    ({ ok: status < 400, status, statusText: "", json: async () => body }) as Response;

let routes: Record<string, () => Response>;
const fetchMock = jest.fn(async (url: string) => {
    if (url.includes("/api/auth/public-key")) {
        return json(200, { publicKey: "" }); // falsy key: requests go unencrypted
    }
    if (url.includes("/api/auth/csrf-token")) {
        return json(200, { csrfToken: "csrf" });
    }
    const handler = routes[url];
    if (!handler) {
        throw new Error(`unexpected fetch ${url}`);
    }
    return handler();
});

beforeEach(() => {
    routes = {};
    fetchMock.mockClear();
    global.fetch = fetchMock as unknown as typeof fetch;
});

const bodyOf = (url: string) => {
    const call = fetchMock.mock.calls.find(([u]) => u === url) as unknown as [string, RequestInit];
    return JSON.parse(call[1].body as string);
};

describe("getHint", () => {
    it("sends the hint number and returns pieces and balance", async () => {
        routes["/api/hint"] = () => json(200, { pieces: [piece], tokenBalance: 3 });

        await expect(getHint({ month: 0, day: 1 }, 2)).resolves.toEqual({ pieces: [piece], tokenBalance: 3 });
        expect(bodyOf("/api/hint")).toEqual({ month: 0, day: 1, hintNumber: 2 });
    });

    it("throws HintRequestError with the code and balance on 409", async () => {
        routes["/api/hint"] = () => json(409, { error: "No hint tokens left.", code: "NO_TOKENS", tokenBalance: 0 });

        const error = await getHint({ month: 0, day: 1 }, 2).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(HintRequestError);
        expect(error).toMatchObject({ message: "No hint tokens left.", code: "NO_TOKENS", tokenBalance: 0 });
    });

    it("marks a rate-limited request with status 429", async () => {
        routes["/api/hint"] = () => json(429, { statusCode: 429, error: "Too Many Requests", message: "Rate limit exceeded, retry in 1 minute" });

        const error = await getHint({ month: 0, day: 1 }, 3).catch((e: unknown) => e);
        expect(error).toMatchObject({ code: null, status: 429 });
    });

    it("throws HintRequestError with a null code on 500", async () => {
        routes["/api/hint"] = () => json(500, { error: "boom" });

        const error = await getHint({ month: 0, day: 1 }, 1).catch((e: unknown) => e);
        expect(error).toMatchObject({ message: "boom", code: null, tokenBalance: null });
    });
});

describe("getHintState", () => {
    it("returns every used hint", async () => {
        routes["/api/hint/01-01/state"] = () => json(200, { pieces: [piece, piece] });
        await expect(getHintState({ month: 0, day: 1 })).resolves.toHaveLength(2);
    });

    it("throws on failure, so an error never reads as \"no hints\"", async () => {
        routes["/api/hint/01-01/state"] = () => json(500, { error: "x" });
        await expect(getHintState({ month: 0, day: 1 })).rejects.toThrow();
    });
});

describe("recordCompletion", () => {
    it("reports whether the server granted a token", async () => {
        routes["/api/stats/complete"] = () => json(200, { success: true, tokenGranted: true });
        await expect(recordCompletion({ month: 0, day: 1 }, [piece])).resolves.toEqual({ success: true, tokenGranted: true });
    });

    it("reports failure without a token", async () => {
        routes["/api/stats/complete"] = () => json(400, { error: "Invalid solution" });
        await expect(recordCompletion({ month: 0, day: 1 }, [piece])).resolves.toEqual({ success: false, tokenGranted: false });
    });
});

describe("saveUserSettings", () => {
    it("PATCHes the partial settings and returns the merged result", async () => {
        routes["/api/user/settings"] = () => json(200, { settings: { tokenIntroSeen: true, skipTokenConfirm: true } });

        await expect(saveUserSettings({ skipTokenConfirm: true })).resolves.toEqual({ tokenIntroSeen: true, skipTokenConfirm: true });
        expect(bodyOf("/api/user/settings")).toEqual({ skipTokenConfirm: true });
    });
});
