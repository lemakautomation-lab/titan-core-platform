import { Result } from "../common/result";
import { UpdateCoachTeamCommand } from "../commands/update-coach-team.command";
import { CoachTeamDto, toCoachTeamDto } from "../dto/coach/coach-team.dto";
import { CoachTeamRepository } from "../../domain/repositories/coach-team.repository";

export class UpdateCoachTeamUseCase {
    constructor(
        private readonly repository: CoachTeamRepository,
    ) {}

    async execute(
        command: Readonly<UpdateCoachTeamCommand>,
    ): Promise<Result<CoachTeamDto>> {
        const squad =
            await this.repository.findById(
                command.id,
                command.tenantId,
                command.coachUserId,
            );

        if (!squad) {
            return Result.failure(
                "Coach team not found.",
            );
        }

        try {
            squad.updateDetails(
                command.name,
                command.description ?? null,
            );

            const updated =
                await this.repository.update(squad);

            return Result.success(
                toCoachTeamDto(updated),
            );
        } catch (error) {
            return Result.failure(
                error instanceof Error
                    ? error.message
                    : "Coach team details are invalid.",
            );
        }
    }
}