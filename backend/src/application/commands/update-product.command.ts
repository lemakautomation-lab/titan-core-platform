export class UpdateProductCommand {

    constructor(
        public readonly tenantId: string,
        public readonly id: string,
        public readonly name: string,
        public readonly slug: string,
        public readonly description: string | null,
        public readonly priceCents: number,
        public readonly currency: string,
        public readonly billingInterval: string,
    ) {}

}
