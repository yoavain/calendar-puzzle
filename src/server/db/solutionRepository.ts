import { eq } from 'drizzle-orm';
import { db } from './connection.js';
import { solutions } from './schema.js';
import { Piece } from '../../common/types.js';

export async function getSolution(dateKey: string): Promise<Piece[] | null> {
    const result = await db.select().from(solutions).where(eq(solutions.dateKey, dateKey));
    return result[0]?.pieces ?? null;
}

export async function saveSolution(dateKey: string, pieces: Piece[]): Promise<void> {
    await db.insert(solutions).values({ dateKey, pieces }).onConflictDoNothing();
}
