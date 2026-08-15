export class AssignRoleToUserCommand {

    constructor(

        public readonly userId: string,

        public readonly roleId: string,

        public readonly tenantId: string,

        public readonly actorUserId: string,

    ) {}

}
