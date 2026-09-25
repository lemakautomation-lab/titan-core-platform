CREATE TABLE "AthleteSportRequirement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "targetValue" DECIMAL(20,6) NOT NULL,
    "unit" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AthleteSportRequirement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AthleteSportRequirement_code_check" CHECK ("code" ~ '^[A-Z][A-Z0-9_]{1,63}$'),
    CONSTRAINT "AthleteSportRequirement_unit_check" CHECK (length(trim("unit")) BETWEEN 1 AND 24),
    CONSTRAINT "AthleteSportRequirement_target_check" CHECK ("targetValue" >= 0 AND "version" > 0)
);

CREATE UNIQUE INDEX "AthleteSportRequirement_tenantId_athleteId_sportId_code_version_key"
ON "AthleteSportRequirement"("tenantId", "athleteId", "sportId", "code", "version");
CREATE UNIQUE INDEX "AthleteSportRequirement_one_active_key"
ON "AthleteSportRequirement"("tenantId", "athleteId", "sportId", "code")
WHERE "status" = 'ACTIVE';
CREATE INDEX "AthleteSportRequirement_tenantId_athleteId_status_idx"
ON "AthleteSportRequirement"("tenantId", "athleteId", "status");

ALTER TABLE "AthleteSportRequirement" ADD CONSTRAINT "AthleteSportRequirement_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AthleteSportRequirement" ADD CONSTRAINT "AthleteSportRequirement_athleteId_tenantId_fkey"
FOREIGN KEY ("athleteId", "tenantId") REFERENCES "Athlete"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AthleteSportRequirement" ADD CONSTRAINT "AthleteSportRequirement_sportId_tenantId_fkey"
FOREIGN KEY ("sportId", "tenantId") REFERENCES "Sport"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "Permission" ("id", "tenantId", "code", "name", "description", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, t."id", codes."code", codes."code", codes."description", NOW(), NOW()
FROM "Tenant" AS t CROSS JOIN (VALUES
  ('sport-requirements.read', 'Read assigned Athlete sport requirements'),
  ('sport-requirements.write', 'Manage assigned Athlete sport requirements')
) AS codes("code", "description")
WHERE NOT EXISTS (SELECT 1 FROM "Permission" AS p WHERE p."tenantId" = t."id" AND p."code" = codes."code")
ON CONFLICT DO NOTHING;

INSERT INTO "RolePermission" ("id", "tenantId", "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid()::text, r."tenantId", r."id", p."id", NOW()
FROM "Role" AS r JOIN "Permission" AS p ON p."tenantId" = r."tenantId"
 AND p."code" IN ('sport-requirements.read', 'sport-requirements.write')
WHERE r."name" = 'ADMIN'
ON CONFLICT ("tenantId", "roleId", "permissionId") DO NOTHING;
