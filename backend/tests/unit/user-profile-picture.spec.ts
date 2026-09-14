import {
    describe,
    expect,
    it,
} from "vitest";

import { User } from "../../src/domain/entities/user.entity";
import { UserStatus } from "../../src/domain/enums/user-status.enum";

function createUser(): User {

    const now =
        new Date("2026-09-14T10:00:00.000Z");

    return new User(
        "user-1",
        "tenant-1",
        null,
        "athlete@titan.test",
        "password-hash",
        "Titan",
        "Athlete",
        UserStatus.ACTIVE,
        now,
        now,
    );
}

function validKey(): string {

    return "tenants/tenant-1/users/user-1/profile.webp";
}

describe(
    "User profile picture",
    () => {

        it(
            "sets a normalized WebP reference",
            () => {

                const user=createUser();

                user.updateProfilePicture(
                    ` ${validKey()} `,
                    " IMAGE/WEBP ",
                    2048,
                );

                expect(
                    user.profilePictureStorageKey,
                ).toBe(validKey());

                expect(
                    user.profilePictureMimeType,
                ).toBe("image/webp");

                expect(
                    user.profilePictureSizeBytes,
                ).toBe(2048);
            },
        );

        it.each([
            "image/jpeg",
            "image/png",
            "image/webp",
        ])(
            "allows %s",
            (mimeType) => {

                const user=createUser();

                user.updateProfilePicture(
                    validKey(),
                    mimeType,
                    1,
                );

                expect(
                    user.profilePictureMimeType,
                ).toBe(mimeType);
            },
        );

        it(
            "rejects an unsupported MIME type",
            () => {

                const user=createUser();

                expect(
                    () => user.updateProfilePicture(
                        validKey(),
                        "image/svg+xml",
                        1024,
                    ),
                ).toThrow(
                    "Profile picture must be JPEG, PNG or WebP.",
                );
            },
        );

        it(
            "rejects a cross-tenant storage key",
            () => {

                const user=createUser();

                expect(
                    () => user.updateProfilePicture(
                        "tenants/tenant-2/users/user-1/profile.webp",
                        "image/webp",
                        1024,
                    ),
                ).toThrow(
                    "Profile picture storage key is invalid.",
                );
            },
        );

        it(
            "rejects a key owned by another User",
            () => {

                const user=createUser();

                expect(
                    () => user.updateProfilePicture(
                        "tenants/tenant-1/users/user-2/profile.webp",
                        "image/webp",
                        1024,
                    ),
                ).toThrow(
                    "Profile picture storage key is invalid.",
                );
            },
        );

        it(
            "rejects traversal in the storage key",
            () => {

                const user=createUser();

                expect(
                    () => user.updateProfilePicture(
                        "tenants/tenant-1/users/user-1/../profile.webp",
                        "image/webp",
                        1024,
                    ),
                ).toThrow(
                    "Profile picture storage key is invalid.",
                );
            },
        );

        it(
            "rejects an oversized picture",
            () => {

                const user=createUser();

                expect(
                    () => user.updateProfilePicture(
                        validKey(),
                        "image/webp",
                        (5 * 1024 * 1024) + 1,
                    ),
                ).toThrow(
                    "Profile picture exceeds the allowed size.",
                );
            },
        );

        it(
            "rejects an empty picture",
            () => {

                const user=createUser();

                expect(
                    () => user.updateProfilePicture(
                        validKey(),
                        "image/webp",
                        0,
                    ),
                ).toThrow(
                    "Profile picture exceeds the allowed size.",
                );
            },
        );

        it(
            "preserves existing state when validation fails",
            () => {

                const user=createUser();

                user.updateProfilePicture(
                    validKey(),
                    "image/webp",
                    1024,
                );

                expect(
                    () => user.updateProfilePicture(
                        validKey(),
                        "image/svg+xml",
                        2000,
                    ),
                ).toThrow();

                expect(
                    user.profilePictureStorageKey,
                ).toBe(validKey());

                expect(
                    user.profilePictureMimeType,
                ).toBe("image/webp");

                expect(
                    user.profilePictureSizeBytes,
                ).toBe(1024);
            },
        );

        it(
            "removes all profile-picture metadata",
            () => {

                const user=createUser();

                user.updateProfilePicture(
                    validKey(),
                    "image/webp",
                    1024,
                );

                user.removeProfilePicture();

                expect(
                    user.profilePictureStorageKey,
                ).toBeNull();

                expect(
                    user.profilePictureMimeType,
                ).toBeNull();

                expect(
                    user.profilePictureSizeBytes,
                ).toBeNull();
            },
        );
    },
);
