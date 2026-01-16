import { FastifyInstance } from 'fastify';
import { DatePathParams, SolutionResponse, ErrorResponse } from '../../common/restTypes';
import { parseDate } from '../utils/dateUtils';

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

            // TODO: Implement puzzle solving
            return reply.code(501).send({
                error: `Solution for ${month}/${day} not yet implemented`
            });
        }
    );
}
