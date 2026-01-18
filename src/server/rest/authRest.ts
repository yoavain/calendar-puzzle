import { FastifyInstance } from 'fastify';
import fastifyPassport from '@fastify/passport';
import { SessionUser } from '../auth/passport.js';
import { db } from '../db/connection.js';
import { userPuzzleStats } from '../db/schema.js';
import { eq, and, isNotNull } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth } from '../auth/requireAuth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    app.get('/api/auth/me', {
        config: {
            rateLimit: {
                max: 20,
                timeWindow: '1 minute'
            }
        }
    }, async (request, reply) => {
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

    // Get server's public key for encryption (Authenticated)
    app.get('/api/auth/public-key', { preHandler: requireAuth }, async (request, reply) => {
        const publicKeyPath = path.resolve(process.cwd(), 'public-key.pem');
        try {
            if (!fs.existsSync(publicKeyPath)) {
                request.log.error(`Public key not found at: ${publicKeyPath}`);
                return reply.code(500).send({ error: 'Server encryption not configured' });
            }
            const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
            return { publicKey };
        } catch (error) {
            request.log.error(error, 'Error reading public key');
            return reply.code(500).send({ error: 'Failed to retrieve public key' });
        }
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

    // Get CSRF Token
    app.get('/api/auth/csrf-token', {
        config: {
            rateLimit: {
                max: 10,
                timeWindow: '1 minute'
            }
        }
    }, async (request, reply) => {
        const token = await reply.generateCsrf();
        return { csrfToken: token };
    });
}
