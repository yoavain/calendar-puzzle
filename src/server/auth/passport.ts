import fastifyPassport from '@fastify/passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

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
    }, (_accessToken, _refreshToken, profile, done) => {
        const user: SessionUser = {
            id: profile.id,
            email: profile.emails?.[0]?.value ?? '',
            name: profile.displayName,
        };
        return done(null, user);
    }));

    fastifyPassport.registerUserSerializer<SessionUser, SessionUser>(
        async (user) => user
    );
    fastifyPassport.registerUserDeserializer<SessionUser, SessionUser>(
        async (user) => user
    );
}
