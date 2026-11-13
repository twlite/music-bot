# syntax=docker/dockerfile:1.7
FROM node:24.22.1-trixie-slim AS dependencies
RUN npm install --global pnpm@12.18.0
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages ./packages
COPY patches ./patches
COPY apps/music-bot/package.json apps/music-bot/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/stream-providers/package.json apps/stream-providers/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --store-dir=/pnpm/store
COPY . .

FROM dependencies AS build
ARG NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
ARG NEXT_PUBLIC_GATEWAY_URL=http://localhost:5000
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL NEXT_PUBLIC_GATEWAY_URL=$NEXT_PUBLIC_GATEWAY_URL NEXT_TELEMETRY_DISABLED=1
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm build && pnpm --filter music-bot deploy --prod /out/bot --store-dir=/pnpm/store

FROM dependencies AS provider-dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm --filter stream-providers deploy --prod /out/providers --store-dir=/pnpm/store

FROM oven/bun:1.4.4-debian AS stream-providers
ENV NODE_ENV=production
WORKDIR /app
COPY --from=provider-dependencies --chown=bun:bun /out/providers /app
USER bun
CMD ["bun", "src/index.ts"]

FROM node:24.22.1-trixie-slim AS media
RUN apt-get update && apt-get install -y --no-install-recommends curl bzip2 ca-certificates && rm -rf /var/lib/apt/lists/*
ADD https://raw.githubusercontent.com/twlite/remedia/d3cfa5b7b6644dc5e29142a0722294c933f1159c/scripts/install.sh /tmp/install-remedia.sh
RUN REMEDIA_INSTALL_DIR=/opt/remedia sh /tmp/install-remedia.sh --ffmpeg-only
FROM node:24.22.1-trixie-slim AS bot
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production LD_LIBRARY_PATH=/opt/remedia/ffmpeg9/lib
WORKDIR /app
COPY --from=media /opt/remedia/ffmpeg9 /opt/remedia/ffmpeg9

COPY --from=build --chown=node:node /out/bot /app
USER node
CMD ["node", "dist/index.js"]

FROM node:24.22.1-trixie-slim AS web
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000 NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
USER node
CMD ["node", "apps/web/server.js"]
