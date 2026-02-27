FROM node:20-alpine AS base
WORKDIR /app

# Install ALL workspace dependencies in one go
FROM base AS deps
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN npm install --include-workspace-root

# Build shared package first (produces dist/ with types + JS)
FROM deps AS build-shared
COPY packages/shared/ ./packages/shared/
RUN npm run build --workspace=packages/shared

# Build API (shared is already built, symlink in node_modules resolves it)
FROM build-shared AS build
COPY apps/api/ ./apps/api/
RUN npx prisma generate --schema=./apps/api/prisma/schema.prisma
RUN npm run build --workspace=apps/api

# Production image
FROM base AS runner
ENV NODE_ENV=production

# Copy root node_modules (has workspace symlinks)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

# Copy shared package (the symlink in node_modules/@ar-core/shared points here)
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy API
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules

RUN mkdir -p /app/uploads

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma && npx prisma db seed --schema=./apps/api/prisma/schema.prisma; node apps/api/dist/main.js"]
