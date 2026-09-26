CREATE TABLE "WearableConnection" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerSubjectDigest" TEXT NOT NULL,
    "consentedById" TEXT NOT NULL,
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WearableConnection_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WearableConnection_provider_check" CHECK ("provider" IN ('GARMIN', 'APPLE_HEALTH', 'SAMSUNG_HEALTH')),
    CONSTRAINT "WearableConnection_subject_digest_check" CHECK ("providerSubjectDigest" ~ '^[0-9a-f]{64}$'),
    CONSTRAINT "WearableConnection_revocation_check" CHECK ("revokedAt" IS NULL OR "revokedAt" >= "consentedAt")
);

CREATE UNIQUE INDEX "WearableConnection_id_tenantId_athleteId_key"
ON "WearableConnection"("id", "tenantId", "athleteId");
CREATE UNIQUE INDEX "WearableConnection_active_subject_key"
ON "WearableConnection"("provider", "providerSubjectDigest") WHERE "revokedAt" IS NULL;
CREATE INDEX "WearableConnection_tenantId_athleteId_revokedAt_idx"
ON "WearableConnection"("tenantId", "athleteId", "revokedAt");

ALTER TABLE "WearableConnection" ADD CONSTRAINT "WearableConnection_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WearableConnection" ADD CONSTRAINT "WearableConnection_athleteId_tenantId_fkey"
FOREIGN KEY ("athleteId", "tenantId") REFERENCES "Athlete"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WearableConnection" ADD CONSTRAINT "WearableConnection_consentedById_tenantId_fkey"
FOREIGN KEY ("consentedById", "tenantId") REFERENCES "User"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "WearableObservation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "providerRecordId" TEXT NOT NULL,
    "metricCode" TEXT NOT NULL,
    "value" DECIMAL(20,6) NOT NULL,
    "unit" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WearableObservation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WearableObservation_metric_unit_check" CHECK (
        ("metricCode" = 'HEART_RATE' AND "unit" = 'bpm' AND "value" BETWEEN 0 AND 300) OR
        ("metricCode" = 'STEPS' AND "unit" = 'count' AND "value" BETWEEN 0 AND 1000000) OR
        ("metricCode" = 'SLEEP_DURATION' AND "unit" = 'minutes' AND "value" BETWEEN 0 AND 1440)
    ),
    CONSTRAINT "WearableObservation_record_check" CHECK (length("providerRecordId") BETWEEN 1 AND 256)
);

CREATE UNIQUE INDEX "WearableObservation_connectionId_providerRecordId_key"
ON "WearableObservation"("connectionId", "providerRecordId");
CREATE INDEX "WearableObservation_tenantId_athleteId_observedAt_idx"
ON "WearableObservation"("tenantId", "athleteId", "observedAt");

ALTER TABLE "WearableObservation" ADD CONSTRAINT "WearableObservation_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WearableObservation" ADD CONSTRAINT "WearableObservation_athleteId_tenantId_fkey"
FOREIGN KEY ("athleteId", "tenantId") REFERENCES "Athlete"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WearableObservation" ADD CONSTRAINT "WearableObservation_connectionId_tenantId_athleteId_fkey"
FOREIGN KEY ("connectionId", "tenantId", "athleteId") REFERENCES "WearableConnection"("id", "tenantId", "athleteId") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "Permission" ("id", "tenantId", "code", "name", "description", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, t."id", 'wearable-observations.read', 'wearable-observations.read',
 'Read consented, verified wearable observations', NOW(), NOW()
FROM "Tenant" AS t
WHERE NOT EXISTS (SELECT 1 FROM "Permission" AS p WHERE p."tenantId" = t."id" AND p."code" = 'wearable-observations.read')
ON CONFLICT DO NOTHING;

INSERT INTO "RolePermission" ("id", "tenantId", "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid()::text, r."tenantId", r."id", p."id", NOW()
FROM "Role" AS r JOIN "Permission" AS p ON p."tenantId" = r."tenantId"
 AND p."code" = 'wearable-observations.read'
WHERE r."name" = 'ADMIN'
ON CONFLICT ("tenantId", "roleId", "permissionId") DO NOTHING;
