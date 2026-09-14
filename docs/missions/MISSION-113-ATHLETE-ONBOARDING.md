# MISSION 113 — ATHLETE ONBOARDING

## Status

ACTIVE

## Objective

Build athlete onboarding through validated, tenant-scoped and authorised athlete-profile capabilities.

## Control 113.1 — Name

**Status:** COMPLETE / VERIFIED / KNOWLEDGE BASE PUBLISHED

### Control Objective

Establish the athlete given-name contract used by onboarding and profile workflows.

The control requires a supplied, normalized and bounded first name whenever an athlete is created or the athlete profile is updated.

### Existing Foundation Verified

The existing platform already provides:

- a required `Athlete.firstName` persistence field;
- an Athlete domain entity;
- Prisma-to-domain and domain-to-persistence mapping;
- a tenant-scoped Athlete repository;
- an optional `Athlete.userId` relationship for authoritative user-to-athlete association.

No database migration is required for Control 113.1.

### Implementation

The Athlete domain now:

- rejects empty and whitespace-only first names;
- trims surrounding whitespace;
- limits first names to 100 characters;
- validates updates before mutating any profile fields;
- preserves the existing athlete state when validation fails.

### Verification

- Backend lint: **GREEN** with pre-existing non-blocking warnings only
- Backend TypeScript build: **GREEN**
- Targeted athlete-name tests: **GREEN**
- Broader Athlete regression: **GREEN**
- Full backend regression: **98 test files / 783 tests GREEN**
- Whitespace audit: **GREEN**
- Objective evidence timestamp: **2026-09-13T21:47:31+02:00**

### Security and Data Integrity

- The implementation does not accept a tenant identifier from an unauthorised client boundary.
- Existing tenant-scoped repository constraints remain unchanged.
- No athlete identity is inferred.
- No duplicate athlete or user relationship is created.
- Invalid updates are atomic at the domain boundary.
- Surname and other onboarding fields remain outside Control 113.1.

### Files

- `backend/src/domain/entities/athlete.entity.ts`
- `backend/tests/unit/athlete-name.spec.ts`

### Publication Evidence

- Implementation commit: `c87dc3f3ee7a81d19f6acd4663e54421698f8c10`
- Push synchronization: `main` equals `origin/main`
- Knowledge Base publication: **VERIFIED**
- Published-page verification timestamp: **2026-09-13T21:49:34+02:00**

**Current classification:** COMPLETE / VERIFIED / KNOWLEDGE BASE PUBLISHED
### Delivery Boundary

Control 113.1 completes the validated athlete-name foundation.

The visible onboarding workflow remains pending later Mission 113 controls. This control alone does not claim that athlete onboarding is released or available in the product frontend.
## Control 113.2 — Surname

**Status:** COMPLETE / VERIFIED / KNOWLEDGE BASE PUBLISHED

### Control Objective

Establish the athlete surname contract used by onboarding and profile workflows.

The control requires a supplied, normalized and bounded surname whenever an athlete is created or the athlete profile is updated.

### Existing Foundation Verified

The existing platform already provides:

- a required `Athlete.lastName` persistence field;
- Athlete domain and persistence mapping;
- tenant-scoped Athlete repository operations.

No database migration is required for Control 113.2.

### Implementation

The Athlete domain now:

- rejects empty and whitespace-only surnames;
- trims surrounding whitespace;
- limits surnames to 100 characters;
- applies identical validation during creation and update;
- validates the complete name pair before mutating profile state;
- preserves existing state when surname validation fails.

### Verification

- Backend lint: **GREEN** with pre-existing non-blocking warnings only
- Backend TypeScript build: **GREEN**
- Name and surname targeted regression: **10 tests GREEN**
- Broader Athlete regression: **GREEN**
- Full backend regression: **GREEN**
- Whitespace audit: **GREEN**
- Objective evidence timestamp: **2026-09-13T21:55:31+02:00**

### Publication Evidence

- Implementation commit: `d148285c49247783c0657a6130d6b47ea6d194e2`
- Push synchronization: `main` equals `origin/main`
- Knowledge Base publication: **VERIFIED**
- Published-page verification timestamp: **2026-09-13T22:03:48+02:00**

**Current classification:** COMPLETE / VERIFIED / KNOWLEDGE BASE PUBLISHED
### Security and Data Integrity

