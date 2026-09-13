---
title: "Mission 014 - ROLE PERMISSION ASSIGNMENT"
slug: /missions/014/
sidebar_position: 14
---

# Mission 014 - ROLE PERMISSION ASSIGNMENT

> Authoritative scope imported from the TITAN Master Mission Control Register.

## Objective

Implement secure, tenant-isolated role-permission assignment, permission inheritance through roles, and permission evaluation.

## Delivery Classification

- **Mission status:** COMPLETE / VERIFIED / PUBLISHED / RELEASED
- **Frontend classification:** BACKEND-ONLY
- **Local frontend:** No visible change required
- **Current control:** 014.3
- **Current control state:** RELEASED
- **Mission release state:** RELEASED

## Controls

| Control | Description | Status |
|---|---|---|
| 14.1 | RolePermission model | RELEASED |
| 14.2 | Permission inheritance through roles | RELEASED |
| 14.3 | Permission evaluation | RELEASED |

## Control 014.1 - RolePermission Model

### Objective

Strengthen the `RolePermission` assignment model so tenant integrity is represented consistently across the domain, application, repository, Prisma, and PostgreSQL persistence boundaries.

### Identified Gap

The application layer checked that a role and permission belonged to the requested tenant, but the original `RolePermission` persistence model did not store `tenantId`.

The original database relationship used independent single-column foreign keys for `roleId` and `permissionId`. A direct or defective persistence operation could therefore pair a role from one tenant with a permission from another tenant.

The original assignment uniqueness constraint was also not tenant-scoped.

### Design Decision

Control 014.1 adopts tenant-aware role-permission assignments:

- Store `tenantId` on every `RolePermission`.
- Carry `tenantId` through the domain entity and mapper.
- Create assignments using the command tenant.
- Resolve and delete assignments through the tenant-scoped compound key.
- Reference `Role(id, tenantId)` through a composite foreign key.
- Reference `Permission(id, tenantId)` through a composite foreign key.
- Enforce uniqueness across `(tenantId, roleId, permissionId)`.
- Add a tenant/role lookup index.
- Reject existing cross-tenant data during migration preflight.
- Reject future cross-tenant assignments at the database boundary.

### Implementation

The following implementation changes were completed:

- Added `tenantId` to the `RolePermission` Prisma model.
- Added composite identity support to `Role` and `Permission`.
- Added tenant-aware composite relations from `RolePermission`.
- Updated the `RolePermission` domain entity create and restore contracts.
- Updated the persistence mapper in both directions.
- Updated assignment creation to pass the authoritative command tenant.
- Updated repository lookup and deletion to use `tenantId_roleId_permissionId`.
- Updated the role test factory for the tenant-aware Prisma contract.
- Updated existing RBAC integration coverage for the compound key.
- Added direct database tenant-integrity integration coverage.

