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

### Control 69.3 - Cross-team visibility within authorised scope

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 69.4 - Role-specific reporting

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 69.5 - Decision-support controls

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

## Mission Exit Gate

all controls implemented or explicitly verified as already satisfied; targeted tests GREEN; relevant regression GREEN; build GREEN; security/tenant/RBAC implications verified; migration/API contract verified where applicable; documentation/evidence captured.
