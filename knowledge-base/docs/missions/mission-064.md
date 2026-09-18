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

Mission 064 remains **ACTIVE**. Control 64.5 remains **NOT STARTED**.
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
