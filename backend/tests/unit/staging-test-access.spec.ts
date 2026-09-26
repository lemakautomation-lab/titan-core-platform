import { afterEach, describe, expect, it } from "vitest";
import { getStagingTestGrant } from "../../src/config/staging-test-access";
import { OnboardingUserType } from "../../src/domain/enums/onboarding-user-type.enum";

const previous = { ...process.env };
afterEach(() => { process.env = { ...previous }; });

describe("staging synthetic access", () => {
    const user = {
        id: "synthetic-athlete-id", tenantId: "synthetic-tenant-id",
        email: "staging-athlete@example.com",
        selectedUserType: OnboardingUserType.ATHLETE,
    };

    function configure() {
        process.env.NODE_ENV = "staging";
        process.env.DATABASE_URL = "postgresql://unused:unused@localhost/titan_staging";
        process.env.STAGING_TEST_TENANT_ID = user.tenantId;
        process.env.STAGING_TEST_ATHLETE_USER_ID = user.id;
        process.env.STAGING_TEST_ACCESS_UNTIL = new Date(Date.now() + 3600000).toISOString();
    }

    it("grants only the named synthetic account for a short staging window", () => {
        configure();
        expect(getStagingTestGrant(user)?.permissions).toContain("athlete_digital_twins.read");
        expect(getStagingTestGrant({ ...user, id: "other" })).toBeNull();
        expect(getStagingTestGrant({ ...user, tenantId: "other" })).toBeNull();
        expect(getStagingTestGrant({ ...user, email: "real@example.com" })).toBeNull();
    });

    it("rejects production, another database, and expired grants", () => {
        configure();
        process.env.NODE_ENV = "production";
        expect(getStagingTestGrant(user)).toBeNull();
        process.env.NODE_ENV = "staging";
        process.env.DATABASE_URL = "postgresql://unused:unused@localhost/titan_core";
        expect(getStagingTestGrant(user)).toBeNull();
        process.env.DATABASE_URL = "postgresql://unused:unused@localhost/titan_staging";
        process.env.STAGING_TEST_ACCESS_UNTIL = new Date(Date.now() - 1000).toISOString();
        expect(getStagingTestGrant(user)).toBeNull();
    });
});
