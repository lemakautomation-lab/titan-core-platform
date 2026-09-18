export class UpdateMyTrainerProfileCommand {

    constructor(
        public readonly userId: string,
        public readonly tenantId: string,
        public readonly professionalTitle: string | null,
        public readonly bio: string | null,
        public readonly qualifications: string | null,
        public readonly specialisations: string | null,
        public readonly yearsExperience: number | null,
        public readonly countryCode: string | null,
        public readonly websiteUrl: string | null,
    ) {}

}
