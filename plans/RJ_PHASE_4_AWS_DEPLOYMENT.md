# Phase 4: immutable AWS deployment and rollback

Status: in-progress
Parent: [RJ_SITE_FOUNDATION.md](RJ_SITE_FOUNDATION.md)
Depends on: Phase 3 complete

## 1. Outcome

Every validated push to `main` publishes immutable web/API images to ECR and deploys them through SSM as one release. Failed health verification restores the previously recorded pair. Operators can inspect status, deploy an existing SHA, or roll back through a manual GitHub workflow and an authorized local command.

Approved identifiers are local profile `rjchicago`, GitHub role `arn:aws:iam::524541702023:role/rj-github-deploy`, EC2 pull policy `rj-ecr-pull`, ECR repositories `524541702023.dkr.ecr.us-east-1.amazonaws.com/rj/web` and `/rj/api`, instance `i-0bd7b964d3f15a32e`, region `us-east-1`, dedicated deployment directory `/home/ec2-user/rjchicago`, and Compose project `rjchicago`.

## 2. Release-state contract

On the host, deployment-owned non-secret state lives under `/home/ec2-user/rjchicago/.deploy/`:

```text
.deploy/
├── compose/<sha>.yml
├── releases/<sha>.json
├── current.json
├── previous.json
├── history.log
└── deploy.lock
```

Each release JSON contains schema version, Git SHA, web ECR digest, API ECR digest, deployment timestamp, and result. It contains no environment values. Updates use write-to-temporary-file then atomic rename. `current.json` changes only after all health checks pass; the former current release becomes `previous.json`.

## 3. Deployment command interface

Create `aws/deploy-rj.sh` with exactly one operation:

```text
--status
--tag <40-character-lowercase-git-sha>
--rollback
```

Common options:

```text
--profile <aws-sso-profile>   local execution only
--no-profile                 GitHub Actions only
```

Invalid/multiple operations exit 2. Status is read-only. Deploy resolves both image tags to digests before host mutation. Rollback targets `previous.json` and refuses when absent or malformed.

## 4. Todos

### P4-T1 — Provision/verify least-privilege AWS identity

Status: done

Files:

- create `aws/README.md`
- add infrastructure policy documents under `aws/policies/` only if the repository owns them

Using exact Phase 3 identifiers, verify or create:

- ECR repositories `rj/web` and `rj/api` with immutable tags, scan-on-push, AES256 encryption, and lifecycle retention of 40 images;
- GitHub OIDC provider;
- role `rj-github-deploy` (`arn:aws:iam::524541702023:role/rj-github-deploy`) restricted to repository `rjchicago/RJ`, the `production` environment, ECR push actions, ECR digest reads, and SSM command execution against `i-0bd7b964d3f15a32e`;
- EC2 instance role able to authenticate/pull from those repositories;
- GitHub `production` environment with appropriate maintainer protection.

Never add static AWS credentials to repository or GitHub secrets.

Checks: exact read-only IAM/ECR/SSM queries are appended after Phase 3 discovery. Pass criterion: OIDC assumption succeeds from GitHub, SSM instance is online, tags are immutable, and unrelated repositories/instances are not authorized.

### P4-T2 — Implement safe SSM deployment script

Status: in-progress

Files:

- create `aws/deploy-rj.sh`
- create `aws/lib/remote-deploy.sh` if separating transported host logic improves quoting/testability

Required algorithm:

1. validate operation, profile mode, exact SHA, account, region, and instance;
2. for deploy, resolve both ECR tags to immutable digests and fail before SSM if either is missing;
3. checksum and transport `deploy/docker-compose.prod.yml` through SSM without `.env` or secret values;
4. acquire an exclusive host lock;
5. validate candidate Compose using the host-managed environment;
6. authenticate the instance to ECR and pull both digest-qualified images;
7. recreate `rj-web` and `rj-api` with `docker compose --project-name rjchicago` under one release operation; never run project-wide lifecycle commands against `/home/ec2-user/web/docker-compose.yaml`;
8. verify expected container image digests, Docker health, internal `/healthz` and `/health`, public `/`, and public `/api/config`;
9. atomically record current/previous/history state;
10. on failure, restore the prior locally available digest pair and rerun health checks;
11. return a nonzero result for a failed release even when restoration succeeds.

