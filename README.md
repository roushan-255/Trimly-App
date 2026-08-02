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

Open http://localhost:3000 for the customer-facing home page. Customer login
and signup are available at http://localhost:3000/customer/login and
http://localhost:3000/signup.

Shop owners can register their account and first shop at
http://localhost:3000/owner/register. After login, the owner dashboard is
available at http://localhost:3000/owner/dashboard. Owners log in through
http://localhost:3000/owner/login. The same email can also be used at
http://localhost:3000/customer/login after customer registration is completed
for that account; customer and owner passwords may be different.

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

Customer and owner login pages both call `POST /auth/login`. The request body
selects the portal role whose password should be verified:

```json
{
  "email": "person@example.com",
  "password": "role-specific-password",
  "role": "CUSTOMER"
}
```

Use `"SHOP_OWNER"` when logging in through the owner portal.

## Accounts, roles, and passwords

An email identifies one `User`, and `User.roles` contains every role registered
for that account. Customer and owner activation are separate:

- Customer signup adds `CUSTOMER` and creates a `CustomerProfile`.
- Owner signup adds `SHOP_OWNER` and creates a `ShopOwnerProfile` plus the first
  shop.
- Registering another role with the same email extends the existing user instead
  of creating a duplicate user.

Passwords are stored per role in `RoleCredential`, so the same email may use one
password at `/customer/login` and another at `/owner/login`. Only password hashes
are stored. Existing-account ownership verification is not implemented in this
MVP; adding another role currently relies on the matching email alone. Add
authenticated role activation or email verification before production.

Owner routes require a bearer token issued from a `SHOP_OWNER` login:

- `GET /owner/shops`
- `POST /owner/shops`
- `POST /owner/shops/:shopId/barbers`

Customer-facing shop discovery uses the public database-backed routes:

- `GET /shops`
- `GET /shops/:shopId`

Owner signup creates the owner profile and first shop together. Barber accounts
can only be added through the protected owner route, which verifies that the
shop belongs to the authenticated owner. Admin signup is intentionally public
for the initial MVP and must be protected or removed before production. The
owner controller uses `BearerTokenGuard` for authentication and `RolesGuard`
with `@Roles(UserRole.SHOP_OWNER)` for role authorization. The service also
checks shop ownership before operating on a specific shop.

## Commands

- `corepack pnpm --dir frontend dev` — run only the Next.js app
- `corepack pnpm --dir backend start:dev` — run only the API
- `corepack pnpm --dir frontend build` — build the frontend
- `corepack pnpm build` — build both applications once the backend is complete
- `corepack pnpm --dir backend prisma:generate` — regenerate the Prisma client
- `corepack pnpm --dir backend exec prisma migrate deploy` — apply checked-in
  database migrations

## Database

Set `DATABASE_URL` in `backend/.env` to the PostgreSQL connection URL you provide.
Prisma is configured in `backend/prisma/schema.prisma` with the initial booking
domain models. Apply the checked-in migrations before starting the backend.
