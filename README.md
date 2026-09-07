# RJChicago

Personal portfolio site built with React, Vite, and a small Node contact API.

## Architecture

| App | Location | Development port | Production role |
|---|---|---:|---|
| Web | `apps/web` | 5173 | Vite development server; Nginx static SPA image |
| API | `apps/api` | 3001 | Node contact/config service |

The browser talks to the web app. Vite proxies `/api/*` to the API during local development. Production routing must send the same `/api/*` paths to the API service and all other paths to the web service.

## Quick start

Prerequisites: Docker with Compose v2. Copy `.env.example` to `.env`, fill only the values needed for contact delivery/captcha, then run:

```bash
docker compose up --build
```

Open [http://localhost:5173](http://localhost:5173). API health is available at [http://localhost:3001/health](http://localhost:3001/health).

Stop the stack with `docker compose down`. See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for the daily workflow and troubleshooting.

## Direct application commands

```bash
npm --prefix apps/api run lint
npm --prefix apps/web run lint
npm --prefix apps/web run build
```

There is intentionally no root `package.json` or task wrapper. Application lockfiles are versioned and image builds use `npm ci`.

## Validation

```bash
npm --prefix apps/api ci
npm --prefix apps/api run lint
npm --prefix apps/api test
npm --prefix apps/web ci
npm --prefix apps/web run lint
npm --prefix apps/web test
npm --prefix apps/web run build
```

## Contact form

The contact form calls `GET /api/config` and `POST /api/contact`. The API validates input, rejects the honeypot, applies an in-memory rate limit, optionally verifies Cloudflare Turnstile, and sends through Resend. It never exposes the Resend key to the browser. Configuration is documented in [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

## Documentation

- [Development](docs/DEVELOPMENT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Configuration](docs/CONFIGURATION.md)
- [Plans](plans/README.md)

AWS deployment automation is planned but not yet implemented. See [plans/RJ_SITE_FOUNDATION.md](plans/RJ_SITE_FOUNDATION.md).

The production topology is now version-controlled in [deploy/docker-compose.prod.yml](deploy/docker-compose.prod.yml); automated ECR publishing and SSM rollout remain Phase 4 work.

## License

MIT
