# Development

## Prerequisites

- Docker with Compose v2
- free local ports 5173 and 3001
- `.env` copied from `.env.example` (the API Compose service requires the file; values may remain blank for non-email local checks)

## First run

```bash
cp .env.example .env
docker compose up --build
```

Open `http://localhost:5173`. Check `http://localhost:3001/health` for API readiness.

## Daily workflow

```bash
docker compose up -d
docker compose logs -f rj api
docker compose down
```

Frontend files under `apps/web` are volume-mounted and Vite provides HMR. API files under `apps/api` are volume-mounted and Node watch mode restarts the process. Recreate after changing environment or Compose configuration:

```bash
docker compose up -d --force-recreate api rj
```

Rebuild after changing a Dockerfile, package manifest, or lockfile:

```bash
docker compose build
docker compose up -d
```

## Native focused checks

```bash
npm --prefix apps/api ci
npm --prefix apps/api run lint
npm --prefix apps/web ci
npm --prefix apps/web run lint
npm --prefix apps/web run build
```

This is also the CI source-validation sequence. The API tests use Node's built-in test runner; the web tests use Vitest and run offline with external services mocked.

## Troubleshooting

- Port already allocated: inspect the listener before stopping it; the Snipps stack commonly uses 3001.
- API unhealthy: run `docker compose logs api` and confirm `.env` exists. Do not print the file.
- Browser API requests fail: confirm the web proxy target remains `http://api:3001` and both services share the Compose network.
- Full reset: `docker compose down -v` removes only RJ's unnamed/local Compose state; use it only when intentionally resetting local data.

## Safety

Never commit `.env` or inspect/print `.aws`. Do not include secret values in logs, issue reports, plans, or Docker contexts.
