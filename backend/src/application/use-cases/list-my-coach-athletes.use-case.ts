import { Result } from "../common/result";
import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";
import { CoachAthleteDto } from "../dto/coach/coach-athlete.dto";
import { ListMyCoachAthletesQuery } from "../queries/coach/list-my-coach-athletes.query";

export class ListMyCoachAthletesUseCase {
    constructor(
        private readonly relationshipRepository: AthleteRelationshipRepository,
        private readonly athleteRepository: AthleteRepository,
    ) {}

    async execute(
        query: Readonly<ListMyCoachAthletesQuery>,
    ): Promise<Result<CoachAthleteDto[]>> {
        const relationships =
            await this.relationshipRepository.findAllByRelatedEntity(
                query.userId,
                AthleteRelationshipType.COACH,
                query.tenantId,
            );

        const athletes: CoachAthleteDto[] = [];

        for (const relationship of relationships) {
            if (!relationship.isActive()) {
                continue;
            }

            const athlete =
                await this.athleteRepository.findById(
                    relationship.athleteId,
                    query.tenantId,
                );

            if (!athlete) {
                continue;
            }

            athletes.push({
                athleteId: athlete.id,
                firstName: athlete.firstName,
                lastName: athlete.lastName,
                countryCode: athlete.countryCode,
                status: athlete.status,
                relationshipId: relationship.id,
                relationshipStatus: relationship.status,
                startsAt: relationship.startsAt,
                endsAt: relationship.endsAt,
            });
        }

        return Result.success(athletes);
    }
}
