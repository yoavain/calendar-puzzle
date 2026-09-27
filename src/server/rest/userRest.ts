import type { FastifyInstance } from "fastify";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/connection.js";
import { users } from "../db/schema.js";
import { requireAuth } from "../auth/requireAuth.js";
import type { SessionUser } from "../auth/passport.js";
import { API_USER_SETTINGS } from "../../common/restPaths.js";
import type { ErrorResponse, UserSettings, UserSettingsResponse } from "../../common/restTypes.js";
import { userSettingsSchema } from "./schemas.js";

export const registerUserRoutes = (app: FastifyInstance): void => {
    // PATCH /api/user/settings - Merge known settings into users.settings
    app.patch<{ Body: UserSettings; Reply: UserSettingsResponse | ErrorResponse }>(
        API_USER_SETTINGS,
        {
            preHandler: requireAuth,
            schema: {
                body: userSettingsSchema
            },
            config: {
                rateLimit: {
                    max: 10,
                    timeWindow: "1 minute"
                }
            }
        },
        async (request, reply) => {
            const user = request.user as SessionUser;

            try {
                const [row] = await db.update(users)
                    .set({ settings: sql`${users.settings} || ${JSON.stringify(request.body)}::jsonb` })
                    .where(eq(users.id, user.id))
                    .returning({ settings: users.settings });

                return reply.send({ settings: row?.settings ?? {} });
            }
            catch (error) {
                request.log.error(error, "[UserRoute] Failed to save settings");
                return reply.code(500).send({ error: "Failed to save settings" });
            }
        }
    );
};
