FROM oven/bun:1.3.14

WORKDIR /app

# The root manifest and workspace files are installed together so Bun resolves
# @repo/common and @repo/db as workspace packages.
COPY package.json bun.lock turbo.json ./
COPY apps ./apps
COPY packages ./packages

RUN bun install --frozen-lockfile
RUN cd packages/db && bunx prisma generate --config prisma7.config.ts

ARG SERVICE=backend
ENV SERVICE=${SERVICE}
EXPOSE 3001 3002

CMD ["sh", "-c", "if [ \"$SERVICE\" = websocket ]; then exec bun run apps/websocket/index.ts; elif [ \"$SERVICE\" = backend ]; then exec bun run apps/backend/index.ts; else echo \"Unsupported SERVICE: $SERVICE\" >&2; exit 1; fi"]
