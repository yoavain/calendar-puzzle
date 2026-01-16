import { eq } from 'drizzle-orm';
import { db } from './connection.js';
import { solutions } from './schema.js';
import { Piece } from '../../common/types.js';

export const getSolution = async (dateKey: string): Promise<Piece[] | null> => {
    const result = await db.select().from(solutions).where(eq(solutions.dateKey, dateKey));
    const pieces = result[0]?.pieces ?? null;
    console.log(`[SolutionRepository] Cache ${pieces ? "HIT" : "MISS"} for ${dateKey}`);
    return pieces;
};

export const saveSolution = async (dateKey: string, pieces: Piece[]): Promise<void> => {
    await db.insert(solutions).values({ dateKey, pieces }).onConflictDoNothing();
    console.log(`[SolutionRepository] Cached solution for ${dateKey}`);
};
