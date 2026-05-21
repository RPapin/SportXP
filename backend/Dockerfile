# ── Stage 1 : Build ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# npm ci installe TOUT (y compris devDependencies) à partir du lock file
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2 : Production ────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# Copie uniquement le code compilé depuis le builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