- Existing tenant-scoped repository behavior remains unchanged.
- No tenant or athlete identity is inferred.
- No database or API contract is weakened.
- Invalid profile updates cannot partially mutate the athlete.
- Country and later onboarding fields remain outside Control 113.2.

### Files

- `backend/src/domain/entities/athlete.entity.ts`
- `backend/tests/unit/athlete-surname.spec.ts`

### Delivery Boundary

Control 113.2 completes the validated athlete-surname foundation. The visible onboarding workflow remains pending later Mission 113 controls.
## Control 113.3 — Country

**Status:** COMPLETE / VERIFIED / KNOWLEDGE BASE PUBLISHED

### Control Objective

Establish a normalized country-code field for athlete onboarding and profile data.

### Implementation

- Added nullable `Athlete.countryCode` storage for legacy compatibility.
- Added a forward-only Prisma migration.
- Normalizes supplied codes to uppercase.
- Requires exactly two alphabetic characters when supplied.
- Enforces the same format through a PostgreSQL check constraint.
- Supports deterministic country updates.
- Preserves the previous country when validation fails.
- Updated Athlete persistence and rehydration mapping.

Existing athletes are not assigned an inferred country. The onboarding submission boundary will require an explicit country later in Mission 113.

### Verification

- Prisma client generation: **GREEN**
- Migration deployment to protected local `titan_core_test`: **GREEN**
- Targeted country regression: **2 files / 10 tests GREEN**
- Broader Athlete regression: **GREEN**
- Full backend regression: **101 test files / 798 tests GREEN**
- Backend build: **GREEN**
- Whitespace audit: **GREEN**
- Objective evidence timestamp: **2026-09-13T22:22:10+02:00**

### Security and Data Integrity

- No production or remote database was targeted.
- Migration execution was restricted to local `titan_core_test`.
- Existing tenant-scoped Athlete repository behavior remains intact.
- No country is inferred from user identity, location or tenant.
- Existing Athlete records remain valid with a null country code.

### Files

- `backend/prisma/migrations/20260913221500_add_athlete_country/migration.sql`
- `backend/prisma/schema.prisma`
- `backend/src/domain/entities/athlete.entity.ts`
- `backend/src/infrastructure/mappers/athlete.mapper.ts`
- `backend/tests/integration/athlete/athlete-country.repository.spec.ts`
- `backend/tests/unit/athlete-country.spec.ts`

### Publication Evidence

- Implementation commit: `f854ba0ca39def2ee803f32c91e8fbe4547ef798`
- Push synchronization: `main` equals `origin/main`
- Knowledge Base publication: **VERIFIED**
- Published-page verification timestamp: **2026-09-13T22:24:46+02:00**

**Current classification:** COMPLETE / VERIFIED / KNOWLEDGE BASE PUBLISHED
### Delivery Boundary

Control 113.3 completes the country persistence and validation foundation. The visible onboarding workflow remains pending later Mission 113 controls.
## Control 113.4 — Email Address

**Status:** COMPLETE / VERIFIED / KNOWLEDGE BASE PUBLISHED

### Control Objective

Establish a canonical email-address contract for athlete onboarding without duplicating email on the Athlete record.

### Implementation

The authoritative email remains owned by `User` and is associated with an Athlete through `Athlete.userId`.

The implementation:

- requires a supplied email address;
- trims surrounding whitespace;
- normalizes email to lowercase;
- validates the normalized format;
- limits normalized email to 254 characters;
- performs tenant-scoped uniqueness checks using the normalized value;
- persists only the normalized value;
- prevents invalid updates from partially mutating User state.

No duplicate Athlete email column or migration was introduced.

### Verification

- Targeted email regression: **1 file / 9 tests GREEN**
- Authentication and User regression: **GREEN**
- Full backend regression: **102 test files / 807 tests GREEN**
- Backend build: **GREEN**
- Whitespace audit: **GREEN**
- Objective evidence timestamp: **2026-09-14T07:52:35+02:00**

### Security and Data Integrity

- Email remains protected by existing tenant-scoped User uniqueness.
- Normalization occurs before duplicate lookup and persistence.
- Athlete email is resolved only through the explicit User-to-Athlete association.
- No email address is inferred or duplicated.

### Publication Evidence

- Implementation commit: `fd99c14de89a34eb7c4f859a8ace5f72c185b12c`
- Push synchronization: `main` equals `origin/main`
- Knowledge Base publication: **VERIFIED**
- Published-page verification timestamp: **2026-09-14T07:56:05+02:00**

