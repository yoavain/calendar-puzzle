import type { FastifyInstance } from "fastify";
import { db } from "../db/connection.js";
import { userPuzzleStats } from "../db/schema.js";
import { isNull } from "drizzle-orm";
import type { SessionUser } from "../auth/passport.js";
import { requireAuth } from "../auth/requireAuth.js";
import { puzzleSolvedForDate } from "../../common/gameLogic.js";
import { statsCompleteSchema, statsStartSchema } from "./schemas.js";
import { submitInvalidSolutionReport } from "../service/issueSubmitter.js";
import { API_STATS_COMPLETE, API_STATS_START } from "../../common/restPaths.js";
import type { CompletePuzzleRequest, ErrorResponse, StartPuzzleRequest, SuccessResponse } from "../../common/restTypes.js";

export const registerStatsRoutes = (app: FastifyInstance): void => {
    // Record that a user started a puzzle
    app.post<{ Body: StartPuzzleRequest; Reply: SuccessResponse | ErrorResponse }>(
        API_STATS_START,
        { 
            preHandler: requireAuth,
            schema: {
                body: statsStartSchema
            },
            config: {
                rateLimit: {
                    max: 10,
                    timeWindow: "1 minute"
                }
            }
        },
        async (request, reply) => {
            const { month, day } = request.body;
            const user = request.user as SessionUser;

            try {
                // Upsert to record the first started time
                await db.insert(userPuzzleStats)
                    .values({
                        userId: user.id,
                        month,
                        day,
                        firstStartedAt: new Date()
                    })
                    .onConflictDoNothing(); // If already exists, do nothing (keep original firstStartedAt)

                return { success: true };
            }
            catch (error) {
                request.log.error(error, "[StatsRoute] Failed to record start");
                return reply.code(500).send({ error: "Failed to record progress" });
            }
        }
    );

    // Record that a user completed a puzzle (with server-side validation)
    app.post<{ Body: CompletePuzzleRequest; Reply: SuccessResponse | ErrorResponse }>(
        API_STATS_COMPLETE,
        { 
            preHandler: requireAuth,
            schema: {
                body: statsCompleteSchema
            },
            config: {
                rateLimit: {
                    max: 5,
                    timeWindow: "1 minute"
                }
            }
        },
        async (request, reply) => {
            const { month, day, pieces } = request.body;
            const user = request.user as SessionUser;

            try {
                // 1. Validate the solution on the server directly using pieces
                const solvedDate = puzzleSolvedForDate(pieces);
                const isValid = solvedDate && solvedDate.month === month && solvedDate.day === day;

                if (isValid) {
                    // 2. Record completion in DB
                    await db.insert(userPuzzleStats)
                        .values({
                            userId: user.id,
                            month,
                            day,
                            firstStartedAt: new Date(), // Fallback if /start wasn't called
                            firstCompletedAt: new Date()
                        })
                        .onConflictDoUpdate({
                            target: [userPuzzleStats.userId, userPuzzleStats.month, userPuzzleStats.day],
                            set: {
                                firstCompletedAt: new Date()
                            },
                            where: isNull(userPuzzleStats.firstCompletedAt)
                        });

                    return { success: true };
                }
                else {
                    // Automatically report a bug to GitHub if a solution fails server-side validation
                    try {
                        const actualDateFound = solvedDate;

                        await submitInvalidSolutionReport(
                            pieces,
                            { month, day },
                            actualDateFound,
                            user
                        );

                        request.log.info({ userId: user.id, targetDate: `${month + 1}/${day}` }, "Automated bug report created for invalid solution");
                    }
                    catch (githubError) {
                        request.log.error(githubError, "[StatsRoute] Failed to report bug to GitHub");
                    }

                    return reply.code(400).send({ error: "Invalid solution" });
                }
            }
            catch (error) {
                request.log.error(error, "[StatsRoute] Failed to validate or record completion");
                return reply.code(500).send({ error: "Failed to record completion" });
            }
        }
    );
};
