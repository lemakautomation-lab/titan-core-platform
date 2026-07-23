export class OrganisationDto {

    constructor(
        public readonly id: string,
        public readonly tenantId: string,
        public readonly name: string,
        public readonly slug: string,
        public readonly status: string,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {}

}
