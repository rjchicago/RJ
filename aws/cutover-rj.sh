#!/usr/bin/env bash
set -euo pipefail
profile=${1:?AWS profile required}
sha=${2:?release SHA required}
web_digest=${3:?web digest required}
api_digest=${4:?api digest required}
[[ "$sha" =~ ^[0-9a-f]{40}$ ]] || exit 2
compose_payload=$(base64 < deploy/docker-compose.prod.yml | tr -d '\n')
helper_payload=$(base64 < aws/lib/remote-deploy.sh | tr -d '\n')
remote_command="set -Eeuo pipefail
root=/home/ec2-user/rjchicago
restore(){ docker-compose --project-name rjchicago --env-file \$root/.env -f \$root/docker-compose.prod.yml down >/dev/null 2>&1 || true; docker start web-rj-web-1 web-rj-api-1 >/dev/null 2>&1 || true; echo legacy-restored >&2; }
trap restore ERR
test -f \$root/.env
mkdir -p \$root/.deploy
printf '%s' '$compose_payload' | base64 -d > \$root/docker-compose.prod.yml
printf '%s' '$helper_payload' | base64 -d > \$root/.deploy/remote-deploy.sh
chmod 700 \$root/.deploy/remote-deploy.sh
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 524541702023.dkr.ecr.us-east-1.amazonaws.com >/dev/null
export RJ_IMAGE_TAG='$sha'
docker-compose --project-name rjchicago --env-file \$root/.env -f \$root/docker-compose.prod.yml config --quiet
docker-compose --project-name rjchicago --env-file \$root/.env -f \$root/docker-compose.prod.yml pull
docker stop web-rj-web-1 web-rj-api-1 >/dev/null
\$root/.deploy/remote-deploy.sh deploy '$sha' '$web_digest' '$api_digest'
curl --fail --silent --show-error https://rjchicago.com/ >/dev/null
curl --fail --silent --show-error https://rjchicago.com/api/config >/dev/null
trap - ERR
echo cutover-success"
parameters=$(jq -cn --arg command "$remote_command" '{commands:[$command]}')
aws ssm send-command --region us-east-1 --profile "$profile" --document-name AWS-RunShellScript \
  --instance-ids i-0bd7b964d3f15a32e --parameters "$parameters" --query Command.CommandId --output text
