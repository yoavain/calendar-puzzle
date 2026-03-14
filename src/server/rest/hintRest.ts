import type { FastifyInstance } from "fastify";
import type { DatePathParams, ErrorResponse, HintRequest, HintResponse, HintStateResponse } from "../../common/restTypes.js";
import { parseDate } from "../utils/dateUtils.js";
import { getHintPiece } from "../service/solverService.js";
import { requireAuth } from "../auth/requireAuth.js";
import { dateParamSchema, statsStartSchema } from "./schemas.js";
import { db } from "../db/connection.js";
import { userPuzzleStats } from "../db/schema.js";
import { and, eq } from "drizzle-orm";
import type { SessionUser } from "../auth/passport.js";
import { API_HINT, API_HINT_STATE } from "../../common/restPaths.js";

export const registerHintRoutes = (app: FastifyInstance): void => {
    // PUT /api/hint - Get a hint and record usage
    app.put<{ Body: HintRequest; Reply: HintResponse | ErrorResponse }>(
        API_HINT,
        { 
            preHandler: requireAuth,
            schema: {
                body: statsStartSchema
            },
            config: {
                rateLimit: {
                    max: 5,
                    timeWindow: "1 minute"
                }
            }
        },
        async (request, reply) => {
            const { month, day } = request.body;
            const user = request.user as SessionUser;

            try {
                // 1. Record hint usage
                await db.insert(userPuzzleStats)
                    .values({
                        userId: user.id,
                        month,
                        day,
                        hintUsed: true
                    })
                    .onConflictDoUpdate({
                        target: [userPuzzleStats.userId, userPuzzleStats.month, userPuzzleStats.day],
                        set: { hintUsed: true }
                    });

                // 2. Get the hint piece
                const hintPiece = await getHintPiece(month, day, request.log);
                return reply.send({ piece: hintPiece });
            }
            catch (error) {
                request.log.error(error, `[HintRoute] Failed to get hint for ${month}/${day}`);
                return reply.code(500).send({
                    error: "Unable to generate hint for this date. Please try again."
                });
            }
        }
    );

    // GET /api/hint/:date/state - Check if a hint was used and return it
    app.get<{ Params: DatePathParams; Reply: HintStateResponse | ErrorResponse }>(
        API_HINT_STATE,
        {
            preHandler: requireAuth,
            schema: {
                params: dateParamSchema
            }
        },
        async (request, reply) => {
            const { date } = request.params;
            const parsed = parseDate(date);

            if (!parsed) {
                return reply.code(400).send({ error: "Invalid date format" });
            }

            const { month, day } = parsed;
            const user = request.user as SessionUser;

            try {
                const stats = await db.select()
                    .from(userPuzzleStats)
                    .where(
                        and(
                            eq(userPuzzleStats.userId, user.id),
                            eq(userPuzzleStats.month, month),
                            eq(userPuzzleStats.day, day)
                        )
                    )
                    .limit(1);

                if (stats.length > 0 && stats[0].hintUsed) {
                    const hintPiece = await getHintPiece(month, day, request.log);
                    return reply.send({ piece: hintPiece });
                }

                return reply.send({ piece: null });
            }
            catch (error) {
                request.log.error(error, `[HintRoute] Failed to check hint state for ${month}/${day}`);
                return reply.code(500).send({ error: "Failed to check hint state" });
            }
        }
    );
};
