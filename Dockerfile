FROM oven/bun:alpine AS base
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

# --- FIX: create logs directory and set permissions ---
RUN mkdir -p /app/logs \
    && mkdir -p /app/temp \
    && chown -R bun:bun /app/logs \
    && chown -R bun:bun /app/temp

USER bun

ENTRYPOINT ["bun", "run", "./src/misell.ts"]