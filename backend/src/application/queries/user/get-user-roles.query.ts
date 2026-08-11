export class GetUserRolesQuery {

    constructor(

        public readonly userId: string,

        public readonly tenantId: string,

    ) {}

}
