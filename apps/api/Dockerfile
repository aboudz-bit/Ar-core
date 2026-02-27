FROM node:20-alpine AS build
WORKDIR /app

# Copy all package manifests
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install dependencies (ignore workspace linking issues — we fix it manually)
RUN npm install --include-workspace-root --ignore-scripts 2>/dev/null; \
    npx prisma --version >/dev/null 2>&1 || true

# Copy shared source and build it
COPY packages/shared/ ./packages/shared/
RUN cd packages/shared && npx tsc

# Force @ar-core/shared into API's local node_modules (no symlinks needed)
RUN mkdir -p apps/api/node_modules/@ar-core/shared && \
    cp packages/shared/package.json apps/api/node_modules/@ar-core/shared/ && \
    cp -r packages/shared/dist apps/api/node_modules/@ar-core/shared/

# Copy API source
COPY apps/api/ ./apps/api/

# Re-apply the shared package (COPY above may overwrite node_modules)
RUN mkdir -p apps/api/node_modules/@ar-core/shared && \
    cp packages/shared/package.json apps/api/node_modules/@ar-core/shared/ && \
    cp -r packages/shared/dist apps/api/node_modules/@ar-core/shared/

# Generate Prisma client and build API
RUN npx prisma generate --schema=./apps/api/prisma/schema.prisma
RUN cd apps/api && rm -rf dist && npx tsc -p tsconfig.json

# ---- Production image ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json ./package.json

# Shared package (for runtime require resolution)
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json

# API build output + prisma
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/prisma ./apps/api/prisma

# All node_modules (root hoisted deps)
COPY --from=build /app/node_modules ./node_modules

# Ensure @ar-core/shared is resolvable at runtime (no symlinks)
RUN mkdir -p node_modules/@ar-core/shared && \
    cp packages/shared/package.json node_modules/@ar-core/shared/ && \
    cp -r packages/shared/dist node_modules/@ar-core/shared/

RUN mkdir -p /app/uploads

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma && npx prisma db seed --schema=./apps/api/prisma/schema.prisma; node apps/api/dist/main.js"]
