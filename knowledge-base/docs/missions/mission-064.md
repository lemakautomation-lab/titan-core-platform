---
title: "Mission 064 - PERSONAL TRAINER PLATFORM"
slug: /missions/064/
sidebar_position: 64
---

# Mission 064 - PERSONAL TRAINER PLATFORM

> Authoritative scope imported from the TITAN Master Mission Control Register.

## Objective

Enable trainers to operate their professional environment.

## Delivery Classification

- **Frontend classification:** FRONTEND-VISIBLE
Local frontend expectation: visible change is expected only where the listed mission controls require a user-facing workflow, page, visualisation or verification surface.

## Controls

### Control 64.1 - Trainer subscription/access

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

#### Control 64.1 Status

**COMPLETE / TECHNICALLY VERIFIED**

Control 64.1 establishes the authenticated Trainer subscription/access boundary.

**Backend boundary**

- `GET /api/v1/auth/me/trainer-access`
- identity and tenant derived from authentication;
- ACTIVE account required;
- selected user type must be `TRAINER`;
- ACTIVE Trainer entitlement required;
- exact source payment must remain `CONFIRMED`;
- invalid, expired, revoked, refunded or missing commercial evidence fails closed;
- no new migration, RBAC role, automatic role assignment or duplicate payment architecture.

**Frontend boundary**

- protected `/trainer` route;
- authoritative Trainer access API consumed directly;
- Trainer status is not inferred from RBAC;
- deterministic granted, wrong-user-type, subscription-required, loading and safe-failure states;
- Trainer signup and checkout remain outside Control 64.1.

**Verification evidence**

- Backend targeted Trainer integration: **8 tests passed**
- Backend commercial/auth regression: **7 files / 48 tests passed**
- Full backend: **142 files / 1057 tests passed**
- Backend TypeScript build: **GREEN**
- Trainer frontend UI: **4 tests passed**
- Router regression: **19 tests passed**
- Full frontend: **35 files / 185 tests passed**
- Frontend production build: **GREEN**
- Frontend lint: **GREEN**
- `git diff --check`: **GREEN**
- Unauthorized implementation files: **NONE**

**Release state**

Control 64.1 is **COMPLETE / VERIFIED / COMMITTED / PUSHED / KNOWLEDGE BASE PUBLISHED**.

- Source commit: `ddba6c2ece8175c38112041fcd27ef66b183ee33`
- Cloudflare deployment: `9827bd34`
- Immutable publication: `https://9827bd34.titan-core-platform.pages.dev/docs/missions/064/`
- Canonical publication: `https://titan-core-platform.pages.dev/docs/missions/064/`
- Immutable and canonical HTTP verification: **200 / VERIFIED**
- Cloudflare Access interception: **ABSENT / VERIFIED**
- Docusaurus production build: **GREEN**
- TITAN product frontend production deployment: **NOT CLAIMED**

Mission 064 remains **ACTIVE** because Controls 64.3 through 64.11 remain outstanding.
### Control 64.2 - Trainer sign-up

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

#### Control 64.2 Status

**COMPLETE / VERIFIED / COMMITTED / PUSHED / KNOWLEDGE BASE PUBLISHED**

Control 64.2 establishes the dedicated TITAN Health Trainer registration boundary.

**Backend boundary**

- `POST /api/v1/auth/register/trainer`
- only first name, last name, email and password are accepted;
- configured consumer tenant is authoritative;
- User is created ACTIVE with `selectedUserType = TRAINER`;
- duplicate tenant/email registration fails safely;
- successful registration uses the established authentication/session flow;
- no Athlete or AthleteDigitalTwin is created;
- no Payment or UserTypeEntitlement is created or granted;
- no RBAC role or permission is created or granted;
- no database migration was required.

**Security boundary**

