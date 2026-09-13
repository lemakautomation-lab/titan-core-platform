import {
    describe,
    expect,
    it,
} from "vitest";

import {
    Athlete,
} from "../../src/domain/entities/athlete.entity";

function createAthlete(
    countryCode: string | null = null,
): Athlete {

    return Athlete.create(
        "tenant-1",
        null,
        "user-1",
        "Marc",
        "Athlete",
        null,
        countryCode,
    );

}

describe("Athlete country", () => {

    it("preserves null for legacy athlete records", () => {

        expect(
            createAthlete().countryCode,
        ).toBeNull();

    });

    it("normalizes a supplied country code", () => {

        expect(
            createAthlete(" za ").countryCode,
        ).toBe("ZA");

    });

    it.each([
        "",
        " ",
        "Z",
        "ZAF",
        "Z1",
    ])(
        "rejects invalid country code %j",
        (countryCode) => {

            expect(
                () => createAthlete(countryCode),
            ).toThrow(
                /Athlete country code/,
            );

        },
    );

    it("updates the country deterministically", () => {

        const athlete=createAthlete("ZA");

        athlete.updateCountry(" gb ");

        expect(athlete.countryCode).toBe("GB");

    });

    it("preserves the existing country after an invalid update", () => {

        const athlete=createAthlete("ZA");

        expect(() =>
            athlete.updateCountry("invalid"),
        ).toThrow(
            "Athlete country code must contain exactly two letters.",
        );

        expect(athlete.countryCode).toBe("ZA");

    });

});
