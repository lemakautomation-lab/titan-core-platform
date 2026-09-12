DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "User" AS user_record
        INNER JOIN "Organisation" AS organisation
            ON organisation."id" = user_record."organisationId"
        WHERE user_record."organisationId" IS NOT NULL
          AND user_record."tenantId" <> organisation."tenantId"
    ) THEN
        RAISE EXCEPTION
            'User Organisation tenant-integrity preflight failed';
    END IF;
END $$;

ALTER TABLE "Organisation"
ADD CONSTRAINT "Organisation_id_tenantId_key"
UNIQUE ("id", "tenantId");

ALTER TABLE "User"
DROP CONSTRAINT "User_organisationId_fkey";

ALTER TABLE "User"
ADD CONSTRAINT "User_organisationId_tenantId_fkey"
FOREIGN KEY ("organisationId", "tenantId")
REFERENCES "Organisation"("id", "tenantId")
ON DELETE RESTRICT
ON UPDATE CASCADE;

CREATE INDEX "User_tenantId_organisationId_idx"
ON "User"("tenantId", "organisationId");
