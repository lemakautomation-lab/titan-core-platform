import { describe, expect, it } from "vitest";

import { User } from "../../src/domain/entities/user.entity";
import { OnboardingUserType } from "../../src/domain/enums/onboarding-user-type.enum";

function createUser(
    selectedUserType: OnboardingUserType | string | null = null,
): User {

    return User.create(
        "tenant-1",
        null,
        "athlete@example.com",
        "password-hash",
        "Test",
        "Athlete",
        "+27821234567",
        selectedUserType,
    );

}

describe("User-selected onboarding type", () => {

    it.each([
        OnboardingUserType.ATHLETE,
        OnboardingUserType.TRAINER,
        OnboardingUserType.ORGANISATION,
    ])("accepts %s", (selectedUserType) => {

        expect(
            createUser(selectedUserType).selectedUserType,
        ).toBe(selectedUserType);

    });

    it("preserves null for legacy users", () => {

        expect(createUser().selectedUserType).toBeNull();

    });

    it.each([
        "",
        "ADMIN",
        "OPERATOR",
        "VIEWER",
        "COACH",
        "athlete",
    ])("rejects unsupported type %j", (selectedUserType) => {

        expect(
            () => createUser(selectedUserType),
        ).toThrow(
            "User type must be ATHLETE, TRAINER or ORGANISATION.",
        );

    });

    it("does not assign an RBAC role", () => {

        const user=createUser(OnboardingUserType.ORGANISATION);

        expect(user.selectedUserType).toBe(
            OnboardingUserType.ORGANISATION,
        );
        expect(Object.keys(user)).not.toContain("roles");

    });

});