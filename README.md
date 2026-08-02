# Trimly

pnpm workspace containing a Next.js frontend and a NestJS backend.

## Prerequisites

- Node.js 20.11+
- Corepack (included with supported Node.js releases)
- A PostgreSQL database connection URL when running the backend

## Run the frontend

```bash
corepack pnpm install --frozen-lockfile
cp frontend/.env.example frontend/.env.local
corepack pnpm --dir frontend dev
```

Open http://localhost:3000 for the customer-facing home page. Login and signup
are available at http://localhost:3000/login and http://localhost:3000/signup.

Shop owners can register their account and first shop at
http://localhost:3000/owner/register. After login, the owner dashboard is
available at http://localhost:3000/owner/dashboard.

If you prefer to use `pnpm` directly, run `corepack enable` once and then use the
same commands without the `corepack` prefix.

## Backend environment

The frontend reads its API origin from `NEXT_PUBLIC_API_URL` and defaults to
`http://localhost:4000` in the example environment file. Before running the API:

```bash
cp backend/.env.example backend/.env
# Set DATABASE_URL and JWT_ACCESS_SECRET in backend/.env
corepack pnpm --dir backend prisma:generate
corepack pnpm --dir backend exec prisma migrate deploy
corepack pnpm --dir backend start:dev
```

The MVP authentication routes are:

- `POST /auth/signup/customer`
- `POST /auth/signup/shop-owner`
- `POST /auth/signup/admin`
- `POST /auth/login`

Owner routes require a `SHOP_OWNER` bearer access token:

- `GET /owner/shops`
- `POST /owner/shops`
- `POST /owner/shops/:shopId/barbers`

Customer-facing shop discovery uses the public database-backed routes:

- `GET /shops`
- `GET /shops/:shopId`

Owner signup creates the owner profile and first shop together. Barber accounts
can only be added through the protected owner route, which verifies that the
shop belongs to the authenticated owner. Admin signup is intentionally public
for the initial MVP and must be protected or removed before production.

## Commands

- `corepack pnpm --dir frontend dev` — run only the Next.js app
- `corepack pnpm --dir backend start:dev` — run only the API
- `corepack pnpm --dir frontend build` — build the frontend
- `corepack pnpm build` — build both applications once the backend is complete

## Database

Set `DATABASE_URL` in `backend/.env` to the PostgreSQL connection URL you provide.
Prisma is configured in `backend/prisma/schema.prisma` with the initial booking
domain models. Apply the checked-in migrations before starting the backend.
