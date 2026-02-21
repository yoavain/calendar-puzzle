import Fastify, { type FastifyInstance } from "fastify";
import type { SessionUser } from "../../../../src/server/auth/passport";

/**
 * Build a lightweight Fastify test server.
 * If `user` is provided, a global preHandler injects it onto every request
 * so that `requireAuth` guards pass without real session/passport setup.
 */
export const buildTestServer = async (
    registerRoutes: (app: FastifyInstance) => void,
    user?: SessionUser
): Promise<FastifyInstance> => {
    const app = Fastify({ logger: false });

    if (user) {
        app.addHook("preHandler", async (request) => {
            (request as any).user = user; // eslint-disable-line @typescript-eslint/no-explicit-any
        });
    }

    registerRoutes(app);
    await app.ready();
    return app;
};
