export class RegisterAthleteCommand {
    constructor(
        public readonly firstName: string,
        public readonly lastName: string,
        public readonly email: string,
        public readonly password: string,
        public readonly countryCode: string,
        public readonly dateOfBirth: Date,
    ) {}
}