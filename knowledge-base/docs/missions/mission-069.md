---
title: "Mission 069 - PERFORMANCE DIRECTOR PLATFORM"
slug: /missions/069/
sidebar_position: 69
---

# Mission 069 - PERFORMANCE DIRECTOR PLATFORM

> Authoritative scope imported from the TITAN Master Mission Control Register.

## Objective

Provide department-level intelligence.

## Delivery Classification

- **Frontend classification:** FRONTEND-VISIBLE
Local frontend expectation: visible change is expected only where the listed mission controls require a user-facing workflow, page, visualisation or verification surface.

## Controls

### Control 69.1 - Department command centre

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Status:** TECHNICALLY COMPLETE / VERIFIED / RELEASE PENDING

- Added read-only `GET /api/v1/performance-director/command-centre` and visible `/performance-director` page. The page reports active staff and athlete counts for the authenticated user's directly assigned active organisation.
- Requires `performance-director.command-centre.read` at the API and frontend route. The database migration creates the tenant-scoped permission and grants existing tenant `ADMIN` roles only. A user without an assigned active organisation receives a bounded 404 response.
- No organisation identifier comes from a request parameter. The use case resolves the director's organisation from the authenticated user; queries enforce the authenticated tenant and that exact organisation. Other organisations, child organisations and coach teams are outside this control's data scope.
- No prediction, ranking, clinical interpretation, or permission to update staff or athletes is added.
- Backend TypeScript build, focused lint, and `git diff --check` passed in an isolated checkout of the 68.4 baseline. Current main has the same exact base blobs for the three modified runtime files. The test migration and authenticated API regression passed. Full backend serial regression passed (184/184 files, 1300/1300 tests); frontend regression passed (41/41 files, 218/218 tests). Backend and frontend builds, focused backend lint, frontend lint (109 files), Knowledge Base build, and git diff --check passed.
- Apply the database migration before enabling the new API route. Production database and application deployments are still pending. For new tenants, an authorised database operator can run `src/scripts/provision-director-command-centre-permission.ts` with explicit tenant and role UUIDs and a change reference; its default is a dry run and `--apply` writes a tenant-scoped grant and audit record. The protected local test-database gate verified dry run, cross-tenant rejection, idempotent granting and audit records. Production migration, application rollout and publication verification remain pending.

### Control 69.2 - Department performance intelligence

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Status:** TECHNICALLY COMPLETE / VERIFIED / RELEASE PENDING

- Added read-only `GET /api/v1/performance-director/intelligence?days=7|30|90`. The default is 30 days; unsupported values fail validation. The response returns the director's own organisation identifier, active Athlete count, Athletes with effective measurements, effective measurement count and most recent recorded timestamp within the window. No individual values, Athlete identifiers or invented performance scores are returned.
- Measurement activity uses the existing effective-record rule: an observation with a correction is excluded in favour of its terminal correction. Both the reporting window and authenticated tenant/active assigned organisation are enforced in database queries. Inactive Athletes and other organisations are excluded.
- The API requires `performance-director.intelligence.read`, separate from broad `performance-measurements.read`. A tenant-scoped migration grants existing `ADMIN` roles only; an audited dry-run-first operator command supports new tenants. The frontend shows the optional intelligence section only to users with the dedicated permission and offers 7, 30 and 90-day windows.
- Focused authenticated API, correction and scope tests and frontend success, failure and permission tests have been added. The migration applied to protected local titan_core_test. Focused backend tests passed (2/2 files, 4/4 tests), including scope, correction handling and new-tenant provisioning; focused frontend tests passed (4/4). Full backend serial regression passed (186/186 files, 1304/1304 tests); full frontend regression passed (41/41 files, 220/220 tests). Backend and frontend builds, focused backend lint, frontend lint, Knowledge Base build and git diff --check passed.
- Production database migration, backend and frontend rollout, and Knowledge Base publication verification remain pending.

### Control 69.3 - Cross-team visibility within authorised scope

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Status:** TECHNICALLY COMPLETE / VERIFIED / RELEASE PENDING

- Added read-only `GET /api/v1/performance-director/teams` with an integer limit from 1 to 100 (default 25) and a validated opaque UUID cursor. It lists only active Coach Team identifiers and names owned by active coaches in the director's active assigned organisation and authenticated tenant. An out-of-scope cursor receives the same bounded 404 as a missing department.
- A separately revocable `performance-director.teams.read` permission protects the route. A tenant-scoped migration grants existing `ADMIN` roles only; an audited, dry-run-first operator command supports new tenants. The frontend displays the team list and bounded next-page action only when that permission is present.
- Coach Team has no organisation or Athlete membership field. Scope derives from its coach's current organisation. This control does not infer Coach Squad membership, cross-organisation visibility, athlete data, or department-wide Coach Team ownership from names.
- Targeted API/RBAC, cross-organisation, inactive-record, cursor, pagination, provisioning and frontend tests have been added. The migration applied to protected local titan_core_test. Focused backend tests passed (2/2 files, 4/4 tests), including authorization, scope, pagination and provisioning; focused frontend tests passed (6/6). Full backend serial regression passed on rerun (188/188 files, 1308/1308 tests); full frontend regression passed (41/41 files, 222/222 tests). Backend and frontend builds, focused backend lint, frontend lint, Knowledge Base build and git diff --check passed. The first full backend run had a 5-second timeout in an unchanged Mission 068.1 test; the complete rerun passed.
- Production database migration, application rollout and Knowledge Base publication verification remain pending.

### Control 69.4 - Role-specific reporting

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Status:** TECHNICALLY COMPLETE / VERIFIED / RELEASE PENDING

- Added read-only `GET /api/v1/performance-director/report?days=7|30|90` with 30 days as default. A dedicated `performance-director.reports.read` grant controls report access independently of intelligence and team visibility. The visible department page shows the report only to users with this grant; page entry continues to require command-centre access.
- The report combines the existing tenant-scoped command-centre and terminal-correction measurement readers. Both independently resolve the authenticated director's directly assigned active organisation; the combined result fails closed if organisation identifiers differ. Only the organisation name and aggregate staff, athlete and measurement activity counts are returned. No athlete or staff identifiers, values, clinical conclusions or predictions are exposed.
- A tenant-scoped migration grants the new permission to existing `ADMIN` roles; an audited dry-run-first operator command supports new tenants. Apply the migration before deploying the route. Neither the production database nor the hosted application has been changed.
- Added HTTP permission, input, active-organisation and aggregate-scope cases, provisioning coverage and frontend permission, window and failure cases. The migration applied to protected local titan_core_test. Focused backend tests passed (2/2 files, 4/4 tests), including report authorization, scope and new-tenant provisioning; focused frontend tests passed (8/8). Full backend serial regression passed (190/190 files, 1312/1312 tests); full frontend regression passed (41/41 files, 224/224 tests). Backend and frontend builds, changed-file backend lint, frontend lint, Knowledge Base build and git diff --check passed.

### Control 69.5 - Decision-support controls

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

## Mission Exit Gate

all controls implemented or explicitly verified as already satisfied; targeted tests GREEN; relevant regression GREEN; build GREEN; security/tenant/RBAC implications verified; migration/API contract verified where applicable; documentation/evidence captured.