- caller cannot supply tenant identity;
- caller cannot supply selected user type;
- caller cannot supply roles or permissions;
- caller cannot supply payment or entitlement state;
- Athlete-specific fields are rejected;
- unknown/protected fields are rejected;
- commercial Trainer access remains governed by Control 64.1;
- authentication, Trainer user type, paid entitlement and RBAC remain separate.

**Frontend boundary**

- public `/signup/trainer` route;
- first name, last name, email and password only;
- dedicated Trainer registration API;
- established auth-session storage reused;
- paid Trainer access explicitly requires successful payment;
- frontend does not infer commercial Trainer access.

**Verification evidence**

- Backend targeted Trainer registration: **2 files / 13 tests passed**
- Full backend regression: **GREEN**
- Backend TypeScript build: **GREEN**
- Trainer signup page: **3 tests passed**
- Targeted frontend Trainer/auth/router regression: **4 files / 39 tests passed**
- Full frontend: **36 files / 191 tests passed**
- Frontend production build: **GREEN**
- Frontend lint: **GREEN**
- `git diff --check`: **GREEN**
- Protected Mission 001-145 closure register: **UNTRACKED / UNTOUCHED**
- Unauthorized implementation scope: **NONE IDENTIFIED**

**Release state**

Control 64.2 is **COMPLETE / VERIFIED / COMMITTED / PUSHED / KNOWLEDGE BASE PUBLISHED**.

Publication evidence:

- Source commit: 2d017d2a562161e7e25605a9b8ce4cbddc1c8391
- Cloudflare deployment ID: f3f56982-98d4-4448-8cc2-7225ca42185a
- Immutable publication: https://f3f56982.titan-core-platform.pages.dev/docs/missions/064/
- Canonical publication: https://titan-core-platform.pages.dev/docs/missions/064/
- Immutable and canonical HTTP verification: **200 / VERIFIED**
- Control 64.2 publication content: **VERIFIED**
- Docusaurus production build: **GREEN**

TITAN product frontend production deployment: **NOT CLAIMED**.

Mission 064 remains **ACTIVE** because Controls 64.3 through 64.11 remain outstanding.
### Control 64.3 - Professional profile

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

#### Control 64.3 Status

**COMPLETE / VERIFIED / COMMITTED / PUSHED / KNOWLEDGE BASE PUBLISHED**

Control 64.3 establishes the tenant-owned TITAN Health Trainer professional-profile boundary.

**Persistence boundary**

- dedicated `TrainerProfile` aggregate;
- one-to-one ownership through `(userId, tenantId)`;
- composite tenant/User foreign-key enforcement;
- professional profile remains separate from User identity/personal details;
- migration `20260918150000_add_trainer_profile`;
- Prisma migration deployed to the test database;
- database schema verified up to date.

Professional fields:

- professional title;
- biography;
- qualifications;
- specialisations;
- years of experience;
- country code;
- website URL.

**API and access boundary**

- `GET /api/v1/auth/me/trainer-profile`
- `PUT /api/v1/auth/me/trainer-profile`
- authenticated User and tenant identity are server-derived;
- ACTIVE Trainer user type is required;
- active Trainer entitlement is required through the existing Control 64.1 access policy;
- caller cannot supply ownership, selected user type, RBAC, payment or entitlement authority;
- public profile DTO does not expose `userId` or `tenantId`.

**Validation and security**

- bounded professional text fields;
- years of experience restricted to integer 0 through 100;
- country code normalized and validated as two letters;
- website restricted to valid HTTP/HTTPS URLs;
- cross-tenant profile isolation verified;
- protected client authority fields rejected;
- commercial entitlement remains separate from RBAC;
- failures are handled without bypassing tenant or access controls.

**Frontend boundary**

The protected `/trainer` experience now provides the professional-profile editor only after Trainer access is granted.

The frontend supports professional-profile loading, first creation, update, validation and safe failure states without supplying tenant/User ownership or authorization state.

**Verification evidence**

