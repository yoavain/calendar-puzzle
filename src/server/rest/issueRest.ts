import type { FastifyInstance } from "fastify";
import type { IssueRequest, IssueResponse, ErrorResponse } from "../../common/restTypes.js";
import { requireAuth } from "../auth/requireAuth.js";
import { issueSchema } from "./schemas.js";
import type { SessionUser } from "../auth/passport.js";
import { submitIssue } from "../service/issueSubmitter.js";

export const registerIssueRoutes = (app: FastifyInstance): void => {
    // POST /api/issue - Submit a bug report or feature request
    app.post<{ Body: IssueRequest; Reply: IssueResponse | ErrorResponse }>(
        "/api/issue",
        {
            preHandler: requireAuth,
            schema: {
                body: issueSchema
            },
            config: {
                rateLimit: {
                    max: 5,
                    timeWindow: "1 hour"
                }
            }
        },
        async (request, reply) => {
            const { title, description, type } = request.body;
            const user = request.user as SessionUser;

            try {
                const response = await submitIssue(
                    title,
                    description,
                    type,
                    user
                );

                request.log.info({ issueUrl: response.data.html_url }, "GitHub issue created successfully");

                return reply.send({ success: true });
            }
            catch (error) {
                request.log.error(error, "Failed to create GitHub issue");
                return reply.code(500).send({
                    error: "Failed to submit issue. Please try again later."
                });
            }
        }
    );
};
