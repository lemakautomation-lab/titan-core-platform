CREATE TYPE "OnboardingUserType" AS ENUM (
    'ATHLETE',
    'TRAINER',
    'ORGANISATION'
);

ALTER TABLE "User"
ADD COLUMN "selectedUserType" "OnboardingUserType";