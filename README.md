# Street Taste Manager

A shift scheduling and payroll app for Street Taste. The manager creates staff accounts, sets each
person's hourly rate, assigns shifts for the week, and sees a payroll dashboard of hours worked and
amount owed per staff member. Staff log in to see their own schedule and earnings.

```
street-taste-manager/
├── api/   Express + TypeScript + Prisma — REST API, owns all business logic and authorization
└── web/   React + TypeScript + Vite + Tailwind — the frontend
```

## Architecture

- **Auth**: Supabase Auth issues JWTs. The frontend talks to Supabase *only* for sign-in/out — never
  for data. Every API request carries the session's access token as `Authorization: Bearer <token>`;
  the Express API verifies it against Supabase's JWKS endpoint on every request.
- **Data**: All reads/writes go through the Express API, backed by Postgres (hosted on Supabase, used
  purely as a managed Postgres instance) via Prisma. There is no row-level-security-based
  authorization — the API enforces who can see and do what.
- **Money**: stored and computed server-side as integer cents to avoid floating-point rounding bugs;
  converted to dollars only for display.
- **Pay rates**: set per staff member by the manager. Each shift snapshots the staff member's rate at
  the moment it's created, so a later raise doesn't retroactively change what past shifts paid.

## Setup

### 1. Supabase project

You need an existing Supabase project (used for Postgres + Auth). From the dashboard, collect:

- **Project URL** and **Secret key** (Project Settings → API) → used by `api/.env`
- **Publishable key** (Project Settings → API) → used by `web/.env`
- **Database password** (Project Settings → Database → Connection string) → used to build `DATABASE_URL`

### 2. API (`api/`)

```bash
cd api
npm install
```

Copy `.env.example` to `.env` and fill in `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWKS_URL`,
and `DATABASE_URL` (the direct connection string, with your real database password substituted in).

Then apply the schema and seed demo accounts:

```bash
npx prisma migrate dev --name init
npm run seed
```

The seed script creates one manager and three staff accounts (via Supabase's invite-by-email flow —
they'll receive an email to set their own password; no shared demo password).

Run the API:

```bash
npm run dev       # http://localhost:3001
```

### 3. Web app (`web/`)

```bash
cd web
npm install
```

Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
(publishable key only — never the secret key), and `VITE_API_URL` (the running API's URL).

```bash
npm run dev        # http://localhost:5173
```

## Security notes

- The Supabase **secret key** only ever lives in `api/.env` and is read server-side. It's never sent
  to the browser or embedded in the built frontend bundle.
- All authorization (who can create shifts, see whose schedule, edit pay rates) is enforced in the
  Express API's middleware — not trusted from the client.
- Passwords are never stored, generated, or seen by the manager: staff set their own via Supabase
  Auth's invite-by-email flow.
- Request bodies are validated with `zod`; the API fails fast at boot if required environment
  variables are missing.

## Deployment

Designed for **web/** on Vercel or Netlify, and **api/** + Postgres on Railway or Render. Set the same
environment variables from each `.env.example` in your hosting provider's dashboard, run
`npx prisma migrate deploy` against production `DATABASE_URL` as part of your deploy step, and set
`CORS_ORIGIN` (api) to the deployed frontend's URL.
