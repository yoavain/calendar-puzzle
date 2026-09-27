import type { FastifyInstance } from "fastify";
import { buildTestServer } from "./helpers/buildTestServer";
import { mockUser } from "./helpers/fixtures";
import { registerUserRoutes } from "../../../src/server/rest/userRest";
import { db } from "../../../src/server/db/connection";

jest.mock("../../../src/server/db/connection", () => ({
    db: {
        update: jest.fn()
    }
}));

const mockUpdate = db.update as jest.Mock;

const patchSettings = (server: FastifyInstance, payload: object) =>
    server.inject({
        method: "PATCH",
        url: "/api/user/settings",
        headers: { "content-type": "application/json" },
        payload
    });

describe("userRest", () => {
    let unauthServer: FastifyInstance;
    let authServer: FastifyInstance;
    let set: jest.Mock;

    beforeAll(async () => {
        unauthServer = await buildTestServer(registerUserRoutes);
        authServer = await buildTestServer(registerUserRoutes, mockUser);
    });

    afterAll(async () => {
        await unauthServer.close();
        await authServer.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        set = jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([{ settings: { skipTokenConfirm: true } }])
            })
        });
        mockUpdate.mockReturnValue({ set });
    });

    it("returns 401 when not authenticated", async () => {
        const res = await patchSettings(unauthServer, { skipTokenConfirm: true });
        expect(res.statusCode).toBe(401);
    });

    it("saves a known setting and returns the merged settings", async () => {
        const res = await patchSettings(authServer, { skipTokenConfirm: true });

        expect(res.statusCode).toBe(200);
        expect(res.json()).toEqual({ settings: { skipTokenConfirm: true } });
        expect(set).toHaveBeenCalledTimes(1);
    });

    it("returns 400 when no known setting is sent (unknown keys are stripped)", async () => {
        const res = await patchSettings(authServer, { isAdmin: true });

        expect(res.statusCode).toBe(400);
        expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("returns 400 for a non-boolean value", async () => {
        const res = await patchSettings(authServer, { tokenIntroSeen: "maybe" });
        expect(res.statusCode).toBe(400);
    });

    it("returns 500 when the update throws", async () => {
        mockUpdate.mockImplementation(() => {
            throw new Error("db down");
        });
        const res = await patchSettings(authServer, { tokenIntroSeen: true });
        expect(res.statusCode).toBe(500);
    });
});
