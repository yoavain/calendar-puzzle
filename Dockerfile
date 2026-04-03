FROM node:24.14.1-slim@sha256:06e5c9f86bfa0aaa7163cf37a5eaa8805f16b9acb48e3f85645b09d459fc2a9f

# Timezone
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends tzdata && rm -rf /var/lib/apt/lists/*

# ENV
ENV TZ=Asia/Jerusalem
ENV NODE_ENV=production
ENV TOKENS_BASE_FOLDER=/usr/app/ext

# Files
WORKDIR /usr/app
RUN mkdir -p /usr/app/ext/logs && chown -R node:node /usr/app
COPY --chown=node:node package.json package-lock.json .npmrc /usr/app/

# Dependencies
USER node
RUN npm ci --omit=dev --ignore-scripts && rm -f .npmrc

# App code and assets
COPY --chown=node:node dist /usr/app/dist/
COPY --chown=node:node build /usr/app/build/
COPY --chown=node:node secret-key private-key.pem public-key.pem /usr/app/
COPY --chown=node:node src/server/db/migrations /usr/app/src/server/db/migrations/

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "dist/server/index.js"]
