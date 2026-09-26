#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
secrets_file="${HOME}/.config/titan-staging/secrets.env"

if [[ ! -f "${secrets_file}" ]]; then
    echo "Run prepare-secrets.sh first." >&2
    exit 1
fi
if [[ -n "$(git -C "${repo_dir}" status --porcelain)" ]]; then
    echo "Server checkout has local changes; deployment stopped." >&2
    exit 1
fi
if ! getent ahostsv4 staging.titan-tech.co.za | awk '{print $1}' | grep -qx '154.65.102.186'; then
    echo "Staging DNS does not resolve to this server; deployment stopped." >&2
    exit 1
fi

cd "${repo_dir}"
echo "Deploying commit $(git rev-parse HEAD)"
compose=(sudo docker compose --env-file "${secrets_file}" -f infrastructure/staging/compose.yaml)
"${compose[@]}" config --quiet
"${compose[@]}" build backend web
"${compose[@]}" up -d postgres
"${compose[@]}" --profile migration run --rm migrate
"${compose[@]}" up -d backend web
"${compose[@]}" ps
