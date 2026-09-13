import {
    describe,
    expect,
    it,
} from "vitest";

import {
    Athlete,
} from "../../src/domain/entities/athlete.entity";

function createAthlete(
    firstName: string,
): Athlete {

    return Athlete.create(
        "tenant-1",
        null,
        "user-1",
        firstName,
        "Athlete",
        null,
    );

}

describe("Athlete first name", () => {

    it("requires a supplied first name", () => {

        expect(
            () => createAthlete("   "),
        ).toThrow(
            "Athlete first name is required.",
        );

    });

    it("normalizes the first name on creation", () => {

        const athlete =
            createAthlete("  Marc  ");

        expect(athlete.firstName).toBe("Marc");
        expect(athlete.getFullName()).toBe(
            "Marc Athlete",
        );

    });

    it("normalizes the first name on profile update", () => {

        const athlete =
            createAthlete("Marc");

        athlete.updateProfile(
            null,
            "user-1",
            "  Marcus  ",
            "Athlete",
            null,
        );

        expect(athlete.firstName).toBe("Marcus");

    });

    it("rejects an invalid update without partially mutating the athlete", () => {

        const athlete =
            createAthlete("Marc");

        expect(() =>
            athlete.updateProfile(
                "organisation-2",
                "user-2",
                " ",
                "Changed",
                null,
            ),
        ).toThrow(
            "Athlete first name is required.",
        );

        expect(athlete.organisationId).toBeNull();
        expect(athlete.userId).toBe("user-1");
        expect(athlete.firstName).toBe("Marc");
        expect(athlete.lastName).toBe("Athlete");

    });

    it("enforces a bounded first-name length", () => {

        expect(
            () => createAthlete("A".repeat(101)),
        ).toThrow(
            "Athlete first name must not exceed 100 characters.",
        );

        expect(
            createAthlete("A".repeat(100)).firstName,
        ).toHaveLength(100);

    });

});
