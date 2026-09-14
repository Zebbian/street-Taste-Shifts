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

Then apply the schema:

```bash
npx prisma migrate dev --name init
```

The first admin account has to be created directly in the database (there's no signup flow — accounts
are only created by an existing admin/manager from inside the app). Create your Supabase Auth user
normally, then insert a matching row in the `users` table with `role = 'ADMIN'`.

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

Designed for **web/** on Vercel or Netlify, and **api/** on Render or Railway (Postgres stays on
Supabase either way — no separate database host needed).

### API on Render (free tier)

1. [render.com](https://render.com) → **New +** → **Web Service** → connect this GitHub repo.
2. Root directory: `api`
3. Build command: `npm install && npx prisma generate && npm run build`
4. Start command: `npx prisma migrate deploy && npm start`
5. Environment variables (Render dashboard → Environment): `SUPABASE_URL`, `SUPABASE_SECRET_KEY`,
   `SUPABASE_JWKS_URL`, `DATABASE_URL` — same values as local `api/.env` — plus `CORS_ORIGIN` (set to
   the deployed frontend's URL once you have it) and `NODE_ENV=production`.

Render's free tier spins the service down after ~15 minutes of inactivity; the first request after
that takes 30–60s to wake it back up. Fine for light/internal use, not for a high-traffic public app.

### Web app on Vercel

1. [vercel.com](https://vercel.com) → **Add New** → **Project** → import this repo.
2. Root directory: `web`
3. Framework preset: Vite (auto-detected). Build command/output directory default to `npm run build` /
   `dist` — no changes needed.
4. Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (publishable key only),
   and `VITE_API_URL` set to the deployed API's URL (e.g. the Render service URL from above).

After both are live, go back to the API's `CORS_ORIGIN` env var and set it to the real Vercel URL, then
redeploy the API so it accepts requests from the deployed frontend.
