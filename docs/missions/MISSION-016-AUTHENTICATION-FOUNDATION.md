# Mission 016 — Authentication Foundation

## Mission status

ACTIVE

## Platform boundary

TITAN Enterprise is the top-level platform. TITAN Health is a product within TITAN Enterprise.

## Control 16.5 — Secure Password Recovery

### Status

TECHNICALLY COMPLETE / AUTOMATED VERIFICATION PASSED / LOCAL VISUAL VERIFICATION PENDING / CLOUDFLARE PUBLICATION PENDING

### Security objective

Allow standard TITAN Health consumer Users to recover a forgotten password without exposing account existence, accepting browser-controlled tenant authority, persisting raw reset tokens, or leaving existing sessions active.

### Delivered boundary

- Public request endpoint: `POST /api/v1/auth/password-reset/request`.
- Public completion endpoint: `POST /api/v1/auth/password-reset/complete`.
- Both endpoints use the existing authentication rate limiter.
- Both endpoints return `Cache-Control: no-store`.
- Request payloads use exact field allowlists.
- Browser-supplied tenant IDs, User IDs, roles, permissions, payments, entitlements, and unknown fields are rejected.
- Request responses are generic for existing and nonexistent accounts.
- TITAN Health consumer tenant identity is resolved from a backend-owned configured slug.
- Email addresses are normalized before tenant-scoped lookup.
- Raw reset tokens use 256 bits of cryptographic randomness and URL-safe base64 encoding.
- Only lowercase SHA-256 token hashes are persisted.
- Raw tokens and reset URLs are not logged.
- Default token lifetime is 15 minutes.
- Maximum permitted lifetime is 60 minutes.
- Reset tokens are single-use and revocable.
- Issuing a replacement revokes previous unconsumed reset tokens for that User.
- Completion atomically claims the token, changes the password, revokes every active User session, and revokes other active reset tokens.
- Failed password updates roll back token consumption.
- Password validation reuses the shared User password policy.
- No paid role, permission, payment, or entitlement authority is involved.

### Persistence

Prisma model: `PasswordResetToken`.

Migration:

`20260915103000_add_password_reset_tokens`

Database enforcement includes:

- Tenant ownership.
- Composite User/Tenant ownership.
- Unique token hash.
- Lowercase 64-character SHA-256 hash format.
- Expiry later than creation.
- User cascade deletion.
- Tenant restrictive deletion.
- Tenant/User and expiry indexes.

Migration state:

- Applied only to protected test database `titan_core_test`.
- Prisma schema validation passed.
- Prisma migration status reported the test schema as current.
- Development database changed: no.
- Production database changed: no.

### Email delivery

- Provider-neutral `PasswordResetEmailDelivery` application port.
- Fake delivery adapter used by automated tests.
- Resend production adapter implemented using pinned `resend@6.28.0`.
- Production configuration fails closed when required Resend values are missing.
- Resend credentials remain backend-only.
- No real Resend request was made during implementation or automated verification.
- Live email delivery remains unverified until a sending domain, sender address, and API key are configured and a real delivery is confirmed.

### Frontend

- Sign In includes a visible `Forgot password?` link.
- `/forgot-password` accepts only an email address.
- No tenant ID is requested.
- Generic confirmation is displayed after a request.
- `/reset-password` reads the raw token from the URL.
- Missing, invalid, expired, revoked, and reused tokens fail safely.
- Password and confirmation fields include loading and disabled states.
- Successful completion provides a route back to Sign In.

### Verification evidence

- Token lifecycle and cryptographic foundation: 2 files, 9 tests passed.
- Persistence boundary: 3 files, 15 tests passed.
- Focused password-reset application, provider, persistence, and HTTP verification passed.
- Full backend regression passed.
- Backend TypeScript build passed.
- Backend lint passed with 0 errors and the established 29 pre-existing warnings.
- Resend dependency audit introduced no new vulnerable package names.
- Focused frontend verification: 3 files, 28 tests passed.
- Full frontend regression: 31 files, 172 tests passed.
- Frontend production build passed.
- Frontend lint passed with zero warnings.
- Prisma validation passed.
- Protected test migration status passed.
- `git diff --check` passed.

### Remaining release gates

- Local visual verification.
- Knowledge Base build.
- Exact authorized-file audit.
- Controlled staging.
- Separate commit and push.
- Cloudflare publication and live page verification.
- Production Resend configuration and verified real delivery.
- Production application and database deployment remain unauthorized.
