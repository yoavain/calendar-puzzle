import { FastifyInstance } from 'fastify';
import { DatePathParams, HintResponse, ErrorResponse } from '../../common/restTypes';
import { parseDate } from '../utils/dateUtils';

export function registerHintRoutes(app: FastifyInstance): void {
    // GET /api/hint/:date - Get a hint (single piece placement) for a date
    app.get<{ Params: DatePathParams; Reply: HintResponse | ErrorResponse }>(
        '/api/hint/:date',
        async (request, reply) => {
            const { date } = request.params;
            const parsed = parseDate(date);

            if (!parsed) {
                return reply.code(400).send({
                    error: 'Invalid date format. Expected MM-DD (e.g., 01-15 for January 15th)'
                });
            }

            const { month, day } = parsed;

            // TODO: Implement hint generation
            return reply.code(501).send({
                error: `Hint for ${month}/${day} not yet implemented`
            });
        }
    );
}
