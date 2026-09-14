ALTER TABLE "User"
ADD COLUMN "profilePictureStorageKey" TEXT,
ADD COLUMN "profilePictureMimeType" TEXT,
ADD COLUMN "profilePictureSizeBytes" INTEGER;

ALTER TABLE "User"
ADD CONSTRAINT "User_profile_picture_complete_check"
CHECK (
    (
        "profilePictureStorageKey" IS NULL
        AND "profilePictureMimeType" IS NULL
        AND "profilePictureSizeBytes" IS NULL
    )
    OR
    (
        "profilePictureStorageKey" IS NOT NULL
        AND "profilePictureMimeType" IS NOT NULL
        AND "profilePictureSizeBytes" IS NOT NULL
    )
);

ALTER TABLE "User"
ADD CONSTRAINT "User_profile_picture_mime_check"
CHECK (
    "profilePictureMimeType" IS NULL
    OR "profilePictureMimeType" IN (
        'image/jpeg',
        'image/png',
        'image/webp'
    )
);

ALTER TABLE "User"
ADD CONSTRAINT "User_profile_picture_size_check"
CHECK (
    "profilePictureSizeBytes" IS NULL
    OR (
        "profilePictureSizeBytes" > 0
        AND "profilePictureSizeBytes" <= 5242880
    )
);

ALTER TABLE "User"
ADD CONSTRAINT "User_profile_picture_key_check"
CHECK (
    "profilePictureStorageKey" IS NULL
    OR (
        length("profilePictureStorageKey") BETWEEN 1 AND 512
        AND "profilePictureStorageKey" !~ '\.\.'
        AND "profilePictureStorageKey" !~ '\\'
        AND "profilePictureStorageKey" !~ '://'
    )
);
