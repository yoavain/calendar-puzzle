FROM node:24.13.0-slim@sha256:bf22df20270b654c4e9da59d8d4a3516cce6ba2852e159b27288d645b7a7eedc

# Timezone
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends tzdata && rm -rf /var/lib/apt/lists/*

# ENV
ENV TZ=Asia/Jerusalem
ENV NODE_ENV=production
ENV TOKENS_BASE_FOLDER=/usr/app/ext

# Files
WORKDIR /usr/app
COPY package.json /usr/app/
COPY package-lock.json /usr/app/
COPY .npmrc /usr/app/
COPY dist /usr/app/dist/
COPY build /usr/app/build/
COPY secret-key /usr/app/
COPY private-key.pem /usr/app/
COPY public-key.pem /usr/app/
COPY src/server/db/migrations /usr/app/src/server/db/migrations/
RUN mkdir -p /usr/app/ext/logs

# Dependencies
RUN npm ci --omit=dev --ignore-scripts

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "dist/server/index.js"]
