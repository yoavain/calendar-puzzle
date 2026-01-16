import { eq } from 'drizzle-orm';
import { FastifyBaseLogger } from 'fastify';
import { db } from './connection.js';
import { solutions } from './schema.js';
import { Piece } from '../../common/types.js';

export const getSolution = async (dateKey: string, log: FastifyBaseLogger): Promise<Piece[] | null> => {
    const result = await db.select().from(solutions).where(eq(solutions.dateKey, dateKey));
    const pieces = result[0]?.pieces ?? null;
    log.info({ dateKey, cacheHit: !!pieces }, `[SolutionRepository] Cache ${pieces ? "HIT" : "MISS"}`);
    return pieces;
};

export const saveSolution = async (dateKey: string, pieces: Piece[], log: FastifyBaseLogger): Promise<void> => {
    await db.insert(solutions).values({ dateKey, pieces }).onConflictDoNothing();
    log.info({ dateKey }, '[SolutionRepository] Cached solution');
};
