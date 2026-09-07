# RJ site foundation and deployment program

Status: draft
Owner: repository maintainer
Planning contract: ORPTA-compatible
Created: 2026-09-06
Scope: make RJ safe, reproducible, testable, documented, and automatically deployable before undertaking broad site redesign

## 1. Outcome

RJ has one documented development workflow, deterministic dependency installation, automated validation, an explicit production topology, and an immutable AWS deployment with health verification and rollback. Local credentials never enter Git, Docker build contexts, images, logs, plans, or CI artifacts.

This root plan coordinates child contracts. It is intentionally `draft` until the production discovery gate in Phase 3 records non-secret infrastructure identifiers and resolves the image registry and host-routing contracts. Phases 0-2 are otherwise specified and may be promoted into a separate ready implementation unit if work must begin before production discovery.

## 2. Evidence and existing behavior

- `.gitignore:6` ignores `.aws`; `.gitignore:35-37` ignores environment files, but `.gitignore:27` also ignores `package-lock.json`.
- No `.dockerignore`, root `package.json`, `Makefile`, `AGENTS.md`, `ORPTA.md`, test file, production Compose file, or deployment-control workflow is tracked (`git ls-files`, observed 2026-09-06).
- `Dockerfile:4-6` and `Dockerfile:13-16` copy package manifests and run `npm install`; the API image follows the same non-lockfile pattern in `api/Dockerfile`.
- `docker-compose.yml:10-12` mounts frontend source for HMR; `docker-compose.yml:19-31` does not mount API source and declares no health checks.
- `web/vite.config.js:15-19` proxies `/api` to the API during development.
- `nginx.conf:7-15` serves SPA/static paths but has no production `/api` routing contract.
- `.github/workflows/docker.yml:21-88` builds and publishes two Docker Hub images but has no lint, test, smoke-test, deployment, public health verification, or rollback job.
- The frontend calls `GET /api/config` and `POST /api/contact` in `web/src/App.jsx`; the API exposes those routes plus `GET /health` in `api/server.js`.
- The local worktree contained an untracked `.codex/` directory on 2026-09-06. It is user state and is outside this program.

## 3. Fixed program decisions

| Area | Decision |
|---|---|
| Workflow | Add an RJ-specific `AGENTS.md` and `ORPTA.md` derived from the Snipps contract, simplified for this repository. |
| Canonical local runtime | Docker Compose is the documented default; native Node commands remain supported for focused work. |
| Dependencies | Version each application's lockfile under `apps/web` and `apps/api` after the Phase 1 move; use `npm ci` in CI and image builds. |
| Repository layout | Move deployable applications to `apps/web` and `apps/api`; keep the root free of a package manifest, workspace framework, Makefile, or task runner. |
| Runtime shape | Retain separate `web` and `api` containers. Do not merge processes or add a framework migration. |
| Public routing | One HTTPS origin: `/api/*` routes to the API and all other paths route to the web container. |
| Registry | Production images use Amazon ECR and full 40-character Git SHA tags. Docker Hub publishing is retired after ECR deployment succeeds. |
| AWS authentication | GitHub Actions uses OIDC and a least-privilege deploy role; no long-lived AWS access keys in GitHub secrets. |
| Host control | Deploy through AWS Systems Manager, not inbound SSH from Actions. |
| Release unit | Web and API deploy together under one Git SHA and roll back together. |
| Secrets | Production secrets remain host-managed or use an approved external secret store; Compose and deployment scripts never synchronize secret values. |
| Tests | Use Node's built-in test runner for the dependency-free API; use Vitest + Testing Library + jsdom for React. |
| Scope discipline | Operational foundation precedes broad component/CSS refactoring or visual redesign. |

## 4. Phase map and dependencies

