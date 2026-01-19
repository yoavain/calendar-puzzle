import type { FastifyInstance } from "fastify";
import type { DatePathParams, HintResponse, ErrorResponse } from "../../common/restTypes.js";
import { parseDate } from "../utils/dateUtils.js";
import { solvePuzzle } from "../service/solverService.js";
import { requireAuth } from "../auth/requireAuth.js";
import { dateParamSchema } from "./schemas.js";

/**
 * Simple hash function to convert a string to a number
 */
const hashString = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
};

export const registerHintRoutes = (app: FastifyInstance): void => {
    // GET /api/hint/:date - Get a hint (single piece placement) for a date
    app.get<{ Params: DatePathParams; Reply: HintResponse | ErrorResponse }>(
        "/api/hint/:date",
        { 
            preHandler: requireAuth,
            schema: {
                params: dateParamSchema
            },
            config: {
                rateLimit: {
                    max: 5,
                    timeWindow: "1 minute"
                }
            }
        },
        async (request, reply) => {
            const { date } = request.params;
            const parsed = parseDate(date);

            if (!parsed) {
                // This should theoretically not be reached if schema validation works correctly
                return reply.code(400).send({
                    error: "Invalid date format. Expected MM-DD (e.g., 01-15 for January 15th)"
                });
            }

            const { month, day } = parsed;

            try {
                // Solve the puzzle to get all piece placements
                // parseDate returns PuzzleDate with 0-indexed month
                const pieces = await solvePuzzle(month, day, request.log);

                // Filter to only pieces that have a position (are placed)
                const placedPieces = pieces.filter(p => p.position !== null);

                if (placedPieces.length === 0) {
                    return reply.code(500).send({
                        error: "No placed pieces found in solution"
                    });
                }

                // Pick a deterministic piece based on the date hash
                // Hash the date string and use modulo 8 to get piece index
                const pieceIndex = hashString(date) % 8;
                const hintPiece = placedPieces[pieceIndex % placedPieces.length];

                return reply.send({ piece: hintPiece });
            }
            catch (error) {
                // Log detailed error on server, but return generic message to client
                request.log.error(error, `[HintRoute] Failed to get hint for ${month}/${day}`);
                return reply.code(500).send({
                    error: "Unable to generate hint for this date. Please try again."
                });
            }
        }
    );
}
