FROM node:24.13.0-alpine3.22@sha256:6f96670faefc1ec23520ce30e453e85bfdb94a43b49b7aac2b0d3ac3a902bf2f

# Timezone
RUN apk add --no-cache tzdata

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
COPY src/server/db/migrations /usr/app/src/server/db/migrations/
RUN mkdir -p /usr/app/ext/logs

# Dependencies
RUN npm i --omit=dev --ignore-scripts

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "dist/server/index.js"]
