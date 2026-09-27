import { sql } from "drizzle-orm";
import { boolean, check, integer, jsonb, pgTable, primaryKey, timestamp, varchar } from "drizzle-orm/pg-core";
import type { Piece } from "../../common/types.js";
import type { UserSettings } from "../../common/restTypes.js";
import { MAX_HINTS } from "../../common/hintTokens.js";

export const solutions = pgTable("solutions", {
    dateKey: varchar("date_key", { length: 5 }).primaryKey(), // '01-01' to '12-31'
    pieces: jsonb("pieces").$type<Piece[]>().notNull()
});

export const users = pgTable("users", {
    id: varchar("id").primaryKey(), // Google ID string
    isAdmin: boolean("is_admin").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    settings: jsonb("settings").$type<UserSettings>().default({}).notNull()
});

export const userPuzzleStats = pgTable("user_puzzle_stats", {
    userId: varchar("user_id").notNull().references(() => users.id),
    month: integer("month").notNull(), // 0-11
    day: integer("day").notNull(), // 1-31
    firstStartedAt: timestamp("first_started_at").defaultNow().notNull(),
    firstCompletedAt: timestamp("first_completed_at"),
    hintsUsed: integer("hints_used").default(0).notNull() // 0..MAX_HINTS
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.userId, table.month, table.day] }),
        // Built from MAX_HINTS: changing it makes `npm run db:generate` emit the new constraint
        hintsUsedRange: check("hints_used_range", sql`${table.hintsUsed} BETWEEN 0 AND ${sql.raw(String(MAX_HINTS))}`)
    };
});

// Inferred types - automatically stay in sync with schema
export type Solution = typeof solutions.$inferSelect;
export type NewSolution = typeof solutions.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type UserPuzzleStats = typeof userPuzzleStats.$inferSelect;
export type NewUserPuzzleStats = typeof userPuzzleStats.$inferInsert;
