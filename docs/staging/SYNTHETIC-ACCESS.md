# Staging synthetic access for feature verification

This access is only evaluated by the backend when `NODE_ENV=staging` and the
database name is exactly `titan_staging`. It applies to one named tenant and
two explicitly nominated synthetic users. Each account must have the matching
Athlete or Trainer user type and an email beginning with `staging-`,
`staging.`, `staging_`, or `staging+`. The grant expires at the configured UTC
instant, no more than 30 days ahead. A missing or invalid setting grants nothing.

Configuration is held in the existing staging secrets environment file:

```text
STAGING_TEST_TENANT_ID=<existing synthetic tenant UUID>
STAGING_TEST_ATHLETE_USER_ID=<existing synthetic Athlete UUID>
STAGING_TEST_TRAINER_USER_ID=<existing synthetic Trainer UUID>
STAGING_TEST_ACCESS_UNTIL=<ISO 8601 UTC instant within 30 days>
```

The Compose backend passes those four values through. No password, payment,
product, entitlement, or role record is created. Athlete gets the limited
read permissions for Digital Twin, performance metrics, sports, and exercises.
Trainer gets programme read/update and exercise read permissions. The Trainer
subscription check reports `STAGING_TEST_GRANT` so the UI does not claim a
payment. Each login using the grant writes a `STAGING_TEST_ACCESS_USED` audit
record with the user type and expiry. The UI displays a staging test banner.

To revoke immediately, remove the IDs or expiry from the secrets file and
recreate the backend container. Session restoration obtains the current
permission set from `/auth/me`; re-sign in to verify the changed grant.

These synthetic grants provide feature testing evidence, not checkout or
payment verification. Do not copy them into production configuration.
