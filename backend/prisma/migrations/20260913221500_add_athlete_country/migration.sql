ALTER TABLE "Athlete"
ADD COLUMN "countryCode" TEXT;

ALTER TABLE "Athlete"
ADD CONSTRAINT "Athlete_countryCode_format_check"
CHECK (
    "countryCode" IS NULL
    OR "countryCode" ~ '^[A-Z]{2}$'
);
