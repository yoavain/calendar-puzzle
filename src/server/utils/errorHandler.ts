import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { AUTH_GOOGLE_CALLBACK, SIGN_IN_ERROR } from "../../common/restPaths.js";

/**
 * Keeps internals out of responses: a failed query carries its SQL and parameters in the message.
 * 4xx messages are written for the caller and pass through.
 */
export const errorHandler = (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    // The browser navigates here from Google, so an error must lead back to the game.
    if (request.routeOptions.url === AUTH_GOOGLE_CALLBACK) {
        request.log.error(error, "[Auth] Sign-in failed");
        return reply.redirect(`/?error=${SIGN_IN_ERROR.unavailable}`);
    }

    const status = error.statusCode ?? 500;
    if (status < 500) {
        return reply.send(error);
    }

    request.log.error(error, "[Server] Request failed");
    return reply.code(status).send({ error: "Internal Server Error" });
};
