export const config = {
    server: {
        port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
        host: process.env.HOST || '0.0.0.0',
        nodeEnv: process.env.NODE_ENV || 'development',
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    database: {
        url: process.env.DATABASE_URL,
    },
};

export function validateConfig() {
    const required = [
        { key: 'GOOGLE_CLIENT_ID', value: config.google.clientId },
        { key: 'GOOGLE_CLIENT_SECRET', value: config.google.clientSecret },
        { key: 'DATABASE_URL', value: config.database.url },
    ];

    const missing = required.filter(item => !item.value);

    if (missing.length > 0) {
        const missingKeys = missing.map(item => item.key).join(', ');
        throw new Error(`Missing required environment variables: ${missingKeys}`);
    }
}

// Add a type for the config to use in other parts of the app
export type Config = typeof config;
