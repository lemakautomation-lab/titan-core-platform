export class CreateOrganisationCommand {

    constructor(

        public readonly tenantId: string,

        public readonly name: string,

    ) {}

}