- Full backend: **145 files / 1079 tests passed**
- Final targeted backend Trainer profile/access: **2 files / 17 tests passed**
- Backend TypeScript build: **GREEN**
- Prisma migration deployment/status: **GREEN / SCHEMA UP TO DATE**
- Public DTO ownership exposure: **NONE**
- Full frontend: **37 files / 196 tests passed**
- Final targeted frontend Trainer profile/access: **2 files / 9 tests passed**
- Trainer professional-profile targeted tests: **5 tests passed**
- Frontend production build: **GREEN**
- Frontend lint: **GREEN / NO WARNINGS**
- `git diff --check`: **GREEN**
- Protected Mission 001-145 closure register: **UNTRACKED / UNTOUCHED**
- Unauthorized implementation scope: **NONE IDENTIFIED**

**Scope deferred**

Controls 64.4 through 64.11 remain outside Control 64.3.

Client management, programme creation, client workout assignment, client monitoring, reports, AI assistance, session scheduling and business workflow controls are not claimed.

**Release state**

Control 64.3 is **COMPLETE / VERIFIED / COMMITTED / PUSHED / KNOWLEDGE BASE PUBLISHED**.

- Implementation commit: `fe57c14536c5499ad3699e53c879fd6009f6326a`
- Knowledge Base publication: **VERIFIED**

Publication evidence:

- Source commit: `fe57c14536c5499ad3699e53c879fd6009f6326a`
- Cloudflare deployment ID: `bfcc497b-8519-4025-957c-0209945f02ba`
- Immutable publication: https://bfcc497b.titan-core-platform.pages.dev/docs/missions/064/
- Canonical publication: https://titan-core-platform.pages.dev/docs/missions/064/
- Immutable HTTP verification: **200 / VERIFIED**
- Canonical HTTP verification: **200 / VERIFIED**
- Control 64.3 publication content: **VERIFIED**
- Docusaurus production build: **GREEN**
- TITAN product frontend production deployment: **NOT CLAIMED**

Mission 064 remains **ACTIVE** because Controls 64.4 through 64.11 remain outstanding.
### Control 64.4 - Client management

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

#### Control 64.4 Status

**COMPLETE / VERIFIED / COMMITTED / PUSHED / KNOWLEDGE BASE PUBLISHED**

Control 64.4 establishes the secure tenant-scoped Trainer client-management boundary.

**Relationship boundary**

- existing `AthleteRelationship` aggregate reused;
- `athleteId` identifies the client Athlete;
- relationship type is server-fixed to `TRAINER`;
- `relatedEntityId` is the authenticated Trainer User ID;
- `tenantId` is derived from the authenticated tenant;
- browser callers cannot override ownership, relationship type or commercial authority.

**Trainer client API**

- `GET /api/v1/auth/me/trainer-clients`
- `POST /api/v1/auth/me/trainer-clients/:athleteId`
- `DELETE /api/v1/auth/me/trainer-clients/:athleteId`

Access reuses the Control 64.1 Trainer commercial-access policy.

An authenticated ACTIVE User with `selectedUserType = TRAINER` and an active Trainer entitlement is required.

**Client lifecycle**

- active Trainer clients can be listed;
- a tenant-owned Athlete can be associated with the authenticated Trainer;
- duplicate active relationships are rejected;
- removal preserves history by marking the relationship `INACTIVE` and recording `endsAt`;
- re-adding an inactive client reactivates the existing relationship and clears `endsAt`;
- inactive relationships are excluded from the active roster.

**Security and isolation**

- unauthenticated access denied;
- non-Trainer access denied;
- Trainer without active entitlement denied;
- server-derived Trainer and tenant ownership;
- cross-tenant Athlete association rejected;
- Trainer roster isolation verified;
- malicious ownership/relationship-type fields cannot override authoritative server identity;
- public client DTO does not expose tenant or Trainer ownership;
- commercial entitlement remains separate from RBAC.

**Frontend boundary**

The protected `/trainer` experience provides client management only after Trainer access has been granted.

The Trainer can view the active roster, add an Athlete by Athlete ID and remove an active client association.

