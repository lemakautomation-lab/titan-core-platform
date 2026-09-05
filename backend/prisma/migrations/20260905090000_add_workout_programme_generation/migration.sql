CREATE TABLE "WorkoutProgrammeGeneration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestFingerprint" TEXT NOT NULL,
    "requestFingerprintVersion" TEXT NOT NULL,
    "planFingerprint" TEXT NOT NULL,
    "rulesetId" TEXT NOT NULL,
    "rulesetVersion" TEXT NOT NULL,
    "inputSnapshot" JSONB NOT NULL,
    "planSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutProgrammeGeneration_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WorkoutProgrammeGeneration_identifiers_check" CHECK (
        char_length(btrim("id")) > 0
        AND char_length(btrim("tenantId")) > 0
        AND char_length(btrim("programmeId")) > 0
        AND char_length(btrim("actorUserId")) > 0
        AND btrim("id") = "id"
        AND btrim("tenantId") = "tenantId"
        AND btrim("programmeId") = "programmeId"
        AND btrim("actorUserId") = "actorUserId"
        AND lower("id") NOT IN ('null', 'undefined')
        AND lower("tenantId") NOT IN ('null', 'undefined')
        AND lower("programmeId") NOT IN ('null', 'undefined')
        AND lower("actorUserId") NOT IN ('null', 'undefined')
    ),
    CONSTRAINT "WorkoutProgrammeGeneration_idempotencyKey_check" CHECK (
        char_length("idempotencyKey") BETWEEN 1 AND 200
        AND "idempotencyKey" ~ '^[A-Za-z0-9._:-]+$'
    ),
    CONSTRAINT "WorkoutProgrammeGeneration_requestFingerprint_check" CHECK (
        "requestFingerprint" ~ '^[0-9a-f]{64}$'
    ),
    CONSTRAINT "WorkoutProgrammeGeneration_requestFingerprintVersion_check" CHECK (
        "requestFingerprintVersion" = '1'
    ),
    CONSTRAINT "WorkoutProgrammeGeneration_planFingerprint_check" CHECK (
        "planFingerprint" ~ '^[0-9a-f]{64}$'
    ),
    CONSTRAINT "WorkoutProgrammeGeneration_rulesetId_check" CHECK (
        char_length(btrim("rulesetId")) > 0
    ),
    CONSTRAINT "WorkoutProgrammeGeneration_rulesetVersion_check" CHECK (
        char_length(btrim("rulesetVersion")) > 0
    )
);

CREATE UNIQUE INDEX "WorkoutProgrammeGeneration_id_tenantId_key"
ON "WorkoutProgrammeGeneration"("id", "tenantId");

CREATE UNIQUE INDEX "WorkoutProgrammeGeneration_tenantId_idempotencyKey_key"
ON "WorkoutProgrammeGeneration"("tenantId", "idempotencyKey");

CREATE UNIQUE INDEX "WorkoutProgrammeGeneration_programmeId_tenantId_key"
ON "WorkoutProgrammeGeneration"("programmeId", "tenantId");

CREATE INDEX "WorkoutProgrammeGeneration_tenantId_idx"
ON "WorkoutProgrammeGeneration"("tenantId");

CREATE INDEX "WorkoutProgrammeGeneration_tenantId_programmeId_idx"
ON "WorkoutProgrammeGeneration"("tenantId", "programmeId");

ALTER TABLE "WorkoutProgrammeGeneration"
ADD CONSTRAINT "WorkoutProgrammeGeneration_programmeId_tenantId_fkey"
FOREIGN KEY ("programmeId", "tenantId")
REFERENCES "WorkoutProgramme"("id", "tenantId")
ON DELETE CASCADE ON UPDATE CASCADE;
