---
title: "Mission 003 - DATABASE ARCHITECTURE"
slug: /missions/003/
sidebar_position: 3
---

# Mission 003 - DATABASE ARCHITECTURE

> Authoritative scope imported from the TITAN Master Mission Control Register.

## Mission Status

**COMPLETE / VERIFIED / RELEASED**

Mission 003 was reconciled against the implemented TITAN Core Platform on
2026-09-12. Controls 3.1 through 3.4 were objectively evidenced by the existing
PostgreSQL, Prisma, migration and relationship implementation. Genuine
environment-safety gaps were identified and remediated under Controls 3.5-R1
and 3.6-R1.

The complete backend regression, Knowledge Base verification and final
integrity gates passed. The verified Mission 003 record was published through
the protected Cloudflare Knowledge Base.

## Objective

Establish the database architecture.

## Delivery Classification

- **Frontend classification:** BACKEND-ONLY
- **Local frontend:** NO visible change in this mission.
- **Implementation approach:** Reconciliation-first.
- **Baseline commit:** `1bc894c092ad5d3990e78f91b8d5f3d16fc53ac3`
- **Baseline branch:** `main`
- **Baseline synchronization:** `HEAD == origin/main`; ahead/behind `0/0`.
- **Baseline working tree:** Clean.

## Controls

### Control 3.1 - PostgreSQL architecture

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Result:** VERIFIED AS ALREADY SATISFIED.

**Evidence:**

- PostgreSQL is the configured Prisma datasource provider.
- Runtime access uses `@prisma/adapter-pg`.
- `DATABASE_URL` is required and missing configuration fails closed.
- `DatabaseService` exposes connection, disconnection and typed transaction
  boundaries.
- PostgreSQL is recorded in the committed migration lock.

### Control 3.2 - Prisma schema

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Result:** VERIFIED AS ALREADY SATISFIED.

**Evidence:**

- `backend/prisma/schema.prisma` is the authoritative executable schema.
- The inspected schema contains 31 models and 9 enums.
- It contains 63 relation declarations, 41 unique constraints and 71 indexes.
- Prisma generates its client into `backend/src/generated/prisma`.
- `prisma validate` confirmed that the schema is valid.

### Control 3.3 - Database migrations

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Result:** VERIFIED AS ALREADY SATISFIED.

**Evidence:**

- The ordered migration chain contains 32 migration directories.
- Every inspected migration directory contains a `migration.sql` file.
- SHA-256 evidence was collected for each migration file.
- `migration_lock.toml` declares PostgreSQL.
- Released migration history is retained in version control.
- Mission documentation now records the forward-only migration policy.

### Control 3.4 - Database relationships

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Result:** VERIFIED AS ALREADY SATISFIED.

**Evidence:**

- Tenant-owned models use explicit `tenantId` ownership.
- Tenant-scoped unique constraints and indexes support bounded lookup.
- Composite foreign keys prevent incompatible cross-tenant relationships in
  critical athlete, sport, exercise, performance and programme structures.
- Explicit update and deletion behavior is defined where required.
- Database transaction and tenant-isolation regressions exercise relational and
  ownership boundaries.

### Control 3.5 - Development database

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Result:** SATISFIED AFTER CONFIGURATION REMEDIATION.

#### Control 3.5-R1 - Development Database Configuration Contract

**Finding:** The public backend environment template exposed component database
fields but did not define the `DATABASE_URL` required by the runtime client or
the `SHADOW_DATABASE_URL` used by Prisma migration tooling.

**Risk:** Developers could construct inconsistent connections, reuse database
identities across environments or direct shadow migration operations at an
unsafe database.

**Remediation:**

- Defined an explicit local development database contract.
- Defined a separate Prisma shadow database contract.
- Used distinct application and migration-role placeholders.
- Documented that placeholder passwords must be replaced only in the ignored
  local `.env` file.
- Prohibited credential reuse across development, test, staging and production.
- Added automated assertions for the public configuration contract.

**Verification:**

- Development database URI contract: valid.
- Shadow database URI contract: valid.
- Database separation: valid.
- Configuration regression: green.

### Control 3.6 - Test database architecture

**Acceptance:** Implement the capability within the mission boundary; enforce appropriate authentication/authorization and tenant scope; validate inputs; preserve database/API integrity; handle failures safely; add targeted automated regression coverage; verify build/tests; document evidence. Do not introduce unrelated functionality.

**Result:** SATISFIED AFTER SAFETY REMEDIATION.

#### Control 3.6-R1 - Test Database Execution Safety

**Finding:** A test database setup function existed but was not executed by the
Vitest setup chain. Its database-name check used substring matching. Test client
and cleanup modules only required a non-empty URL before constructing database
clients.

**Risk:** A malformed, remote or non-test database URL could cross the test
boundary, including the destructive cleanup path.

**Remediation:**

- Wired test database validation into the Vitest environment setup.
- Required `NODE_ENV` to equal `test`.
- Required a valid PostgreSQL URL.
- Restricted the database host to local loopback hosts.
- Required the database pathname to equal `/titan_core_test`.
- Applied the shared guard before constructing the test Prisma client.
- Applied the same guard before constructing the destructive cleanup client.
- Added regression coverage for safe and unsafe configurations.

