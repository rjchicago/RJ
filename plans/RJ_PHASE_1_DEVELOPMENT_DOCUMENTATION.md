# Phase 1: local development and repository contracts

Status: done
Parent: [RJ_SITE_FOUNDATION.md](RJ_SITE_FOUNDATION.md)
Depends on: Phase 0

## 1. Outcome

A clean checkout has a clear `apps/` layout and documented direct commands, frontend and API development reload predictably in Compose, service readiness is visible, and future agents follow an RJ-specific ORPTA and secret-safety contract.

## 2. Fixed interfaces

The repository root contains orchestration and project documentation only:

```text
apps/
├── api/
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
└── web/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── package-lock.json
    ├── public/
    └── src/
```

Keep `.github/`, `assets/`, `docs/`, `plans/`, `.dockerignore`, `.env.example`, `.gitignore`, `docker-compose.yml`, `LICENSE`, `README.md`, `AGENTS.md`, and `ORPTA.md` at the root. Do not add a root `package.json`, workspace configuration, Makefile, Justfile, or task-runner wrapper.

Canonical commands are direct:

```bash
docker compose up --build
docker compose up --build -d
docker compose logs -f rj api
docker compose down
npm --prefix apps/api run lint
npm --prefix apps/web run lint
npm --prefix apps/web run build
```

## 3. Todos

### P1-T1 — Adopt the `apps/` repository layout

Status: done

Files:

- move `web/` to `apps/web/`
- move `api/` to `apps/api/`
- move root `Dockerfile` to `apps/web/Dockerfile`
- move root `nginx.conf` to `apps/web/nginx.conf`
- create `apps/web/.dockerignore`
- create `apps/api/.dockerignore`
- modify `apps/web/Dockerfile`
- modify `apps/api/Dockerfile`
- modify `docker-compose.yml`
- modify `.github/workflows/docker.yml`

Use `git mv` so history remains legible. After the move:

- `apps/web/Dockerfile` uses application-local build context: `COPY package*.json ./`, `COPY . .`, and `COPY nginx.conf /etc/nginx/conf.d/default.conf`;
- `apps/api/Dockerfile` uses application-local build context: `COPY package*.json ./` and `COPY server.js ./`;
- Compose build contexts are `./apps/web` and `./apps/api`, each with local `Dockerfile`;
- Compose frontend volume is `./apps/web:/app`; API layout changes are completed in P1-T2;
- the existing workflow builds web with `context: ./apps/web` and API with `context: ./apps/api` plus `file: ./apps/api/Dockerfile`;
- each application-local `.dockerignore` excludes `.env`, `.env.*`, `.aws`, `.git`, `.codex`, `node_modules`, `dist`, `build`, `.cache`, logs, and OS/editor files; `apps/web/.dockerignore` must keep application sources, its lockfile, Dockerfile, and `nginx.conf` available;
- service names, image names, ports, Docker stages, and runtime behavior remain unchanged.

Do not leave compatibility copies or symlinks at root, `web/`, or `api/`.

Checks:

```bash
docker compose build
npm --prefix apps/api run lint
npm --prefix apps/web run lint
npm --prefix apps/web run build
test ! -e web
test ! -e api
test ! -e Dockerfile
test ! -e nginx.conf
```

Pass criterion: both application images and the frontend production bundle build from application-local contexts, lint passes, old paths are absent, and no root package/task wrapper exists.

### P1-T2 — Improve the Compose development loop

Status: done

Files:

- modify `docker-compose.yml`
- modify `apps/api/package.json`

Required changes:

- mount `./apps/api:/app` and preserve `/app/node_modules` only if dependencies are introduced;
- change API `dev` to `node --watch --env-file=../.env server.js` for native development;
- override the Compose API command to `node --watch server.js`, because Compose already injects `.env`;
- add API health check against `http://127.0.0.1:3001/health` using Node `fetch`;
- make the frontend depend on `api` with `condition: service_healthy`;
- add a frontend health check against the Vite root;
- retain ports `5173` and `3001`, service names `rj` and `api`, and proxy target `http://api:3001`.

Do not add production settings or expose secrets in Compose output.

Checks:

```bash
docker compose build
docker compose up -d
docker compose ps
curl --fail http://localhost:3001/health
curl --fail http://localhost:5173/
docker compose down
```

Pass criterion: both services become healthy, frontend reaches the API through `/api/config`, and editing `apps/api/server.js` causes the API process to restart without an image rebuild.

### P1-T3 — Add RJ agent and ORPTA contracts

Status: done

Files:

- create `AGENTS.md`
- create `ORPTA.md`
- create `plans/README.md`

Adapt the Snipps contracts with these RJ-specific requirements:

