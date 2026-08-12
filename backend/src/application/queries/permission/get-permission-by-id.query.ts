export class GetPermissionByIdQuery {

    constructor(
        public readonly id: string,
        public readonly tenantId: string,
    ) {}

}
