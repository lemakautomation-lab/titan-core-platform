export class UpdateRoleCommand {

    constructor(

        public readonly id: string,

        public readonly name: string,

        public readonly description: string | null,

        public readonly tenantId: string,

        public readonly userId: string,

    ) {}

}
