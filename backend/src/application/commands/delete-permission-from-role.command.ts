export class DeletePermissionFromRoleCommand {

    constructor(

        public readonly roleId: string,

        public readonly permissionId: string,

        public readonly tenantId: string,

        public readonly userId: string,

    ) {}

}
