FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
# openssl para que Prisma detecte la plataforma correcta en Alpine
RUN apk add --no-cache openssl
COPY . .
RUN npx prisma generate && npm run build
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
# chown a node: el CLI de prisma necesita poder escribir sus engines al migrar
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/public ./public
USER node
# migra y seedea (idempotente) para que el Playground tenga datos al levantar
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node dist/main.js"]
