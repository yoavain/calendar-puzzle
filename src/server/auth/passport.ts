import fastifyPassport from "@fastify/passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { db } from "../db/connection.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { config } from "../config.js";
import { AUTH_GOOGLE_CALLBACK } from "../../common/restPaths.js";

export interface SessionUser {
    id: string;
    isAdmin: boolean;
    // PII stored in session only, not in DB
    email?: string;
    name?: string;
    avatarUrl?: string | null;
}

export const setupPassport = () => {
    fastifyPassport.use("google", new GoogleStrategy({
        clientID: config.google.clientId as string,
        clientSecret: config.google.clientSecret as string,
        callbackURL: AUTH_GOOGLE_CALLBACK, // Relative path - resolved from request host
        proxy: true // Trust X-Forwarded-Proto header from reverse proxies
        // Passport declares the verify callback as returning void, but an async
        // callback is the documented pattern. Every path below calls done(), so
        // this promise cannot reject.
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
    }, async (_accessToken, _refreshToken, profile, done) => {
        try {
            const pii = {
                email: profile.emails?.[0]?.value ?? "",
                name: profile.displayName,
                avatarUrl: profile.photos?.[0]?.value ?? null
            };

            // Ensure user exists in DB - only store non-PII
            const [dbUser] = await db.insert(users)
                .values({
                    id: profile.id
                })
                .onConflictDoNothing()
                .returning();

            // If user already existed, dbUser will be undefined from onConflictDoNothing().returning()
            // So we fetch the actual user state
            const [finalDbUser] = dbUser 
                ? [dbUser] 
                : await db.select().from(users).where(eq(users.id, profile.id));

            return done(null, {
                id: profile.id,
                isAdmin: finalDbUser.isAdmin,
                ...pii
            });
        }
        catch (error) {
            return done(error as Error);
        }
    }));

    fastifyPassport.registerUserSerializer<SessionUser, SessionUser>(
        async (user) => user
    );
    fastifyPassport.registerUserDeserializer<SessionUser, SessionUser | null>(
        async (user) => {
            const [dbUser] = await db.select({ isAdmin: users.isAdmin })
                .from(users).where(eq(users.id, user.id));
            if (!dbUser) {
                return null;
            }
            return { ...user, isAdmin: dbUser.isAdmin };
        }
    );
};
