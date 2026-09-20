import { Result } from "../common/result";
import { CoachTeamDto, toCoachTeamDto } from "../dto/coach/coach-team.dto";
import { ListCoachTeamsQuery } from "../queries/coach/list-coach-teams.query";
import { CoachTeamRepository } from "../../domain/repositories/coach-team.repository";

export class ListCoachTeamsUseCase {
    constructor(
        private readonly repository: CoachTeamRepository,
    ) {}

    async execute(
        query: Readonly<ListCoachTeamsQuery>,
    ): Promise<Result<CoachTeamDto[]>> {
        const squads =
            await this.repository.listForCoach(
                query.tenantId,
                query.coachUserId,
            );

        return Result.success(
            squads.map(toCoachTeamDto),
        );
    }
}