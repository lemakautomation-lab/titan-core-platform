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

**Status:** COMPLETE / VERIFIED / COMMITTED / PUSHED / KB PUBLISHED

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

Backend implementation is verified, committed and pushed. Knowledge Base publication is verified through Cloudflare Pages deployment 19f9ddef.

- Publication source commit: `a0a3f69d76ad52e9eaf24085d3f4ab710d172bad`
- Immutable Mission 067 URL: https://19f9ddef.titan-core-platform.pages.dev/docs/missions/067/
- Canonical Mission 067 URL: https://titan-core-platform.pages.dev/docs/missions/067/
- Immutable verification: HTTP 302 to Cloudflare Access - VERIFIED.
- Canonical verification: HTTP 302 to Cloudflare Access - VERIFIED.

Mission 067 remains **ACTIVE** because Controls 67.2-67.6 remain incomplete.

### Control 67.2 - Individual comparisons

**Status:** COMPLETE / VERIFIED / COMMITTED / PUSHED / KB PUBLISHED

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Implementation evidence**

- Implementation commit: `e63ece12524024f554aef5b4f0a044c72aa27b46` - `Mission 067.2: Add individual performance comparisons`.
- Added `GET /api/v1/coach/squads/:squadId/individual-comparison`.
- Comparison is restricted to the authenticated Coach's owned squad.
- Authorization requires `coach-squads.read` and `performance-measurements.read`.
- Both athletes must be explicitly enrolled in the selected squad.
- Both athletes are resolved within the authenticated tenant.
- Both athletes require an exact active `COACH` relationship with the authenticated Coach before performance information is exposed.
- Athlete identities must be distinct.
- Request limit is bounded from 1 to 100.
- Comparable metrics are matched by normalized metric slug, normalized unit and data type.
- Metrics with incompatible units or data types are excluded.
- Latest effective performance measurements are used for each compatible metric.
- No winner, ranking, score or subjective better/worse assessment is generated.
- Same-tenant Coach ownership and cross-tenant isolation are enforced.
- No new persistence model or database migration was required.

**Verification evidence**

- Focused Mission 067.2 integration: 1/1 file GREEN; 7/7 tests GREEN.
- Broader Coach regression: 3/3 files GREEN; 20/20 tests GREEN.
- Full backend regression: 170/170 files GREEN; 1228/1228 tests GREEN.
- TypeScript backend build: GREEN.
- `git diff --check`: GREEN.
- Automated coverage verifies authentication, dual-permission RBAC, explicit squad membership, active Coach relationship enforcement, metric compatibility, latest effective measurements, Coach ownership isolation, cross-tenant isolation, distinct-athlete validation and bounded input validation.
- Unauthorized files committed: none.
- Protected closure-register file remained outside the Mission 067.2 commit boundary.

**Release state**

Backend implementation is verified, committed and pushed. Knowledge Base publication is verified through Cloudflare Pages deployment `5d9b1e2c`.

- Publication source commit: `991a9d01aa6e90d3d8750409c1a73cb045b26b51`
- Immutable Mission 067 URL: https://5d9b1e2c.titan-core-platform.pages.dev/docs/missions/067/
- Canonical Mission 067 URL: https://titan-core-platform.pages.dev/docs/missions/067/
- Immutable verification: HTTP 302 to Cloudflare Access - VERIFIED.
- Canonical verification: HTTP 302 to Cloudflare Access - VERIFIED.

Mission 067 remains **ACTIVE** because Controls 67.3-67.6 remain incomplete.
### Control 67.3 - Team trends

**Status:** COMPLETE / VERIFIED / COMMITTED / PUSHED / KB PUBLISHED

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Implementation evidence**

- Implementation commit: `73cf225edd8e7df128dca3b0d95d9141b9baf7e1` - `Mission 067.3: Add team performance trends`.
- Added `GET /api/v1/coach/squads/:squadId/team-trends`.
- Restricted to the authenticated Coach's owned squad.
- Requires `coach-squads.read` and `performance-measurements.read`.
- Athletes must be explicitly enrolled in the selected squad.
- Athletes are resolved within the authenticated tenant.
- Each included athlete requires an exact active `COACH` relationship with the authenticated Coach.
- Non-members and stale/inactive Coach relationships are excluded.
- Trends use effective performance measurements.
- Compatible metrics are grouped by normalized slug, normalized unit and data type.
- Trend points are returned in deterministic chronological order.
- Output includes athlete identity, metric identity, measurement value and recorded timestamp.
- No rankings, winners or subjective better/worse assessments are generated.
- Measurement history is bounded from 1 to 100 records per athlete metric.
- Same-tenant Coach ownership and cross-tenant isolation are enforced.
- Empty owned squads return a valid empty trend result.
- No Prisma schema change or database migration was required.

