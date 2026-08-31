ALTER TABLE "Product" ADD COLUMN "tenantId" TEXT;

UPDATE "Product"
SET "tenantId" = (SELECT "id" FROM "Tenant" LIMIT 1)
WHERE "tenantId" IS NULL;

ALTER TABLE "Product" ALTER COLUMN "tenantId" SET NOT NULL;

CREATE INDEX "Product_tenantId_idx" ON "Product"("tenantId");

CREATE UNIQUE INDEX "Product_tenantId_slug_key"
ON "Product"("tenantId", "slug");

ALTER TABLE "Product"
ADD CONSTRAINT "Product_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
