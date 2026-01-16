import { FastifyInstance } from 'fastify';
import { DatePathParams, SolutionResponse, ErrorResponse } from '../../common/restTypes.js';
import { parseDate } from '../utils/dateUtils.js';
import { solvePuzzle } from '../service/solverService.js';

export function registerSolutionRoutes(app: FastifyInstance): void {
    // GET /api/solution/:date - Get full puzzle solution for a date
    app.get<{ Params: DatePathParams; Reply: SolutionResponse | ErrorResponse }>(
        '/api/solution/:date',
        async (request, reply) => {
            const { date } = request.params;
            const parsed = parseDate(date);

            if (!parsed) {
                return reply.code(400).send({
                    error: 'Invalid date format. Expected MM-DD (e.g., 01-15 for January 15th)'
                });
            }

            const { month, day } = parsed;

            try {
                // parseDate returns PuzzleDate with 0-indexed month
                const pieces = await solvePuzzle(month, day);
                return reply.send({ pieces });
            } catch (error) {
                // Log detailed error on server, but return generic message to client
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                app.log.error(`Failed to solve puzzle for ${month}/${day}: ${errorMessage}`);
                return reply.code(500).send({
                    error: 'Unable to solve puzzle for this date. Please try again.'
                });
            }
        }
    );
}
