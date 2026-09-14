export class UpdateMyPersonalDetailsCommand {

    constructor(
        public readonly userId: string,
        public readonly tenantId: string,
        public readonly firstName: string,
        public readonly lastName: string,
        public readonly email: string,
        public readonly contactNumber: string | null,
        public readonly countryCode: string,
        public readonly dateOfBirth: Date | null,
    ) {}

}