**Current classification:** COMPLETE / VERIFIED / KNOWLEDGE BASE PUBLISHED
### Delivery Boundary

Control 113.4 completes the authoritative email foundation. The visible onboarding form remains pending later Mission 113 controls.

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

Status: **COMPLETE / VERIFIED / KNOWLEDGE BASE PUBLISHED**

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
- Cloudflare deployment 353a7551 visually verified at **2026-09-14 11:05:42 +02:00**.

### Delivery classification

Control 113.7 is complete, verified and published through the verified Cloudflare deployment artifact. It establishes the payment-before-access foundation, not a live payment gateway or checkout release. The canonical Cloudflare alias incident remains open. Mission 113 remains active.
## Control 113.8 - Paid User-Type Entitlement

Status: **COMPLETE / VERIFIED / KNOWLEDGE BASE PUBLISHED**

Control 113.8 establishes the tenant-bound entitlement foundation that connects a confirmed payment to the user type selected during onboarding.

### Entitlement policy

- Entitlements are issued only from confirmed payments.
- The selected User type must match the Product entitlement target.
- Supported targets are `ATHLETE`, `TRAINER` and `ORGANISATION`.
- Organisation represents the organisation-management onboarding path, including team or organisation managers.
- A payment can issue no more than one user-type entitlement.
- Pending, failed, cancelled and refunded payments do not permit access.
- Expired and revoked entitlements do not permit access.
- Entitlements remain separate from RBAC roles and permissions.
- No role, user type, payment or tenant ownership is inferred.

### Product boundary

- Added nullable `Product.entitlementUserType` for legacy compatibility.
- Updated Product create and update commands.
- Updated Product DTO and application mapping.
- Updated Product create and update use cases.
- Updated Product request validation.
- Updated Prisma Product persistence mapping.
- Invalid entitlement targets are rejected at the request boundary.
- An omitted update value preserves the existing Product target.

### Entitlement domain

- Added the `UserTypeEntitlement` aggregate.
- Added `ACTIVE`, `EXPIRED` and `REVOKED` lifecycle states.
- Added deterministic monthly, quarterly and annual validity periods.
- Added non-expiring one-time entitlement support.
- Added explicit expiry and revocation behavior.
- Access evaluation requires both an active entitlement and its confirmed source payment.

### Persistence and tenant isolation

- Added forward-only migration `20260914114500_add_user_type_entitlement`.
- Added a unique payment-to-entitlement constraint.
- Added tenant-bounded User and Product foreign keys.
- Added a composite Payment ownership foreign key covering payment, tenant, User and Product.
- Added a validity-period database check.
- Added tenant-scoped repository reads and writes.
- Cross-tenant entitlement retrieval returns no record.
- Repository updates require both entitlement identity and tenant ownership.

### Verification evidence

Evidence timestamp: **2026-09-14 12:08:13 +02:00**

- Migration deployed only to protected local database `titan_core_test`.
- Prisma migration status verified.
- Entitlement domain and payment-policy tests passed.
- Entitlement repository integration tests passed.
- Product, payment and entitlement regression passed.
- Full backend test suite passed.
- Backend TypeScript build passed.
- Backend lint passed with no errors.
- `git diff --check` passed.
- Unauthorized files changed: none.
- Knowledge Base publication visually verified at **2026-09-14 12:14:46 +02:00**.

### Delivery classification

Control 113.8 is complete, verified and published as a backend entitlement foundation. It does not claim a live checkout, payment-provider integration, frontend onboarding release or automatic RBAC assignment. The canonical Cloudflare alias incident remains tracked separately. Mission 113 remains active.
## Control 113.9 - Profile Picture

Status: **COMPLETE / VERIFIED / KNOWLEDGE BASE PUBLISHED**

Control 113.9 establishes the secure, provider-neutral profile-picture foundation for athlete onboarding.

### Ownership decision

- The authoritative profile picture belongs to the `User` personal profile.
- `Athlete` does not duplicate profile-picture data.
- Athlete access resolves through the explicit User-to-Athlete relationship.
- Existing users remain compatible through nullable metadata.
- No image, tenant, User or storage location is inferred.

### Image contract

- Supported formats are JPEG, PNG and WebP.
- SVG and other unsupported formats are rejected.
- Empty images are rejected.
- Maximum image size is 5 MiB.
- Storage keys are opaque and limited to 512 characters.
- Storage keys must be owned by the explicit tenant and User path.
- URL-shaped, traversal and backslash-containing keys are rejected.
- Invalid replacements preserve the existing profile-picture state.

