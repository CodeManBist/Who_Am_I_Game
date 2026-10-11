# db

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.14. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

## Prisma 7

Generate the client from the repository root with `bunx prisma generate --config packages/db/prisma7.config.ts`.
Apply checked-in migrations manually with `cd packages/db && bunx prisma migrate deploy --config prisma7.config.ts` after setting `DATABASE_URL` in the shell. Do not run migrations as part of container startup.
