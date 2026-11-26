/**
 * @jest-environment jsdom
 */
import { readStorage, writeStorage } from "../../src/client/utils/safeStorage";
import { debugLogger } from "../../src/client/utils/debugLogger";

describe("safeStorage with blocked storage", () => {
    beforeEach(() => {
        const blocked = () => {
            throw new DOMException("blocked", "SecurityError");
        };
        jest.spyOn(Storage.prototype, "getItem").mockImplementation(blocked);
        jest.spyOn(Storage.prototype, "setItem").mockImplementation(blocked);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("reads nothing and ignores writes", () => {
        expect(readStorage("theme")).toBeNull();
        expect(() => writeStorage("theme", "dark")).not.toThrow();
    });

    it("lets the app start", () => {
        expect(() => debugLogger.init()).not.toThrow();
    });
});
