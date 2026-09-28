-- Mission 111 staging introductory prices. Values are ZAR cents; no VAT is added.
-- Applications snapshot these amounts, so future price changes require new plan codes.
BEGIN;

INSERT INTO "OrganisationOnboardingPlan"
    ("id", "code", "name", "amountMinor", "currency", "billingInterval", "status", "createdAt", "updatedAt")
VALUES
    ('54e7d3da-f836-4ae5-a566-15981d639001', 'ORG_INTRO_MONTHLY_2026', 'TITAN Health Organisation Monthly', 39900, 'ZAR', 'MONTHLY', 'ACTIVE', now(), now()),
    ('54e7d3da-f836-4ae5-a566-15981d639002', 'ORG_INTRO_ANNUAL_2026', 'TITAN Health Organisation Annual', 399000, 'ZAR', 'ANNUALLY', 'ACTIVE', now(), now())
ON CONFLICT ("code") DO NOTHING;

DO $$
BEGIN
    IF (
        SELECT count(*) FROM "OrganisationOnboardingPlan"
        WHERE ("code" = 'ORG_INTRO_MONTHLY_2026' AND "amountMinor" = 39900 AND "currency" = 'ZAR' AND "billingInterval" = 'MONTHLY' AND "status" = 'ACTIVE')
           OR ("code" = 'ORG_INTRO_ANNUAL_2026' AND "amountMinor" = 399000 AND "currency" = 'ZAR' AND "billingInterval" = 'ANNUALLY' AND "status" = 'ACTIVE')
    ) <> 2 THEN
        RAISE EXCEPTION 'Organisation introductory plan records differ from approved pricing';
    END IF;
END $$;

COMMIT;
