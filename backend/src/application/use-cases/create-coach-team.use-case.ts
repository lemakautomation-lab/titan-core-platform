import { Result } from "../common/result";
import { CreateCoachTeamCommand } from "../commands/create-coach-team.command";
import { CoachTeamDto, toCoachTeamDto } from "../dto/coach/coach-team.dto";
import { CoachTeam } from "../../domain/entities/coach-team.entity";
import { CoachTeamRepository } from "../../domain/repositories/coach-team.repository";

export class CreateCoachTeamUseCase {
    constructor(
        private readonly repository: CoachTeamRepository,
    ) {}

    async execute(
        command: Readonly<CreateCoachTeamCommand>,
    ): Promise<Result<CoachTeamDto>> {
        try {
            const squad = CoachTeam.create(
                command.tenantId,
                command.coachUserId,
                command.name,
                command.description ?? null,
            );

            const created =
                await this.repository.create(squad);

            return Result.success(
                toCoachTeamDto(created),
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