---
title: "Mission 067 - TEAM PERFORMANCE"
slug: /missions/067/
sidebar_position: 67
---

# Mission 067 - TEAM PERFORMANCE

> Authoritative scope imported from the TITAN Master Mission Control Register.

## Objective

Build team performance intelligence.

## Delivery Classification

- **Frontend classification:** FRONTEND-VISIBLE
Local frontend expectation: visible change is expected only where the listed mission controls require a user-facing workflow, page, visualisation or verification surface.

## Controls

### Control 67.1 - Squad dashboards

**Status:** COMPLETE / VERIFIED / COMMITTED / PUSHED / RELEASE PENDING

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Implementation evidence**

- Implementation commit: `17f399ace4329654020d06a14136af0663daf7f8` - `Mission 067.1: Add squad performance dashboard`.
- Added explicit tenant-scoped `CoachSquad` to `Athlete` membership. Squad membership is not inferred from general Coach relationships.
- Added authenticated Coach squad membership add, list and remove capabilities.
- Added `GET /api/v1/coach/squads/:squadId/performance-dashboard`.
- Dashboard access is restricted to the authenticated Coach's owned squad.
- Dashboard authorization requires `coach-squads.read` and `performance-measurements.read`.
- Athletes are resolved within the authenticated tenant and require an exact active `COACH` relationship before performance information is exposed.
- Explicit squad membership and active Coach relationship are both required.
- Coach-linked athletes not enrolled in the squad are excluded.
- Stale or inactive Coach relationships are filtered before performance data is read.
- Dashboard intelligence includes performance metric count, effective performance measurement count, latest recovery value, latest training-stress value and workout-programme count.
- Dashboard request limit is bounded from 1 to 100.
- Same-tenant Coach ownership and cross-tenant isolation are enforced.

**Persistence and integrity evidence**

- Added `CoachSquadAthlete` persistence with unique tenant/squad/athlete membership.
- Migration `20260920220000_add_coach_squad_athlete_membership` created the membership boundary.
- Forward-only migration `20260920221000_harden_coach_squad_athlete_tenant_fk` hardened Athlete integrity with composite `(athleteId, tenantId)` foreign-key enforcement.
- Prisma validation and client generation passed.
- Both Mission 067.1 migrations were successfully applied to guarded database `titan_core_test`.
- Prisma migration status reported the test database schema up to date.
- Production database `titan_core` was not modified during Mission 067.1 verification.

**Verification evidence**

- Focused integration: 2/2 files GREEN; 13/13 tests GREEN.
- Broader Coach regression: 7/7 files GREEN; 47/47 tests GREEN.
- Full backend regression: 169/169 files GREEN; 1221/1221 tests GREEN.
- TypeScript backend build: GREEN.
- `git diff --check`: GREEN.
- Authentication, dual-permission RBAC, membership enforcement, active Coach relationship enforcement, Coach ownership isolation, tenant isolation, stale relationship filtering, empty-state behavior, bounded input validation and performance aggregation are covered by automated integration tests.
- Unauthorized files committed: none.

**Release state**

Backend implementation is verified, committed and pushed. Knowledge Base publication remains pending.

Mission 067 remains **ACTIVE** because Controls 67.2-67.6 remain incomplete.

### Control 67.2 - Individual comparisons

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 67.3 - Team trends

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 67.4 - Training load

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 67.5 - Athlete development

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 67.6 - Role/tenant-scoped comparisons

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

## Mission Exit Gate

all controls implemented or explicitly verified as already satisfied; targeted tests GREEN; relevant regression GREEN; build GREEN; security/tenant/RBAC implications verified; migration/API contract verified where applicable; documentation/evidence captured.
