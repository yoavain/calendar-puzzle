import { pgTable, varchar, jsonb, integer, timestamp, primaryKey, boolean } from 'drizzle-orm/pg-core';
import { Piece } from '../../common/types.js';

export const solutions = pgTable('solutions', {
    dateKey: varchar('date_key', { length: 5 }).primaryKey(), // '01-01' to '12-31'
    pieces: jsonb('pieces').$type<Piece[]>().notNull(),
});

export const users = pgTable('users', {
    id: varchar('id').primaryKey(), // Google ID string
    email: varchar('email').notNull(),
    name: varchar('name').notNull(),
    avatarUrl: varchar('avatar_url'),
    isAdmin: boolean('is_admin').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userPuzzleStats = pgTable('user_puzzle_stats', {
    userId: varchar('user_id').notNull().references(() => users.id),
    month: integer('month').notNull(), // 0-11
    day: integer('day').notNull(), // 1-31
    firstStartedAt: timestamp('first_started_at').defaultNow().notNull(),
    firstCompletedAt: timestamp('first_completed_at'),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.userId, table.month, table.day] }),
    };
});

// Inferred types - automatically stay in sync with schema
export type Solution = typeof solutions.$inferSelect;
export type NewSolution = typeof solutions.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type UserPuzzleStats = typeof userPuzzleStats.$inferSelect;
export type NewUserPuzzleStats = typeof userPuzzleStats.$inferInsert;
