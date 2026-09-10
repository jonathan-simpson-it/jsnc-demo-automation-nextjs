# JS&C — Next.js App (Marketing + AI Platform)

Jonathan Simpson & Co. — the marketing site and the private-markets AI
workspace, in one Next.js 16 App Router application (TypeScript + Tailwind),
with a PostgreSQL-backed SaaS control plane (Better Auth + Prisma).

> The Python backend lives in the separate
> [`jsnc-demo-automation-python`](https://github.com/jonathan-simpson-it/jsnc-demo-automation-python)
> repository. Deployment topology and the platform's architecture/security
> docs live in that repo's `docs/` directory (architecture.md,
> security-threat-model.md, migration-notes.md).

## Quick start

```bash
# Node 24 is required (.nvmrc); Prisma 7 needs >= 20.19.
# Start PostgreSQL (pgvector) once, from the Python repo:
#   docker compose up -d postgres

cd frontend
npm install                   # generates the Prisma client (postinstall)
cp .env.example .env          # set BETTER_AUTH_SECRET (openssl rand -base64 32)
npx prisma migrate dev        # create/update the local schema
npm run dev
```

Open http://localhost:3000.

- With no `RESEND_API_KEY`, magic links and invitations print to the dev
  server console as `[dev-email]` lines. Production requires Resend.
- Workspace surfaces (`/chat`, `/documents`, `/settings`, …) require sign-in;
  marketing pages stay public.
- The Python service is optional for auth/workspace work. When `BACKEND_URL`
  is unset it defaults to `http://127.0.0.1:8000`; fallback rewrites proxy
  `/api/*` and `/health` to it, while `/api/auth/*` and `/api/v1/*` are local
  route handlers.

## What lives here

- **Marketing pages** (static, editorial look): `/services`, `/work` (+ case
  studies), `/blog` (+ posts), `/products`, `/applications`, `/contact`,
  `/support`, `/compliance`, plus `robots.txt` and `sitemap.xml`.
- **Workspace pages** (gated, under `app/(app)/`): `/chat`, `/documents`,
  `/eval`, `/summary`, `/config`, `/mailbox`, `/review-hub`, `/radar`,
  `/telemetry`, `/workbench/*`, `/settings`.
- **Auth pages**: `/sign-in` (magic link), `/accept-invitation/[id]`.

## SaaS control plane

- Prisma owns all DDL (`prisma/schema.prisma`, `prisma/migrations/`); Python
  will read/write the same database in a later phase. See `PRODUCT.md` for
  product context and `docs/` in the Python repo for the architecture.
- Better Auth: magic link (Resend), organisation plugin with roles
  `owner`/`admin`/`analyst`/`reviewer`/`viewer`, single-use invitations that
  expire after 7 days, email verification required to accept an invitation.
- Tenant context always derives from the session (`lib/tenant.ts`); the BFF
  `/api/v1/*` handlers never accept an organisation id from the caller.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `BACKEND_URL` | `http://127.0.0.1:8000` | Python backend origin for fallback rewrites |
| `NEXT_PUBLIC_SITE_URL` | `https://jonathansimpson.co` | Metadata/canonical/sitemap origin |
| `DATABASE_URL` | – | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | – | Session/encryption secret (32+ chars) |
| `BETTER_AUTH_URL` | `http://localhost:3000` | Better Auth base URL |
| `RESEND_API_KEY` | – | Transactional email; unset = dev console fallback |
| `RESEND_FROM_EMAIL` | `JS&C AI <no-reply@…>` | Sender address |
| `NEXT_PUBLIC_BYOK_DEV` | – | `1` re-enables the pre-SaaS BYOK key dialog for local demos |

## Verification

```bash
npm run typecheck        # tsc --noEmit
npm run build            # production build
npm test                 # vitest integration suite (needs Docker Postgres)
```

The test suite migrates a disposable `payo_test` database, then drives real
magic-link sign-in, invitations (single-use, expiry) and cross-organisation
isolation against it.
