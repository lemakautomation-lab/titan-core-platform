export class UnlockUserCommand {

    constructor(

        public readonly userId: string,

        public readonly tenantId: string,

        public readonly actorUserId: string,

    ) {}

}
