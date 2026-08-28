export class UpdateSportCommand {

    constructor(

        public readonly id: string,

        public readonly name: string,

        public readonly slug: string,

        public readonly tenantId: string,

        public readonly userId: string,

    ) {}

}
