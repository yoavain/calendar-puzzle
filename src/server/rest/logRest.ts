import type { FastifyInstance } from "fastify";
import type { ErrorResponse, LogRequest } from "../../common/restTypes.js";
import { logSchema } from "./schemas.js";
import { API_LOG } from "../../common/restPaths.js";
import { requireAuth } from "../auth/requireAuth.js";
import type { SessionUser } from "../auth/passport.js";

export const registerLogRoutes = (app: FastifyInstance): void => {
    // POST /api/log - Log client-side errors or info messages
    app.post<{ Body: LogRequest; Reply: { success: true } | ErrorResponse }>(
        API_LOG,
        {
            schema: {
                body: logSchema
            },
            preHandler: requireAuth,
            config: {
                rateLimit: {
                    max: 10,
                    timeWindow: "1 minute"
                }
            }
        },
        async (request, reply) => {
            const { logLevel, message, stack } = request.body;
            const sanitize = (s: string | undefined) => s?.replace(/[\r\n]+/g, " ");

            const logData = {
                clientUser: (request.user as SessionUser).id,
                stack: sanitize(stack),
                userAgent: sanitize(request.headers["user-agent"] as string | undefined),
                ip: request.ip
            };

            if (logLevel === "error") {
                request.log.error(logData, `[ClientError] ${sanitize(message)}`);
            }
            else {
                request.log.info(logData, `[ClientInfo] ${sanitize(message)}`);
            }

            return reply.send({ success: true });
        }
    );
};
