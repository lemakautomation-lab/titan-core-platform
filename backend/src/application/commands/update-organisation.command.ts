export class UpdateOrganisationCommand {

    constructor(

        public readonly id: string,

        public readonly name: string,

        public readonly slug: string,

    ) {}

}
