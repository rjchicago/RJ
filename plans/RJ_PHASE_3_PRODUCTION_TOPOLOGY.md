# Phase 3: production topology and release contract

Status: in-progress
Parent: [RJ_SITE_FOUNDATION.md](RJ_SITE_FOUNDATION.md)
Depends on: Phases 0-2

## 1. Outcome

The repository contains a secret-free production Compose source of truth for a dedicated RJ web/API project, with verified routing, health checks, and host assumptions. RJ deploys from `/home/ec2-user/rjchicago` and joins the existing external Traefik network; it does not remain a service inside the legacy `/home/ec2-user/web` master Compose project.

## 2. P3-T0 readiness discovery gate

Status: done

This is read-only discovery. Do not implement later todos until its evidence is appended to this plan and placeholders below are replaced with exact values.

Permitted inspection:

- list names and file types directly inside `.aws` without printing content;
- inspect a candidate text file only after confirming it is a script or documentation file and scanning it locally for credential-shaped assignments;
- redact account IDs only from user-facing commentary, but record non-secret account/region/resource identifiers in this private repository plan only with maintainer approval;
- query AWS identity/resource metadata only through an explicitly selected local SSO profile and read-only commands.

Forbidden inspection/output:

- `.env` contents;
- credential/config file contents;
- private keys, access keys, session tokens, secret ARNs containing secret names, or Compose-expanded environment;
- recursive `.aws` dumps or copying `.aws` into the repository.

Facts to verify and record:

| Fact | Required evidence |
|---|---|
| AWS account and region | approved SSO profile plus `aws sts get-caller-identity` and configured region |
| ECR repositories | exact web/API repository URIs or `not found` |
| Production compute | exact EC2 instance ID or `not found`; instance is SSM managed and online |
| Host directory | exact absolute deployment directory, owner, and permissions |
| Reverse proxy | Traefik external network name, HTTPS entrypoint, certificate resolver, and hostname |
| Current deployment | container/image/Compose names only; never environment values |
| IAM | GitHub OIDC provider and deploy-role ARN or `not found`; EC2 instance role capabilities |
| Health URLs | internal API path, public web URL, and public API config URL |

Pass criterion: all facts have evidence or explicit `not found`; the maintainer approves exact non-secret identifiers; no credential material is emitted. Then amend this plan, replace placeholders, and change status to `ready` after Sol-level review.

## 3. Fixed topology

```text
Internet
  -> existing Traefik HTTPS entrypoint on shared Snipps EC2 host
     -> Host(`rjchicago.com`) && PathPrefix(`/api`) -> rj-api:3001
     -> Host(`rjchicago.com`)                       -> rj-web:80
```

Traefik owns TLS. Nginx owns SPA fallback and static caching only. The API is not published directly on a host port in production. Both services join the existing external `traefik` network shared with Snipps; no application-internal network is needed because Traefik reaches both directly.

The dedicated Compose project name is `rjchicago`, and its host directory is `/home/ec2-user/rjchicago`, owned by `ec2-user`. The existing `/home/ec2-user/web/docker-compose.yaml` remains the legacy master stack and continues to own Traefik and unrelated services. Phase 4 performs a one-time, reversible handoff of only the legacy RJ services; routine RJ releases never run `up`, `down`, or broad lifecycle commands against the master project.

## 4. Todos after discovery

### P3-T1 — Add production web health endpoint

Status: done

Files:

- modify `apps/web/nginx.conf`
- modify `apps/web/Dockerfile`

Add exact Nginx route `GET /healthz` returning status 200, content type `text/plain`, body `ok\n`, and `Cache-Control: no-store`. Add a production image `HEALTHCHECK` using a tool already present in the chosen Nginx image; do not install a package solely for health checking. Preserve SPA fallback and asset caching.

Checks:

```bash
docker build -t rj-local:web apps/web
docker run --rm -d --name rj-web-check -p 18080:80 rj-local:web
curl --fail http://127.0.0.1:18080/healthz
docker stop rj-web-check
```

Pass criterion: the container reports healthy and `/healthz` returns exactly `ok` with no-store caching.

### P3-T2 — Add production Compose source of truth

Status: done

Files:

- create `deploy/docker-compose.prod.yml`
- create `deploy/.env.example`

Services must be named `rj-web` and `rj-api`. Images use:

```text
524541702023.dkr.ecr.us-east-1.amazonaws.com/rj/web:${RJ_IMAGE_TAG:?set RJ_IMAGE_TAG to a full Git SHA}
524541702023.dkr.ecr.us-east-1.amazonaws.com/rj/api:${RJ_IMAGE_TAG:?set RJ_IMAGE_TAG to a full Git SHA}
```

Required behavior:

