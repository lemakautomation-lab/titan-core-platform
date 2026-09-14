export class RemoveUserProfilePictureCommand {

    constructor(
        public readonly userId: string,
        public readonly tenantId: string,
    ) {}

}
