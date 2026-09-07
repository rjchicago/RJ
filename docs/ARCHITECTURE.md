# Architecture

## Local request flow

```text
Browser :5173
  ├── page/static requests -> Vite dev server
  └── /api/* -> Vite proxy -> api:3001
                         ├── /health
                         ├── /api/config
                         └── /api/contact -> Turnstile (optional) -> Resend
```

The web app owns presentation, routing, and browser-side Turnstile rendering. The API owns validation, honeypot/rate limiting, captcha verification, and email delivery. Resend credentials and Turnstile secrets are API-only.

## Production boundary

The production web image serves the SPA through Nginx. The API image serves port 3001 internally. A reverse proxy/TLS layer must route one HTTPS origin as follows:

```text
/api/* -> API container
everything else -> web container
```

The Phase 3 production Compose source of truth is [deploy/docker-compose.prod.yml](../deploy/docker-compose.prod.yml). It runs as the dedicated `rjchicago` Compose project from `/home/ec2-user/rjchicago`, accepts both `rjchicago.com` and `www.rjchicago.com`, routes `/api/*` to `rj-api:3001`, and routes all other paths to `rj-web:80` through the shared Traefik `websecure` entrypoint and `acme` resolver. The apex currently redirects to `www`, so both hostnames must remain in the router rules. Traefik remains owned by the legacy master project; routine RJ deployment cannot restart that project or unrelated services.

## Repository ownership

- `apps/web`: React/Vite, frontend dependencies, Vite dev server, Nginx production image.
- `apps/api`: Node HTTP server, API dependencies, contact/config/health routes.
- Root: Compose orchestration, CI, shared examples, documentation, plans, and deployment configuration.

## Health endpoints

- API: `GET /health` returns JSON readiness.
- Web: `GET /healthz` returns plain-text `ok` from the production Nginx image.
