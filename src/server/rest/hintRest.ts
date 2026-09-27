import type { FastifyInstance } from "fastify";
import type { DatePathParams, ErrorResponse, HintErrorResponse, HintRequest, HintResponse, HintStateResponse } from "../../common/restTypes.js";
import type { HintErrorCode } from "../../common/hintTokens.js";
import { parseDate } from "../utils/dateUtils.js";
import { getHintPieces } from "../service/solverService.js";
import { getHintsUsed, spendHint } from "../db/hintRepository.js";
import { requireAuth } from "../auth/requireAuth.js";
import { dateParamSchema, hintRequestSchema } from "./schemas.js";
import type { SessionUser } from "../auth/passport.js";
import { API_HINT, API_HINT_STATE } from "../../common/restPaths.js";

const HINT_ERROR_MESSAGES: Record<HintErrorCode, string> = {
    STALE_HINT_NUMBER: "Your hints are out of date.",
    ALREADY_SOLVED: "This date is already solved.",
    NO_TOKENS: "No hint tokens left."
};

export const registerHintRoutes = (app: FastifyInstance): void => {
    // PUT /api/hint - Request hint #hintNumber; spends a token for #2 and later
    app.put<{ Body: HintRequest; Reply: HintResponse | HintErrorResponse | ErrorResponse }>(
        API_HINT,
        {
            preHandler: requireAuth,
            schema: {
                body: hintRequestSchema
            },
            config: {
                rateLimit: {
                    max: 5,
                    timeWindow: "1 minute"
                }
            }
        },
        async (request, reply) => {
            const { month, day, hintNumber } = request.body;
            const user = request.user as SessionUser;

            try {
                const result = await spendHint(user.id, month, day, hintNumber);
                if (!result.ok) {
                    return reply.code(409).send({
                        error: HINT_ERROR_MESSAGES[result.code],
                        code: result.code,
                        tokenBalance: result.tokenBalance
                    });
                }

                // Outside the transaction: the solver never runs under the row lock
                const pieces = await getHintPieces(month, day, result.hintsUsed, request.log);
                return reply.send({ pieces, tokenBalance: result.tokenBalance });
            }
            catch (error) {
                request.log.error(error, `[HintRoute] Failed to get hint #${hintNumber} for ${month}/${day}`);
                return reply.code(500).send({
                    error: "Unable to generate hint for this date. Please try again."
                });
            }
        }
    );

    // GET /api/hint/:date/state - Every hint the user has used for this date
    app.get<{ Params: DatePathParams; Reply: HintStateResponse | ErrorResponse }>(
        API_HINT_STATE,
        {
            preHandler: requireAuth,
            schema: {
                params: dateParamSchema
            }
        },
        async (request, reply) => {
            const parsed = parseDate(request.params.date);

            if (!parsed) {
                return reply.code(400).send({ error: "Invalid date format" });
            }

            const { month, day } = parsed;
            const user = request.user as SessionUser;

            try {
                const hintsUsed = await getHintsUsed(user.id, month, day);
                const pieces = hintsUsed > 0 ? await getHintPieces(month, day, hintsUsed, request.log) : [];
                return reply.send({ pieces });
            }
            catch (error) {
                request.log.error(error, `[HintRoute] Failed to check hint state for ${month}/${day}`);
                return reply.code(500).send({ error: "Failed to check hint state" });
            }
        }
    );
};
