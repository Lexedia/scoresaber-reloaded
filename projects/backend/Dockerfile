FROM oven/bun:1.3.14-alpine AS base

FROM base AS depends
WORKDIR /app

# Copy workspace structure needed for dependency resolution
COPY package.json bun.lock ./
COPY projects/common/package.json ./projects/common/
COPY projects/backend/package.json ./projects/backend/
COPY projects/website/package.json ./projects/website/

# Install production dependencies
RUN bun install --frozen-lockfile --production

FROM base AS builder
WORKDIR /app

# Copy workspace structure
COPY package.json bun.lock ./
COPY projects/common/package.json ./projects/common/
COPY projects/backend/package.json ./projects/backend/
COPY projects/website/package.json ./projects/website/

# Install all dependencies (including dev)
RUN bun install --frozen-lockfile

# Copy source code and config
COPY eslint.config.mjs ./
COPY projects/common/tsconfig.json ./projects/common/
COPY projects/common/src ./projects/common/src
COPY projects/backend/tsconfig.json projects/backend/drizzle.config.ts ./projects/backend/
COPY projects/backend/src ./projects/backend/src
COPY projects/backend/scripts ./projects/backend/scripts
COPY projects/backend/drizzle ./projects/backend/drizzle

# Build the common library
RUN cd projects/common && bun run build

# Lint before building
RUN cd projects/backend && bun run lint

# Build the backend
RUN cd projects/backend && bun run build

# -----------------------------------
# Final stage - minimal runtime image
FROM base AS final
WORKDIR /app

ENV NODE_ENV production
ENV APP_ENV backend

# Copy only runtime dependencies from depends
COPY --from=depends /app/package.json* /app/bun.lock* ./
COPY --from=depends /app/node_modules ./node_modules

# Copy built applications from builder
COPY --from=builder /app/projects/common ./projects/common
COPY --from=builder /app/projects/backend/package.json ./projects/backend/
COPY --from=builder /app/projects/backend/ssr-backend ./projects/backend/ssr-backend

# SQL migrations for startup `runMigrations()`
COPY --from=builder /app/projects/backend/drizzle ./projects/backend/drizzle

ARG PORT=8080
ENV PORT $PORT
EXPOSE $PORT

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

WORKDIR /app/projects/backend
CMD ["./ssr-backend"]