- `rj-web`: read-only filesystem, tmpfs for `/var/cache/nginx`, `/var/run`, and `/tmp`; port 80 only to Docker networks; `/healthz` health check; Traefik web labels.
- `rj-api`: `NODE_ENV=production`, `PORT=3001`, `TRUST_PROXY=true`; inject `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `RESEND_FROM_EMAIL`, `TURNSTILE_SECRET_KEY`, and `TURNSTILE_SITE_KEY` from host environment; API health check; Traefik `/api` labels with higher priority than web.
- both: restart `unless-stopped`, immutable-image contract, external `traefik` network.
- no `ports`, host bind mounts, AWS credential mounts, or literal secret values.

`deploy/.env.example` contains blank/safe examples only and documents `RJ_IMAGE_TAG` as exactly 40 lowercase hexadecimal characters.

Checks:

```bash
RJ_IMAGE_TAG=0000000000000000000000000000000000000000 docker compose --env-file deploy/.env.example -f deploy/docker-compose.prod.yml config --quiet
```

Pass criterion: Compose validates, contains exact discovered identifiers, exposes no host ports, and has no credential values.

### P3-T3 — Add production operations documentation

Status: done

Files:

- create `deploy/README.md`
- modify `docs/ARCHITECTURE.md`
- modify `docs/CONFIGURATION.md`
- modify root `README.md`

Document prerequisites, external network, dedicated host directory and Compose project name, secret ownership, manual pull/up/log/status flow, health endpoints, mixed-version window, and emergency rollback to a previous SHA. Distinguish the legacy master stack from the new RJ-owned stack. Commands must use exact discovered identifiers. Explicitly warn against broad Docker prune operations on a shared host.

Checks:

```bash
rg -n '<[A-Z_]+>' deploy docs README.md && exit 1 || true
rg -n 'rollback|health|secret|prune|RJ_IMAGE_TAG' deploy/README.md
```

Pass criterion: no placeholders remain and an authorized operator can perform and reverse a manual deployment without reading repository-local secret files.

### P3-T4 — Validate topology on production-like infrastructure

Status: pending

Files: no intended changes except recorded evidence and amendments

Validation cases:

1. web and API images have the same SHA label/tag;
2. both containers become healthy;
3. `/`, `/about`, and an unknown SPA route reach Nginx and do not return proxy 404;
4. `/api/config` reaches the API through the public hostname;
5. direct public access to API port 3001 is unavailable;
6. container restart preserves service availability after health recovery;
7. no secrets appear in Compose, container labels, deployment logs, or documentation.
8. the active RJ containers belong to Compose project `rjchicago`, while Traefik and unrelated services remain owned by the legacy master stack;
9. the one-time route handoff can restore the two legacy RJ services if the dedicated stack fails validation.

Pass criterion: all cases are recorded with date and non-secret evidence in this plan.

## 5. Out of scope

- Creating AWS deployment automation
- Replacing Traefik
- Zero-downtime blue/green routing
- Live contact-email submission as a routine health check
- Migrating secret values

## 6. Amendments

- 2026-09-06, P3-T1 and all application references: Phase 1 now moves the frontend to `apps/web` and the API to `apps/api`. Corrected production web configuration and Docker build paths; production topology and service contracts are unchanged.
- 2026-09-07, production ownership: `/home/ec2-user/web/docker-compose.yaml` is the existing master project, not the durable RJ deployment target. Adopted the Snipps-style dedicated directory `/home/ec2-user/rjchicago` and Compose project `rjchicago`. The new project consumes the shared external `traefik` network but does not own or restart Traefik. The Phase 4 first deployment must explicitly hand off duplicate router rules and preserve a rollback to the two legacy RJ services.

## 7. Discovery record

- 2026-09-06, P3-T0: safe top-level `.aws` entry-name inventory found `cman.pem`, `letsencrypt/`, `docker-compose.yaml`, `README.md`, `api/`, and `deploy.sh`. No contents were read. `cman.pem` is treated as credential material and is permanently excluded from inspection in this phase.
- 2026-09-06, P3-T0: no `AWS_PROFILE` is selected in the environment, so no AWS identity/resource query was attempted. Public DNS checks for `rjchicago.com` and `www.rjchicago.com` could not resolve from this environment. AWS account/region, ECR repositories, EC2/SSM target, host directory, Traefik network/resolver, IAM/OIDC, and health URLs remain `not established`.
- 2026-09-06, P3-T0: implementation is gated. Do not replace placeholders or execute P3-T1–T4 until the maintainer supplies/approves a non-secret AWS profile and production identifiers, or authorizes a separate safe discovery session. No production files were created or modified.
- 2026-09-06, P3-T0: maintainer confirmed `rjchicago.com` is Namecheap-registered and hosted on the same EC2 instance as Snipps, sharing the existing Traefik network. Corrected topology decision: set the production hostname to `rjchicago.com` and external network to `traefik`; TLS remains owned by the shared Traefik instance. Exact AWS account/region, EC2 instance ID/SSM status, host deployment directory/owner, ECR repositories, IAM/OIDC role, certificate resolver/entrypoint names, and current RJ deployment state remain unestablished.
- 2026-09-06, P3-T0: the maintainer-approved Snipps AWS operations README documents account `524541702023`, region `us-east-1`, EC2 `i-0bd7b964d3f15a32e` (`cman`), instance role/profile `ec2-s3-snipps-assets`, GitHub role `snipps-github-deploy`, ECR registry `524541702023.dkr.ecr.us-east-1.amazonaws.com`, SSM document `AWS-RunShellScript`, GitHub environment `production`, and deployment directory pattern `/home/ec2-user/snipps`. These are recorded as shared-environment source facts, not yet RJ-specific authorization or repository configuration.
- 2026-09-06, P3-T0: read-only verification with `aws ... --profile snipps` was attempted for caller identity, ECR repositories, EC2 state, and SSM managed status. All calls returned `Your session has expired. Please reauthenticate using 'aws login'.` No AWS mutation was attempted. Continue only after the maintainer reauthenticates the documented profile or supplies an equivalent approved read-only identity.
- 2026-09-06, P3-T0: maintainer supplied a successful caller-identity result for account `524541702023`, but the ARN is `arn:aws:iam::524541702023:root` and UserId is `524541702023`. Account correctness is confirmed; credential posture is not acceptable for routine deployment. Do not use the root identity for GitHub OIDC, deployment automation, or broad discovery. Establish a dedicated `rjchicago` role/profile first, then rerun the read-only inventory.
- 2026-09-07, P3-T0: maintainer approved the RJ naming contract: local AWS profile `rjchicago`; GitHub OIDC role `rj-github-deploy`; EC2 ECR pull policy `rj-ecr-pull`; ECR repositories `rj/web` and `rj/api`. These names replace unresolved RJ naming placeholders in later deployment work.
- 2026-09-07, P3-T0: using the authenticated `snipps` profile for approved bootstrap, created and verified ECR repositories `524541702023.dkr.ecr.us-east-1.amazonaws.com/rj/web` and `/rj/api` with `IMMUTABLE` tags, scan-on-push enabled, AES256 encryption, and lifecycle retention of 40 images. Created GitHub OIDC role `arn:aws:iam::524541702023:role/rj-github-deploy` trusted only for audience `sts.amazonaws.com` and subject `repo:rjchicago/RJ:environment:production`. Added EC2 inline policy `rj-ecr-pull` to role `ec2-s3-snipps-assets`, scoped to both RJ repository ARNs. No secret values were read or emitted.
- 2026-09-07, P3-T0: sanitized SSM discovery found the legacy master project at `/home/ec2-user/web/docker-compose.yaml`, owned by `ec2-user`. Existing RJ services are `web-rj-web-1` and `web-rj-api-1`; both currently run Docker Hub `rjchicago/rj:latest` and `rjchicago/rj-api:latest`. The shared Docker network is `traefik`; Snipps’ documented shared Traefik conventions are HTTPS entrypoint `websecure` and certificate resolver `acme`. No environment, Compose secret values, or private-key contents were read.
- 2026-09-07, P3-T0: account, region, EC2/SSM status, legacy master path/owner, ECR URIs, OIDC role, shared network, and existing RJ service names are established. The maintainer selected `/home/ec2-user/rjchicago` as the new dedicated RJ deployment directory. Public health verification remains for P3-T4 because DNS is unavailable from this environment. P3-T0 is complete.

## 8. Implementation record

- 2026-09-07, P3-T1: added `GET /healthz` to `apps/web/nginx.conf` with a no-store response and added an image healthcheck to `apps/web/Dockerfile`. Built `rj-local:web-phase3` and verified `/healthz` returned `ok` from a temporary container.
- 2026-09-07, P3-T2: added `deploy/docker-compose.prod.yml` as the production topology source of truth. It uses immutable full Git SHA image tags from the RJ ECR repositories, the external `traefik` network, `websecure`/`acme` routing, web and API healthchecks, read-only Nginx runtime filesystems, and no published API port. `deploy/.env.example` is safe and contains no credentials. Compose config validation passed.
- 2026-09-07, P3-T3: added `deploy/README.md` and updated architecture/configuration/root README guidance with dedicated host path `/home/ec2-user/rjchicago`, Compose project `rjchicago`, operator-owned secret boundaries, health checks, rollback expectations, and explicit prohibition on broad Docker prune operations.
- 2026-09-07, P3-T4: deferred. Public DNS could not be resolved from this environment, and the live host still runs the legacy Docker Hub `latest` deployment. Full production-like validation belongs with the first SHA-tagged Phase 4 deployment; no live service migration was performed in Phase 3.