Sanitize output: log SHA, digest, service, health status, and SSM command ID only. Never print environment, headers, email addresses, request bodies, or AWS credentials.

Checks:

```bash
bash -n aws/deploy-rj.sh
shellcheck aws/deploy-rj.sh
./aws/deploy-rj.sh --status --profile rjchicago
```

Pass criterion: status is non-mutating; malformed SHAs fail locally; one known-good SHA deploys; an intentionally unhealthy candidate triggers automatic restoration and leaves the failed SHA out of `current.json`.

Before the first normal deployment, perform a one-time cutover transaction:

1. verify by container Compose labels that `web-rj-web-1` and `web-rj-api-1` are the exact legacy RJ services and record their image IDs, service names, router labels, and running state without inspecting environment values;
2. create `/home/ec2-user/rjchicago` as `ec2-user`, install the repository-owned Compose file, create the host-managed `.env` through an authorized operator path, and validate the candidate without printing expanded configuration;
3. pull both candidate digests before changing route ownership;
4. stop only the verified legacy RJ services using their exact master-project service targets, leaving Traefik and every unrelated master service running;
5. immediately start Compose project `rjchicago`, then run internal and public health checks;
6. if validation fails, stop only project `rjchicago`, restart the two recorded legacy RJ services, verify public recovery, and return failure;
7. after success, record completion in `.deploy/history.log`; removal of legacy RJ service definitions from the master Compose file is a separate reviewed cleanup, not part of routine deployment automation.

At no point may both generations advertise the same Traefik host/path routers longer than the bounded handoff window. The cutover implementation must use exact verified master-project service names and refuse to proceed if labels or ownership differ from the recorded preflight.

### P4-T3 — Publish immutable images after validation

Status: in-progress

Files:

- modify `.github/workflows/docker.yml`

Replace Docker Hub publication with one `publish-and-deploy` job that:

- runs only for pushes to `main`;
- needs every Phase 2 validation job;
- uses GitHub environment `production`;
- grants only `contents: read` and `id-token: write`;
- uses concurrency group `rj-production` with `cancel-in-progress: false`;
- assumes `arn:aws:iam::524541702023:role/rj-github-deploy` and verifies account `524541702023`;
- builds `linux/amd64` web and API images;
- tags both with `${{ github.sha }}` only;
- applies OCI revision/source labels;
- invokes `bash aws/deploy-rj.sh --no-profile --tag "$RELEASE_SHA"`.

Do not publish `latest`, branch, PR, partial-semver, or mutable production tags. Tag-triggered releases may be planned later.

Pass criterion: a validated `main` commit publishes both SHA tags and deploys them; PRs cannot assume AWS identity or publish.

### P4-T4 — Add manual production control workflow

Status: pending

Files:

- create `.github/workflows/deploy.yml`

Add `workflow_dispatch` input `action` with `status`, `deploy`, and `rollback`, default `status`; add optional `image_tag`. Validate a full lowercase 40-character SHA for deploy before AWS mutation. Use the same production environment, role, region, account check, concurrency group, and script as automatic deployment.

Pass criterion: status succeeds without mutation, malformed deploy inputs fail before SSM, known SHA deploy works, and rollback restores the recorded previous release.

### P4-T5 — Document and exercise recovery

Status: pending

Files:

- modify `deploy/README.md`
- modify `aws/README.md`
- modify root `README.md`

Document automatic failure restoration, manual rollback, status interpretation, release-state paths, log locations, IAM boundaries, mixed-version window, ECR retention, and recovery when `previous.json` or an image digest is unavailable.

Run and record:

