export class CreateUserCommand {

    constructor(

        public readonly tenantId: string,

        public readonly organisationId: string | null,

        public readonly email: string,

        public readonly password: string,

        public readonly firstName: string | null,

        public readonly lastName: string | null,

    ) {}

}