- ORPTA applies to plans, milestones, refactors, cross-service work, deployment, security-sensitive changes, and delegated implementation;
- direct work is allowed only for obvious low-risk changes contained in five or fewer known files;
- plans live in `plans/`, use status as the authoritative lifecycle record, and amendments are append-only;
- each implementation todo must name exact files, identifiers, checks, pass criteria, and out-of-scope behavior;
- `.env` and `.aws` are sensitive and opaque unless a plan explicitly authorizes a narrowly scoped inspection method;
- `.codex/` is local/user state and must not be changed unless explicitly requested;
- the coordinator alone updates plan statuses during parallel work;
- preserve user changes and never assign concurrent workers to the same file.

`plans/README.md` indexes the root and child plans and explains `draft`, `ready`, `in-progress`, and `done`.

Checks:

```bash
rg -n 'ORPTA|\.env|\.aws|Amendments|in-progress|five' AGENTS.md ORPTA.md plans/README.md
```

Pass criterion: a new agent can determine when to plan, what it may inspect, how to resume, and which checks govern the repository without consulting Snipps.

### P1-T4 — Rewrite developer documentation

Status: done

Files:

- modify `README.md`
- replace `apps/web/README.md`
- create `docs/DEVELOPMENT.md`
- create `docs/ARCHITECTURE.md`
- create `docs/CONFIGURATION.md`

Required content:

- root README: purpose, features, architecture table, Docker-first quick start, root commands, validation, deployment status, documentation index, and license;
- development guide: prerequisites, first run, daily loop, rebuild/recreate rules, health checks, native frontend/API commands, troubleshooting, and safe shutdown;
- architecture guide: browser → web → `/api` → API → Turnstile/Resend flow, ports, ownership boundaries, and production-routing requirement;
- configuration guide: document names, required/optional status, defaults, consumers, and whether each value is public or secret; copy descriptions from `.env.example` without printing `.env`;
- frontend README: concise frontend-specific entry points and link back to root docs; remove Vite template prose.

Do not claim deployment automation, tests, or production Compose exist until their phases are complete.

Checks:

```bash
rg -n 'docker compose|npm --prefix apps/|3001|5173|\.env\.example|health' README.md docs apps/web/README.md
git diff --check
```

Pass criterion: every documented command exists and documentation matches the Phase 1 repository state.

## 4. Acceptance criteria

- [x] `apps/web` and `apps/api` own their sources, manifests, locks, and Dockerfiles without compatibility copies.
- [x] Direct Docker Compose and application-local npm commands provide the canonical interface; no root package/task wrapper exists.
- [x] Web and API both reload during Compose development and report health.
- [x] RJ owns complete local `AGENTS.md` and `ORPTA.md` contracts.
- [x] Documentation is accurate, cross-linked, and free of secret values.
- [x] Vite boilerplate documentation is removed.

## 5. Out of scope

- Automated test implementation
- Production Compose or AWS automation
- Application restructuring or redesign
- Environment-variable renaming

## 6. Amendments

- 2026-09-06, P1-T1 and downstream: maintainer rejected the planned root `package.json` and requested the simpler Snipps-style layout. Corrected contract: move applications to `apps/web` and `apps/api`, move web Docker/Nginx configuration and the API Dockerfile with their owners, keep root Compose as orchestration, and document direct commands. P1-T1 now owns the migration and all later Phase 1 paths use the new layout.

## 7. Implementation record

- 2026-09-06, P1-T1: moved `web/` → `apps/web/`, `api/` → `apps/api/`, root Docker/Nginx files into `apps/web/`, and updated application-local Dockerfiles, Compose contexts, and workflow contexts. Added both app-local `.dockerignore` files. Old paths and root package/task files are absent.
- 2026-09-06, P1-T2: added Node watch mode, API/frontend health checks, API source mount, and `service_healthy` dependency ordering. `docker compose build` passed. Full-stack host-port check was blocked by the existing `snipps-server` container on port 3001; isolated temporary containers on ports 13001/15173 passed API health, web serving, and `/api/config` proxy checks. Existing Snipps containers were not stopped.
- 2026-09-06, P1-T2 follow-up: after the user stopped Snipps, the canonical `docker compose up -d --build` smoke test passed on ports 3001/5173. API `/health`, web `/`, and proxied `/api/config` returned successfully; containers were healthy/started and were then brought down cleanly.
- 2026-09-06, P1-T3: added RJ-specific `AGENTS.md`, `ORPTA.md`, and `plans/README.md`; required contract grep passed.
- 2026-09-06, P1-T4: replaced root and frontend boilerplate documentation and added `docs/DEVELOPMENT.md`, `docs/ARCHITECTURE.md`, and `docs/CONFIGURATION.md`; required documentation grep and `git diff --check` passed.