Loading, empty, add, remove and safe failure states are covered.

The roster passed the semantic accessibility lint gate.

**Verification evidence**

- Full backend: **146 files / 1088 tests passed**
- Targeted Control 64.4 security/integration: **1 file / 9 tests passed**
- Bounded Trainer/AthleteRelationship regression: **6 files / 31 tests passed**
- Backend TypeScript build: **GREEN**
- Full frontend: **38 files / 202 tests passed**
- Final targeted Trainer client-management/access: **2 files / 10 tests passed**
- Frontend production build: **GREEN**
- Frontend lint: **GREEN / NO WARNINGS**
- Semantic accessibility gate: **GREEN**
- `git diff --check`: **GREEN**
- Implementation scope: **17 authorized files**
- Unauthorized committed files: **NONE**
- Protected Mission 001-145 closure register: **UNTRACKED / UNTOUCHED**

**Scope deferred**

Controls 64.5 through 64.11 remain outside Control 64.4.

Programme creation, client workout assignment, client monitoring, reports, AI assistance, session scheduling and business workflow controls are not claimed.

**Release state**

Control 64.4 implementation is **COMPLETE / VERIFIED / COMMITTED / PUSHED**.

- Implementation commit: `03182e8e8a7135af08f4afcb1df87fddc888743e`
- Knowledge Base publication: **VERIFIED**
- TITAN product frontend production deployment: **NOT CLAIMED**

Mission 064 remains **ACTIVE** because Controls 64.5 through 64.11 remain outstanding.

### Knowledge Base Publication Evidence

- Candidate deployment ID: `60cd0f64-1227-4b49-8e10-f3887fca27a2`
- Candidate source implementation: `03182e8e8a7135af08f4afcb1df87fddc888743e`
- Immutable Mission 064 URL: `https://60cd0f64.titan-core-platform.pages.dev/docs/missions/064/`
- Canonical Mission 064 URL: `https://titan-core-platform.pages.dev/docs/missions/064/`
- Immutable HTTP verification: **200 / VERIFIED**
- Canonical HTTP verification: **200 / VERIFIED**
- Control 64.4 content: **VERIFIED**
- Client management content: **VERIFIED**
- Backend evidence (146 files / 1088 tests): **VERIFIED**
- Frontend evidence (38 files / 202 tests): **VERIFIED**
- Trainer client endpoint evidence: **VERIFIED**
- Knowledge Base publication: **VERIFIED**
- Product frontend production deployment: **NOT CLAIMED**
- Mission 064 remains: **ACTIVE**
### Knowledge Base Access Security Evidence

**Status:** PRIVATE / ACCESS-CONTROLLED / VERIFIED

Cloudflare Access was applied to the TITAN engineering Knowledge Base on 18 September 2026.

Security boundary verified:

- `docs.titan-tech.co.za` requires Cloudflare Access authentication;
- anonymous access to the custom Knowledge Base hostname is blocked;
- authorized administrator access was successfully verified;
- production `titan-core-platform.pages.dev` requires Cloudflare Access authentication;
- wildcard preview/immutable `*.titan-core-platform.pages.dev` deployments are protected by Cloudflare Access;
- an immutable Mission 064 deployment was independently tested and intercepted by Cloudflare Access;
- no authentication credentials, email addresses, Access tokens, session tokens or private login URLs are recorded in repository evidence;
- the public TitanTech corporate website remains outside the Knowledge Base Access boundary.

This security hardening does not alter the implementation or closure state of Controls 64.1 through 64.4.

Mission 064 remains **ACTIVE**. Control 64.5 was subsequently implemented and verified; see the Control 64.5 evidence below.
### Control 64.5 - Programme creation

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 64.6 - Client workout assignment

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 64.7 - Client monitoring

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 64.8 - Reports

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 64.9 - AI assistance

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 64.10 - Session scheduling

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 64.11 - Business workflow controls

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

## Mission Exit Gate

