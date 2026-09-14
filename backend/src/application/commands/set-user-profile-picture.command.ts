export class SetUserProfilePictureCommand {

    constructor(
        public readonly userId: string,
        public readonly tenantId: string,
        public readonly content: Uint8Array,
        public readonly mimeType: string,
    ) {}

}
