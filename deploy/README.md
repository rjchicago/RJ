# RJ production deployment

RJ runs on the shared Snipps EC2 host `i-0bd7b964d3f15a32e` (`cman`) in `us-east-1`. The host uses Traefik on the external `traefik` network with HTTPS entrypoint `websecure` and certificate resolver `acme`. RJ's dedicated deployment directory is `/home/ec2-user/rjchicago`, owned by `ec2-user`, and its Compose project name is `rjchicago`.

The version-controlled source of truth is [docker-compose.prod.yml](docker-compose.prod.yml). It defines `rj-web` and `rj-api`, routes `rjchicago.com/api/*` to the API, and routes all other paths to the web container. The API is not published directly on a host port.

## Images

Production images are published to immutable ECR repositories:

```text
524541702023.dkr.ecr.us-east-1.amazonaws.com/rj/web:<full-git-sha>
524541702023.dkr.ecr.us-east-1.amazonaws.com/rj/api:<full-git-sha>
```

Both services must use the same full 40-character Git SHA. Do not deploy `latest`.

## Host prerequisites

- Docker Compose v2
- external Docker network `traefik`
- host-managed environment at `/home/ec2-user/rjchicago/.env` (never synchronized from Git)
- EC2 role `ec2-s3-snipps-assets` with `rj-ecr-pull`

The host environment supplies `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `RESEND_FROM_EMAIL`, `TURNSTILE_SECRET_KEY`, and `TURNSTILE_SITE_KEY`. Do not print or copy those values.

## Manual candidate deployment

Until Phase 4 automation is complete, an authorized operator may deploy manually through SSM or an interactive maintenance session:

```bash
cd /home/ec2-user/rjchicago
export RJ_IMAGE_TAG=<full-40-character-git-sha>
docker compose --project-name rjchicago --env-file .env -f docker-compose.prod.yml pull
docker compose --project-name rjchicago --env-file .env -f docker-compose.prod.yml up -d
docker compose --project-name rjchicago --env-file .env -f docker-compose.prod.yml ps
```

Verify the API and web health before considering the release successful:

```bash
curl --fail https://rjchicago.com/
curl --fail https://rjchicago.com/api/config
docker compose --project-name rjchicago --env-file .env -f docker-compose.prod.yml ps
```

The current legacy deployment uses `web-rj-web-1` and `web-rj-api-1` with Docker Hub `latest` inside `/home/ec2-user/web/docker-compose.yaml`. That file is the master stack and also owns Traefik and unrelated services. Phase 4 performs a one-time, reversible handoff to the dedicated project; routine RJ operations must never run broad `up`, `down`, or prune commands against the master project.

## Recovery

Phase 3 does not yet provide automated rollback. Before a manual change, record the current image IDs and Compose file checksum. If a candidate is unhealthy, restore the prior image tags and rerun health checks. Do not run broad Docker prune commands on this shared host.

## Secrets and state

`.env` remains host-managed. This repository, GitHub Actions, and future SSM scripts must never synchronize its contents. The Phase 4 release state will live under `/home/ec2-user/rjchicago/.deploy` and contain only image digests, SHAs, timestamps, and health results.
