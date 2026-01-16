import { pgTable, varchar, jsonb } from 'drizzle-orm/pg-core';
import { Piece } from '../../common/types.js';

export const solutions = pgTable('solutions', {
    dateKey: varchar('date_key', { length: 5 }).primaryKey(), // '01-01' to '12-31'
    pieces: jsonb('pieces').$type<Piece[]>().notNull(),
});

// Inferred types - automatically stay in sync with schema
export type Solution = typeof solutions.$inferSelect;
export type NewSolution = typeof solutions.$inferInsert;
