# Mission 115 — Customer Support Infrastructure

## Mission status

ACTIVE

## Platform boundary

TITAN Enterprise is the top-level platform. TITAN Health is one product within TITAN Enterprise.

## Control 115.5 — Account Assistance

### Status

COMPLETE / VERIFIED / LOCAL VISUAL VERIFICATION PASSED / CLOUDFLARE PUBLICATION PENDING

### Security decision

TITAN currently has no verified secondary email or verified telephone channel. The existing `contactNumber` field is not sufficient proof of identity.

Control 115.5 therefore does not search for accounts, match personal details, reveal email addresses, disclose masked account hints, or allow a requester to claim a Tenant or User identity.

### Delivered boundary

- Public endpoint: `POST /api/v1/auth/account-assistance/request`.
- Public frontend route: `/account-assistance`.
- Sign In includes a visible `Forgot email?` link.
- The request accepts an exact empty object only.
- Email, contact number, Tenant ID, User ID, role, permission, payment, entitlement and other identity or authority fields are rejected.
- The backend resolves the TITAN Health consumer Tenant from a server-owned configured slug.
- The endpoint uses the existing authentication rate limiter.
- Responses use `Cache-Control: no-store`.
- A successful request returns a cryptographically random, opaque reference.
- The raw reference is returned once and is not persisted.
- Only a lowercase SHA-256 reference hash is stored.
- Default reference lifetime is 72 hours.
- Maximum permitted lifetime is seven days.
- Requests support OPEN, CLOSED and EXPIRED lifecycle states.
- The reference does not prove identity or account ownership.
- Users are instructed to provide it only to authorised TITAN support.
- No passwords, identity documents, payment information or other personal data are collected.

### Persistence

Prisma model: `AccountAssistanceRequest`.

Migration:

`20260915180000_add_account_assistance_requests`

Database enforcement includes:

- Backend-selected Tenant ownership.
- Unique SHA-256 reference hash.
- Lowercase 64-character hexadecimal hash constraint.
- Expiry later than creation.
- Valid closure timestamp.
- Tenant/status, expiry and creation indexes.
- Restrictive Tenant deletion.

Migration state:

- 47 migrations present.
- Migration applied only to protected test database `titan_core_test`.
- Prisma migration status reported the schema as current.
- Prisma validation passed.
- Development database changed: no.
- Production database changed: no.

### Verification

- Domain lifecycle and opaque-reference tests passed.
- Tenant-owned persistence and database-constraint tests passed.
- Application boundary tests passed.
- Public HTTP integration tests passed.
- Frontend component and route regression passed.
- Full backend regression passed.
- Backend build passed.
- Backend lint passed with 0 errors and the established 29 pre-existing warnings.
- Full frontend regression passed.
- Frontend production build passed.
- Frontend lint passed with zero warnings.
- `git diff --check` passed.

### Deferred security controls

Control 115.5 does not implement staff-side account access or identity verification.

The following remain separate governed controls:

- Control 115.6 — support authorisation.
- Control 115.7 — support auditability.
- Control 115.8 — secure customer-data handling.
- Verified secondary-channel enrolment.
- Masked account hints after sufficient identity proof.
- Staff resolution or closure workflow.
- Production deployment.

No support worker may use the opaque reference alone as proof of identity.
