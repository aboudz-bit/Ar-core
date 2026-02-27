FROM node:20-alpine AS build
WORKDIR /app

# Copy all package manifests + workspace root
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install all dependencies (creates workspace symlinks)
RUN npm ci --include-workspace-root 2>/dev/null || npm install --include-workspace-root

# Copy shared source and build it
COPY packages/shared/ ./packages/shared/
RUN npm run build --workspace=packages/shared

# Verify the workspace symlink resolves
RUN ls -la node_modules/@ar-core/shared && ls node_modules/@ar-core/shared/dist/index.d.ts

# Copy API source and build it
COPY apps/api/ ./apps/api/
RUN npx prisma generate --schema=./apps/api/prisma/schema.prisma
RUN npm run build --workspace=apps/api

# ---- Production image ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy everything needed at runtime
COPY --from=build /app/package.json ./package.json

# Shared package
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json

# API
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/prisma ./apps/api/prisma

# Root node_modules (runtime deps)
COPY --from=build /app/node_modules ./node_modules

# Re-create the workspace symlink (COPY --from doesn't preserve symlinks across stages)
RUN mkdir -p node_modules/@ar-core && \
    rm -rf node_modules/@ar-core/shared && \
    ln -s ../../packages/shared node_modules/@ar-core/shared

RUN mkdir -p /app/uploads

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma && npx prisma db seed --schema=./apps/api/prisma/schema.prisma; node apps/api/dist/main.js"]
