import fastifyPassport from '@fastify/passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from '../db/connection.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { config } from '../config.js';

export interface SessionUser {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
    isAdmin: boolean;
}

export function setupPassport() {
    fastifyPassport.use('google', new GoogleStrategy({
        clientID: config.google.clientId as string,
        clientSecret: config.google.clientSecret as string,
        callbackURL: '/auth/google/callback',  // Relative path - resolved from request host
        proxy: true,  // Trust X-Forwarded-Proto header from reverse proxies
    }, async (_accessToken, _refreshToken, profile, done) => {
        try {
            const user = {
                id: profile.id,
                email: profile.emails?.[0]?.value ?? '',
                name: profile.displayName,
                avatarUrl: profile.photos?.[0]?.value ?? null,
            };

            // Ensure user exists in DB - Upsert user information
            const [dbUser] = await db.insert(users)
                .values({
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    avatarUrl: user.avatarUrl,
                })
                .onConflictDoUpdate({
                    target: users.id,
                    set: {
                        email: user.email,
                        name: user.name,
                        avatarUrl: user.avatarUrl,
                    },
                })
                .returning();

            return done(null, {
                ...user,
                isAdmin: dbUser.isAdmin
            });
        } catch (error) {
            return done(error as Error);
        }
    }));

    fastifyPassport.registerUserSerializer<SessionUser, string>(
        async (user) => user.id
    );
    fastifyPassport.registerUserDeserializer<string, SessionUser>(
        async (id) => {
            const [user] = await db.select().from(users).where(eq(users.id, id));
            return user as SessionUser;
        }
    );
}
