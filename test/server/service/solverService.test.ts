import type { FastifyBaseLogger } from "fastify";
import { getSolution } from "../../../src/server/db/solutionRepository";
import { getHintPieces } from "../../../src/server/service/solverService";
import { hashString } from "../../../src/server/utils/dateUtils";
import { makeEightPieces } from "../rest/helpers/fixtures";

jest.mock("../../../src/server/db/solutionRepository", () => ({
    getSolution: jest.fn(),
    saveSolution: jest.fn()
}));

jest.mock("../../../src/server/config", () => ({
    config: { paths: { root: "." } }
}));

const log = { info: jest.fn(), error: jest.fn() } as unknown as FastifyBaseLogger;
const mockGetSolution = getSolution as jest.Mock;

describe("getHintPieces", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetSolution.mockResolvedValue(makeEightPieces());
    });

    it("keeps hint #1 on today's formula", async () => {
        const pieces = makeEightPieces();
        const [first] = await getHintPieces(0, 1, 1, log);
        expect(first).toEqual(pieces[hashString("01-01") % 8 % pieces.length]);
    });

    it("steps through the solution from the hashed start index", async () => {
        const pieces = makeEightPieces();
        const start = hashString("01-01") % 8;
        const hints = await getHintPieces(0, 1, 7, log);
        expect(hints).toEqual(Array.from({ length: 7 }, (_, k) => pieces[(start + k) % 8]));
        expect(new Set(hints.map(h => h.id)).size).toBe(7);
    });

    it("returns the same sequence on every call (every player gets the same hints)", async () => {
        expect(await getHintPieces(3, 15, 4, log)).toEqual(await getHintPieces(3, 15, 4, log));
    });

    it("returns [] for count 0 without solving", async () => {
        expect(await getHintPieces(0, 1, 0, log)).toEqual([]);
        expect(mockGetSolution).not.toHaveBeenCalled();
    });
});
