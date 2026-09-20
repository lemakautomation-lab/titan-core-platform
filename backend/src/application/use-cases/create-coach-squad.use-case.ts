import { Result } from "../common/result";
import { CreateCoachSquadCommand } from "../commands/create-coach-squad.command";
import { CoachSquadDto, toCoachSquadDto } from "../dto/coach/coach-squad.dto";
import { CoachSquad } from "../../domain/entities/coach-squad.entity";
import { CoachSquadRepository } from "../../domain/repositories/coach-squad.repository";

export class CreateCoachSquadUseCase {
    constructor(
        private readonly repository: CoachSquadRepository,
    ) {}

    async execute(
        command: Readonly<CreateCoachSquadCommand>,
    ): Promise<Result<CoachSquadDto>> {
        try {
            const squad = CoachSquad.create(
                command.tenantId,
                command.coachUserId,
                command.name,
                command.description ?? null,
            );

            const created =
                await this.repository.create(squad);

            return Result.success(
                toCoachSquadDto(created),
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