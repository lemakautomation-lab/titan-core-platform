# Mission 047 — TITAN Health Product Shell

## Control 047-R1 — Canonical Dashboard and Route Guards

**Status:** COMPLETE / VERIFIED

### Implementation

- Authenticated root redirects to `/dashboard`.
- A canonical dashboard foundation is provided.
- Protected frontend routes require their matching backend permission names.
- Frontend guards improve UX and defence in depth; backend authorization remains authoritative.
- Unauthorized direct navigation fails safely.
- The shell owns one canonical page heading; duplicate child-page headings are removed.

### Verification Evidence

- Frontend production build: **GREEN**
- Targeted regression: **2/2 files; 16/16 tests GREEN**
- Full serial regression: **17/17 files; 101/101 tests GREEN**
- Backend, database and migration changes: **NONE**

### Authorized Files

- `frontend/src/app/AppRouter.tsx`
- `frontend/src/app/AppRouter.test.tsx`
- `frontend/src/dashboard/DashboardPage.tsx`
- `frontend/src/dashboard/DashboardPage.test.tsx`
- `frontend/src/athlete-digital-twin/AthleteDigitalTwinPage.tsx`
- `frontend/src/performance-metrics/PerformanceMetricsPage.tsx`
- `frontend/src/sports/SportsPage.tsx`
- `frontend/src/users/UsersPage.tsx`
- `docs/missions/MISSION-047-TITAN-HEALTH-PRODUCT-SHELL.md`

### Deferred Scope

The complete athlete dashboard remains Mission 063.
