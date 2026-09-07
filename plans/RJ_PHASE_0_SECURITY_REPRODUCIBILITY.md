# Phase 0: build-context security and reproducibility

Status: done
Parent: [RJ_SITE_FOUNDATION.md](RJ_SITE_FOUNDATION.md)
Depends on: none

## 1. Outcome

Docker never receives local secret material as build context, dependency resolution is reproducible, and both application images build from version-controlled lockfile candidates.

## 2. Secret-handling boundary

- Never read or print `.env`.
- Never recursively list, read, hash, archive, copy, or print `.aws`.
- It is permitted to verify ignore behavior for the literal paths `.env`, `.aws`, and `.aws/placeholder` with `git check-ignore`.
- Do not inspect historical Docker layers or caches for possible secret content in this phase.
- Do not touch the existing untracked `.codex/` directory.

## 3. Todos

### P0-T1 — Add Docker context exclusions

Status: done

Files:

- create `.dockerignore`

Required literal rules:

```text
.aws
.codex
.env
.env.*
!.env.example
.git
.github
node_modules
**/node_modules
dist
**/dist
build
**/build
.cache
*.log
.DS_Store
plans
```

Keep `README.md`, application sources, package manifests, lockfiles, `nginx.conf`, and Dockerfiles available to the build when their Dockerfile references require them.

Checks:

```bash
test -f .dockerignore
for path in .env .aws .aws/placeholder .git .codex web/node_modules web/dist; do grep -F "${path%%/*}" .dockerignore >/dev/null || true; done
```

Pass criterion: a targeted Docker context audit confirms `.env`, `.aws`, `.git`, and `.codex` are excluded and `.env.example` is not excluded. The audit must report path inclusion/exclusion only, never file contents.

### P0-T2 — Track dependency locks

Status: done

Files:

- modify `.gitignore`
- add `web/package-lock.json`
- add `api/package-lock.json`

Remove the `package-lock.json` ignore rule. Keep `node_modules/` ignored. Regenerate locks from the existing manifests with Node 22/npm in the project containers if either local lock does not match its manifest. Review lock diffs before staging.

Checks:

```bash
git check-ignore web/package-lock.json api/package-lock.json && exit 1 || true
git diff --check
npm --prefix web ci --ignore-scripts
npm --prefix api ci --ignore-scripts
```

Pass criterion: both locks are tracked candidates, clean installs succeed, and neither manifest changes unless dependency correction is explicitly amended into this plan.

### P0-T3 — Make image installation deterministic

Status: done

Files:

- modify `Dockerfile`
- modify `api/Dockerfile`

Replace each `npm install` with `npm ci`. Preserve Node 22, the existing `dev`, `build`, and Nginx stages, exposed ports, and commands. Do not upgrade base-image versions in this todo.

Checks:

```bash
docker build --target dev -t rj-local:web-dev .
docker build -t rj-local:web .
docker build -f api/Dockerfile -t rj-local:api .
```

Pass criterion: all three builds complete from the committed manifests and locks.

### P0-T4 — Validate repository hygiene

Status: done

Files: no intended changes

Checks:

```bash
git ls-files | rg '(^|/)(\.env($|\.)|\.aws(/|$))' | rg -v '(^|/)\.env\.example$' && exit 1 || true
git check-ignore -q .env
git check-ignore -q .aws/placeholder
git diff --check
git status --short
```

Pass criterion: no sensitive path is tracked, required ignores succeed, only scoped files are changed, and `.codex/` remains untouched.

## 4. Acceptance criteria

- [x] `.dockerignore` excludes every named sensitive/local path.
- [x] `.env.example` remains usable as tracked documentation.
- [x] Both lockfiles are present as unignored Git additions and accepted by `npm ci`.
- [x] Development, production-web, and API images build successfully.
- [x] No secret value appears in command output, logs, commits, or plans.

## 5. Out of scope

- Unrelated or manifest-range dependency upgrades
- CI workflow redesign
- Docker image hardening beyond deterministic installation
- Docker cache incident response
- AWS inventory

## 6. Amendments

- 2026-09-06, P0-T2: `npm --prefix web audit --omit=dev --audit-level=low` reported two high-severity production advisories through `react-router-dom`/`react-router` versions 7.12.0-7.18.1 (GHSA-qwww-vcr4-c8h2). Corrected decision: permit `npm audit fix --package-lock-only --ignore-scripts` to select a patched version already allowed by the existing `react-router-dom` manifest range, without changing `web/package.json`; rerun clean install, production-only audit, lint, and build. Unrelated or manifest-range-changing upgrades remain out of scope.
- 2026-09-06, P0-T4: the original tracked-sensitive-path command also matched the intentionally tracked `.env.example`. Corrected check: retain the broad match but exclude only the exact safe path `(^|/)\.env\.example$` before deciding that sensitive material is tracked. Acceptance intent and all other checks are unchanged.

## 7. Implementation record

- 2026-09-06, P0-T1: Docker build probes rejected `.env`, `.aws`, `.git`, and `.codex`; a separate probe successfully copied the safe `.env.example`. No protected file content was read or emitted.
- 2026-09-06, P0-T2: Node 22-compatible clean installs succeeded for `web` and `api`. The amended lock-only advisory fix resolved `react-router-dom` and `react-router` to 7.18.3; production-only npm audit reported zero vulnerabilities. Frontend lint and production build passed.
- 2026-09-06, P0-T3: `rj-local:web-dev`, `rj-local:web`, and `rj-local:api` built successfully with `npm ci`; Dockerfiles retained their existing stages, ports, and commands.
- 2026-09-06, P0-T4: tracked-sensitive-path, ignore, lockfile-presence, lint, build, and whitespace checks passed. The pre-existing untracked `.codex/` directory remained untouched.
