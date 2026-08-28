export class DeleteSportCommand {

    constructor(

        public readonly id: string,

        public readonly tenantId: string,

        public readonly userId: string,

    ) {}

}
