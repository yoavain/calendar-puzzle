import type { FastifyInstance } from "fastify";
import type { ErrorResponse, IssueRequest, IssueResponse } from "../../common/restTypes.js";
import { requireAuth } from "../auth/requireAuth.js";
import { issueSchema } from "./schemas.js";
import { submitIssue } from "../service/issueSubmitter.js";
import { API_ISSUE } from "../../common/restPaths.js";

export const registerIssueRoutes = (app: FastifyInstance): void => {
    // POST /api/issue - Submit a bug report or feature request
    app.post<{ Body: IssueRequest; Reply: IssueResponse | ErrorResponse }>(
        API_ISSUE,
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

            try {
                const response = await submitIssue(
                    title,
                    description,
                    type
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