**Verification:**

- Test TypeScript compilation: green.
- Database safety and configuration regression: 13/13 passed.
- Tenant-integrity regression: three files and 35/35 tests passed.
- Prisma schema validation: green.
- Backend build: green.
- Diff integrity: green.

#### Control 3.6-R2 - Shared Test Database Execution Isolation

**Finding:** The full backend regression exposed nondeterministic interference
when test files executed concurrently against the same `titan_core_test`
database. The account-lock regression observed a record changed by overlapping
database activity. The affected test passed consistently in isolation, and the
complete suite passed with file-level parallelism disabled.

**Risk:** Concurrent test files could delete or replace shared fixtures,
producing false failures or false confidence in database-dependent controls.

**Remediation:**

- Disabled Vitest file-level parallelism in the default test configuration.
- Preserved parallel execution within a test file where controlled by the suite.
- Added an automated assertion protecting the execution-isolation setting.
- Retained the exact test-database connection guard.

**Verification:**

- Affected login regression passed on three isolated executions.
- Diagnostic serial regression passed 90 files and 756 tests.
- Updated safety regression passed 14/14 tests.
- Default full backend regression passed 90 files and 757/757 tests.
- Backend build passed.

## Security and Tenant-Isolation Assessment

Mission 003 changes no tenant-facing API contract. It strengthens database
environment boundaries and documents the existing tenant-integrity model.

Objective evidence includes:

- Explicit tenant ownership fields
- Tenant-scoped uniqueness and indexes
- Composite tenant-bound foreign keys
- Transactional persistence and rollback coverage
- Tenant-isolation authorization regression coverage
- Exact local test-database enforcement
- Separate development, shadow and test database identities
- Fail-closed runtime configuration

No authentication, authorization, RBAC, migration or API contract was weakened.

## Documentation Reconciliation

The previous database documents described a high-level future architecture and
included entities and operational capabilities that were not authoritative
evidence of the current implementation.

The reconciled documents now:

- Identify the Prisma schema and migration chain as executable authorities.
- Record the implemented data domains and verified schema metrics.
- Define tenant, relationship and transaction integrity requirements.
- Define forward-only migration governance.
- Define development, shadow and test database separation.
- Distinguish implemented repository controls from external operational
  responsibilities.
- Remove unsupported claims that backup, replication or encryption controls are
  implemented merely because they were architectural objectives.
- Correct legacy text-encoding defects.

## Quality and Information Security Alignment

Mission 003 retains technical evidence supporting controlled design and
development, documented change, verification, configuration management, access
control, secure development, test-data separation and audit readiness.

This evidence supports organizational activities associated with ISO 9001:2015
and ISO/IEC 27001. It does not independently constitute certification,
conformity determination or a complete organizational control implementation.

## Verification Record

| Gate | Result |
| --- | --- |
| Released baseline synchronized | GREEN |
| Starting working tree clean | GREEN |
| PostgreSQL configuration inspected | GREEN |
| Prisma schema metrics collected | GREEN |
| Migration chain inspected | GREEN - 32 directories |
| Prisma schema validation | GREEN |
| Development and shadow contracts | GREEN |
| Test database safety regression | GREEN - 14/14 |
| Tenant-integrity regression | GREEN - 3 files, 35/35 |
| Test TypeScript compilation | GREEN |
| Backend build | GREEN |
| Documentation reconciliation | GREEN |
| Full backend regression | GREEN - 90 files, 757/757 |
| Knowledge Base typecheck and build | GREEN |
| Cloudflare Knowledge Base publication | VERIFIED |
| Unauthorized changes | NONE |
| Frontend changes | NONE |

## Known Non-Blocking Observations

- Backend lint previously reported 29 pre-existing warnings and zero errors.
- Vitest reports a forward-looking Vite native configuration-loader warning.
  Current test execution remains successful.
- Database backup, recovery, encryption, monitoring, replication and production
  credential controls require separate deployment-environment evidence.

These observations remain visible for risk-based treatment and must not be
misrepresented as completed controls or current test failures.

## Mission Exit Gate

- All six controls implemented or objectively verified: **YES**
- Development database configuration gap remediated: **YES**
- Test database execution-safety gap remediated: **YES**
- Shared test-database execution isolated: **YES**
- Targeted database regression green: **YES**
- Prisma schema valid: **YES**
- Tenant, relationship and transaction integrity assessed: **YES**
- Migration and API implications assessed: **YES**
- Documentation reconciled: **YES**
- Full backend regression: **YES - 90 files, 757/757 tests**
- Knowledge Base typecheck and build: **YES**
- Cloudflare Knowledge Base publication: **VERIFIED**
- Published source commit: `52b1384f390d9d3d1d3493fac49c0e6e95e704ab`
- Protected production route: `/docs/missions/003/`
- Cloudflare Access protection: **VERIFIED**

**Mission 003 engineering conclusion:** COMPLETE / VERIFIED.
