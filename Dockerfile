# Docker deploys are retired. This file is kept as a description of the Proxmox runtime.
# The tag must equal .node-version: scripts/deploy-proxmox.mjs refuses to deploy otherwise.
FROM node:26.10.0-slim@sha256:ec7758ee051e457b468b32bde57b0879010b325bb9862718e9615225ce4aaae1

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

# Disaster Recovery Plan
# COPY --chown=node:node scripts/db-utils.js /usr/app/scripts/db-utils.js

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "dist/server/index.js"]
