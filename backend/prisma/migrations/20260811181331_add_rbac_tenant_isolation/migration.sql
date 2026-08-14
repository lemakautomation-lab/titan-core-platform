/*
  Mission 043 — RBAC Tenant Isolation

  Safely converts legacy global Role/Permission records into
  tenant-scoped RBAC.

  Legacy data backfill:
    - ADMIN -> tenant of admin@titan.test
    - AUDIT_READER -> tenant of acme.test@titan.com
    - permissions assigned to ADMIN -> ADMIN tenant
    - permissions assigned to AUDIT_READER -> AUDIT_READER tenant
    - remaining legacy RBAC records -> TITAN Test Tenant

  The migration is intentionally compatible with Prisma's shadow
  database, which does not contain application seed data.
*/

-- AlterEnum
ALTER TYPE "SecurityEventType" ADD VALUE 'TOKEN_REFRESH_SUCCESS';
ALTER TYPE "SecurityEventType" ADD VALUE 'TOKEN_REFRESH_FAILURE';
ALTER TYPE "SecurityEventType" ADD VALUE 'TOKEN_REUSE_DETECTED';

-- Drop legacy global uniqueness
DROP INDEX "Permission_name_key";
DROP INDEX "Role_name_key";

-- Add temporary nullable tenant columns
ALTER TABLE "Permission"
ADD COLUMN "tenantId" TEXT;

ALTER TABLE "Role"
ADD COLUMN "tenantId" TEXT;

-- ============================================================
-- LEGACY ROLE BACKFILL
-- ============================================================

-- ADMIN belongs to the tenant of admin@titan.test.
UPDATE "Role"
SET "tenantId" = (
    SELECT "tenantId"
    FROM "User"
    WHERE "email" = 'admin@titan.test'
    LIMIT 1
)
WHERE "name" = 'ADMIN';

-- AUDIT_READER belongs to the tenant of acme.test@titan.com.
UPDATE "Role"
SET "tenantId" = (
    SELECT "tenantId"
    FROM "User"
    WHERE "email" = 'acme.test@titan.com'
    LIMIT 1
)
WHERE "name" = 'AUDIT_READER';

-- Remaining legacy roles belong to TITAN Test Tenant.
UPDATE "Role"
SET "tenantId" = (
    SELECT "id"
    FROM "Tenant"
    WHERE "name" = 'TITAN Test Tenant'
    ORDER BY "id"
    LIMIT 1
)
WHERE "tenantId" IS NULL;

-- ============================================================
-- LEGACY PERMISSION BACKFILL
-- ============================================================

-- Permissions assigned to ADMIN belong to ADMIN's tenant.
UPDATE "Permission" p
SET "tenantId" = r."tenantId"
FROM "RolePermission" rp
JOIN "Role" r
    ON r."id" = rp."roleId"
WHERE rp."permissionId" = p."id"
  AND r."name" = 'ADMIN'
  AND p."tenantId" IS NULL;

-- Permissions assigned to AUDIT_READER belong to AUDIT_READER's tenant.
UPDATE "Permission" p
SET "tenantId" = r."tenantId"
FROM "RolePermission" rp
JOIN "Role" r
    ON r."id" = rp."roleId"
WHERE rp."permissionId" = p."id"
  AND r."name" = 'AUDIT_READER'
  AND p."tenantId" IS NULL;

-- Remaining legacy permissions belong to TITAN Test Tenant.
UPDATE "Permission"
SET "tenantId" = (
    SELECT "id"
    FROM "Tenant"
    WHERE "name" = 'TITAN Test Tenant'
    ORDER BY "id"
    LIMIT 1
)
WHERE "tenantId" IS NULL;

-- ============================================================
-- SAFETY VALIDATION
--
-- Important:
-- Prisma shadow databases contain no application data.
-- Therefore tenant existence is only required when RBAC rows
-- actually exist.
-- ============================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "Role"
        WHERE "tenantId" IS NULL
    ) THEN
        RAISE EXCEPTION
            'RBAC migration aborted: Role tenantId backfill incomplete';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "Permission"
        WHERE "tenantId" IS NULL
    ) THEN
        RAISE EXCEPTION
            'RBAC migration aborted: Permission tenantId backfill incomplete';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "Role"
    )
    AND NOT EXISTS (
        SELECT 1
        FROM "Tenant"
        WHERE "name" = 'TITAN Test Tenant'
    )
    AND EXISTS (
        SELECT 1
        FROM "Role"
        WHERE "tenantId" IS NOT NULL
    ) THEN
        RAISE EXCEPTION
            'RBAC migration aborted: legacy roles exist but TITAN Test Tenant was not found';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM "Permission"
    )
    AND NOT EXISTS (
        SELECT 1
        FROM "Tenant"
        WHERE "name" = 'TITAN Test Tenant'
    )
    AND EXISTS (
        SELECT 1
        FROM "Permission"
        WHERE "tenantId" IS NOT NULL
    ) THEN
        RAISE EXCEPTION
            'RBAC migration aborted: legacy permissions exist but TITAN Test Tenant was not found';
    END IF;
END
$$;

-- ============================================================
-- ENFORCE TENANT ISOLATION
-- ============================================================

ALTER TABLE "Role"
ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "Permission"
ALTER COLUMN "tenantId" SET NOT NULL;

CREATE UNIQUE INDEX "Role_tenantId_name_key"
ON "Role"("tenantId", "name");

ALTER TABLE "Role"
ADD CONSTRAINT "Role_tenantId_fkey"
FOREIGN KEY ("tenantId")
REFERENCES "Tenant"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "Permission"
ADD CONSTRAINT "Permission_tenantId_fkey"
FOREIGN KEY ("tenantId")
REFERENCES "Tenant"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