### Files Changed

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260913000000_add_role_permission_tenant_integrity/migration.sql`
- `backend/src/application/use-cases/assign-permission-to-role.use-case.ts`
- `backend/src/domain/entities/role-permission.entity.ts`
- `backend/src/infrastructure/mappers/role-permission.mapper.ts`
- `backend/src/infrastructure/repositories/role-permission.repository.ts`
- `backend/tests/factories/role.factory.ts`
- `backend/tests/integration/authorization/rbac-tenant-isolation.spec.ts`
- `backend/tests/integration/authorization/role-permission-tenant-integrity.spec.ts`

### Migration

Migration:

`20260913000000_add_role_permission_tenant_integrity`

The migration:

1. Adds nullable `RolePermission.tenantId`.
2. Backfills it from the assigned role.
3. Performs a preflight check for role/permission tenant mismatch.
4. Makes `tenantId` non-nullable.
5. Adds composite uniqueness required by the parent relations.
6. Replaces the original single-column foreign keys.
7. Adds tenant-aware composite foreign keys.
8. Replaces the original assignment uniqueness constraint.
9. Adds the tenant/role lookup index.

Historical applied migrations were not modified.

The migration was applied successfully to the controlled `titan_core_test` database using `prisma migrate deploy`.

### Targeted Test Evidence

Test:

`tests/integration/authorization/role-permission-tenant-integrity.spec.ts`

Verified scenarios:

- Same-tenant assignment persists successfully.
- A tenant A role cannot be paired with a tenant B permission.
- A tenant B role cannot be paired with a tenant A permission.
- Rejected cross-tenant attempts leave no assignment behind.

Result:

- **1 test file passed**
- **3 tests passed**

### Broader RBAC Regression

Serial suites:

- `tests/integration/authorization/rbac-tenant-isolation.spec.ts`
- `tests/integration/authorization/role-permission-tenant-integrity.spec.ts`

Result:

- **2 test files passed**
- **17 tests passed**

### Full Serial Regression

Result:

- **95 of 95 test files passed**
- **772 of 772 tests passed**
- **Duration: 222.49 seconds**

### Build and Validation Evidence

Verified:

- `npx prisma validate` passed.
- `npx tsc --noEmit` passed.
- `npx prisma migrate status` found 36 migrations.
- Prisma reported the active database schema as up to date.
- `npm run build` completed successfully using `tsc`.
- `git diff --check` passed.

The database name was not displayed by the final Prisma status output. The controlled migration application evidence separately identified `titan_core_test`.

The Prisma 8 release-candidate upgrade notice was informational. No dependency upgrade was introduced into this control.

### Security and Tenant-Integrity Evidence

The database now rejects assignments unless the supplied tenant matches both the referenced role and referenced permission.

This provides defence in depth beyond application-layer validation and protects against:

- Cross-tenant role-permission pairing.
- Direct persistence bypass.
- Repository defects that supply mismatched identifiers.
- Duplicate assignments within the same tenant.

Existing authentication, session, refresh-token, RBAC, and anti-escalation controls were not weakened or redesigned.

### Data-Integrity and Failure Behaviour

The migration fails loudly if historical role-permission data violates tenant consistency.

Composite foreign keys enforce tenant ownership during future writes. Unique assignment enforcement remains deterministic and tenant-scoped.

### Dirty-Tree Protection

Before documentation, every dirty and untracked file was enumerated.

The nine implementation files listed above were classified as Control 014.1 work. An unrelated `MealPlan` schema ordering change was removed. No unrelated file was reset or reverted.

LF-to-CRLF messages were Git working-copy notices and not validation failures.

### ISO-Aligned Engineering Evidence

This control provides engineering evidence aligned with:

- ISO/IEC 27001:2022 security principles through tenant isolation, least-privilege support, persistence integrity, and defence in depth.
- ISO 9001:2015 quality-management and documented-information principles through controlled design, traceable implementation, regression evidence, migration control, and reproducible verification.

This evidence does not claim formal certification. Certification requires the wider organisational ISMS and QMS.

### Control 014.1 Release State

| Release gate | State |
|---|---|
| Implementation | COMPLETE |
| Targeted verification | PASSED |
| Broader regression | PASSED |
| Full serial regression | PASSED |
| Prisma validation | PASSED |
| TypeScript verification | PASSED |
| Backend build | PASSED |
| Migration status | SCHEMA UP TO DATE |
| Governance documentation | COMPLETE |
| GitHub commit | VERIFIED - `e40f578612b06e166d3a9adb09aa1628d9590213` |
| GitHub push | VERIFIED - `main` equals `origin/main` |
| Docusaurus validation/build | PASSED |
| Cloudflare publication | VERIFIED |
| Public-page verification | VERIFIED |

**Current classification: RELEASED (Control 014.1).**

Control 014.1 is committed, pushed, published, and publicly verified. Mission 014 remains ACTIVE because Controls 014.2 and 014.3 are not yet complete.

## Control 014.2 - Permission Inheritance Through Roles

### Objective

Ensure users deterministically inherit the union of permissions assigned to all of their tenant-scoped roles.

### Identified Gap

Permission inheritance already traversed user roles and their assigned permissions, but the resolution service used mutable permission display names as authorization identifiers.

Mission 012 established `Permission.code` as the stable authorization identity. Continuing to evaluate `Permission.name` could cause authorization behaviour to change when a display name was edited.

No direct automated tests covered multi-role inheritance, duplicate elimination, stable-code evaluation, or defence against a foreign-tenant permission returned by a defective repository.

The role-permission repository query also did not directly filter `RolePermission.tenantId`, although related role and permission tenant filters were present.

### Design Decision

Control 014.2:

- Resolves inherited permissions by stable `Permission.code`.
- Aggregates permissions from every role assigned to the user.
- Deduplicates permission codes through a deterministic set.
- Retains application-layer tenant validation for resolved permissions.
- Passes the tenant identifier to every role-permission lookup.
- Directly filters `RolePermission.tenantId`.
- Keeps related role and permission tenant filters as defence in depth.
- Adds focused tests for multi-role inheritance, deduplication, tenant rejection, and code-based evaluation.

### Implementation

Changed:

- `PermissionResolutionService` now adds `permission.code`.
- Permission evaluation parameters are named `permissionCode`.
- `AuthorizationService` forwards the stable permission code.
- `PrismaRoleRepository.findPermissions()` directly filters `tenantId`.
- Added direct unit coverage for inheritance and evaluation behaviour.

### Files Changed

- `backend/src/application/services/authorization.service.ts`
- `backend/src/application/services/permission-resolution.service.ts`
- `backend/src/infrastructure/repositories/role.repository.ts`
- `backend/tests/unit/application/services/permission-resolution.service.spec.ts`

### Migration and API Impact

- Database migration: **NONE**
- HTTP route change: **NONE**
- Request/response contract change: **NONE**
- Authorization identity correction: display name to stable permission code

### Targeted Test Evidence

Test:

`tests/unit/application/services/permission-resolution.service.spec.ts`

Verified:

- Permissions are inherited from all assigned roles.
- Duplicate permission codes are returned once.
- A foreign-tenant permission is excluded.
- Role lookups receive the authoritative tenant.
- Stable permission code grants access.
- Mutable display name does not grant access.

Result:

- **1 test file passed**
- **2 tests passed**

### Broader RBAC Regression

Suites:

- Permission-resolution unit tests
- RBAC tenant-isolation integration tests
- Role-delegation integration tests

Result:

- **3 test files passed**
- **19 tests passed**

### Full Backend Regression

Result:

- **96 of 96 test files passed**
- **774 of 774 tests passed**
- **Duration: 314.35 seconds**

### Build and Quality Evidence

- Backend TypeScript build: **PASSED**
- Targeted test: **PASSED**
- Broader serial regression: **PASSED**
- Full backend regression: **PASSED**
- Whitespace audit: **PASSED**
- Unrelated file changes: **NONE**

### Security and Tenant-Isolation Evidence

Permission inheritance is tenant-scoped across:

1. User-to-role resolution.
2. Direct `RolePermission.tenantId` filtering.
3. Related role tenant filtering.
4. Related permission tenant filtering.
5. Application-layer permission tenant validation.

Authorization decisions now use stable permission codes rather than mutable presentation names.

This strengthens deterministic RBAC evaluation and reduces accidental authorization changes caused by permission renaming.

### ISO-Aligned Engineering Evidence

This control provides engineering evidence aligned with ISO/IEC 27001:2022 security principles and ISO 9001:2015 documented-information and verification principles.

It does not claim formal certification.

### Control 014.2 Release State

| Release gate | State |
|---|---|
| Implementation | COMPLETE |
| Targeted verification | PASSED |
| Broader RBAC regression | PASSED |
| Full backend regression | PASSED |
| Backend build | PASSED |
| Governance documentation | COMPLETE |
| GitHub commit | VERIFIED - `35045a2741ddef8a4475725b73228dbd4ff26ecd` |
| GitHub push | VERIFIED - `main` equals `origin/main` |
| Docusaurus build | PASSED |
| Cloudflare publication | VERIFIED |
| Public-page verification | VERIFIED |

**Current classification: RELEASED (Control 014.2).**

Control 014.2 is committed, pushed, published, and publicly verified.
## Control 014.3 - Permission Evaluation

### Objective

Provide a deterministic, tenant-aware, safely failing permission-evaluation boundary for protected HTTP routes.

### Identified Gap

The authorization service and `requirePermission` middleware already evaluated permissions, rejected unauthenticated and unauthorized requests, recorded denied security events, and forwarded failures to centralized error handling.

However, this critical enforcement boundary had no direct automated tests. Its authentication, denial, audit, request-context, and resolver-failure behaviour was therefore not independently verified.

The middleware parameter was also generically named `permission`, while Mission 012 and Control 014.2 established permission code as the authoritative authorization identity.

### Design Decision

Control 014.3:

- Makes the middleware contract explicitly code-based through `permissionCode`.
- Preserves authenticated principal and tenant identity as authoritative inputs.
- Denies requests without an authenticated principal.
- Evaluates the required permission code through `AuthorizationService`.
- Records denied permission security events with request metadata.
- Returns a forbidden error when evaluation denies access.
- Records granted permission codes in request security context.
- Forwards resolver failures to centralized error handling without granting access.
- Adds direct unit regression coverage for every evaluation branch.

### Implementation

Changed:

- Renamed the middleware evaluation identifier from `permission` to `permissionCode`.
- Added direct unit tests for the `requirePermission` middleware.
- Preserved all route permission-code contracts.
- Preserved centralized exception handling and security-event recording.

### Files Changed

- `backend/src/middleware/authorization.middleware.ts`
- `backend/tests/unit/middleware/authorization.middleware.spec.ts`

### Migration and API Impact

- Database migration: **NONE**
- Route change: **NONE**
- Request/response contract change: **NONE**
- Existing permission codes: **PRESERVED**
- Frontend impact: **NONE**

### Targeted Test Evidence

Test:

`tests/unit/middleware/authorization.middleware.spec.ts`

Verified:

- Missing authenticated principal produces `UnauthorizedException`.
- Permission resolution is not called without a principal.
- Denied permission produces `ForbiddenException`.
- Denied permission records a security event.
- Audit evidence includes tenant, user, permission code, method, path, IP address, user agent, and Request-ID.
- Allowed permission invokes downstream middleware.
- Allowed permission code is recorded in request security context.
- Resolver failure is forwarded and never converted into an allow result.

Result:

- **1 test file passed**
- **4 tests passed**

### Broader Authorization Regression

Suites:

- Authorization middleware unit tests
- Permission-resolution unit tests
- RBAC tenant-isolation integration tests
- Role-delegation integration tests

Result:

- **4 test files passed**
- **23 tests passed**

### Full Backend Regression

Result:

- **97 of 97 test files passed**
- **778 of 778 tests passed**
- **Duration: 316.90 seconds**

### Build and Quality Evidence

- Backend TypeScript build: **PASSED**
- Targeted permission-evaluation tests: **PASSED**
- Broader authorization regression: **PASSED**
- Full backend regression: **PASSED**
- Whitespace audit: **PASSED**
- Unrelated changes: **NONE**

### Security and Safe-Failure Evidence

The evaluation boundary is explicitly verified to:

- Deny unauthenticated access.
- Deny missing permissions.
- Preserve tenant-scoped evaluation.
- Use stable permission codes.
- Record denial security evidence.
- Preserve Request-ID correlation.
- Avoid permission duplication in context.
- Forward evaluation failures without granting access.

Existing authentication, session, refresh-token, tenant-isolation, RBAC, and anti-escalation controls were not weakened.

### ISO-Aligned Engineering Evidence

This control provides engineering evidence aligned with ISO/IEC 27001:2022 access-control, logging, traceability, and secure-failure principles, together with ISO 9001:2015 verification and documented-information principles.

It does not claim formal certification.

### Control 014.3 Release State

| Release gate | State |
|---|---|
| Implementation | COMPLETE |
| Targeted verification | PASSED |
| Broader authorization regression | PASSED |
| Full backend regression | PASSED |
| Backend build | PASSED |
| Governance documentation | COMPLETE |
| GitHub commit | VERIFIED - `d311595efac182bcf6008ba5e61d92a5c68d61c1` |
| GitHub push | VERIFIED - `main` equals `origin/main` |
| Docusaurus build | PASSED |
| Cloudflare publication | VERIFIED |
| Public-page verification | VERIFIED |

**Current classification: RELEASED (Control 014.3).**

Control 014.3 is committed, pushed, published, and publicly verified.
## Mission 013 Publication Closure

Mission 013 repository work was completed, verified, committed, and pushed at commit:

`8994a7907e30095ae6c0351a86cea5186e05bf50`

Its Docusaurus build, Cloudflare Pages publication, Cloudflare Access protection, protected route, and authenticated production page were verified.

Mission 013 is **COMPLETE / VERIFIED / PUBLISHED / RELEASED**.

## Mission Exit Gate

Mission 014 may be classified as RELEASED only when:

- Controls 014.1, 014.2, and 014.3 are complete.
- Targeted and relevant broader/full regressions pass.
- Required builds and migration/API contract checks pass.
- Security, tenant-isolation, and RBAC implications are verified.
- Governance evidence is complete.
- Commits and pushes are verified.
- Docusaurus publication succeeds.
- Cloudflare deployment succeeds.
- The public Mission 014 page is verified.

## Final Mission 014 Release Evidence

### Control Commits

- Control 014.1 implementation and governance: `e40f578612b06e166d3a9adb09aa1628d9590213`
- Mission 013 and Control 014.1 publication reconciliation: `2614ff632bc5cb16b60aeb96588fa6fca1e9e154`
- Control 014.2 implementation and governance: `35045a2741ddef8a4475725b73228dbd4ff26ecd`
- Control 014.2 release reconciliation: `dbdf81fea7aad0ea0c31093623b85cb0526be00a`
- Control 014.3 implementation and governance: `d311595efac182bcf6008ba5e61d92a5c68d61c1`

### Final Verification Baseline

- RolePermission database tenant integrity: **VERIFIED**
- Permission inheritance through tenant roles: **VERIFIED**
- Stable permission-code resolution: **VERIFIED**
- Permission evaluation boundary: **VERIFIED**
- Denial security-event recording: **VERIFIED**
- Safe failure: **VERIFIED**
- Final backend build: **PASSED**
- Final full regression: **97/97 test files and 778/778 tests passed**
- Knowledge Base typecheck: **PASSED**
- Docusaurus production build: **PASSED**
- Cloudflare Pages publication: **VERIFIED**
- Cloudflare Access protection: **VERIFIED**
- Authenticated Mission 014 production page: **VERIFIED**
- Protected route: `/docs/missions/014/`

### Final Classification

All three Mission 014 controls are implemented or verified, committed, pushed, documented, published, and publicly verified.

**Mission 014 - ROLE PERMISSION ASSIGNMENT is COMPLETE / VERIFIED / PUBLISHED / RELEASED.**