all controls implemented or explicitly verified as already satisfied; targeted tests GREEN; relevant regression GREEN; build GREEN; security/tenant/RBAC implications verified; migration/API contract verified where applicable; documentation/evidence captured.

---

## Control 64.5 - Programme Creation

### Status

**COMPLETE / VERIFIED / COMMITTED / PUSHED**

### Objective

Control 64.5 introduces a dedicated Trainer programme-creation boundary while reusing the existing TITAN workout-programme architecture delivered by the programme engine.

The control does not introduce a duplicate Trainer programme aggregate and does not weaken or repurpose the existing generic workout-programme creation contract.

### Architecture

Trainer programme creation follows this authorization chain:

Authenticated User -> RBAC Permission -> Active Paid Trainer Access -> Active Trainer/Client Relationship -> Existing Workout Programme Creation

The dedicated Trainer endpoint is:

POST /api/v1/workout-programmes/trainer

The existing generic workout-programme endpoint remains available for its existing RBAC-governed purpose and was not converted into a Trainer-only boundary.

### Security Boundary

Programme creation through the Trainer boundary requires:

- authenticated user context;
- workout-programmes.create permission;
- active paid Trainer access;
- an active TRAINER AthleteRelationship between the authenticated Trainer and target Athlete;
- matching tenant ownership;
- all existing WorkoutProgramme validation and persistence rules.

The Trainer cannot create a programme for an Athlete without an active Trainer/client relationship.

Inactive Trainer/client relationships are rejected.

Cross-tenant programme creation remains prohibited by the existing tenant-aware Athlete and Sport boundaries.

### Implementation

Control 64.5 added:

- CreateTrainerWorkoutProgrammeUseCase;
- Trainer commercial-access enforcement through GetMyTrainerAccessUseCase;
- active Trainer/client relationship enforcement;
- dedicated Trainer programme creation controller boundary;
- dedicated /workout-programmes/trainer route;
- composition-root wiring;
- focused unit security tests;
- dedicated API security/integration tests.

The existing CreateWorkoutProgrammeUseCase remains the authoritative generic programme-creation implementation and is delegated to only after the Trainer-specific authorization boundary succeeds.

No Prisma schema change or database migration was required.

### Explicit Scope Boundary

Control 64.5 covers **programme creation only**.

Control 64.6 - Client Workout Assignment remains outside this control and is **NOT STARTED**.

No client workout assignment, client monitoring, reports, AI assistance, session scheduling or business workflow controls are claimed by Control 64.5.

### Verification Evidence

- Trainer wrapper unit regression: **1 file / 4 tests passed**
- Trainer programme API security/integration regression: **6 tests passed**
- Existing generic Mission 055 workout-programme API regression: **1 file / 6 tests passed**
- Full backend regression: **148 files / 1098 tests passed**
- TypeScript build: **GREEN**
- Control 64.5 scoped ESLint: **GREEN**
- git diff --check: **GREEN**
- Implementation scope: **7 authorized files**
- Unauthorized committed files: **NONE**
- Protected Mission 001-145 closure register: **UNTRACKED / UNTOUCHED**
- Implementation commit: `603954f0a2ceeaffe6668879068b142713a5ed03`
- Implementation push: **VERIFIED**
- Implementation HEAD/origin synchronization: **0 / 0**

Repository-wide ESLint currently reports one pre-existing unrelated error in `tests/integration/auth/actionable-insights.spec.ts`. Repository HEAD evidence confirmed that defect predates Control 64.5. Control 64.5's seven implementation files pass scoped ESLint.

### Release State

Control 64.5 implementation is **COMPLETE / VERIFIED / COMMITTED / PUSHED**.

Implementation commit: `603954f0a2ceeaffe6668879068b142713a5ed03`

Knowledge Base publication: **PENDING**

TITAN product frontend production deployment is **NOT CLAIMED**.

Mission 064 remains **ACTIVE**.

Control 64.6 - Client Workout Assignment remains **NOT STARTED**.
