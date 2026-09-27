import { and, eq } from "drizzle-orm";
import { db } from "./connection.js";
import { userPuzzleStats, users } from "./schema.js";
import { computeTokenBalance, evaluateHintRequest } from "../../common/hintTokens.js";
import type { HintErrorCode } from "../../common/hintTokens.js";

export type HintSpendResult =
    | { ok: true; hintsUsed: number; tokenBalance: number }
    | { ok: false; code: HintErrorCode; tokenBalance: number };

/**
 * Record hint #hintNumber for a date and spend a token when it costs one.
 *
 * The transaction starts by locking the user row, so two concurrent requests
 * of the same user (two tabs, a double click) run one after the other and
 * cannot spend the same token.
 */
export const spendHint = async (userId: string, month: number, day: number, hintNumber: number): Promise<HintSpendResult> =>
    db.transaction(async (tx) => {
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
