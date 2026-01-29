import type { FastifyInstance } from "fastify";
import fastifyPassport from "@fastify/passport";
import type { SessionUser } from "../auth/passport.js";
import { db } from "../db/connection.js";
import { userPuzzleStats } from "../db/schema.js";
import { eq } from "drizzle-orm";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "../config.js";
import { requireAuth } from "../auth/requireAuth.js";
import { API_AUTH_CSRF_TOKEN, API_AUTH_ME, API_AUTH_PUBLIC_KEY, AUTH_GOOGLE, AUTH_GOOGLE_CALLBACK, AUTH_LOGOUT } from "../../common/restPaths.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const registerAuthRoutes = (app: FastifyInstance): void => {
    // Initiate Google OAuth flow
    app.get(AUTH_GOOGLE, {
        preValidation: fastifyPassport.authenticate("google", {
            scope: ["profile", "email"]
        })
    }, async () => {
        // This handler is never called - passport redirects to Google
    });

    // Handle Google OAuth callback
    app.get(AUTH_GOOGLE_CALLBACK, {
        preValidation: fastifyPassport.authenticate("google", {
            failureRedirect: "/?error=auth_failed"
        })
    }, async (request, reply) => {
        // Authentication successful, redirect to home
        return reply.redirect("/");
    });

    // Get current authenticated user profile and completion history
    app.get(API_AUTH_ME, {
        config: {
            rateLimit: {
                max: 20,
                timeWindow: "1 minute"
            }
        }
    }, async (request, reply) => {
        if (request.user) {
            const user = request.user as SessionUser;

            // Fetch all stats for this user to calculate played count
            const stats = await db.select({
                month: userPuzzleStats.month,
                day: userPuzzleStats.day,
                firstCompletedAt: userPuzzleStats.firstCompletedAt
            })
                .from(userPuzzleStats)
                .where(eq(userPuzzleStats.userId, user.id));

            const completedDates = stats
                .filter(s => s.firstCompletedAt !== null)
                .map(s => ({ month: s.month, day: s.day }));

            const playedDates = stats.map(s => ({ month: s.month, day: s.day }));

            return {
                user,
                completedDates,
                playedDates
            };
        }
        return { user: null, completedDates: [], playedDates: [] };
    });

    // Get server's public key for encryption (Authenticated)
    app.get(API_AUTH_PUBLIC_KEY, { preHandler: requireAuth }, async (request, reply) => {
        const publicKeyPath = config.paths.publicKey;
        try {
            try {
                await fs.access(publicKeyPath);
            }
            catch {
                request.log.error(`Public key not found at: ${publicKeyPath}`);
                return reply.code(500).send({ error: "Server encryption not configured" });
            }
            const publicKey = await fs.readFile(publicKeyPath, "utf8");
            return { publicKey };
        }
        catch (error) {
            request.log.error(error, "Error reading public key");
            return reply.code(500).send({ error: "Failed to retrieve public key" });
        }
    });

    // Logout
    app.post(AUTH_LOGOUT, async (request, reply) => {
        await request.logout();
        return { success: true };
    });

    // Get CSRF Token
    app.get(API_AUTH_CSRF_TOKEN, {
        config: {
            rateLimit: {
                max: 10,
                timeWindow: "1 minute"
            }
        }
    }, async (request, reply) => {
        const token = await reply.generateCsrf();
        return { csrfToken: token };
    });
};
