FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN npm install --workspace=packages/shared --workspace=apps/api --include-workspace-root

# Build shared package
FROM deps AS build-shared
COPY packages/shared/ ./packages/shared/
RUN npm run build --workspace=packages/shared

# Generate Prisma client and build API
FROM build-shared AS build
COPY apps/api/ ./apps/api/
RUN npx prisma generate --schema=./apps/api/prisma/schema.prisma
RUN npm run build --workspace=apps/api

# Production image
FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/package.json ./package.json

RUN mkdir -p /app/uploads

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./apps/api/prisma/schema.prisma && npx prisma db seed --schema=./apps/api/prisma/schema.prisma; node apps/api/dist/main.js"]
