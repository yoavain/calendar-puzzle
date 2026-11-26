import fastifyPassport from "@fastify/passport";
import type { FastifyRequest } from "fastify";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { db } from "../db/connection.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { config } from "../config.js";
import { API_HEALTH, AUTH_GOOGLE_CALLBACK } from "../../common/restPaths.js";

export interface SessionUser {
    id: string;
    isAdmin: boolean;
    // PII stored in session only, not in DB
    email?: string;
    name?: string;
    avatarUrl?: string | null;
}

declare module "fastify" {
    interface FastifyRequest {
        // Set when the user lookup of this request failed
        databaseUnavailable?: boolean;
    }
}

// Pages and assets need no database. Health must not wait for the database before its own check.
// The matched route decides, not the raw URL, which a client can encode in other ways.
const needsUserLookup = (route: string | undefined): boolean =>
    route !== undefined && route !== API_HEALTH && (route.startsWith("/api/") || route.startsWith("/auth/"));

// Log only a change of state, so an outage does not flood the journal.
let isLookupFailing = false;

/**
 * Turns the session into request.user.
 *
 * It must not throw and must not return a falsy value on a database error: passport treats both
 * as "no such user" and signs the user out. The signed session cookie already proves the identity.
 * Without a database answer, the user has no admin rights.
 */
export const deserializeSessionUser = async (user: SessionUser, request: FastifyRequest): Promise<SessionUser | null> => {
    const unverified = { ...user, isAdmin: false };
    if (!needsUserLookup(request.routeOptions.url)) {
        return unverified;
    }

    try {
        const [dbUser] = await db.select({ isAdmin: users.isAdmin })
            .from(users).where(eq(users.id, user.id));
        if (isLookupFailing) {
            isLookupFailing = false;
            request.log.info("[Auth] User lookup recovered");
        }
        return dbUser ? { ...user, isAdmin: dbUser.isAdmin } : null;
    }
    catch (error) {
        request.databaseUnavailable = true;
        if (!isLookupFailing) {
            isLookupFailing = true;
            request.log.error(error, "[Auth] User lookup failed");
        }
        return unverified;
    }
};

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
    fastifyPassport.registerUserDeserializer<SessionUser, SessionUser | null>(deserializeSessionUser);
};
