---
title: "BD-004 Database Design"
slug: /architecture/docs-bd-004-database-design/
sidebar_position: 7
---

> **Authoritative repository source:** `docs/BD-004 Database Design.md`
# BD-004 Database Design

**Document ID:** BD-004
**Status:** Approved implementation baseline
**Version:** 2.0
**Reconciled:** 2026-09-12

## Purpose

This document defines the implemented logical database architecture of the
TITAN Core Platform. It establishes the authoritative technology, ownership,
relationship, migration and environment-separation rules used when changing
persistent data.

The current implementation is a PostgreSQL relational architecture managed
through Prisma. The Prisma schema and committed migration chain are the
executable authorities for implemented database structure.

## Scope

This design covers:

- PostgreSQL and Prisma configuration
- Logical data domains
- Tenant ownership and relational integrity
- Schema and migration governance
- Development and test database separation
- Transaction boundaries
- Security and operational responsibilities
- Required verification evidence

It does not claim that future storage technologies or production infrastructure
controls are already deployed.

## Authoritative Components

| Component | Repository authority | Purpose |
| --- | --- | --- |
| Prisma schema | `backend/prisma/schema.prisma` | Models, enums, relations, constraints and indexes |
| Migration chain | `backend/prisma/migrations` | Ordered, reviewable PostgreSQL changes |
| Prisma configuration | `backend/prisma.config.ts` | Schema, migrations and datasource configuration |
| Runtime client | `backend/src/infrastructure/database/prisma.client.ts` | Fail-closed PostgreSQL client construction |
| Database service | `backend/src/infrastructure/database/database.service.ts` | Connection lifecycle and transaction boundary |
| Test guard | `backend/tests/setup/database.setup.ts` | Exact test-environment and database validation |

## Technology Architecture

PostgreSQL is the authoritative persistent relational database. Prisma provides
the schema, generated client, migration configuration and transaction-client
type. The application connects through the PostgreSQL Prisma adapter.

`DATABASE_URL` supplies the application database connection. Prisma migration
operations may additionally use `SHADOW_DATABASE_URL`. Runtime client
construction stops when required database configuration is missing.

## Implemented Schema Baseline

The schema inspected on 2026-09-12 contains:

| Metric | Verified count |
| --- | ---: |
| Models | 31 |
| Enums | 9 |
| Relations | 63 |
| Unique constraints | 41 |
| Indexes | 71 |
| Migration directories | 32 |

These counts are verification evidence for Mission 003, not permanent design
limits. Future approved migrations may change them.

## Logical Data Domains

### Platform identity and authorization

- Tenant
- Organisation
- User
- Role
- Permission
- UserRole
- RolePermission
- Session

### Security and accountability

- AuditLog
- SecurityEvent

### Athlete and sport

- Athlete
- AthleteRelationship
- AthleteDigitalTwin
- Sport
- Exercise
- ExercisePrescriptionProfile

### Performance and programme generation

- PerformanceMetric
- PerformanceMeasurement
- WorkoutProgramme
- WorkoutProgrammeGeneration
- WorkoutProgrammeSession
- WorkoutProgrammeExercisePrescription

### Commercial data

- Product
- ProductPrice

### Nutrition and readiness

- RecoveryTracking
- NutritionPlan
- MealPlan
- ShoppingList
- SleepTracking
- RestTracking
- TrainingStress

## Tenant Ownership Model

`tenantId` is the primary ownership discriminator for tenant-controlled data.
Tenant scope is enforced through a combination of:

- Required tenant identifiers on tenant-owned models
- Tenant-scoped uniqueness constraints
- Tenant lookup indexes
- Composite identifiers
- Composite foreign keys that include tenant identity
- Repository and transaction predicates
- Authentication and authorization controls at application boundaries

A record identifier alone must not be treated as sufficient authority to access
tenant-owned data.

## Relationship Integrity

Prisma relations and PostgreSQL foreign keys preserve structural integrity.
Composite relations bind athletes, sports, exercises, performance data,
programmes and generated structures to compatible tenant identities.

Relationship deletion and update behavior is declared where domain behavior
requires explicit `Restrict`, `Cascade` or update semantics. Changes to these
rules require impact assessment and regression coverage.

## Transaction Integrity

`DatabaseService.transaction` exposes Prisma's typed transaction client.
Multi-record operations that must succeed or fail as one unit use transaction
boundaries. Transaction tests verify rollback, idempotency, concurrent
arbitration and mandatory audit behavior for relevant workflows.

## Migration Governance

Committed migration directories form an ordered evidence chain. Each directory
must contain its `migration.sql` file, and `migration_lock.toml` identifies
PostgreSQL as the provider.

The following rules apply:

1. Do not edit a migration that has been released.
2. Create a new forward migration for every approved schema change.
3. Review generated SQL before applying it.
4. Assess data preservation, locking, rollback and compatibility risks.
5. Validate the Prisma schema.
6. Test the complete migration chain against an appropriate non-production
   database.
7. Retain the migration and verification evidence in version control.

Production migration execution requires separate release authorization and is
outside ordinary development testing.

## Development Database

The public environment template defines separate local contracts:

- Application database: `titan_core_development`
- Prisma shadow database: `titan_core_shadow`
- Application role placeholder: `titan_app`
- Migration role placeholder: `titan_migrations`

Developers must copy `.env.example` to the ignored `.env` file and replace
placeholder passwords locally. Development credentials must not be reused in
test, staging or production.

The shadow database is separate because Prisma may create, alter or reset it
while evaluating migrations. It must never point to production or to the
application database.

## Test Database Architecture

Automated tests use the local PostgreSQL database named exactly
`titan_core_test`.

Before test database clients or destructive cleanup operations are constructed,
the shared guard verifies:

- `NODE_ENV` is exactly `test`
- `DATABASE_URL` exists and is syntactically valid
- The protocol is `postgres` or `postgresql`
- The host is a local loopback host
- The pathname is exactly `/titan_core_test`
- Vitest file-level parallelism is disabled for the shared test database

This prevents suffix matching, query-string bait, remote hosts, non-PostgreSQL
URLs and non-test environments from crossing the destructive test boundary. It
also prevents concurrent test files from deleting or modifying another file's
database fixtures.

## Security Requirements

Database changes must preserve:

- Authentication and authorization enforcement
- Tenant ownership and composite tenant integrity
- Least-privilege credential separation
- Secret exclusion from committed configuration
- Referential and transactional integrity
- Audit evidence where required by the business operation
- Sanitized failure handling

The schema does not replace application authorization. Both database integrity
and application policy are required.

## Operational Control Boundary

Production backup, restoration, retention, encryption, monitoring, replication,
high availability and disaster recovery are operational responsibilities.
Their configuration and effectiveness must be evidenced in the deployment
environment.

These controls must not be described as implemented solely because they appear
as architectural objectives in documentation.

## Quality and Information Security Alignment

This design supports controlled design and development, documented change,
verification, configuration management, access control, secure development,
test-data separation and retained evidence.

It provides technical evidence relevant to ISO 9001:2015 and ISO/IEC 27001
management-system activities. It does not independently establish conformity,
certification or a complete organizational control implementation.

## Acceptance Criteria

The database architecture is acceptable when:

- The Prisma schema is valid.
- The migration chain is complete and reviewable.
- Tenant and relationship integrity are preserved.
- Development, shadow and test databases are separated.
- Destructive test access fails closed.
- Relevant database regressions pass.
- Backend compilation succeeds.
- Documentation matches the executable implementation.
