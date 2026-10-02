import { Result } from "../common/result";
import { ListCoachSquadsQuery } from "../queries/coach/list-coach-squads.query";
import { ListCoachTeamsQuery } from "../queries/coach/list-coach-teams.query";
import { ListMyCoachAthletesQuery } from "../queries/coach/list-my-coach-athletes.query";
import type { ListCoachSquadsUseCase } from "./list-coach-squads.use-case";
import type { ListCoachTeamsUseCase } from "./list-coach-teams.use-case";
import type { ListMyCoachAthletesUseCase } from "./list-my-coach-athletes.use-case";

export interface AiCoachContextDto {
    accessMode: "COACH_PORTFOLIO";
    athleteCount: number;
    squadCount: number;
    teamCount: number;
    athletes: Array<{
        athleteId: string;
        firstName: string;
        lastName: string;
        countryCode: string | null;
        status: string;
    }>;
    squads: Array<{
        id: string;
        name: string;
        status: string;
    }>;
    teams: Array<{
        id: string;
        name: string;
        status: string;
    }>;
}

export class GetAiCoachContextUseCase {
    constructor(
        private readonly athletes:
            Pick<ListMyCoachAthletesUseCase, "execute">,
        private readonly squads:
            Pick<ListCoachSquadsUseCase, "execute">,
        private readonly teams:
            Pick<ListCoachTeamsUseCase, "execute">,
    ) {}

    async execute(input: Readonly<{
        tenantId: string;
        userId: string;
    }>): Promise<Result<AiCoachContextDto>> {
        const [
            athleteResult,
            squadResult,
            teamResult,
        ] = await Promise.all([
            this.athletes.execute(
                new ListMyCoachAthletesQuery(
                    input.tenantId,
                    input.userId,
                ),
            ),
            this.squads.execute(
                new ListCoachSquadsQuery(
                    input.tenantId,
                    input.userId,
                ),
            ),
            this.teams.execute(
                new ListCoachTeamsQuery(
                    input.tenantId,
                    input.userId,
                ),
            ),
        ]);

        if (
            !athleteResult.isSuccess ||
            !athleteResult.value
        ) {
            return Result.failure(
                athleteResult.error ??
                "Coach athlete context could not be loaded.",
            );
        }

        if (
            !squadResult.isSuccess ||
            !squadResult.value
        ) {
            return Result.failure(
                squadResult.error ??
                "Coach squad context could not be loaded.",
            );
        }

        if (
            !teamResult.isSuccess ||
            !teamResult.value
        ) {
            return Result.failure(
                teamResult.error ??
                "Coach team context could not be loaded.",
            );
        }

        const athletes = athleteResult.value
            .filter(
                athlete =>
                    String(athlete.status) === "ACTIVE" &&
                    String(athlete.relationshipStatus) === "ACTIVE",
            )
            .map(athlete => ({
                athleteId: athlete.athleteId,
                firstName: athlete.firstName,
                lastName: athlete.lastName,
                countryCode: athlete.countryCode,
                status: String(athlete.status),
            }));

        const squads = squadResult.value
            .filter(squad => squad.status === "ACTIVE")
            .map(squad => ({
                id: squad.id,
                name: squad.name,
                status: squad.status,
            }));

        const teams = teamResult.value
            .filter(team => team.status === "ACTIVE")
            .map(team => ({
                id: team.id,
                name: team.name,
                status: team.status,
            }));

        return Result.success({
            accessMode: "COACH_PORTFOLIO",
            athleteCount: athletes.length,
            squadCount: squads.length,
            teamCount: teams.length,
            athletes,
            squads,
            teams,
        });
    }
}
