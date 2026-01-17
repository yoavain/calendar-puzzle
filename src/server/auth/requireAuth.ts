import { FastifyRequest, FastifyReply } from 'fastify';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
        return reply.code(401).send({ error: 'Not authenticated' });
    }
}
