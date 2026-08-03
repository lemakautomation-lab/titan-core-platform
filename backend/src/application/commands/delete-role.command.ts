export class DeleteRoleCommand {

    constructor(

        public readonly id: string,

        public readonly tenantId: string,

        public readonly userId: string,

    ) {}

}
