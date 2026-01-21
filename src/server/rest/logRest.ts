import type { FastifyInstance } from "fastify";
import type { ErrorResponse, LogRequest } from "../../common/restTypes.js";
import { logSchema } from "./schemas.js";
import { API_LOG } from "../../common/restPaths.js";

export const registerLogRoutes = (app: FastifyInstance): void => {
    // POST /api/log - Log client-side errors or info messages
    // Unauthenticated API, protected by rate limiting
    app.post<{ Body: LogRequest; Reply: { success: true } | ErrorResponse }>(
        API_LOG,
        {
            schema: {
                body: logSchema
            },
            config: {
                rateLimit: {
                    max: 10,
                    timeWindow: "1 minute"
                }
            }
        },
        async (request, reply) => {
            const { user, logLevel, message, stack } = request.body;

            const logData = {
                clientUser: user,
                stack,
                userAgent: request.headers["user-agent"],
                ip: request.ip
            };

            if (logLevel === "error") {
                request.log.error(logData, `[ClientError] ${message}`);
            }
            else {
                request.log.info(logData, `[ClientInfo] ${message}`);
            }

            return reply.send({ success: true });
        }
    );
};
