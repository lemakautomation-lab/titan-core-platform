export class TenantDto {

    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly slug: string,
        public readonly status: string,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {}

}