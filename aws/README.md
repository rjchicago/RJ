# RJ AWS deployment

RJ deployment targets account `524541702023`, region `us-east-1`, and instance `i-0bd7b964d3f15a32e` through AWS Systems Manager. GitHub Actions assumes `arn:aws:iam::524541702023:role/rj-github-deploy` using OIDC; local operators use the `rjchicago` profile. The EC2 role uses `rj-ecr-pull` for the RJ ECR repositories.

The deployment-owned host directory is `/home/ec2-user/rjchicago` and the Compose project is `rjchicago`. The legacy `/home/ec2-user/web` Compose project owns Traefik and unrelated services; deployment automation must never copy its environment, restart it broadly, or prune shared Docker resources.

`deploy-rj.sh` will transport only the repository-owned Compose definition and non-secret release metadata through SSM. The host `.env` remains operator-managed and opaque. Logs may contain release SHAs, image digests, health states, and SSM command IDs, but never environment values or request data.

Before the first automated release, follow the Phase 4 cutover procedure to verify the legacy RJ service labels, pre-pull the candidate, and hand off the two Traefik routers with a tested restoration path.
