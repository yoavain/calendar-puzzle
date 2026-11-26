/**
 * The connection of the hint transaction, with the real drizzle transaction over a fake pg client.
 */
import { spendHint } from "../../../src/server/db/hintRepository";
import { pool } from "../../../src/server/db/connection";

jest.mock("../../../src/server/db/connection", () => ({
    db: {},
    pool: { connect: jest.fn() }
}));

const mockConnect = pool.connect as unknown as jest.Mock;

const fakeClient = (failOn?: string) => ({
    query: jest.fn(async (query: string | { text: string }) => {
        const text = typeof query === "string" ? query : query.text;
        if (failOn && text.toLowerCase().startsWith(failOn)) {
            throw new Error("Query read timeout");
        }
        return { rows: [], rowCount: 0 };
    }),
    on: jest.fn(),
    removeListener: jest.fn(),
    release: jest.fn()
});

describe("spendHint connection", () => {
    it("returns the connection to the pool after a commit", async () => {
        const client = fakeClient();
        mockConnect.mockResolvedValue(client);

        await expect(spendHint("u1", 0, 1, 1)).resolves.toMatchObject({ ok: true, hintsUsed: 1 });

        expect(client.release).toHaveBeenCalledTimes(1);
        expect(client.release).toHaveBeenCalledWith();
    });

    it.each(["begin", "select", "insert", "commit"])("destroys the connection when %s fails", async (statement) => {
        const client = fakeClient(statement);
        mockConnect.mockResolvedValue(client);

        await expect(spendHint("u1", 0, 1, 1)).rejects.toThrow();

        expect(client.release).toHaveBeenCalledTimes(1);
        expect(client.release).toHaveBeenCalledWith(true);
    });
});
