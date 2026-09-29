import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";

export class AuthoriseAthleteTrendVisibilityUseCase {
    constructor(
        private readonly athletes: AthleteRepository,
        private readonly relationships: AthleteRelationshipRepository,
    ) {}

    async execute(input: { tenantId: string; userId: string; athleteId: string }): Promise<boolean> {
        const athlete = await this.athletes.findById(input.athleteId, input.tenantId);
        if (!athlete) return false;
        if (athlete.userId === input.userId) return true;
        for (const type of [AthleteRelationshipType.TRAINER, AthleteRelationshipType.COACH,
            AthleteRelationshipType.PERFORMANCE_PROFESSIONAL]) {
            const relationship = await this.relationships.findByAthleteAndRelatedEntity(
                input.athleteId, input.userId, type, input.tenantId,
            );
            if (relationship?.isActive()) return true;
        }
        return false;
    }
}
