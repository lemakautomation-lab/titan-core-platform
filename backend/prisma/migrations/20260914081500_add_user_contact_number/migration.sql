ALTER TABLE "User"
ADD COLUMN "contactNumber" TEXT;

ALTER TABLE "User"
ADD CONSTRAINT "User_contactNumber_e164_check"
CHECK (
    "contactNumber" IS NULL
    OR "contactNumber" ~ '^\+[1-9][0-9]{7,14}$'
);
