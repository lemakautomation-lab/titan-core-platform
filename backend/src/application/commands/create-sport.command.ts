export class CreateSportCommand {

    constructor(

        public readonly name: string,

        public readonly slug: string,

        public readonly tenantId: string,

        public readonly userId: string,

    ) {}

}
