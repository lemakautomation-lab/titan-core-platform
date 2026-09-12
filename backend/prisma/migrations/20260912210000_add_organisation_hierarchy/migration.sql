ALTER TABLE "Organisation"
ADD COLUMN "parentOrganisationId" TEXT;

ALTER TABLE "Organisation"
ADD CONSTRAINT "Organisation_parent_not_self_check"
CHECK (
    "parentOrganisationId" IS NULL
    OR "parentOrganisationId" <> "id"
);

ALTER TABLE "Organisation"
ADD CONSTRAINT "Organisation_parentOrganisationId_tenantId_fkey"
FOREIGN KEY ("parentOrganisationId", "tenantId")
REFERENCES "Organisation"("id", "tenantId")
ON DELETE RESTRICT
ON UPDATE CASCADE;

CREATE INDEX "Organisation_tenantId_parentOrganisationId_idx"
ON "Organisation"("tenantId", "parentOrganisationId");
