import fastifyPassport from '@fastify/passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { db } from '../db/connection.js';
import { users } from '../db/schema.js';

export interface SessionUser {
    id: string;
    email: string;
    name: string;
}

export function setupPassport() {
    fastifyPassport.use('google', new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: '/auth/google/callback',  // Relative path - resolved from request host
        proxy: true,  // Trust X-Forwarded-Proto header from reverse proxies
    }, async (_accessToken, _refreshToken, profile, done) => {
        try {
            const user: SessionUser = {
                id: profile.id,
                email: profile.emails?.[0]?.value ?? '',
                name: profile.displayName,
            };

            // Ensure user exists in DB - Upsert user information
            await db.insert(users)
                .values({
                    id: user.id,
                    email: user.email,
                    name: user.name,
                })
                .onConflictDoUpdate({
                    target: users.id,
                    set: {
                        email: user.email,
                        name: user.name,
                    },
                });

            return done(null, user);
        } catch (error) {
            return done(error as Error);
        }
    }));

    fastifyPassport.registerUserSerializer<SessionUser, SessionUser>(
        async (user) => user
    );
    fastifyPassport.registerUserDeserializer<SessionUser, SessionUser>(
        async (user) => user
    );
}
