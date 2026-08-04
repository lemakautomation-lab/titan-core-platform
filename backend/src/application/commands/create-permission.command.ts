export class CreatePermissionCommand {

    constructor(

        public readonly name: string,

        public readonly description: string | null,

        public readonly tenantId: string,

        public readonly userId: string,

    ) {}

}
