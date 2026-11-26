import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { db, pool } from "./connection.js";
import * as schema from "./schema.js";
import { userPuzzleStats, users } from "./schema.js";
import { computeTokenBalance, evaluateHintRequest } from "../../common/hintTokens.js";
import type { HintErrorCode } from "../../common/hintTokens.js";

export type HintSpendResult =
    | { ok: true; hintsUsed: number; tokenBalance: number }
    | { ok: false; code: HintErrorCode; tokenBalance: number };

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Runs a transaction on its own connection and destroys that connection on any error.
 * db.transaction() is not safe with a query timeout: a timeout on BEGIN leaks the connection,
 * and a later one returns it to the pool with the transaction still open.
 */
const isolatedTransaction = async <T>(work: (tx: Transaction) => Promise<T>): Promise<T> => {
    const client = await pool.connect();
    // A checked-out client has no pool listener. Without one, a dropped connection stops the process.
    const ignore = () => {};
    client.on("error", ignore);

    try {
        const result = await drizzle(client, { schema }).transaction(work);
        client.removeListener("error", ignore);
        client.release();
        return result;
    }
    catch (error) {
        client.release(true);
        throw error;
    }
};

/**
 * Record hint #hintNumber for a date and spend a token when it costs one.
 *
 * The transaction starts by locking the user row, so two concurrent requests
 * of the same user (two tabs, a double click) run one after the other and
 * cannot spend the same token.
 */
export const spendHint = async (userId: string, month: number, day: number, hintNumber: number): Promise<HintSpendResult> =>
    isolatedTransaction<HintSpendResult>(async (tx) => {
        await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for("update");

        const rows = await tx.select({
            month: userPuzzleStats.month,
            day: userPuzzleStats.day,
            firstCompletedAt: userPuzzleStats.firstCompletedAt,
            hintsUsed: userPuzzleStats.hintsUsed
        })
            .from(userPuzzleStats)
            .where(eq(userPuzzleStats.userId, userId));

        const balance = computeTokenBalance(rows.map(r => ({ completed: r.firstCompletedAt !== null, hintsUsed: r.hintsUsed })));
        const row = rows.find(r => r.month === month && r.day === day);
        const hintsUsed = row?.hintsUsed ?? 0;

        const decision = evaluateHintRequest({
            hintNumber,
            hintsUsed,
            isSolved: row?.firstCompletedAt != null,
            balance
        });

        if (decision.kind === "reject") {
            return { ok: false, code: decision.code, tokenBalance: balance };
        }
        if (decision.kind === "replay") {
            return { ok: true, hintsUsed, tokenBalance: balance };
        }

        await tx.insert(userPuzzleStats)
            .values({ userId, month, day, hintsUsed: hintNumber })
            .onConflictDoUpdate({
                target: [userPuzzleStats.userId, userPuzzleStats.month, userPuzzleStats.day],
                set: { hintsUsed: hintNumber }
            });

        return { ok: true, hintsUsed: hintNumber, tokenBalance: balance - decision.cost };
    });

export const getHintsUsed = async (userId: string, month: number, day: number): Promise<number> => {
    const rows = await db.select({ hintsUsed: userPuzzleStats.hintsUsed })
        .from(userPuzzleStats)
        .where(and(
            eq(userPuzzleStats.userId, userId),
            eq(userPuzzleStats.month, month),
            eq(userPuzzleStats.day, day)
        ))
        .limit(1);
    return rows[0]?.hintsUsed ?? 0;
};
