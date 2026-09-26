import { OnboardingUserType } from "../domain/enums/onboarding-user-type.enum";

type TestUser = {
    id: string;
    tenantId: string;
    email: string;
    selectedUserType: OnboardingUserType | null;
};

export type StagingTestGrant = {
    userType: OnboardingUserType.ATHLETE | OnboardingUserType.TRAINER;
    permissions: readonly string[];
    expiresAt: string;
};

const athletePermissions = [
    "staging.synthetic-access",
    "athlete_digital_twins.read",
    "performance-metrics.read",
    "sports.read",
    "exercises.read",
] as const;

const trainerPermissions = [
    "staging.synthetic-access",
    "workout-programmes.read",
    "workout-programmes.update",
    "exercises.read",
] as const;

// A test grant never creates a payment or a paid entitlement.
export function stagingTestAccessConfigured(): boolean {
    if (process.env.NODE_ENV !== "staging") return false;

    let databaseName: string;
    try {
        databaseName = new URL(process.env.DATABASE_URL ?? "").pathname;
    } catch {
        return false;
    }
    if (databaseName !== "/titan_staging") return false;

    const tenantId = process.env.STAGING_TEST_TENANT_ID;
    const expiresAt = process.env.STAGING_TEST_ACCESS_UNTIL;
    const expiry = expiresAt ? Date.parse(expiresAt) : NaN;
    if (!tenantId ||
        !Number.isFinite(expiry) || expiry <= Date.now() ||
        expiry > Date.now() + 30 * 24 * 60 * 60 * 1000) return false;
    return true;
}

export function getStagingTestGrant(user: TestUser): StagingTestGrant | null {
    if (!stagingTestAccessConfigured() ||
        user.tenantId !== process.env.STAGING_TEST_TENANT_ID) return null;
    const expiresAt = process.env.STAGING_TEST_ACCESS_UNTIL!;

    // Only explicitly nominated synthetic accounts may receive these grants.
    if (!/^staging[.\-_+]/i.test(user.email)) return null;

    if (user.selectedUserType === OnboardingUserType.ATHLETE &&
        user.id === process.env.STAGING_TEST_ATHLETE_USER_ID) {
        return { userType: OnboardingUserType.ATHLETE,
            permissions: athletePermissions, expiresAt: expiresAt! };
    }
    if (user.selectedUserType === OnboardingUserType.TRAINER &&
        user.id === process.env.STAGING_TEST_TRAINER_USER_ID) {
        return { userType: OnboardingUserType.TRAINER,
            permissions: trainerPermissions, expiresAt: expiresAt! };
    }
    return null;
}
