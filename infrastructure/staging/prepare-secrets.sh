#!/usr/bin/env bash
set -euo pipefail

secrets_dir="${HOME}/.config/titan-staging"
secrets_file="${secrets_dir}/secrets.env"

if [[ -e "${secrets_file}" ]]; then
    echo "Staging secrets already exist; nothing was changed."
    exit 0
fi

client_ip="${SSH_CLIENT%% *}"
if [[ ! "${client_ip}" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Run this from the permitted IPv4 SSH session." >&2
    exit 1
fi

install -d -m 700 "${secrets_dir}"
(
    umask 077
    {
        printf 'POSTGRES_MIGRATOR_PASSWORD=%s\n' "$(openssl rand -hex 32)"
        printf 'POSTGRES_APP_PASSWORD=%s\n' "$(openssl rand -hex 32)"
        printf 'JWT_SECRET=%s\n' "$(openssl rand -hex 64)"
        printf 'STAGING_ALLOWED_IP=%s/32\n' "${client_ip}"
    } > "${secrets_file}"
)

echo "Staging secrets created outside the repository (contents hidden)."
