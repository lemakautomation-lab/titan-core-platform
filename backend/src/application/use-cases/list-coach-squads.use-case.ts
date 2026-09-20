import { Result } from "../common/result";
import { CoachSquadDto, toCoachSquadDto } from "../dto/coach/coach-squad.dto";
import { ListCoachSquadsQuery } from "../queries/coach/list-coach-squads.query";
import { CoachSquadRepository } from "../../domain/repositories/coach-squad.repository";

export class ListCoachSquadsUseCase {
    constructor(
        private readonly repository: CoachSquadRepository,
    ) {}

    async execute(
        query: Readonly<ListCoachSquadsQuery>,
    ): Promise<Result<CoachSquadDto[]>> {
        const squads =
            await this.repository.listForCoach(
                query.tenantId,
                query.coachUserId,
            );

        return Result.success(
            squads.map(toCoachSquadDto),
        );
    }
}