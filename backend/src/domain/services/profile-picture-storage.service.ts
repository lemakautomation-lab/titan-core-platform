export interface ProfilePictureUpload {

    tenantId: string;

    userId: string;

    content: Uint8Array;

    mimeType: string;

}

export interface StoredProfilePicture {

    storageKey: string;

    mimeType: string;

    sizeBytes: number;

}

export interface ProfilePictureStorageService {

    store(
        upload: ProfilePictureUpload,
    ): Promise<StoredProfilePicture>;

    delete(
        storageKey: string,
        tenantId: string,
        userId: string,
    ): Promise<void>;

}
