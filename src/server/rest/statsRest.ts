import { FastifyInstance } from 'fastify';
import { db } from '../db/connection.js';
import { userPuzzleStats } from '../db/schema.js';
import { eq, and, isNull } from 'drizzle-orm';
import { SessionUser } from '../auth/passport.js';
import { requireAuth } from '../auth/requireAuth.js';
import { Piece, PuzzleDate } from '../../common/types.js';
import { isPuzzleSolved, isValidPlacement, getTransformedShape } from '../../common/gameLogic.js';
import { initializeBoard } from '../utils/gameInit.js';

interface StatsRequest {
    month: number;
    day: number;
}

interface CompleteRequest extends StatsRequest {
    pieces: Piece[];
}

export function registerStatsRoutes(app: FastifyInstance): void {
    // Record that a user started a puzzle
    app.post<{ Body: StatsRequest }>(
        '/api/stats/start',
        { preHandler: requireAuth },
        async (request, reply) => {
            const { month, day } = request.body;
            const user = request.user as SessionUser;

            try {
                // Upsert to record the first started time
                await db.insert(userPuzzleStats)
                    .values({
                        userId: user.id,
                        month,
                        day,
                        firstStartedAt: new Date(),
                    })
                    .onConflictDoNothing(); // If already exists, do nothing (keep original firstStartedAt)

                return { success: true };
            } catch (error) {
                request.log.error(error, '[StatsRoute] Failed to record start');
                return reply.code(500).send({ error: 'Failed to record progress' });
            }
        }
    );

    // Record that a user completed a puzzle (with server-side validation)
    app.post<{ Body: CompleteRequest }>(
        '/api/stats/complete',
        { preHandler: requireAuth },
        async (request, reply) => {
            const { month, day, pieces } = request.body;
            const user = request.user as SessionUser;
            const puzzleDate: PuzzleDate = { month, day };

            try {
                // 1. Validate the solution on the server
                const board = initializeBoard(puzzleDate);
                
                // Place pieces on the board and check validity
                let allValid = true;
                for (const piece of pieces) {
                    if (piece.position) {
                        if (!isValidPlacement(board, piece, piece.position)) {
                            allValid = false;
                            break;
                        }
                        
                        // Mark as occupied for overlap check of next pieces
                        const shape = getTransformedShape(piece);
                        for (let dy = 0; dy < shape.length; dy++) {
                            for (let dx = 0; dx < shape[0].length; dx++) {
                                if (shape[dy][dx]) {
                                    const boardY = piece.position.y + dy;
                                    const boardX = piece.position.x + dx;
                                    if (boardY < board.length && boardX < board[boardY].length) {
                                        board[boardY][boardX].isOccupied = true;
                                    }
                                }
                            }
                        }
                    } else {
                        // All pieces must be placed for a solution to be valid
                        allValid = false;
                        break;
                    }
                }

                if (allValid && isPuzzleSolved(board, puzzleDate)) {
                    // 2. Record completion in DB
                    await db.insert(userPuzzleStats)
                        .values({
                            userId: user.id,
                            month,
                            day,
                            firstStartedAt: new Date(), // Fallback if /start wasn't called
                            firstCompletedAt: new Date(),
                        })
                        .onConflictDoUpdate({
                            target: [userPuzzleStats.userId, userPuzzleStats.month, userPuzzleStats.day],
                            set: {
                                firstCompletedAt: new Date(),
                            },
                            where: isNull(userPuzzleStats.firstCompletedAt)
                        });

                    return { success: true };
                } else {
                    return reply.code(400).send({ error: 'Invalid solution' });
                }
            } catch (error) {
                request.log.error(error, '[StatsRoute] Failed to validate or record completion');
                return reply.code(500).send({ error: 'Failed to record completion' });
            }
        }
    );
}