### Persistence integrity

- Added nullable storage key, MIME type and byte-size fields to `User`.
- Added forward-only migration `20260914122500_add_user_profile_picture`.
- Database constraints require all profile-picture metadata fields to be either complete or null.
- Database constraints enforce supported MIME types and size limits.
- Existing users remain valid without profile pictures.
- Prisma persistence and rehydration mapping were updated.

### Application and storage boundary

- Added a provider-neutral profile-picture storage contract.
- No Cloudflare R2, S3 or other provider credentials were invented.
- Added tenant-bounded User profile lookup.
- Added profile-picture set and removal commands.
- Added profile-picture set and removal use cases.
- Upload content is validated before storage.
- A newly stored object is deleted if database persistence fails.
- Removal clears persisted metadata and requests deletion from storage.
- Cross-tenant User lookup returns no record.
- Raw image bytes are not stored in PostgreSQL.
- Arbitrary external image URLs are not persisted.

### Verification evidence

Evidence timestamp: **2026-09-14 14:42:36 +02:00**

- Migration deployed only to protected local database `titan_core_test`.
- Prisma migration status verified.
- Profile-picture domain tests passed.
- Profile-picture application tests passed.
- Profile-picture persistence and tenant-isolation tests passed.
- User and authentication regression passed.
- Full backend test suite passed.
- Backend TypeScript build passed.
- Backend lint passed with no errors.
- `git diff --check` passed.
- Unauthorized files changed: none.
- Knowledge Base publication visually verified at **2026-09-14 14:46:58 +02:00**.

### Delivery classification

Control 113.9 is complete, verified and published as a secure backend profile-picture foundation. It does not claim that a storage provider, multipart HTTP endpoint or frontend uploader is released. The canonical Cloudflare alias incident remains tracked separately. Mission 113 remains active.
## Control 113.10 - Editable Personal Details

Status: **TECHNICALLY COMPLETE / VERIFIED**

Control 113.10 establishes an authenticated self-service boundary for editing the personal details owned jointly by the User identity and its linked Athlete profile.

### Self-service boundary

- Added authenticated `PUT /api/v1/auth/me`.
- User and tenant identity come only from the verified authentication context.
- No request-supplied User or tenant identity is trusted.
- This boundary does not reuse the permissioned administrator User-update route.
- Unauthenticated requests are rejected.
- A linked, tenant-owned Athlete profile is required.

### Editable details

- First name.
- Surname.
- Email address.
- Contact number.
- Country code.
- Date of birth.

### Protected account fields

The self-service boundary cannot change:

- tenant ownership;
- organisation ownership;
- selected onboarding user type;
- roles or permissions;
- account status;
- password;
- payment or entitlement state.

Requests containing protected account fields are rejected.

### Validation and normalization

- Athlete first name and surname use the existing required, trimmed and bounded Athlete contracts.
- User and Athlete names persist from the same canonical normalized values.
- Email uses the existing trimmed, lowercase User email contract.
- Email uniqueness remains tenant-scoped.
- Contact number uses the existing nullable E.164 User contract.
- Country uses the existing required two-letter uppercase Athlete contract.
- Date of birth must be a valid, non-future date.
- Invalid requests do not partially mutate either record.

### Atomic persistence and tenant isolation

- Added a dedicated personal-details transaction port.
- Added a Prisma transaction implementation.
- User and linked Athlete updates occur in one database transaction.
- Duplicate email is checked inside the transaction.
- User lookup is bounded by authenticated User and tenant identity.
- Athlete lookup is bounded by authenticated User and tenant identity.
- Cross-tenant access returns no User.
- Failure of either update rolls back both records.

### Verification evidence

Evidence timestamp: **2026-09-14 15:12:56 +02:00**

- Personal-details application tests passed.
- Atomic User/Athlete transaction tests passed.
- Authenticated API tests passed.
- Cross-tenant rejection tests passed.
- Duplicate-email rollback tests passed.
- Invalid Athlete-data rollback tests passed.
- User, Athlete and authentication regression passed.
- Full backend test suite passed.
- Backend TypeScript build passed.
- Backend lint passed with no errors.
- `git diff --check` passed.
- Unauthorized files changed: none.

### Delivery classification

Control 113.10 is technically complete and verified as a backend self-service personal-details boundary. It does not claim that the product frontend is released. Knowledge Base publication verification remains outstanding. Mission 113 remains active.
