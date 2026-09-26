# TITAN staging deployment

This stack serves `https://staging.titan-tech.co.za` on the xneelo staging VM.
It is for synthetic test data only. The PostgreSQL and Node ports are private
to the Compose network. The Caddy proxy restricts access to the IPv4 address
from the SSH session used to prepare the secrets. The existing development
Compose file must not be used here.

Prerequisites: Ubuntu 24.04, Docker Engine and Compose plugin, DNS-only A record
for `staging.titan-tech.co.za` pointing at `154.65.102.186`, and cloud firewall
rules for 80/443 plus SSH restricted to the administrator's IP.

From a clean server checkout of the reviewed commit:

```bash
bash infrastructure/staging/prepare-secrets.sh
bash infrastructure/staging/deploy.sh
```

The first command creates random database and JWT credentials in
`~/.config/titan-staging/secrets.env` (mode 600), outside Git. It never
overwrites that file. Do not print, copy into chat, or commit it.
The second command builds both apps, starts PostgreSQL, applies migrations
with the migrator account, then starts the API and HTTPS frontend.
Review `sudo docker compose --env-file ~/.config/titan-staging/secrets.env
-f infrastructure/staging/compose.yaml ps` for container status. Verify
`/api/v1/health` from the permitted browser. Back up the database volume
before future migrations; never remove the named volumes during updates.

For a changed administrator IP, update both the xneelo SSH rule and
`STAGING_ALLOWED_IP` in the server-only secrets file, then recreate `web`.
No AAAA record should be added until matching IPv6 ingress and access rules
are designed. Staging authentication email delivery is not configured.
