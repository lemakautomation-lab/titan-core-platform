---
title: "Mission 113 - ATHLETE ONBOARDING"
slug: /missions/113/
sidebar_position: 113
---

# Mission 113 - ATHLETE ONBOARDING

> Authoritative scope imported from the TITAN Master Mission Control Register.

## Objective

Build athlete onboarding.

## Delivery Classification

- **Frontend classification:** FRONTEND-VISIBLE
Local frontend expectation: visible change is expected only where the listed mission controls require a user-facing workflow, page, visualisation or verification surface.

## Controls

### Control 113.1 - Name

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.
**Status:** COMPLETE / VERIFIED / KNOWLEDGE BASE PUBLISHED

**Objective:** Establish the validated athlete given-name contract used by onboarding and profile workflows.

The existing Athlete persistence, mapping and tenant-scoped repository foundation was verified. No database migration is required.

Implemented domain guarantees:

- first name is required;
- surrounding whitespace is removed;
- the normalized value is limited to 100 characters;
- create and update operations apply the same rule;
- invalid updates do not partially mutate athlete state.

Verification evidence:

- Backend build: **GREEN**
- Targeted athlete-name regression: **GREEN**
- Broader Athlete regression: **GREEN**
- Full backend regression: **98 test files / 783 tests GREEN**
- Objective evidence timestamp: **2026-09-13T21:47:31+02:00**

The visible onboarding workflow remains pending later Mission 113 controls.

- Implementation commit: `c87dc3f3ee7a81d19f6acd4663e54421698f8c10`
- Push synchronization: `main` equals `origin/main`
- Knowledge Base publication: **VERIFIED**
- Published-page verification timestamp: **2026-09-13T21:49:34+02:00**

**Current classification:** COMPLETE / VERIFIED / KNOWLEDGE BASE PUBLISHED

### Control 113.2 - Surname

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.
**Status:** COMPLETE / VERIFIED / KNOWLEDGE BASE PUBLISHED

**Objective:** Establish the validated athlete surname contract used by onboarding and profile workflows.

The existing required surname persistence, mapping and tenant-scoped repository foundation was verified. No migration is required.

Implemented guarantees:

- surname is required;
- surrounding whitespace is removed;
- the normalized surname is limited to 100 characters;
- creation and update use the same validation;
- invalid updates do not partially mutate athlete state.

Verification evidence:

- Backend build: **GREEN**
- Name and surname targeted regression: **10 tests GREEN**
- Broader Athlete regression: **GREEN**
- Full backend regression: **GREEN**
- Objective evidence timestamp: **2026-09-13T21:55:31+02:00**

The visible onboarding workflow remains pending later Mission 113 controls.

- Implementation commit: `d148285c49247783c0657a6130d6b47ea6d194e2`
- Push synchronization: `main` equals `origin/main`
- Knowledge Base publication: **VERIFIED**
- Published-page verification timestamp: **2026-09-13T22:03:48+02:00**

**Current classification:** COMPLETE / VERIFIED / KNOWLEDGE BASE PUBLISHED

### Control 113.3 - Country

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.
**Status:** COMPLETE / VERIFIED / KNOWLEDGE BASE PUBLISHED

**Objective:** Establish normalized athlete country data for onboarding and profile workflows.

Implemented and verified:

- nullable legacy-compatible `countryCode` persistence;
- explicit two-letter country-code validation;
- uppercase normalization;
- PostgreSQL format constraint;
- Athlete repository persistence and retrieval;
- no inferred country for existing athletes;
- protected test-database migration deployment.

Verification evidence:

- Targeted regression: **2 files / 10 tests GREEN**
- Full backend regression: **101 test files / 798 tests GREEN**
- Backend build: **GREEN**
- Objective evidence timestamp: **2026-09-13T22:22:10+02:00**

The visible onboarding workflow remains pending later Mission 113 controls.

- Implementation commit: `f854ba0ca39def2ee803f32c91e8fbe4547ef798`
- Push synchronization: `main` equals `origin/main`
- Knowledge Base publication: **VERIFIED**
- Published-page verification timestamp: **2026-09-13T22:24:46+02:00**

**Current classification:** COMPLETE / VERIFIED / KNOWLEDGE BASE PUBLISHED

### Control 113.4 - Email address

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.
**Status:** COMPLETE / VERIFIED / KNOWLEDGE BASE PUBLISHED

