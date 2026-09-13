ALTER TABLE "RolePermission"
ADD COLUMN "tenantId" TEXT;

UPDATE "RolePermission" AS rp
SET "tenantId" = r."tenantId"
FROM "Role" AS r
WHERE r."id" = rp."roleId";

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "RolePermission" rp
        INNER JOIN "Role" r ON r."id" = rp."roleId"
        INNER JOIN "Permission" p ON p."id" = rp."permissionId"
        WHERE r."tenantId" <> p."tenantId"
    ) THEN
        RAISE EXCEPTION 'RolePermission tenant-integrity preflight failed';
    END IF;
END $$;

ALTER TABLE "RolePermission" ALTER COLUMN "tenantId" SET NOT NULL;

ALTER TABLE "Role"
ADD CONSTRAINT "Role_id_tenantId_key" UNIQUE ("id", "tenantId");

ALTER TABLE "Permission"
ADD CONSTRAINT "Permission_id_tenantId_key" UNIQUE ("id", "tenantId");

ALTER TABLE "RolePermission"
DROP CONSTRAINT "RolePermission_roleId_fkey";

ALTER TABLE "RolePermission"
DROP CONSTRAINT "RolePermission_permissionId_fkey";

ALTER TABLE "RolePermission"
ADD CONSTRAINT "RolePermission_roleId_tenantId_fkey"
FOREIGN KEY ("roleId", "tenantId")
REFERENCES "Role"("id", "tenantId")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RolePermission"
ADD CONSTRAINT "RolePermission_permissionId_tenantId_fkey"
FOREIGN KEY ("permissionId", "tenantId")
REFERENCES "Permission"("id", "tenantId")
ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "RolePermission_roleId_permissionId_key";

CREATE UNIQUE INDEX "RolePermission_tenantId_roleId_permissionId_key"
ON "RolePermission"("tenantId", "roleId", "permissionId");

CREATE INDEX "RolePermission_tenantId_roleId_idx"
ON "RolePermission"("tenantId", "roleId");