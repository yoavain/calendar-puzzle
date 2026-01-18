import { FastifyInstance } from 'fastify';
import fastifyPassport from '@fastify/passport';
import { SessionUser } from '../auth/passport.js';
import { db } from '../db/connection.js';
import { userPuzzleStats } from '../db/schema.js';
import { eq, and, isNotNull } from 'drizzle-orm';

export function registerAuthRoutes(app: FastifyInstance): void {
    // Initiate Google OAuth flow
    app.get('/auth/google', {
        preValidation: fastifyPassport.authenticate('google', {
            scope: ['profile', 'email']
        })
    }, async () => {
        // This handler is never called - passport redirects to Google
    });

    // Handle Google OAuth callback
    app.get('/auth/google/callback', {
        preValidation: fastifyPassport.authenticate('google', {
            failureRedirect: '/?error=auth_failed'
        })
    }, async (request, reply) => {
        // Authentication successful, redirect to home
        return reply.redirect('/');
    });

    // Get current authenticated user profile and completion history
    app.get('/api/auth/me', async (request, reply) => {
        if (request.user) {
            const user = request.user as SessionUser;

            // Fetch all stats for this user to calculate played count
            const stats = await db.select({
                month: userPuzzleStats.month,
                day: userPuzzleStats.day,
                firstCompletedAt: userPuzzleStats.firstCompletedAt,
            })
            .from(userPuzzleStats)
            .where(eq(userPuzzleStats.userId, user.id));

            const completedDates = stats
                .filter(s => s.firstCompletedAt !== null)
                .map(s => ({ month: s.month, day: s.day }));

            return {
                user,
                completedDates,
                playedCount: stats.length
            };
        }
        return reply.code(401).send({ error: 'Not authenticated' });
    });

    // Legacy endpoint for backward compatibility (can be removed later)
    app.get('/auth/user', async (request, reply) => {
        if (request.user) {
            return request.user as SessionUser;
        }
        return reply.code(401).send({ error: 'Not authenticated' });
    });

    // Logout
    app.post('/auth/logout', async (request, reply) => {
        await request.logout();
        return { success: true };
    });
}
