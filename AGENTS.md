# RJ agent workflow

RJ uses a lightweight ORPTA workflow for durable, cross-file work. Read `ORPTA.md` before planning or implementing a milestone, feature, refactor, security change, deployment change, or delegated task.

## Repository shape

- `apps/web/` is the React/Vite frontend and owns its package manifest, lockfile, Dockerfile, Nginx configuration, and source.
- `apps/api/` is the Node contact API and owns its package manifest, lockfile, Dockerfile, and server source.
- The root owns Docker Compose, repository documentation, deployment plans, and CI configuration.
- There is intentionally no root `package.json`, workspace, Makefile, or task runner.

## Safety boundaries

- Treat `.env` and every `.env.*` file as secret. Never print, paste, commit, archive, or include their values in plans or logs.
- Treat `.aws/` as opaque by default. Do not recursively list, read, hash, copy, or print it unless an active plan authorizes a narrowly scoped inspection.
- `.codex/` is local/user state. Do not modify it unless the user explicitly asks.
- Preserve unrelated user changes and never use destructive Git commands without explicit authorization.

## Planning and implementation

- Direct work is allowed only for an obvious low-risk change contained in five or fewer known files.
- Plans live in `plans/`; their frontmatter/status is authoritative.
- A plan must name exact files, identifiers, defaults, commands, tests, acceptance criteria, and out-of-scope behavior.
- Amendments are append-only. If reality contradicts a plan, record evidence and the corrected contract before continuing.
- The coordinator updates plan statuses. Never assign concurrent workers to the same file.
- Use `apply_patch` for content edits. Use `git mv` for tracked renames when the Git index is writable; otherwise use filesystem moves and let Git detect renames.

## Canonical checks

```bash
npm --prefix apps/api run lint
npm --prefix apps/web run lint
npm --prefix apps/web run build
docker compose build
```

Phase-specific plans may add tests, smoke checks, or deployment checks. Do not claim a check passed without recording its command and result.

## Resumption

Read the root plan, the active child plan, current statuses, amendments, and worktree before resuming. Continue from the first dependency-satisfied pending todo; do not restart completed work blindly.
