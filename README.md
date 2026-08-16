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

The frontend reads its API base URL from `NEXT_PUBLIC_API_URL`. For local
development, the example environment points to
`http://localhost:4000`. On Vercel, the frontend also recognizes the generated
`NEXT_PUBLIC_BACKEND_URL` service variable and otherwise uses the same-origin
`/api/backend` path. Nest applies that prefix only in Vercel, leaving local API
routes unchanged. Before running the API:

```bash
cp backend/.env.example backend/.env
# Set DATABASE_URL, JWT_ACCESS_SECRET, and SEED_OWNER_PASSWORD in backend/.env
corepack pnpm --dir backend prisma:generate
corepack pnpm --dir backend exec prisma migrate deploy
corepack pnpm --dir backend start:dev
```

The API routes below are relative to `NEXT_PUBLIC_API_URL`. The MVP
authentication routes are:

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
- `PUT /owner/shops/:shopId` — update an owned shop's public profile
- `POST /owner/shops/:shopId/barbers`
- `PUT /owner/shops/:shopId/barbers/:barberId` — update a barber profile
  and its linked login contact details
- `DELETE /owner/shops/:shopId/barbers/:barberId` — revoke the barber's
  membership while preserving account and appointment history
- `POST /owner/shops/:shopId/services` — publish a new 10-minute service
- `PUT /owner/shops/:shopId/services/:serviceId` — edit, publish, or hide a
  service
- `DELETE /owner/shops/:shopId/services/:serviceId` — hide a service while
  preserving booking history
- `GET /owner/shops/:shopId/visits` — list upcoming customer visit notices for
  the owner dashboard

Customer-facing shop discovery uses the public database-backed routes:

- `GET /shops` — location/date search with shop, service, price, rating,
  verification, sorting, and pagination filters
- `GET /shops/locations` — locality autocomplete suggestions
- `GET /shops/service-options` — active service names for a location
- `GET /shops/:shopId`

Customer booking management requires a bearer token issued from a `CUSTOMER`
login:

- `GET /customer/bookings` — upcoming and past bookings grouped by checkout
- `PATCH /customer/bookings/:bookingGroupId/cancel` — cancel the complete
  booking
- `PATCH /customer/bookings/:bookingGroupId/reschedule` — move the complete
  booking to another visit date
- `POST /customer/bookings/:bookingGroupId/review` — submit separate shop and
  barber ratings for a completed booking

The customer booking page is available at http://localhost:3000/bookings.
Multi-service appointments are displayed and managed as one booking.
New bookings are date-only visit notices: customers choose a date and services,
then notify the shop and barber that they are coming. No arrival time is
selected or reserved. Existing timed bookings remain readable for historical
compatibility.

Owner signup creates the owner profile and first shop together. Barber accounts
can only be added through the protected owner route, which verifies that the
shop belongs to the authenticated owner. Admin signup is intentionally public
for the initial MVP and must be protected or removed before production. The
owner controller uses `BearerTokenGuard` for authentication and `RolesGuard`
with `@Roles(UserRole.SHOP_OWNER)` for role authorization. The service also
checks shop ownership before operating on a specific shop.

Owners can manage a gallery of up to 10 public shop images during registration
or from the shop profile editor. They can upload JPG, PNG, or WebP files up to
5 MB each, paste image URLs, remove images, and choose the cover image. Local
development stores these files in the ignored `backend/uploads/shop-images`
directory and serves them from `/uploads/shop-images/:fileName`. Configure an
object-storage provider such as Cloudinary or S3 before production deployment,
where application filesystems may be temporary.

## Commands

- `corepack pnpm --dir frontend dev` — run only the Next.js app
- `corepack pnpm --dir backend start:dev` — run only the API
- `corepack pnpm --dir frontend build` — build the frontend
- `corepack pnpm build` — build both applications once the backend is complete
- `corepack pnpm --dir backend prisma:generate` — regenerate the Prisma client
- `corepack pnpm --dir backend prisma:seed` — replace the deterministic
  development dataset with shops, barbers, services, reviews, and availability
- `corepack pnpm --dir backend exec prisma migrate deploy` — apply checked-in
  database migrations

## Database

Set `DATABASE_URL` in `backend/.env` to the PostgreSQL connection URL you provide.
Prisma is configured in `backend/prisma/schema.prisma` with the initial booking
domain models. Apply the checked-in migrations before starting the backend.

For Vercel deployments, add `DATABASE_URL` and `JWT_ACCESS_SECRET` in the
project's Environment Variables settings for both Production and Preview as
needed, then redeploy. Local `.env` files are intentionally ignored and are not
uploaded by Git. Use the pooled connection URL supplied by a serverless
PostgreSQL provider, and apply migrations to that production database with
`corepack pnpm --dir backend exec prisma migrate deploy` before serving traffic.
