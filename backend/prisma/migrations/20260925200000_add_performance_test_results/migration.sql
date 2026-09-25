CREATE TABLE "PerformanceTestProtocol" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "sportId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PerformanceTestProtocol_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PerformanceTestProtocol_code_check" CHECK ("code" ~ '^[A-Z][A-Z0-9_]{1,63}$'),
  CONSTRAINT "PerformanceTestProtocol_name_unit_check" CHECK (length(trim("name")) BETWEEN 1 AND 120 AND length(trim("unit")) BETWEEN 1 AND 24),
  CONSTRAINT "PerformanceTestProtocol_version_check" CHECK ("version" > 0)
);
CREATE UNIQUE INDEX "PerformanceTestProtocol_id_tenantId_key" ON "PerformanceTestProtocol"("id", "tenantId");
CREATE UNIQUE INDEX "PerformanceTestProtocol_tenantId_sportId_code_version_key"
ON "PerformanceTestProtocol"("tenantId", "sportId", "code", "version");
CREATE UNIQUE INDEX "PerformanceTestProtocol_one_active_key"
ON "PerformanceTestProtocol"("tenantId", "sportId", "code") WHERE "status" = 'ACTIVE';
CREATE INDEX "PerformanceTestProtocol_tenantId_status_idx" ON "PerformanceTestProtocol"("tenantId", "status");
ALTER TABLE "PerformanceTestProtocol" ADD CONSTRAINT "PerformanceTestProtocol_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PerformanceTestProtocol" ADD CONSTRAINT "PerformanceTestProtocol_sportId_tenantId_fkey"
FOREIGN KEY ("sportId", "tenantId") REFERENCES "Sport"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "AthletePerformanceTestResult" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "athleteId" TEXT NOT NULL,
  "protocolId" TEXT NOT NULL,
  "value" DECIMAL(20,6) NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL,
  "correctsResultId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AthletePerformanceTestResult_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AthletePerformanceTestResult_value_check" CHECK ("value" >= 0),
  CONSTRAINT "AthletePerformanceTestResult_self_check" CHECK ("correctsResultId" IS NULL OR "correctsResultId" <> "id")
);
CREATE UNIQUE INDEX "AthletePerformanceTestResult_correctsResultId_key" ON "AthletePerformanceTestResult"("correctsResultId");
CREATE UNIQUE INDEX "AthletePerformanceTestResult_id_tenantId_athleteId_protocolId_key"
ON "AthletePerformanceTestResult"("id", "tenantId", "athleteId", "protocolId");
CREATE INDEX "AthletePerformanceTestResult_tenantId_athleteId_recordedAt_idx"
ON "AthletePerformanceTestResult"("tenantId", "athleteId", "recordedAt");
ALTER TABLE "AthletePerformanceTestResult" ADD CONSTRAINT "AthletePerformanceTestResult_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AthletePerformanceTestResult" ADD CONSTRAINT "AthletePerformanceTestResult_athleteId_tenantId_fkey"
FOREIGN KEY ("athleteId", "tenantId") REFERENCES "Athlete"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AthletePerformanceTestResult" ADD CONSTRAINT "AthletePerformanceTestResult_protocolId_tenantId_fkey"
FOREIGN KEY ("protocolId", "tenantId") REFERENCES "PerformanceTestProtocol"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AthletePerformanceTestResult" ADD CONSTRAINT "AthletePerformanceTestResult_correction_fkey"
FOREIGN KEY ("correctsResultId", "tenantId", "athleteId", "protocolId")
REFERENCES "AthletePerformanceTestResult"("id", "tenantId", "athleteId", "protocolId") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "Permission" ("id", "tenantId", "code", "name", "description", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, t."id", codes."code", codes."code", codes."description", NOW(), NOW()
FROM "Tenant" AS t CROSS JOIN (VALUES
  ('performance-tests.read', 'Read authorised Athlete performance tests'),
  ('performance-tests.write', 'Manage governed performance tests')
) AS codes("code", "description")
WHERE NOT EXISTS (SELECT 1 FROM "Permission" AS p WHERE p."tenantId" = t."id" AND p."code" = codes."code")
ON CONFLICT DO NOTHING;
INSERT INTO "RolePermission" ("id", "tenantId", "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid()::text, r."tenantId", r."id", p."id", NOW()
FROM "Role" AS r JOIN "Permission" AS p ON p."tenantId" = r."tenantId"
 AND p."code" IN ('performance-tests.read', 'performance-tests.write')
WHERE r."name" = 'ADMIN'
ON CONFLICT ("tenantId", "roleId", "permissionId") DO NOTHING;
