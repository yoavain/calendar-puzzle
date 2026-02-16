import { saveSession, loadSession, clearSession } from "../../src/client/hooks/useGameSession";
import type { SessionData } from "../../src/client/hooks/useGameSession";
import type { Piece, PuzzleDate } from "../../src/common/types";

describe("useGameSession", () => {
    const STORAGE_KEY = "calendar-puzzle-session";

    const mockStorage: Record<string, string> = {};
    const localStorageMock = {
        getItem: jest.fn((key: string) => mockStorage[key] ?? null),
        setItem: jest.fn((key: string, value: string) => {
            mockStorage[key] = value; 
        }),
        removeItem: jest.fn((key: string) => {
            delete mockStorage[key]; 
        })
    };

    beforeAll(() => {
        Object.defineProperty(globalThis, "localStorage", {
            value: localStorageMock,
            writable: true
        });
    });

    beforeEach(() => {
        jest.clearAllMocks();
        for (const key of Object.keys(mockStorage)) {
            delete mockStorage[key];
        }
    });

    const makePiece = (id: number): Piece => ({
        id,
        position: null,
        rotation: 0,
        isFlippedH: false,
        isFlippedV: false
    });

    const makeSession = (): SessionData => ({
        date: { month: 0, day: 1 },
        pieces: [makePiece(1), makePiece(2)],
        isSolved: false
    });

    describe("saveSession", () => {
        it("should serialize and store session data", () => {
            const data = makeSession();
            saveSession(data);
            expect(localStorageMock.setItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify(data));
        });

        it("should not throw when localStorage throws", () => {
            localStorageMock.setItem.mockImplementationOnce(() => {
                throw new Error("quota exceeded"); 
            });
            expect(() => saveSession(makeSession())).not.toThrow();
        });
    });

    describe("loadSession", () => {
        it("should return null when no session exists", () => {
            expect(loadSession()).toBeNull();
        });

        it("should return parsed session data", () => {
            const data = makeSession();
            mockStorage[STORAGE_KEY] = JSON.stringify(data);
            const result = loadSession();
            expect(result).toEqual(data);
        });

        it("should return null on corrupted JSON", () => {
            mockStorage[STORAGE_KEY] = "not-valid-json{{{";
            expect(loadSession()).toBeNull();
        });

        it("should return null when getItem throws", () => {
            localStorageMock.getItem.mockImplementationOnce(() => {
                throw new Error("access denied"); 
            });
            expect(loadSession()).toBeNull();
        });
    });

    describe("clearSession", () => {
        it("should remove the storage key", () => {
            mockStorage[STORAGE_KEY] = "something";
            clearSession();
            expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
        });

        it("should not throw when localStorage throws", () => {
            localStorageMock.removeItem.mockImplementationOnce(() => {
                throw new Error("access denied"); 
            });
            expect(() => clearSession()).not.toThrow();
        });
    });
});
