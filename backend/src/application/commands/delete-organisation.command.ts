export class DeleteOrganisationCommand {

    constructor(

        public readonly id: string,

        public readonly tenantId: string,

    ) {}

}
