import { describe, expect, it } from "vitest";

import { User } from "../../src/domain/entities/user.entity";

function createUser(
    contactNumber: string | null = null,
): User {

    return User.create(
        "tenant-1",
        null,
        "athlete@example.com",
        "password-hash",
        "Test",
        "Athlete",
        contactNumber,
    );

}

describe("User contact number for athlete onboarding", () => {

    it("stores a normalized E.164 contact number", () => {

        const user = createUser("  +27821234567  ");

        expect(user.contactNumber).toBe("+27821234567");

    });

    it("preserves null for legacy users", () => {

        expect(createUser().contactNumber).toBeNull();

    });

    it.each([
        "",
        "0821234567",
        "27821234567",
        "+0123456789",
        "+1234567",
        "+1234567890123456",
        "+27 82 123 4567",
    ])("rejects invalid contact number %j", (contactNumber) => {

        expect(
            () => createUser(contactNumber),
        ).toThrow(
            "User contact number must use E.164 format.",
        );

    });

    it("updates the contact number deterministically", () => {

        const user = createUser("+27821234567");

        user.updateContactNumber("  +27829876543  ");

        expect(user.contactNumber).toBe("+27829876543");

    });

    it("does not mutate the profile when an update is invalid", () => {

        const user = createUser("+27821234567");

        expect(
            () => user.updateContactNumber("0829876543"),
        ).toThrow(
            "User contact number must use E.164 format.",
        );

        expect(user.contactNumber).toBe("+27821234567");

    });

});
