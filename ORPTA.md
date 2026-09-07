# RJ planning and implementation contract

RJ uses one durable plan as the source of truth for work whose context must survive a session boundary.

## When a plan is required

Create or update a plan for any feature, milestone, refactor, migration, deployment, security-sensitive change, cross-application change, or delegated implementation. Skip a formal plan only for an obvious low-risk change contained in five or fewer known files.

## Plan readiness

A plan is `ready` only when the problem is evidenced, decisions are fixed, exact files and identifiers are named, interfaces/defaults/routes are explicit, todos are ordered, tests and commands are executable, acceptance criteria are measurable, and out-of-scope behavior is stated. If a production fact is unknown, add a precise discovery todo and keep the affected plan `draft`.

Plan status in the file is authoritative. Persist `in-progress` before editing or dispatching work, and persist `done` only after acceptance checks pass. Amendments are append-only and must record date, affected todo, evidence, corrected decision, and downstream impact.

## Research and delegation

Research is read-only and bounded. Every reported claim should carry `path:line`; missing identifiers must be reported as `not found`. A worker receives one isolated todo with exact ownership and must stop when the contract is incomplete. The coordinator owns plan status updates and integration review.

## Secret handling

`.env` and `.env.*` are secret files. `.aws/` may contain credentials and is opaque by default. Plans may authorize only narrowly scoped inspection that emits non-secret metadata. Never place secret values in command output, plans, commits, Docker contexts, image layers, CI artifacts, or documentation. `.codex/` is user state and is outside normal work.

## Implementation lifecycle

1. Read the root and active child plan.
2. Select the first dependency-satisfied pending todo.
3. Mark the plan/todo `in-progress` in the file.
4. Edit only named files and run named checks.
5. Record material results and amendments.
6. Mark the todo `done` only after its acceptance criteria pass.
7. After all todos pass, perform integration review and mark the plan `done`.

## RJ conventions

The deployable applications live under `apps/web` and `apps/api`. The root intentionally has no package manifest or task wrapper. Use direct commands such as `docker compose up --build` and `npm --prefix apps/web run build`.
