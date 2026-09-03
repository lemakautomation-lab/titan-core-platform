DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "Exercise" AS exercise
        LEFT JOIN "Sport" AS sport
          ON sport."id" = exercise."sportId"
         AND sport."tenantId" = exercise."tenantId"
        WHERE exercise."sportId" IS NOT NULL
          AND sport."id" IS NULL
    ) THEN
        RAISE EXCEPTION 'Exercise tenant/Sport ownership preflight failed';
    END IF;
END $$;

ALTER TABLE "Exercise"
DROP CONSTRAINT "Exercise_sportId_fkey";

ALTER TABLE "Exercise"
ADD CONSTRAINT "Exercise_sportId_tenantId_fkey"
FOREIGN KEY ("sportId", "tenantId")
REFERENCES "Sport"("id", "tenantId")
ON DELETE RESTRICT ON UPDATE CASCADE;
