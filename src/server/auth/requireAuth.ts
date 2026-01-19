import type { FastifyRequest, FastifyReply } from "fastify";
import type { SessionUser } from "./passport.js";

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
        return reply.code(401).send({ error: "Not authenticated" });
    }
};

export const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(request, reply);
    if (reply.sent) {
        return;
    }

    const user = request.user as SessionUser;
    if (!user.isAdmin) {
        return reply.code(403).send({ error: "Admin access required" });
    }
};
