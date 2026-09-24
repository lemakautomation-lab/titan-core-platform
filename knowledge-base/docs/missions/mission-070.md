---
title: "Mission 070 - CLUB MANAGEMENT"
slug: /missions/070/
sidebar_position: 70
---

# Mission 070 - CLUB MANAGEMENT

> Authoritative scope imported from the TITAN Master Mission Control Register.

## Objective

Build professional club architecture.

## Delivery Classification

- **Frontend classification:** FRONTEND-VISIBLE
Local frontend expectation: visible change is expected only where the listed mission controls require a user-facing workflow, page, visualisation or verification surface.

## Controls

### Control 70.1 - Executive structure

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Status:** TECHNICALLY COMPLETE / VERIFIED / RELEASE PENDING

- Added `GET /api/v1/club/executives?limit=1..100&cursor=uuid` with a default page size of 25 and a visible `/club` page. The server resolves the authenticated user's directly assigned active organisation and tenant. It returns only its name, count of directly linked active child organisations and paged active users in that same organisation explicitly assigned the `CLUB_EXECUTIVE` role. An out-of-scope cursor receives a bounded 404.
- A dedicated tenant-scoped `club.executives.read` permission protects the API and frontend route. A migration grants existing tenant `ADMIN` roles this view permission; an audited, dry-run-first operator command supports new tenants. The permission grants read access but never appoints an executive. Existing role-management controls govern any `CLUB_EXECUTIVE` appointment.
- The model contains no dedicated club classification or executive appointment entity. This control makes no claim that an `ADMIN` user is an executive, that a child organisation is a team, or that an unassigned user is a club officer. No cross-organisation traversal, hierarchy edit, athlete data or personnel write is introduced.
- Targeted API scope, authentication, cursor, inactivity, pagination, provisioning and frontend access/failure tests have been added. The migration applied to protected local titan_core_test. Focused backend tests passed (2/2 files, 4/4 tests), including access scope, pagination and provisioning; focused frontend and router tests passed (2/2 files, 27/27 tests). Full backend serial regression passed (195/195 files, 1325/1325 tests); full frontend regression passed (42/42 files, 230/230 tests). Backend and frontend builds, changed-file backend lint, frontend lint, Knowledge Base build and git diff --check passed. Commit, production rollout and Knowledge Base publication verification remain pending. Production database and application rollout remain pending.

### Control 70.2 - Performance director

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Status:** TECHNICALLY COMPLETE / VERIFIED / RELEASE PENDING

- Added authenticated `GET /api/v1/club/directors?limit=1..100&cursor=uuid` with default limit 25. It pages only active users in the authenticated user's directly assigned active organisation and tenant who have an explicit tenant `PERFORMANCE_DIRECTOR` role. A cursor outside that scope receives a bounded 404. The Club page presents this section only with `club.directors.read` and checks that the returned club matches its executive view.
- The dedicated `club.directors.read` grant is tenant-scoped. A migration grants existing tenant `ADMIN` roles read access, while an audited dry-run-first command supports new-tenant grants. The permission never assigns a director role; established tenant role management handles appointments. The standalone Mission 069 Performance Director command centre and its separate permissions remain the reporting workflow.
- The query does not infer director status from ADMIN, a coaching relationship, organisation name or possession of a Mission 069 reporting permission. No child-organisation traversal, personnel mutation, athlete data or cross-tenant roster is introduced.
- Added focused API, validation, inactive-user, pagination, cursor-scope, provisioning and frontend permission/scope cases. The migration applied to protected local titan_core_test. Focused backend tests passed (2/2 files, 4/4 tests); focused frontend and router tests passed (2/2 files, 29/29 tests). Full backend serial regression and changed-file backend lint passed. Full frontend regression passed (42/42 files, 232/232 tests). After correcting an effect dependency, frontend lint, focused Club page tests (4/4), frontend build, Knowledge Base build and git diff --check passed. Commit, production rollout and Knowledge Base publication verification remain pending. Production migration and application rollout remain pending.

### Control 70.3 - Coaches

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Status:** TECHNICALLY COMPLETE / VERIFIED / RELEASE PENDING

