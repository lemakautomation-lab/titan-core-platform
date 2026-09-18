import { Result } from "../common/result";
import { TrainerProfileDto } from "../dto/trainer/trainer-profile.dto";
import { TrainerProfileRepository } from "../../domain/repositories/trainer-profile.repository";
import { GetMyTrainerAccessUseCase } from "./get-my-trainer-access.use-case";

export interface GetMyTrainerProfileQuery {
    userId: string;
    tenantId: string;
}

export class GetMyTrainerProfileUseCase {

    constructor(
        private readonly repository:
            TrainerProfileRepository,
        private readonly trainerAccess:
            GetMyTrainerAccessUseCase,
    ) {}

    async execute(
        query: Readonly<GetMyTrainerProfileQuery>,
    ): Promise<Result<TrainerProfileDto | null>> {

        const access =
            await this.trainerAccess.execute(query);

        if (!access.isSuccess) {
            return Result.failure(
                access.error ??
                "Trainer access could not be determined.",
            );
        }

        if (!access.value?.accessGranted) {
            return Result.failure(
                "Active Trainer access is required.",
            );
        }

        const profile =
            await this.repository.findByUserId(
                query.userId,
                query.tenantId,
            );

        return Result.success(
            profile
                ? {
                    id: profile.id,
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
                    createdAt:
                        profile.createdAt,
                    updatedAt:
                        profile.updatedAt,
                }
                : null,
        );
    }

}
