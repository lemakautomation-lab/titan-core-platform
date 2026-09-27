DROP INDEX "Organisation_slug_key";

CREATE UNIQUE INDEX "Organisation_tenantId_slug_key"
    ON "Organisation"("tenantId", "slug");
