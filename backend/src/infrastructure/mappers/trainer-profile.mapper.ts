import { TrainerProfile as PrismaTrainerProfile } from "../../generated/prisma/client";
import { TrainerProfile } from "../../domain/entities/trainer-profile.entity";

export class TrainerProfileMapper {

    static toDomain(
        prisma: PrismaTrainerProfile,
    ): TrainerProfile {

        return new TrainerProfile(
            prisma.id,
            prisma.tenantId,
            prisma.userId,
            prisma.professionalTitle,
            prisma.bio,
            prisma.qualifications,
            prisma.specialisations,
            prisma.yearsExperience,
            prisma.countryCode,
            prisma.websiteUrl,
            prisma.createdAt,
            prisma.updatedAt,
        );
    }

    static toPersistence(
        profile: TrainerProfile,
    ) {

        return {
            id: profile.id,
            tenantId: profile.tenantId,
            userId: profile.userId,
            professionalTitle:
                profile.professionalTitle,
            bio: profile.bio,
            qualifications:
                profile.qualifications,
            specialisations:
                profile.specialisations,
            yearsExperience:
                profile.yearsExperience,
            countryCode:
                profile.countryCode,
            websiteUrl:
                profile.websiteUrl,
            updatedAt:
                profile.updatedAt,
        };
    }

}
