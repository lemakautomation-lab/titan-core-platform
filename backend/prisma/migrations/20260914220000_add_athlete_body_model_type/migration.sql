CREATE TYPE "PerformanceBodyModelType"
AS ENUM ('MALE', 'FEMALE');

ALTER TABLE "Athlete"
ADD COLUMN "bodyModelType"
"PerformanceBodyModelType";