1. status of current release;
2. deploy of a known-good existing SHA;
3. rollback to previous;
4. redeploy to the intended current SHA;
5. public web and API health after each mutation.

Pass criterion: production ends on the intended release, current/previous/history agree, and documentation matches observed behavior.

## 5. Program acceptance commands

Program acceptance:

```bash
npm --prefix apps/api run lint
npm --prefix apps/api test
npm --prefix apps/web run lint
npm --prefix apps/web test
npm --prefix apps/web run build
docker compose build
bash -n aws/deploy-rj.sh
shellcheck aws/deploy-rj.sh
./aws/deploy-rj.sh --status --profile rjchicago
curl --fail https://rjchicago.com/
curl --fail https://rjchicago.com/api/config
```

## 6. Out of scope

- SSH-based GitHub deployment
- Static AWS access keys
- Secret synchronization from the repository
- Database migration handling
- Blue/green or canary deployment
- Cross-region disaster recovery
- Automatic deployment of tags or pull requests

## 7. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Only one of two images exists | Resolve both digests before sending SSM mutation. |
| Concurrent manual/automatic deploy | GitHub concurrency plus exclusive host lock. |
| Host loses network access mid-release | Keep prior digests locally and restore from local images where possible. |
| Release state corrupts on interruption | Atomic rename and append-only history. |
| Rollback image expired from ECR | Retain 40 images and verify digest availability before mutation. |
| Secret appears in logs | Fixed sanitized logging contract; never enable shell tracing. |
| New and legacy services claim the same Traefik routes | Pre-pull, verify exact legacy ownership, use a bounded stop/start handoff, and automatically restore legacy services on failure. |
| RJ deployment disrupts shared infrastructure | Use project name `rjchicago`; never run broad Compose lifecycle or prune commands against the master project or shared host. |

## 8. Amendments

