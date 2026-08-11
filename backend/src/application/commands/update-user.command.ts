export class UpdateUserCommand {

    constructor(

        public readonly id: string,

        public readonly organisationId: string | null,

        public readonly email: string,

        public readonly password: string | null,

        public readonly firstName: string | null,

        public readonly lastName: string | null,

        public readonly tenantId: string,

    ) {}

}