- Added read-only `GET /api/v1/club/coaches?limit=1..100&cursor=uuid` with a default limit of 25. The query resolves the authenticated user's directly assigned active organisation and tenant and pages active users in that organisation who explicitly hold a tenant `COACH` role. Missing or out-of-scope cursors receive the same bounded 404 as an unassigned club.
- A dedicated tenant-scoped `club.coaches.read` permission protects the API and the optional Club page coaches section. The existing Club page still requires `club.executives.read` to enter. A migration grants existing tenant `ADMIN` roles the new read permission; an audited dry-run-first operator command supports new tenants. This permission does not appoint coaches or expose coach–Athlete relationships.
- The page loads the coaches section only when permitted, verifies that its organisation matches the authorised executive view and supports bounded pagination. Authentication, input validation, role and tenant scope, active status, cursor scope, provisioning and frontend failure cases are covered by targeted tests. The migration applied to protected local titan_core_test. Focused backend tests passed (2/2 files, 4/4 tests); focused frontend and router tests passed (2/2 files, 31/31 tests). Full backend serial regression passed (199/199 files, 1333/1333 tests); full frontend regression passed (42/42 files, 234/234 tests). Backend and frontend builds, changed-file backend lint, frontend lint, Knowledge Base build and git diff --check passed. Commit, production rollout and Knowledge Base publication verification remain pending.

### Control 70.4 - Sports scientists

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Status:** TECHNICALLY COMPLETE / VERIFIED / RELEASE PENDING

- Added read-only `GET /api/v1/club/scientists?limit=1..100&cursor=uuid` with default limit 25. The query resolves the authenticated user's directly assigned active organisation and tenant, and pages only active users in that organisation with an explicit tenant `SPORTS_SCIENTIST` role. An unassigned club or cursor outside the scope receives a bounded 404.
- The new tenant-scoped `club.scientists.read` permission protects the endpoint and optional Club page section; Club page entry still requires `club.executives.read`. A migration grants existing tenant `ADMIN` roles the new read permission and an audited dry-run-first operator command supports new tenants. This does not appoint Sports Scientists or grant access to athlete observations.
- The frontend verifies the returned organisation against its authorised executive view, supports bounded pagination and hides failures. The existing `PERFORMANCE_PROFESSIONAL` Athlete relationship remains the separate Athlete workflow boundary and does not establish a club Sports Scientist appointment. Targeted RBAC, scope, validation, provisioning and frontend tests are added. The migration applied to protected local titan_core_test. Focused backend tests passed (2/2 files, 4/4 tests); focused frontend and router tests passed (2/2 files, 33/33 tests). Full backend serial regression passed (201/201 files, 1337/1337 tests); full frontend regression passed (42/42 files, 236/236 tests). Backend and frontend builds, changed-file backend lint, frontend lint, Knowledge Base build and git diff --check passed. Commit, production rollout and Knowledge Base publication verification remain pending.

### Control 70.5 - Strength & conditioning

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Status:** TECHNICALLY COMPLETE / VERIFIED / RELEASE PENDING

- Added read-only `GET /api/v1/club/conditioning?limit=1..100&cursor=uuid` with default limit 25. It resolves the authenticated user's directly assigned active organisation and tenant, returning only active users in that organisation with an explicit tenant `STRENGTH_CONDITIONING` role. Missing or out-of-scope cursors return the bounded 404 used for an unassigned club.
- Dedicated tenant-scoped `club.conditioning.read` protects the API and optional Club page section; page entry continues to require `club.executives.read`. A tenant-scoped migration grants existing `ADMIN` roles the new read permission, and an audited dry-run-first operator command supports new-tenant grants. It does not appoint practitioners or grant access to Athlete training observations.
- The frontend checks the organisation against its authorised executive view, pages staff and hides failed results. The existing Strength & Conditioning Athlete workflow under Mission 068 remains a separate relationship-scoped boundary. Targeted authentication, permission, pagination, input, scope, provisioning and frontend cases were added. The migration applied to protected local titan_core_test. Focused backend tests passed (2/2 files, 4/4 tests); focused frontend and router tests passed (2/2 files, 35/35 tests). Full backend serial regression passed (203/203 files, 1341/1341 tests); full frontend regression passed (42/42 files, 238/238 tests). Backend and frontend builds, changed-file backend lint, frontend lint, Knowledge Base build and git diff --check passed. Commit, production rollout and Knowledge Base publication verification remain pending.

