# Phase 2: automated validation and CI gates

Status: done
Parent: [RJ_SITE_FOUNDATION.md](RJ_SITE_FOUNDATION.md)
Depends on: Phases 0-1

## 1. Outcome

API and contact-form behavior have focused automated coverage, CI validates source and production artifacts before publishing, and a Compose smoke test proves the frontend/API integration.

## 2. Fixed test design

- API: Node 22 built-in `node:test`; factor pure behavior from `apps/api/server.js` into `apps/api/contact.js`.
- Web: Vitest, React Testing Library, `@testing-library/jest-dom`, `@testing-library/user-event`, and jsdom.
- External calls: stub `globalThis.fetch`; tests never call Resend or Turnstile over the network.
- CI installs with `npm ci` from committed locks.
- Pull requests validate but never authenticate to a registry or publish images.

## 3. Todos

### P2-T1 — Extract and test API contact behavior

Status: done

Files:

- create `apps/api/contact.js`
- create `apps/api/contact.test.js`
- modify `apps/api/server.js`
- modify `apps/api/Dockerfile`
- modify `apps/api/package.json`
- update `apps/api/package-lock.json`

Move and export pure helpers for cleaning, email validation, submission validation, HTML/text formatting, and rate-limit state. Keep route behavior and public JSON response shapes unchanged. Export a rate-limit factory so tests use isolated state; production creates one instance with the existing 10-minute window and five-request limit.

Add `"test": "node --test"`. Test exact cases:

1. valid minimal submission;
2. honeypot rejection;
3. invalid and overlong email;
4. message boundaries at 19, 20, 3000, and 3001 characters;
5. optional-field limits;
6. HTML escaping of all five special characters;
7. text formatting preserves message newlines;
8. sixth request from one IP is limited and a different IP is not;
9. expired rate window resets.

Checks:

```bash
npm --prefix apps/api ci
npm --prefix apps/api run lint
npm --prefix apps/api test
```

Pass criterion: all cases pass and `GET /health`, `GET /api/config`, and `POST /api/contact` retain their route names and response schema.

### P2-T2 — Harden proxy IP handling

Status: done

Files:

- modify `apps/api/server.js`
- modify `apps/api/contact.test.js`
- modify `docs/CONFIGURATION.md`
- modify `.env.example`

Add `TRUST_PROXY` with default `false`. When false, use `request.socket.remoteAddress` and ignore `X-Forwarded-For`. When true, use the first valid non-empty address in `X-Forwarded-For`, falling back to the socket address. Production Compose must set `TRUST_PROXY=true` only because the API is reachable through the controlled reverse proxy; local development leaves it false.

Checks:

```bash
npm --prefix apps/api test
rg -n 'TRUST_PROXY' .env.example apps/api/server.js docs/CONFIGURATION.md
```

Pass criterion: spoofed forwarding headers do not affect rate limiting by default, and trusted-proxy behavior has unit coverage.

### P2-T3 — Add frontend contact tests

Status: done

Files:

- create `apps/web/src/test/setup.js`
- create `apps/web/src/App.test.jsx`
- create or modify `apps/web/vitest.config.js` only if Vite config cannot host test settings cleanly
- modify `apps/web/package.json`
- update `apps/web/package-lock.json`

Add scripts `"test": "vitest run"` and `"test:watch": "vitest"`. Test exact cases:

1. initial config request uses `/api/config`;
2. form remains unavailable until configuration resolves;
3. captcha-required-without-site-key disables submission and shows an actionable state;
4. valid non-captcha submission posts JSON to `/api/contact`;
5. successful response clears the form and reports success;
6. API error preserves user input and shows the returned error;
7. route `/contact` renders under `BrowserRouter` without uncaught errors.

Mock Turnstile rather than loading its network script.

Checks:

```bash
npm --prefix apps/web ci
npm --prefix apps/web run lint
npm --prefix apps/web test
npm --prefix apps/web run build
```

Pass criterion: all tests pass offline and the production frontend build succeeds.

### P2-T4 — Document the direct validation sequence

Status: done

Files:

- modify `docs/DEVELOPMENT.md`
- modify root `README.md`

