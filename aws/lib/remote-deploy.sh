#!/usr/bin/env bash
set -euo pipefail
root=/home/ec2-user/rjchicago
state="$root/.deploy"
operation=${1:?}
if [[ "$operation" == rollback ]]; then
  [[ -f "$state/previous.json" ]] || { echo no-previous-release >&2; exit 1; }
  sha=$(sed -n 's/.*"sha":"\([0-9a-f]\{40\}\)".*/\1/p' "$state/previous.json")
  web_digest=$(sed -n 's/.*"webDigest":"\(sha256:[0-9a-f]\{64\}\)".*/\1/p' "$state/previous.json")
  api_digest=$(sed -n 's/.*"apiDigest":"\(sha256:[0-9a-f]\{64\}\)".*/\1/p' "$state/previous.json")
  [[ "$sha" && "$web_digest" && "$api_digest" ]] || { echo malformed-previous-release >&2; exit 1; }
else
  sha=${2:?}
  web_digest=${3:?}
  api_digest=${4:?}
fi
mkdir -p "$state/releases" "$state/compose"
lock="$state/deploy.lock"
if ! (set -C; : > "$lock") 2>/dev/null; then echo deployment-locked >&2; exit 1; fi
restoring=0
restore_previous() {
  [[ "$restoring" == 0 && -f "$state/current.json" ]] || return 1
  restoring=1
  old_sha=$(sed -n 's/.*"sha":"\([0-9a-f]\{40\}\)".*/\1/p' "$state/current.json")
  [[ "$old_sha" ]] || return 1
  export RJ_IMAGE_TAG="$old_sha"
  docker compose --project-name rjchicago --env-file "$root/.env" -f "$root/docker-compose.prod.yml" up -d
  printf '%s restored_sha=%s result=automatic-restoration\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$old_sha" >> "$state/history.log"
}
on_error() { code=$?; restore_previous || true; exit "$code"; }
trap 'on_error' ERR
trap 'rm -f "$lock"' EXIT
export RJ_IMAGE_TAG="$sha"
docker compose --project-name rjchicago --env-file "$root/.env" -f "$root/docker-compose.prod.yml" config --quiet
docker compose --project-name rjchicago --env-file "$root/.env" -f "$root/docker-compose.prod.yml" pull
docker compose --project-name rjchicago --env-file "$root/.env" -f "$root/docker-compose.prod.yml" up -d
healthy=0
for _ in $(seq 1 30); do
  web_state=$(docker inspect --format '{{.State.Health.Status}}' rjchicago-rj-web-1 2>/dev/null || true)
  api_state=$(docker inspect --format '{{.State.Health.Status}}' rjchicago-rj-api-1 2>/dev/null || true)
  if [[ "$web_state" == healthy && "$api_state" == healthy ]]; then healthy=1; break; fi
  sleep 2
done
[[ "$healthy" == 1 ]] || { echo release-unhealthy >&2; exit 1; }
timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
printf '{"schema":1,"sha":"%s","webDigest":"%s","apiDigest":"%s","timestamp":"%s","result":"success"}\n' "$sha" "$web_digest" "$api_digest" "$timestamp" > "$state/releases/$sha.json.tmp"
[[ -f "$state/current.json" ]] && cp "$state/current.json" "$state/previous.json"
mv "$state/releases/$sha.json.tmp" "$state/releases/$sha.json"
cp "$state/releases/$sha.json" "$state/current.json.tmp"
mv "$state/current.json.tmp" "$state/current.json"
result=success
[[ "$operation" == rollback ]] && result=rollback-success
printf '%s sha=%s web=%s api=%s result=%s\n' "$timestamp" "$sha" "$web_digest" "$api_digest" "$result" >> "$state/history.log"
echo "$result"