### Control 70.6 - Nutrition

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Status:** TECHNICALLY COMPLETE / VERIFIED / RELEASE PENDING

- Added read-only `GET /api/v1/club/nutrition` with bounded cursor pagination. Authentication, the dedicated `club.nutrition.read` permission and the actor's directly assigned active club are required. The response includes only active users explicitly assigned to that club with the `NUTRITION_PROFESSIONAL` role, by name and opaque ID. The API rejects invalid pagination and out-of-scope cursors and hides missing clubs.
- A tenant-scoped migration grants the permission to existing `ADMIN` roles; an audited, dry-run-first operator command provisions it for new tenants. Apply the migration before deploying the route. The club page loads Nutrition Professionals only with their independent grant, checks the returned organisation against the authorised club and handles failures without displaying mismatched data. An Athlete's existing nutrition relationship does not confer a club assignment or grant. No meal plans, clinical advice or Athlete data are exposed.
- Added targeted API authentication, permission, pagination, tenant and active-assignment scope tests, provisioning tests and frontend permission, pagination and failure cases. The migration applied to protected local titan_core_test. Focused backend tests passed (2/2 files, 4/4 tests); focused frontend and router tests passed (2/2 files, 37/37 tests). An initial full backend run had two 5-second test timeouts; both affected files passed on rerun (13/13 tests), followed by a passing full serial backend regression with a 30-second test timeout. Full frontend regression passed (42/42 files, 240/240 tests). Backend and frontend builds, changed-file backend lint, frontend lint, Knowledge Base build and git diff --check passed. Commit, production rollout and Knowledge Base publication verification remain pending.

### Control 70.7 - Medical/rehab boundary

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Status:** TECHNICALLY COMPLETE / VERIFIED / RELEASE PENDING

- Added read-only `GET /api/v1/club/rehabilitation` with bounded cursor pagination. It requires authentication and the independent `club.rehabilitation.read` permission. The reader resolves the actor's directly assigned active club and returns only active users with an explicit `REHABILITATION_PROFESSIONAL` role in that same tenant and club. The response contains names and opaque IDs only; invalid pagination and out-of-scope cursors are rejected and a missing club is hidden.
- A tenant-scoped migration grants the permission to existing `ADMIN` roles; an audited dry-run-first operator command provisions it for new tenants. Apply the migration before deploying the route. The club page checks the returned organisation against its authorised executive view, loads only with the dedicated permission and fails closed on errors. A club staff assignment does not grant access to Athlete rehabilitation records. Existing Athlete rehabilitation access retains its separate `performance-professional.rehabilitation.read` permission and active Athlete relationship requirement. No diagnoses, treatment plans, clinical data or medical access are introduced.
- Added targeted API authentication, permission, pagination, scope and provisioning tests and frontend permission, pagination and mismatch tests. The migration applied to protected local titan_core_test. Focused backend tests passed (2/2 files, 4/4 tests); focused frontend and router tests passed (2/2 files, 39/39 tests). Full backend serial regression passed (207/207 files, 1349/1349 tests); full frontend regression passed (42/42 files, 242/242 tests). Backend and frontend builds, changed-file backend lint, frontend lint, Knowledge Base build and git diff --check passed. Commit, production rollout and Knowledge Base publication verification remain pending.

### Control 70.8 - Teams

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 70.9 - Athletes

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 70.10 - Role-based access across club structure

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

## Mission Exit Gate

all controls implemented or explicitly verified as already satisfied; targeted tests GREEN; relevant regression GREEN; build GREEN; security/tenant/RBAC implications verified; migration/API contract verified where applicable; documentation/evidence captured.

PHASE 9 — TITAN INTELLIGENCE

Missions 071–080. Controls below are the detailed execution decomposition of the authoritative roadmap scope, cross-checked against the Product Vision where the Vision adds architectural/product intent.