- 2026-09-06, program acceptance: Phase 1 now uses `apps/web` and `apps/api` with no root package/task wrapper. Replaced the nonexistent root `npm run check` command with the exact direct application validation sequence; deployment behavior is unchanged.
- 2026-09-07, deployment ownership: selected `/home/ec2-user/rjchicago` and Compose project `rjchicago`, modeled after Snipps. `/home/ec2-user/web/docker-compose.yaml` is treated as the legacy master stack that owns Traefik and unrelated services. Added an explicit, reversible first-release route handoff; subsequent deployments operate only on the dedicated RJ project.
- 2026-09-07, P4-T1: approved bootstrap created and verified the RJ ECR repositories, immutable/scan/encryption/lifecycle controls, GitHub OIDC role, and EC2 `rj-ecr-pull` policy. No static credentials or secret values were added. P4-T2 is now the active implementation todo; Phase 3 live validation is an execution gate of the first cutover release.
- 2026-09-07, P4-T2 implementation start: added `aws/deploy-rj.sh` with strict operation/SHA/profile validation, account guard, ECR digest preflight, sanitized SSM command submission, and dedicated `rjchicago` Compose targeting. `bash -n aws/deploy-rj.sh` and help-path validation pass. Health verification, atomic release state, automatic restoration, and the one-time legacy cutover remain to be implemented before marking P4-T2 done.
- 2026-09-07, P4-T2 implementation: added `aws/lib/remote-deploy.sh` for exclusive host locking, host-managed environment use, Compose validation/pull/up, container health gating, and atomic release metadata writes. The wrapper transports only the Compose/helper scripts and non-secret SHA/digest arguments. `bash -n aws/deploy-rj.sh aws/lib/remote-deploy.sh` and `git diff --check` pass. Automatic restoration and first-release legacy cutover sequencing remain before acceptance.
- 2026-09-07, P4-T2 recovery: rollback now reads only validated SHA/digest fields from `previous.json`, redeploys that pair through the dedicated Compose project, waits up to 60 seconds for both healthchecks, and records `rollback-success`. Wrapper rollback transports the helper only. Syntax/help and diff checks pass; legacy cutover and automatic restoration on a failed candidate remain before acceptance.
- 2026-09-07, P4-T2 automatic restoration: remote helper now traps deployment errors, attempts to restart the recorded `current.json` SHA, appends a sanitized restoration event, and preserves the original nonzero exit code. Syntax and diff checks pass. The first-release legacy-service handoff remains a separate cutover operation before P4-T2 can be accepted.
- 2026-09-07, Sol cutover preflight: read-only ECR inventory found no tagged images in either `rj/web` or `rj/api`; therefore no immutable paired release exists and no production mutation was attempted. Review also found the wrapper returned after asynchronous SSM submission and the workflow still published Docker Hub `latest`. Corrected the wrapper to wait for command completion and require SSM `Success`; converted the main-branch publish job to GitHub OIDC, ECR SHA-only `linux/amd64` images, account verification, production concurrency, and deployment invocation. YAML parse, shell syntax, and diff checks pass. P4-T3 remains in progress until a committed main build publishes the first pair.
- 2026-09-07, first-release bootstrap: the maintainer approved a two-stage rollout. The first PR publishes the matching ECR SHA pair but deliberately omits automatic deployment. After that merge, an authorized operator performs and validates the guarded legacy-to-`rjchicago` cutover. A follow-up PR adds automatic deployment to validated `main` releases. This temporary exception prevents duplicate Traefik route ownership during bootstrap and does not change the steady-state deployment contract.
- 2026-09-07, first cutover attempt: SSM command `09959a96-73a8-42d6-9086-6475e0fd980a` failed before stopping legacy services because the host does not expose the Compose v2 CLI plugin as `docker compose`. The cutover restoration trap ran and sanitized verification confirmed both legacy RJ containers remained running. Host evidence establishes standalone `docker-compose` version `2.29.2`; corrected host-side scripts to use that exact command. Downstream documentation and steady-state automation must preserve this host-specific command until the plugin is deliberately installed.
- 2026-09-07, first cutover success: SSM command `c3eb2e17-9026-4938-9cdc-2f7fa0e170cc` completed with `cutover-success` for immutable paired SHA `0935a18bc826c73e49e42c9fc738a57770e2df36`. Independent command `25331065-15d9-4750-a518-24f4a1374cc1` confirmed both dedicated-project containers healthy, no host-published ports, both legacy RJ containers stopped, and `current.json` present. External `/` and `/api/config` checks passed. The bootstrap exception is now retired; automatic deployment is enabled in the follow-up change. P4-T2 remains in progress until a steady-state deployment exercises the wrapper end to end.
- 2026-09-07, first automatic release diagnostics: main SHA `b4aec6160cfb094cd2eebc69ace5580f9ce01554` published both images, then deployment failed before SSM because `rj-github-deploy` lacked `ecr:DescribeImages`. Added only that action to the existing ECR statement scoped to `rj/web` and `rj/api`. A failed-job rerun then correctly encountered immutable existing tags before deployment. Corrected the workflow to detect and skip already-published SHA tags on retries, and corrected the steady-state wrapper to JSON-encode SSM command parameters. The prior production release remained healthy throughout.
- 2026-09-07, hostname routing correction: external verification found `rjchicago.com` returns a permanent redirect to `www.rjchicago.com`, while the production Traefik rules matched only the apex and therefore returned 404 after redirect. Corrected both web and `/api` router rules to accept the apex and `www`; validation must cover both public hostnames.
- 2026-09-07, first steady-state host failure: GitHub run `34136545686` published both immutable images, but SSM command `46d1ac38-0e7e-4ed3-87c8-ea731ec43eb9` failed during Compose pull with `no basic auth credentials`. Automatic restoration restarted the prior cached release with the corrected Compose labels; independent checks then returned `301` from the apex to `www`, `200` from `www` `/`, and `200` from `www` `/api/config`. Corrected the remote helper to obtain a short-lived ECR authorization token through the instance role and authenticate Docker before every pull; no credential is logged or persisted in repository state.
