#!/usr/bin/env bash
set -euo pipefail

region=us-east-1
account_expected=524541702023
instance=i-0bd7b964d3f15a32e
dir=/home/ec2-user/rjchicago
op= tag= profile= no_profile=0
die(){ printf 'error: %s\n' "$1" >&2; exit 2; }
while (($#)); do
  case "$1" in
    --status|--rollback) [[ -z "$op" ]] || die 'multiple operations'; op=${1#--}; shift;;
    --tag) [[ -z "$op" ]] || die 'multiple operations'; (($# > 1)) || die '--tag requires SHA'; op=deploy; tag=$2; shift 2;;
    --profile) [[ -z "$profile" && $no_profile == 0 ]] || die 'profile mode repeated'; (($# > 1)) || die '--profile requires name'; profile=$2; shift 2;;
    --no-profile) [[ -z "$profile" && $no_profile == 0 ]] || die 'profile mode repeated'; no_profile=1; shift;;
    -h|--help) printf '%s\n' 'usage: deploy-rj.sh (--status|--tag SHA|--rollback) [--profile NAME|--no-profile]'; exit 0;;
    *) die "unknown option: $1";;
  esac
done
[[ -n "$op" ]] || die 'one operation is required'
[[ -n "$profile" || $no_profile == 1 ]] || die 'select --profile or --no-profile'
[[ "$op" != deploy || "$tag" =~ ^[0-9a-f]{40}$ ]] || die 'tag must be 40 lowercase hexadecimal characters'
aws_cmd=(aws --region "$region"); [[ -n "$profile" ]] && aws_cmd+=(--profile "$profile")
[[ $("${aws_cmd[@]}" sts get-caller-identity --query Account --output text) == "$account_expected" ]] || die 'AWS account mismatch'
send() {
  local command_id parameters status
  parameters=$(jq -cn --arg command "$1" '{commands:[$command]}')
  command_id=$("${aws_cmd[@]}" ssm send-command --document-name AWS-RunShellScript --instance-ids "$instance" --parameters "$parameters" --query Command.CommandId --output text)
  "${aws_cmd[@]}" ssm wait command-executed --command-id "$command_id" --instance-id "$instance" || true
  status=$("${aws_cmd[@]}" ssm get-command-invocation --command-id "$command_id" --instance-id "$instance" --query Status --output text)
  [[ "$status" == Success ]] || { printf 'ssm_command_id=%s status=%s\n' "$command_id" "$status" >&2; return 1; }
  printf '%s\n' "$command_id"
}
case "$op" in
  status) id=$(send "set -eu; test -f '$dir/.deploy/current.json' && sed -n '1,120p' '$dir/.deploy/current.json' || printf '%s\\n' no-current-release"); printf 'ssm_command_id=%s operation=status\n' "$id";;
  rollback) helper=$(base64 < aws/lib/remote-deploy.sh | tr -d '\n'); remote="set -eu; mkdir -p '$dir/.deploy'; printf '%s' '$helper' | base64 -d > '$dir/.deploy/remote-deploy.sh'; chmod 700 '$dir/.deploy/remote-deploy.sh'; '$dir/.deploy/remote-deploy.sh' rollback"; id=$(send "$remote"); printf 'ssm_command_id=%s operation=rollback\n' "$id";;
  deploy) for repo in rj/web rj/api; do digest=$("${aws_cmd[@]}" ecr describe-images --repository-name "$repo" --image-ids imageTag="$tag" --query 'imageDetails[0].imageDigest' --output text); [[ "$digest" =~ ^sha256:[0-9a-f]{64}$ ]] || die "no digest for $repo:$tag"; [[ "$repo" == rj/web ]] && web_digest=$digest || api_digest=$digest; done; payload=$(base64 < deploy/docker-compose.prod.yml | tr -d '\n'); helper=$(base64 < aws/lib/remote-deploy.sh | tr -d '\n'); remote="set -eu; mkdir -p '$dir/.deploy'; printf '%s' '$payload' | base64 -d > '$dir/docker-compose.prod.yml'; printf '%s' '$helper' | base64 -d > '$dir/.deploy/remote-deploy.sh'; chmod 700 '$dir/.deploy/remote-deploy.sh'; '$dir/.deploy/remote-deploy.sh' deploy '$tag' '$web_digest' '$api_digest'"; id=$(send "$remote"); printf 'ssm_command_id=%s operation=deploy sha=%s web_digest=%s api_digest=%s\n' "$id" "$tag" "$web_digest" "$api_digest";;
esac
