# Trimly

pnpm workspace containing a Next.js frontend and a NestJS backend.

## Prerequisites

- Node.js 20.11+
- pnpm 9+
- A PostgreSQL database connection URL

## Getting started

```bash
pnpm install
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
# Set DATABASE_URL in backend/.env
pnpm --dir backend prisma:generate
pnpm dev
```

The frontend is served on http://localhost:3000 and the backend on http://localhost:4000.

## Commands

- `pnpm dev:frontend` — run only the Next.js app
- `pnpm dev:backend` — run only the API
- `pnpm build` — build both applications

## Database

Set `DATABASE_URL` in `backend/.env` to the PostgreSQL connection URL you provide. Prisma is configured in `backend/prisma/schema.prisma`; no application models are included intentionally. Add models and migrations as business requirements are defined.
