import { Result } from "../common/result";
import { UpdateCoachSquadCommand } from "../commands/update-coach-squad.command";
import { CoachSquadDto, toCoachSquadDto } from "../dto/coach/coach-squad.dto";
import { CoachSquadRepository } from "../../domain/repositories/coach-squad.repository";

export class UpdateCoachSquadUseCase {
    constructor(
        private readonly repository: CoachSquadRepository,
    ) {}

    async execute(
        command: Readonly<UpdateCoachSquadCommand>,
    ): Promise<Result<CoachSquadDto>> {
        const squad =
            await this.repository.findById(
                command.id,
                command.tenantId,
                command.coachUserId,
            );

        if (!squad) {
            return Result.failure(
                "Coach squad not found.",
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
                toCoachSquadDto(updated),
            );
        } catch (error) {
            return Result.failure(
                error instanceof Error
                    ? error.message
                    : "Coach squad details are invalid.",
            );
        }
    }
}