**Verification evidence**

- Focused Mission 067.3 integration: 1/1 file GREEN; 7/7 tests GREEN.
- Full backend regression: 171/171 files GREEN; 1235/1235 tests GREEN.
- TypeScript backend build: GREEN.
- `git diff --check`: GREEN.
- Authentication and dual-permission RBAC verified.
- Squad membership and active Coach relationship enforcement verified.
- Coach ownership and cross-tenant isolation verified.
- Chronological trend generation and bounded-input validation verified.
- Authorized implementation scope: exactly 6 files.
- Unauthorized implementation files committed: none.
- Protected closure-register file remained outside the implementation commit.

**Release state**

Backend implementation is verified, committed and pushed. Knowledge Base publication is verified.

- Knowledge Base source commit: `a702b15d06c56033e8cd842db08849fae772cf5c`.
- Cloudflare production deployment: `476acbc0-4f55-4249-8c4a-6ec51b34a79d`.
- Immutable deployment: `https://476acbc0.titan-core-platform.pages.dev/docs/missions/067/`.
- Publication visually verified through authenticated Cloudflare Access on 21 September 2026.

Mission 067 remains **ACTIVE** because Controls 67.4-67.6 remain incomplete.

### Control 67.4 - Training load

**Status:** COMPLETE / VERIFIED / COMMITTED / PUSHED / KB RELEASE PENDING

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Implementation evidence**

- Implementation commit: `bc9c653956b0643dcf8700a5f1d6592167b6f453` - `Mission 067.4: Add squad training load`.
- Added `GET /api/v1/coach/squads/:squadId/training-load`.
- Restricted to the authenticated Coach's owned squad.
- Requires `coach-squads.read` and `performance-measurements.read`.
- Athletes must be explicitly enrolled in the selected squad.
- Athletes are resolved within the authenticated tenant.
- Each included athlete requires an exact active `COACH` relationship with the authenticated Coach.
- Non-members and stale/inactive Coach relationships are excluded.
- Training load uses the existing authoritative `TrainingStress` domain and repository boundary.
- Historical training-stress observations are returned per eligible squad athlete.
- Observations are returned in deterministic chronological order.
- Retrieval is bounded from 1 to 100 observations per athlete.
- Empty owned squads return a valid empty athlete set.
- Same-tenant Coach ownership and cross-tenant isolation are enforced.
- No ACWR, readiness score, threshold, medical interpretation, aggregate average or other unsupported derived analytics are generated.
- No Prisma schema change or database migration was required.
- Authorized implementation scope: exactly 6 files.

**Verification evidence**

- Focused Mission 067.4 integration: 1/1 file GREEN; 7/7 tests GREEN.
- Broader Coach regression: 6/6 files GREEN; 40/40 tests GREEN.
- Full backend regression: 172/172 files GREEN; 1242/1242 tests GREEN.
- Production TypeScript backend build: GREEN.
- `git diff --check`: GREEN.
- Authentication and dual-permission RBAC verified.
- Explicit squad membership and active Coach relationship enforcement verified.
- Coach ownership and cross-tenant isolation verified.
- Bounded retrieval and deterministic chronological output verified.
- Unauthorized implementation files committed: none.
- Protected closure-register file remained outside the implementation commit.

**Release state**

Backend implementation is verified, committed and pushed. Knowledge Base publication is pending verification.

Mission 067 remains **ACTIVE** because Controls 67.5-67.6 remain incomplete.
### Control 67.5 - Athlete development

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

### Control 67.6 - Role/tenant-scoped comparisons

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

## Mission Exit Gate

all controls implemented or explicitly verified as already satisfied; targeted tests GREEN; relevant regression GREEN; build GREEN; security/tenant/RBAC implications verified; migration/API contract verified where applicable; documentation/evidence captured.