Document this exact source-validation sequence without adding a root package or wrapper script:

Checks:

```bash
npm --prefix apps/api ci
npm --prefix apps/api run lint
npm --prefix apps/api test
npm --prefix apps/web ci
npm --prefix apps/web run lint
npm --prefix apps/web test
npm --prefix apps/web run build
```

Pass criterion: every documented command exists and the sequence matches the CI `source-validation` job step-for-step.

### P2-T5 — Rebuild CI as validation then publication

Status: done

Files:

- modify `.github/workflows/docker.yml`
- optionally create `docker-compose.ci.yml` if isolation from the development Compose file is required

Workflow jobs:

1. `source-validation`: checkout, Node 22, cached `npm ci` for both applications, root lint/tests/build;
2. `image-validation`: Buildx build of production web and API images for `linux/amd64`, no push;
3. `smoke-test`: build/start Compose without real Resend or Turnstile credentials, wait for health, request `/`, `/api/config`, and `/health`, always collect sanitized service logs and shut down;
4. `publish`: push only on `main` or `v*`, depend on all validation jobs, and retain Docker Hub temporarily until Phase 4 replaces it with ECR.

Use least permissions: validation jobs `contents: read`; Docker Hub publish needs no `packages: write`. Pin action major versions consistently. Do not expose Compose-rendered environment or use `docker compose config` in logs.

Checks:

```bash
npm --prefix apps/api run lint
npm --prefix apps/api test
npm --prefix apps/web run lint
npm --prefix apps/web test
npm --prefix apps/web run build
docker compose build
docker compose up -d
curl --fail http://localhost:5173/
curl --fail http://localhost:5173/api/config
curl --fail http://localhost:3001/health
docker compose down
```

Pass criterion: local equivalents pass; a pull request run validates without registry login; publishing cannot run if any validation job fails.

## 4. Acceptance criteria

- [x] API validation, formatting, rate limiting, and trusted-proxy logic have deterministic tests.
- [x] Contact UI configuration, submission, success, and error states have offline tests.
- [x] Documentation and CI share the same direct `npm --prefix apps/...` validation sequence without a root package/task wrapper.
- [x] CI validation precedes publication and uses versioned application lockfiles.
- [x] Compose smoke tests prove the same-origin `/api` development path.

## 5. Out of scope

- Browser end-to-end automation
- Sending a live contact email in CI
- Persistent/distributed rate limiting
- Code-coverage percentage gates
- Production deployment

## 6. Amendments

- 2026-09-06, all todos: Phase 1 was amended to move applications to `apps/web` and `apps/api` and prohibit a root package/task wrapper. Corrected all file paths and commands. P2-T4 now documents the direct validation sequence instead of creating or modifying a root `package.json`; CI remains the automated aggregate gate.
- 2026-09-06, P2-T1: isolated container smoke testing showed `apps/api/server.js` imports the newly extracted `contact.js`, but `apps/api/Dockerfile` copied only `server.js`; the API image exited at startup. Corrected contract and implementation: copy `contact.js` into the image and include the Dockerfile in P2-T1 ownership. Rebuild and rerun image/runtime checks before marking P2-T5 done.

## 7. Implementation record

- 2026-09-06, P2-T1: extracted pure contact helpers to `apps/api/contact.js`; added eight Node tests covering validation, limits, escaping, text formatting, rate limiting, and proxy IP selection. API lint and tests passed.
- 2026-09-06, P2-T2: added `TRUST_PROXY=false` default behavior, trusted forwarding mode, safe example/docs entries, and unit coverage. API tests passed.
- 2026-09-06, P2-T3: added Vitest/jsdom/Testing Library setup and five offline contact-route tests. Web lint, tests, and production build passed with zero npm audit findings.
- 2026-09-06, P2-T4: documented the exact direct application validation sequence in the root README and development guide.
- 2026-09-06, P2-T5: replaced the single publish-only workflow with source validation, production image validation, Compose smoke test, and gated Docker Hub publication jobs. YAML parse, local checks, and isolated runtime smoke passed. The canonical host-port smoke was attempted but port 3001 remained occupied by `snipps-server`; no unrelated container was stopped.
