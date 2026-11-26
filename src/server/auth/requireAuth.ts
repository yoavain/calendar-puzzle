import type { FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { EXPECTED_USER_HEADER } from "../../common/restPaths.js";
import { users } from "../db/schema.js";
import type { SessionUser } from "./passport.js";

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
        return reply.code(401).send({ error: "Not authenticated" });
    }
};

/**
 * For routes that read or write the database. After a failed user lookup it answers at once,
 * so one request does not wait for the database a second time.
 */
export const requireDatabaseUser = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
        return reply.code(401).send({ error: "Not authenticated" });
    }
    if (request.databaseUnavailable) {
        // The player sees this text when a hint fails.
        return reply.code(503).send({ error: "Saving is paused. Please try again later." });
    }
};

/**
 * A stored save names its user. The session cookie can belong to someone else by the time it arrives,
 * after a sign-in in another tab. Use after requireDatabaseUser.
 */
export const requireSameUser = async (request: FastifyRequest, reply: FastifyReply) => {
    const expected = request.headers[EXPECTED_USER_HEADER];
    if (expected !== undefined && expected !== (request.user as SessionUser).id) {
        return reply.code(409).send({ error: "Signed in as another account" });
    }
};

export const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
    await requireDatabaseUser(request, reply);
    if (reply.sent) {
        return;
    }

    const user = request.user as SessionUser;
    const [dbUser] = await db.select({ isAdmin: users.isAdmin }).from(users).where(eq(users.id, user.id));
    if (!dbUser?.isAdmin) {
        return reply.code(403).send({ error: "Admin access required" });
    }
};
