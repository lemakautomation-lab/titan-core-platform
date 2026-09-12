# TITAN Database Architecture

The TITAN Core Platform uses PostgreSQL as its authoritative relational
database and Prisma as its schema, migration and client boundary. The current
implementation supports tenant-isolated identity, authorization, audit,
security, athlete, performance, training, nutrition, recovery and commercial
data.

## Authoritative Implementation

- Prisma schema: `backend/prisma/schema.prisma`
- Migration chain: `backend/prisma/migrations`
- Prisma configuration: `backend/prisma.config.ts`
- Runtime client: `backend/src/infrastructure/database/prisma.client.ts`
- Database service: `backend/src/infrastructure/database/database.service.ts`
- Test safety boundary: `backend/tests/setup/database.setup.ts`

The Prisma schema is authoritative when this overview and the executable
implementation differ.

## Technology

- Database engine: PostgreSQL
- Schema and migration tooling: Prisma
- PostgreSQL adapter: `@prisma/adapter-pg`
- Application connection variable: `DATABASE_URL`
- Migration shadow connection variable: `SHADOW_DATABASE_URL`

Runtime database initialization fails closed when `DATABASE_URL` is absent.

## Current Schema

The verified schema contains:

- 31 models
- 9 enums
- 63 relation declarations
- 41 unique constraints
- 71 indexes

The schema covers these implemented areas:

- Tenants, organisations, users, roles, permissions and sessions
- Audit logs and security events
- Athletes, athlete relationships and athlete digital twins
- Sports, exercises and prescription profiles
- Performance metrics and measurements
- Workout programmes, generations, sessions and prescriptions
- Products and product pricing
- Recovery, sleep, rest and training-stress tracking
- Nutrition plans, meal plans and shopping lists

## Tenant Integrity

Tenant-owned records use `tenantId` as an explicit ownership boundary.
Composite keys and composite foreign-key relationships bind related records to
the same tenant where required. Application authorization remains responsible
for authenticating the actor and enforcing permitted operations.

Cross-tenant protection must be maintained in all schema changes, repositories,
transactions and APIs.

## Migration Management

The repository contains an ordered PostgreSQL migration chain under
`backend/prisma/migrations`. Migration directories and committed
`migration.sql` files are immutable release evidence.

New database changes must be introduced through a new migration. Previously
released migrations must not be rewritten. Prisma schema validation, migration
review and relevant database regression tests are required before release.

## Environment Separation

Development, test, staging and production credentials must remain separate.

Development uses:

- `titan_core_development` for application development
- `titan_core_shadow` for Prisma migration shadow operations
- Separate application and migration-role placeholders in `.env.example`

Automated tests use only the local database named exactly `titan_core_test`.
Test initialization, Prisma test clients and destructive cleanup code validate
the environment, PostgreSQL protocol, local host and exact database name before
a connection is constructed. Vitest file-level parallelism is disabled because
database integration files share this single controlled test database.

Real credentials must never be committed. Developers copy `.env.example` to an
ignored local `.env` file and replace placeholders locally.

## Operational Responsibilities

Backup, restoration, retention, encryption, monitoring, availability and
production credential management are deployment and operational controls.
They must be defined and tested in the applicable environment before production
release. This repository documentation does not claim that those external
controls have already been implemented.

## Change Requirements

Every database change must:

1. Preserve tenant isolation and authorization boundaries.
2. Use a forward migration instead of modifying released migration history.
3. Preserve referential, uniqueness and transaction integrity.
4. Validate the Prisma schema.
5. Pass targeted and relevant database regression tests.
6. Document security, migration and compatibility implications.
7. Retain review and verification evidence.
