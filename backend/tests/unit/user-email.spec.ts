import {
    describe,
    expect,
    it,
} from "vitest";

import {
    User,
} from "../../src/domain/entities/user.entity";

function createUser(email: string): User {

    return User.create(
        "tenant-1",
        null,
        email,
        "password-hash",
        "Marc",
        "Athlete",
    );

}

describe("User email for athlete onboarding", () => {

    it("normalizes email deterministically", () => {

        expect(
            createUser(
                "  ATHLETE@TITAN.TEST  ",
            ).email,
        ).toBe("athlete@titan.test");

    });

    it.each([
        "",
        " ",
        "invalid",
        "@titan.test",
        "athlete@",
        `a${"b".repeat(250)}@titan.test`,
    ])("rejects invalid email %j", (email) => {

        expect(
            () => createUser(email),
        ).toThrow(/User email/);

    });

    it("normalizes email during profile update", () => {

        const user=createUser(
            "athlete@titan.test",
        );

        user.updateProfile(
            null,
            " UPDATED@TITAN.TEST ",
            "Marc",
            "Athlete",
        );

        expect(user.email).toBe(
            "updated@titan.test",
        );

    });

    it("rejects invalid updates atomically", () => {

        const user=createUser(
            "athlete@titan.test",
        );

        expect(() =>
            user.updateProfile(
                "organisation-2",
                "invalid",
                "Changed",
                "Name",
            ),
        ).toThrow(
            "User email format is invalid.",
        );

        expect(user.organisationId).toBeNull();
        expect(user.email).toBe(
            "athlete@titan.test",
        );
        expect(user.firstName).toBe("Marc");
        expect(user.lastName).toBe("Athlete");

    });

});
