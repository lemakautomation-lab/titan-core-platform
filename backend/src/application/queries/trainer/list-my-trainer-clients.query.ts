export class ListMyTrainerClientsQuery {
    constructor(
        public readonly userId: string,
        public readonly tenantId: string,
    ) {}
}
