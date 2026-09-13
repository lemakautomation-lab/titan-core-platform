import {
    describe,
    expect,
    it,
} from "vitest";

import {
    Athlete,
} from "../../src/domain/entities/athlete.entity";

function createAthlete(
    lastName: string,
): Athlete {

    return Athlete.create(
        "tenant-1",
        null,
        "user-1",
        "Marc",
        lastName,
        null,
    );

}

describe("Athlete surname", () => {

    it("requires a supplied surname", () => {

        expect(
            () => createAthlete("   "),
        ).toThrow(
            "Athlete surname is required.",
        );

    });

    it("normalizes the surname on creation", () => {

        const athlete =
            createAthlete("  Athlete  ");

        expect(athlete.lastName).toBe("Athlete");
        expect(athlete.getFullName()).toBe(
            "Marc Athlete",
        );

    });

    it("normalizes the surname on profile update", () => {

        const athlete =
            createAthlete("Athlete");

        athlete.updateProfile(
            null,
            "user-1",
            "Marc",
            "  Titan  ",
            null,
        );

        expect(athlete.lastName).toBe("Titan");

    });

    it("rejects an invalid surname update without partial mutation", () => {

        const athlete =
            createAthlete("Athlete");

        expect(() =>
            athlete.updateProfile(
                "organisation-2",
                "user-2",
                "Marcus",
                " ",
                null,
            ),
        ).toThrow(
            "Athlete surname is required.",
        );

        expect(athlete.organisationId).toBeNull();
        expect(athlete.userId).toBe("user-1");
        expect(athlete.firstName).toBe("Marc");
        expect(athlete.lastName).toBe("Athlete");

    });

    it("enforces a bounded surname length", () => {

        expect(
            () => createAthlete("A".repeat(101)),
        ).toThrow(
            "Athlete surname must not exceed 100 characters.",
        );

        expect(
            createAthlete("A".repeat(100)).lastName,
        ).toHaveLength(100);

    });

});
