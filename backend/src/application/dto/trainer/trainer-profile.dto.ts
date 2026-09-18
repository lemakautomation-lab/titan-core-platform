export interface TrainerProfileDto {
    id: string;
    professionalTitle: string | null;
    bio: string | null;
    qualifications: string | null;
    specialisations: string | null;
    yearsExperience: number | null;
    countryCode: string | null;
    websiteUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}
