# Configuration

Create `.env` from `.env.example`. `.env` is ignored and secret-bearing; never commit or print it.

| Variable | Required | Consumer | Exposure |
|---|---|---|---|
| `RESEND_API_KEY` | for contact delivery | API | secret |
| `CONTACT_TO_EMAIL` | optional; API has a documented fallback | API | private destination |
| `RESEND_FROM_EMAIL` | optional; API has a development fallback | API/Resend | sender identity |
| `TURNSTILE_SECRET_KEY` | optional; enables captcha verification | API | secret |
| `TURNSTILE_SITE_KEY` | required when the secret is set | API config → browser widget | public site key |
| `VITE_TURNSTILE_SITE_KEY` | legacy/public fallback | API config | public site key |
| `PORT` | optional; defaults to 3001 | API | non-secret |
| `NODE_ENV` | Compose sets `development` locally | API | non-secret |
| `VITE_API_PROXY_TARGET` | optional; defaults to `http://localhost:3001` natively and Compose sets `http://api:3001` | Vite | non-secret |
| `TRUST_PROXY` | optional; defaults to `false` | API | non-secret |

If `TURNSTILE_SECRET_KEY` is set without a site key, the API requires captcha while the frontend cannot render it; contact submission is intentionally disabled. For production, use a verified Resend sender/domain and allow the production hostname in Turnstile.

Production secrets belong on the deployment host or an approved secret manager. Production Compose must reference them without synchronizing secret files from GitHub or this repository.

Keep `TRUST_PROXY=false` for local development. Set it to `true` only when the API is reachable exclusively through a controlled reverse proxy that overwrites `X-Forwarded-For`.

Production uses `deploy/.env.example` as a safe variable-name reference and keeps the real environment at `/home/ec2-user/rjchicago/.env` on the shared EC2 host. The dedicated production Compose project is `rjchicago`; it joins the shared Traefik network but does not own Traefik. The production Compose definition sets `TRUST_PROXY=true` because Traefik is the controlled proxy.
