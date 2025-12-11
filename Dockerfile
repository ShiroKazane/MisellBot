# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /app

# Install all dependencies (including dev)
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --no-cache

# Build stage
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Final runtime image
FROM base AS release
ENV NODE_ENV=production

COPY --from=build /app ./

USER bun
ENTRYPOINT ["bun", "run", "./src/misell.ts"]