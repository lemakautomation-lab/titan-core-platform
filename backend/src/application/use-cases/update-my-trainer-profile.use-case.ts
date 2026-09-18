import { Result } from "../common/result";
import { UpdateMyTrainerProfileCommand } from "../commands/update-my-trainer-profile.command";
import { TrainerProfileDto } from "../dto/trainer/trainer-profile.dto";
import { TrainerProfile } from "../../domain/entities/trainer-profile.entity";
import { TrainerProfileRepository } from "../../domain/repositories/trainer-profile.repository";
import { GetMyTrainerAccessUseCase } from "./get-my-trainer-access.use-case";

export class UpdateMyTrainerProfileUseCase {

    constructor(
        private readonly repository:
            TrainerProfileRepository,
        private readonly trainerAccess:
            GetMyTrainerAccessUseCase,
    ) {}

    async execute(
        command: UpdateMyTrainerProfileCommand,
    ): Promise<Result<TrainerProfileDto>> {

        try {
            const access =
                await this.trainerAccess.execute({
                    userId: command.userId,
                    tenantId: command.tenantId,
                });

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

            let profile =
                await this.repository.findByUserId(
                    command.userId,
                    command.tenantId,
                );

            if (!profile) {
                profile = TrainerProfile.create(
                    command.tenantId,
                    command.userId,
                    command.professionalTitle,
                    command.bio,
                    command.qualifications,
                    command.specialisations,
                    command.yearsExperience,
                    command.countryCode,
                    command.websiteUrl,
                );

                profile =
                    await this.repository.create(
                        profile,
                    );
            }
            else {
                profile.update(
                    command.professionalTitle,
                    command.bio,
                    command.qualifications,
                    command.specialisations,
                    command.yearsExperience,
                    command.countryCode,
                    command.websiteUrl,
                );

                profile =
                    await this.repository.update(
                        profile,
                    );
            }

            return Result.success({
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
            });
        }
        catch (error) {
            return Result.failure(
                error instanceof Error
                    ? error.message
                    : "Trainer profile could not be updated.",
            );
        }
    }

}
