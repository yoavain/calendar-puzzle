import type { FastifyInstance } from "fastify";
import { db } from "../db/connection.js";
import { userPuzzleStats, users } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { requireAdmin, requireAuth } from "../auth/requireAuth.js";
import { parseDate } from "../utils/dateUtils.js";
import { solvePuzzle } from "../service/solverService.js";
import { dateParamSchema } from "./schemas.js";
import { API_ADMIN_SOLUTION, API_HALL_OF_FAME } from "../../common/restPaths.js";
import type { DatePathParams, ErrorResponse, SolutionResponse, UserDataResponse } from "../../common/restTypes.js";

export const registerAdminRoutes = (app: FastifyInstance): void => {
    // GET /api/admin/solution/:date - Get full puzzle solution for a date (Admin only)
    app.get<{ Params: DatePathParams; Reply: SolutionResponse | ErrorResponse }>(
        API_ADMIN_SOLUTION,
        { 
            preHandler: requireAdmin,
            schema: {
                params: dateParamSchema
            },
            config: {
                rateLimit: {
                    max: 10,
                    timeWindow: "1 minute"
                }
            }
        },
        async (request, reply) => {
            const { date } = request.params;
            const parsed = parseDate(date);

            if (!parsed) {
                return reply.code(400).send({
                    error: "Invalid date format. Expected MM-DD (e.g., 01-15 for January 15th)"
                });
            }

            const { month, day } = parsed;

            try {
                const pieces = await solvePuzzle(month, day, request.log);
                return reply.send({ pieces });
            }
            catch (error) {
                request.log.error(error, `[AdminSolutionRoute] Failed to solve puzzle for ${month}/${day}`);
                return reply.code(500).send({
                    error: "Unable to solve puzzle for this date. Please try again."
                });
            }
        }
    );

    // GET /api/hall-of-fame - Get user activity statistics (Hall of Fame)
    app.get<{ Reply: UserDataResponse | ErrorResponse }>(
        API_HALL_OF_FAME,
        { 
            preHandler: requireAuth,
            config: {
                rateLimit: {
                    max: 5,
                    timeWindow: "1 minute"
                }
            }
        },
        async (request, reply) => {
            try {
                const stats = await db
                    .select({
                        userId: users.id,
                        daysPlayed: sql<number>`count(${userPuzzleStats.userId})`.mapWith(Number),
                        daysSolved: sql<number>`count(${userPuzzleStats.firstCompletedAt})`.mapWith(Number),
                        daysPlayedWithHint: sql<number>`count(CASE WHEN ${userPuzzleStats.hintUsed} THEN 1 END)`.mapWith(Number),
                        daysSolvedWithHint: sql<number>`count(CASE WHEN ${userPuzzleStats.hintUsed} AND ${userPuzzleStats.firstCompletedAt} IS NOT NULL THEN 1 END)`.mapWith(Number)
                    })
                    .from(users)
                    .leftJoin(userPuzzleStats, eq(users.id, userPuzzleStats.userId))
                    .groupBy(users.id)
                    .orderBy(users.id);

                return reply.send({ users: stats });
            }
            catch (error) {
                request.log.error(error, "[AdminUserDataRoute] Failed to fetch user data");
                return reply.code(500).send({ error: "Failed to fetch user activity data" });
            }
        }
    );
};
