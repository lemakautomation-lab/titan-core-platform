export class ProfilePictureReference {

    static readonly maximumSizeBytes =
        5 * 1024 * 1024;

    private static readonly allowedMimeTypes =
        new Set([
            "image/jpeg",
            "image/png",
            "image/webp",
        ]);

    private constructor(
        public readonly storageKey: string,
        public readonly mimeType: string,
        public readonly sizeBytes: number,
    ) {}

    static create(
        tenantId: string,
        userId: string,
        storageKey: string,
        mimeType: string,
        sizeBytes: number,
    ): ProfilePictureReference {

        if (
            typeof storageKey !== "string" ||
            typeof mimeType !== "string"
        ) {
            throw new Error(
                "Profile picture metadata is invalid.",
            );
        }

        const normalizedKey =
            storageKey.trim();

        const normalizedMimeType =
            mimeType.trim().toLowerCase();

        const requiredPrefix =
            `tenants/${tenantId}/users/${userId}/`;

        if (
            normalizedKey.length === 0 ||
            normalizedKey.length > 512 ||
            !normalizedKey.startsWith(
                requiredPrefix,
            ) ||
            normalizedKey.includes("..") ||
            normalizedKey.includes("\\") ||
            normalizedKey.includes("://") ||
            !/^[A-Za-z0-9][A-Za-z0-9/_.-]*$/.test(
                normalizedKey,
            )
        ) {
            throw new Error(
                "Profile picture storage key is invalid.",
            );
        }

        if (
            !ProfilePictureReference
                .allowedMimeTypes
                .has(normalizedMimeType)
        ) {
            throw new Error(
                "Profile picture must be JPEG, PNG or WebP.",
            );
        }

        if (
            !Number.isInteger(sizeBytes) ||
            sizeBytes <= 0 ||
            sizeBytes >
                ProfilePictureReference.maximumSizeBytes
        ) {
            throw new Error(
                "Profile picture exceeds the allowed size.",
            );
        }

        return new ProfilePictureReference(
            normalizedKey,
            normalizedMimeType,
            sizeBytes,
        );
    }

}