| Priority | Child plan | Depends on | Completion signal |
|---:|---|---|---|
| 0 | [RJ_PHASE_0_SECURITY_REPRODUCIBILITY.md](RJ_PHASE_0_SECURITY_REPRODUCIBILITY.md) | none | sensitive paths excluded from Docker context; lockfiles committed; deterministic images build |
| 1 | [RJ_PHASE_1_DEVELOPMENT_DOCUMENTATION.md](RJ_PHASE_1_DEVELOPMENT_DOCUMENTATION.md) | Phase 0 | organized `apps/` layout, direct Docker/npm workflow, and accurate README, AGENTS, and ORPTA contracts |
| 2 | [RJ_PHASE_2_VALIDATION_CI.md](RJ_PHASE_2_VALIDATION_CI.md) | Phases 0-1 | lint, unit tests, builds, and smoke checks gate image publication |
| 3 | [RJ_PHASE_3_PRODUCTION_TOPOLOGY.md](RJ_PHASE_3_PRODUCTION_TOPOLOGY.md) | Phases 0-2 | production Compose/routing contract validated without secret disclosure |
| 4 | [RJ_PHASE_4_AWS_DEPLOYMENT.md](RJ_PHASE_4_AWS_DEPLOYMENT.md) | Phase 3 | main deploys immutable release; manual status/deploy/rollback works |
| 5 | future plan, not created here | Phase 4 | maintainability, accessibility, performance, content, and visual enhancements |

Do not implement a child plan unless its own status is `ready` or `in-progress` and it has no unresolved gates. The coordinator is the sole writer of plan statuses during delegated work.

## 5. Program acceptance

The program is complete only when:

- [x] `.env`, every `.env.*` secret variant, `.aws`, `.git`, `.codex`, dependency directories, and build outputs are excluded from Docker contexts.
- [x] Both lockfiles are present as unignored Git additions and every automated image install uses `npm ci`; Phase 1 moves them with their applications.
- [ ] A new contributor can follow the root README from a clean checkout to a healthy local site.
- [ ] `AGENTS.md` and `ORPTA.md` make planning thresholds, secret boundaries, checks, plan lifecycle, and resumption unambiguous.
- [ ] CI gates image publication on frontend/API lint, tests, builds, and a Compose smoke test.
- [ ] Production routing for `/api/*` and SPA routes is version-controlled and health checked.
- [ ] GitHub uses AWS OIDC, publishes immutable ECR images, and invokes SSM deployment without copying secret files.
- [ ] A failed release automatically restores the recorded previous web/API pair.
- [ ] Manual status, deploy-by-SHA, and rollback operations work through GitHub Actions and an authorized local operator path.
- [ ] Documentation names exact recovery behavior and accurately describes remaining limitations.

## 6. Out of scope

- Redesigning page content, information architecture, branding, or animation
- Migrating React to TypeScript, Next.js, Astro, or another frontend stack
- Replacing the Node HTTP API with Express or another server framework
- Adding a database, authentication, CMS, analytics, or persistent rate-limit service
- Reading, copying, committing, logging, or migrating secret values from `.env` or `.aws`
- Blue/green or zero-downtime traffic-atomic deployment
- Infrastructure-as-code for the full AWS account
- Multi-region deployment, Kubernetes, or CDN migration

## 7. Program risks

| Risk | Mitigation |
|---|---|
| Existing `.aws` content contains credentials | Treat the directory as opaque by default; Phase 3 inventory records only safe filenames/resource identifiers and stops on any credential-shaped material. |
| Local build context has already included secrets | Add `.dockerignore` first; do not inspect Docker cache/history for secret contents without a separate security response plan. |
| Deployment design assumes Snipps infrastructure is reusable | Phase 3 verifies account, region, ECR, instance, SSM, Traefik, paths, and IAM before Phase 4 becomes ready. |
| Two containers can briefly run mixed versions | Use one release SHA, verify both image IDs, and document the brief sequential-recreation window. |
| Contact email fails while web remains healthy | Require API functional health/readiness and a synthetic config check; do not send real email during routine deployment verification. |
| Scope expands into a redesign | Keep Phase 5 separate and begin it only after operational program acceptance. |

## 8. Resumption

1. Read this root plan and all child-plan statuses.
2. Read append-only Amendments in the root and active child.
3. Select the earliest dependency-satisfied child that is not `done`.
4. Within that child, resume the first pending or evidenced `in-progress` todo.
5. Never inspect `.env` values or recursively print `.aws` while resuming.

## 9. Amendments

Append entries here; do not rewrite historical decisions silently.

- 2026-09-06, Phase 1 and downstream: maintainer rejected a root `package.json` and preferred the simpler Snipps-style application layout. Corrected decision: move `web` to `apps/web` and `api` to `apps/api`, move application-specific Docker/Nginx files with their app, retain root Compose and documentation, and use direct `docker compose` plus `npm --prefix apps/...` commands. Phase 1, Phase 2, Phase 3, and Phase 4 contracts were updated; Phase 0 remains an accurate historical record of its completed paths.
