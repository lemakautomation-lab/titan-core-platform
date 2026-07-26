export class DeletePermissionFromRoleCommand {

    constructor(

        public readonly roleId: string,

        public readonly permissionId: string,

    ) {}

}
