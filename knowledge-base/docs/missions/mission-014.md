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

- **Mission status:** ACTIVE
- **Frontend classification:** BACKEND-ONLY
- **Local frontend:** No visible change required
- **Current control:** 014.1
- **Current control state:** TECHNICALLY COMPLETE / VERIFIED
- **Mission release state:** NOT RELEASED

## Controls

| Control | Description | Status |
|---|---|---|
| 14.1 | RolePermission model | TECHNICALLY COMPLETE / VERIFIED |
| 14.2 | Permission inheritance through roles | NOT STARTED |
| 14.3 | Permission evaluation | NOT STARTED |

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
| Governance documentation | UPDATED LOCALLY |
| GitHub commit | PENDING |
| GitHub push | PENDING |
| Docusaurus validation/build | PENDING |
| Cloudflare publication | PENDING |
| Public-page verification | PENDING |

**Current classification: TECHNICALLY COMPLETE / VERIFIED.**

Control 014.1 is not yet committed, pushed, published, or released.

## Control 014.2 - Permission Inheritance Through Roles

**Status:** NOT STARTED

The actual authorization services, permission-resolution services, repository contracts, use cases, queries, role assignment/removal behaviour, and integration coverage must be inspected before identifying the implementation gap.

No implementation claim is made.

## Control 014.3 - Permission Evaluation

**Status:** NOT STARTED

The actual authorization service, permission-resolution service, commands, queries, middleware, tenant boundaries, role inheritance behaviour, and existing authorization tests must be inspected before identifying the implementation gap.

No implementation claim is made.

## Outstanding Publication Carry-Over

Mission 013 repository work is complete, verified, committed, and pushed at commit:

`8994a7907e30095ae6c0351a86cea5186e05bf50`

Mission 013 remains not fully released because its Docusaurus/Cloudflare publication and public-page verification are pending.

This carry-over must be completed at the appropriate publication gate and must not be silently omitted.

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

Until all gates are complete, Mission 014 remains **ACTIVE / NOT RELEASED**.
