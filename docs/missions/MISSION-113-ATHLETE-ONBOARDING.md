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

Status: **TECHNICALLY COMPLETE / VERIFIED**

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

Control 113.6 is technically complete and verified. Knowledge Base publication verification remains outstanding. Mission 113 remains active.