**Objective:** Establish the canonical User email contract used by athlete onboarding.

Verified implementation:

- required, trimmed and lowercase email;
- normalized format and length validation;
- normalized tenant-scoped duplicate lookup;
- normalized persistence;
- atomic rejection of invalid profile updates;
- no duplicate email field on Athlete.

Verification evidence:

- Targeted regression: **1 file / 9 tests GREEN**
- Authentication and User regression: **GREEN**
- Full backend regression: **102 test files / 807 tests GREEN**
- Backend build: **GREEN**
- Objective evidence timestamp: **2026-09-14T07:52:35+02:00**

The visible onboarding workflow remains pending later Mission 113 controls.

- Implementation commit: `fd99c14de89a34eb7c4f859a8ace5f72c185b12c`
- Push synchronization: `main` equals `origin/main`
- Knowledge Base publication: **VERIFIED**
- Published-page verification timestamp: **2026-09-14T07:56:05+02:00**

**Current classification:** COMPLETE / VERIFIED / KNOWLEDGE BASE PUBLISHED

### Control 113.5 - Contact number

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 113.6 - Selected user type

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 113.7 - Payment before access

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 113.8 - Paid user-type entitlement

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 113.9 - Profile picture

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 113.10 - Editable personal details

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 113.11 - Athlete goals

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 113.12 - BMI/measurements capture

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 113.13 - Onboarding validation

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

## Mission Exit Gate

all controls implemented or explicitly verified as already satisfied; targeted tests GREEN; relevant regression GREEN; build GREEN; security/tenant/RBAC implications verified; migration/API contract verified where applicable; documentation/evidence captured.

## Control 113.5 — Contact Number

Status: **COMPLETE / VERIFIED / KNOWLEDGE BASE PUBLISHED**

Control 113.5 establishes the authoritative contact-number foundation required by athlete onboarding.

### Ownership decision

- Contact number belongs to the authoritative `User` personal profile.
- `Athlete` does not duplicate the contact number.
- Athlete access resolves through the explicit, tenant-bounded `Athlete.userId` relationship.
- Existing users remain compatible through a nullable contact number.
- No contact number is inferred.

### Domain contract

- Values are trimmed before persistence.
- Persisted values must use E.164 format.
- Values begin with `+`.
- The first digit after `+` is non-zero.
- Values contain between 8 and 15 digits.
- Invalid values are rejected before profile mutation.
- Invalid updates preserve the previous value.
- `null` remains valid for legacy users.
- Later onboarding submission will require explicit completion.

### Persistence and application boundary

- Added nullable `User.contactNumber`.
- Added a PostgreSQL E.164 check constraint.
- Added migration `20260914081500_add_user_contact_number`.
- Updated User domain construction and profile updates.
- Updated Prisma and application mapping.
- Updated create and update commands and use cases.
- Updated the User controller boundary.
- Contact number is not duplicated on `Athlete`.

### Verification evidence

Evidence timestamp: **2026-09-14 08:41:18 +02:00**

- Migration encoding verified as UTF-8 without BOM.
- Failed local test migration explicitly marked rolled back.
- Migration deployed only to protected local `titan_core_test`.
- Prisma migration status verified.
- Targeted suite: 2 test files / 20 tests passed.
- User and authentication regression passed.
- Full backend test suite passed.
- Backend TypeScript build passed.
- Backend lint passed with 0 errors and 29 existing warnings.
- `git diff --check` passed.
- Unauthorized files changed: none.
- Knowledge Base publication visually verified at **2026-09-14 08:56:30 +02:00**.

### Delivery classification

Control 113.5 is complete, verified and published. Mission 113 remains active.
## Control 113.6 - Selected User Type

Status: **COMPLETE / VERIFIED / KNOWLEDGE BASE PUBLISHED**

Control 113.6 establishes an explicit onboarding user-type selection without converting self-selection into authorization.

### Allowed user types

- `ATHLETE`
- `TRAINER`
- `ORGANISATION`

`ORGANISATION` represents a team, club, academy, school, corporate wellness or other organisation manager.

### Security boundary

- Selected user type is onboarding profile data.
- Existing RBAC roles remain separate.
- Selecting a user type does not assign permissions or roles.
- `ADMIN`, `OPERATOR` and `VIEWER` are not selectable onboarding types.
- Unsupported values are rejected before persistence.
- Existing users remain compatible through a nullable value.
- No user type is inferred.

### Implementation

