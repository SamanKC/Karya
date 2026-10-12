# ── Stage 1: Install dependencies ──────────────────────────
FROM node:22-slim AS deps
WORKDIR /app

# Copy workspace manifests
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/

RUN npm ci --ignore-scripts

# ── Stage 2: Build shared + server ────────────────────────
FROM deps AS server-build
WORKDIR /app

COPY packages/shared packages/shared
COPY packages/server packages/server
COPY tsconfig.base.json tsconfig.json ./

RUN npm run --workspace=packages/shared build
RUN npx --workspace=packages/server prisma generate
RUN npm run --workspace=packages/server build

# ── Stage 3: Build client ─────────────────────────────────
FROM deps AS client-build
WORKDIR /app

COPY packages/shared packages/shared
COPY packages/client packages/client
COPY tsconfig.base.json tsconfig.json ./

RUN npm run --workspace=packages/shared build
RUN npm run --workspace=packages/client build

# ── Stage 4: Production runtime ───────────────────────────
FROM node:22-slim AS runtime
WORKDIR /app

# Install production deps only
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/

RUN npm ci --omit=dev --ignore-scripts

# Copy built artifacts
COPY --from=server-build /app/packages/shared/dist packages/shared/dist
COPY --from=server-build /app/packages/shared/package.json packages/shared/
COPY --from=server-build /app/packages/server/dist packages/server/dist
COPY --from=server-build /app/packages/server/package.json packages/server/
COPY --from=server-build /app/packages/server/node_modules/.prisma packages/server/node_modules/.prisma

# Copy client build into server's public directory
COPY --from=client-build /app/packages/client/dist packages/server/public

# Copy prisma schema and migrations (needed for runtime + deploy)
COPY packages/server/prisma packages/server/prisma

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/api/v1/health').then(r=>{if(!r.ok)throw 1}).catch(()=>process.exit(1))"

# Use entrypoint for migration + startup
ENTRYPOINT ["/app/docker-entrypoint.sh"]
