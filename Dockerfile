FROM node:26 AS base
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install --global "$(node -p 'require("./package.json").packageManager')" \
    && npm cache clean --force

FROM base AS builder
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN pnpm run build

FROM base AS runner

ENV NODE_ENV=production

RUN pnpm install --prod --frozen-lockfile --store-dir /tmp/pnpm-store \
    && rm -rf /tmp/pnpm-store

COPY --from=builder /app/dist ./dist

USER node
CMD ["node", "dist/index.js"]