- Added the `OnboardingUserType` domain enum.
- Added nullable `User.selectedUserType`.
- Added a forward-only PostgreSQL enum migration.
- Updated User domain construction and update behavior.
- Updated Prisma and application mapping.
- Updated create and update commands and use cases.
- Updated User DTO and controller boundaries.
- No RBAC role assignment was introduced.

### Verification evidence

Evidence timestamp: **2026-09-14 09:22:50 +02:00**

- Migration deployed only to protected local `titan_core_test`.
- Prisma migration status verified.
- Targeted User suite: 3 test files / 31 tests passed.
- User and authentication regression passed.
- Full backend test suite passed.
- Backend TypeScript build passed.
- Backend lint passed.
- `git diff --check` passed.
- Unauthorized files changed: none.

### Delivery classification

Control 113.6 is complete, verified and published through the verified Cloudflare deployment artifact. The canonical alias incident remains open. Mission 113 remains active.

## Mission 113 Knowledge Base Publication Status

Publication evidence timestamp: **2026-09-14 10:11:15 +02:00**

Controls 113.5 and 113.6 are present in the successful Cloudflare Pages production artifact:

- [Verified Mission 113 deployment](https://9284e34b.titan-core-platform.pages.dev/docs/missions/113/)
- Control 113.5 content verified in the deployed artifact.
- Control 113.6 content verified in the deployed artifact.
- Docusaurus production build passed.
- Cloudflare Pages build and asset publication passed.
- GitHub `main` and `origin/main` were synchronized.
- The canonical `titan-core-platform.pages.dev` alias remained temporarily stale after successful deployment and retry.
- This is tracked as a Cloudflare production-alias incident.
- No backend, database or product code change was required for the publication incident.

The immutable deployment URL is the verified publication evidence while Cloudflare refreshes or repairs the canonical alias.

## Control 113.7 - Payment Before Access

Status: **TECHNICALLY COMPLETE / VERIFIED**

Control 113.7 establishes a provider-neutral and default-deny payment boundary for athlete onboarding.

### Payment contract

- Payments begin in `PENDING` status.
- Access is denied unless payment is `CONFIRMED`.
- `FAILED`, `CANCELLED` and `REFUNDED` payments do not permit access.
- Confirmation requires a server-held provider reference.
- Frontend-supplied paid status is not trusted.
- Amount, currency and billing interval are captured as an immutable price snapshot.
- No payment gateway is falsely represented as connected or released.

### Tenant and product integrity

- Every Payment belongs to one tenant and one User in that tenant.
- Every Payment belongs to one tenant-owned Product.
- The selected ProductPrice must belong to the selected Product.
- Composite database constraints prevent cross-tenant User and Product associations.
- Repository reads and updates require explicit tenant identity.
- Cross-tenant payment retrieval returns no record.
- ProductPrice lookup alone is not accepted as tenant authority.

### Payment lifecycle

Supported states:

- `PENDING`
- `CONFIRMED`
- `FAILED`
- `CANCELLED`
- `REFUNDED`

Only pending payments can be confirmed, failed or cancelled. Only confirmed payments can be refunded.

### Implementation

- Added the Payment domain entity.
- Added the PaymentStatus enum.
- Added the default-deny payment access policy.
- Added the tenant-bounded Payment repository contract.
- Added Prisma persistence mapping and repository implementation.
- Added the Payment persistence model and forward-only migration.
- Added database amount, currency, confirmation-state and ownership constraints.
- Added domain and tenant-isolation persistence tests.
- No checkout endpoint or external gateway integration was claimed.
- Control 113.8 will convert confirmed payment evidence into the appropriate paid user-type entitlement.

### Verification evidence

Evidence timestamp: **2026-09-14 10:57:13 +02:00**

- Migration deployed only to protected local `titan_core_test`.
- Prisma migration status verified.
- Targeted payment suite: 2 test files / 13 tests passed.
- Cross-tenant User association was rejected by persistence constraints.
- Cross-tenant payment retrieval returned no record.
- Confirmed-payment lookup remained tenant and Product bounded.
- Full backend test suite passed.
- Backend TypeScript build passed.
- Backend lint passed.
- `git diff --check` passed.
- Unauthorized files changed: none.

### Delivery classification

Control 113.7 is technically complete and verified. It establishes the payment-before-access foundation, not a live payment gateway or checkout release. Knowledge Base publication verification remains outstanding. Mission 113 remains active.