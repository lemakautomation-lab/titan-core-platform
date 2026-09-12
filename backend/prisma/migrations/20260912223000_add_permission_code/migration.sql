ALTER TABLE "Permission"
ADD COLUMN "code" TEXT;

UPDATE "Permission"
SET "code" = "name"
WHERE "code" IS NULL;

ALTER TABLE "Permission"
ALTER COLUMN "code" SET NOT NULL;

CREATE UNIQUE INDEX "Permission_tenantId_code_key"
ON "Permission"("tenantId", "code");
