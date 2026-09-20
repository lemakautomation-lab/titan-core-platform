import { Result } from "../common/result";
import { CoachSquadRepository } from "../../domain/repositories/coach-squad.repository";
import { CoachSquadAthleteRepository } from "../../domain/repositories/coach-squad-athlete.repository";
import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";

export class AddCoachSquadAthleteUseCase {
    constructor(
        private readonly squadRepository: CoachSquadRepository,
        private readonly membershipRepository: CoachSquadAthleteRepository,
        private readonly athleteRepository: AthleteRepository,
        private readonly relationshipRepository: AthleteRelationshipRepository,
    ) {}

    async execute(input: {
        tenantId: string;
        userId: string;
        squadId: string;
        athleteId: string;
    }): Promise<Result<{
        squadId: string;
        athleteId: string;
    }>> {
        const squad =
            await this.squadRepository.findById(
                input.squadId,
                input.tenantId,
                input.userId,
            );

        if (!squad) {
            return Result.failure("Coach squad not found.");
        }

        const athlete =
            await this.athleteRepository.findById(
                input.athleteId,
                input.tenantId,
            );

        if (!athlete) {
            return Result.failure("Athlete not found.");
        }

        const relationship =
            await this.relationshipRepository.findByAthleteAndRelatedEntity(
                input.athleteId,
                input.userId,
                AthleteRelationshipType.COACH,
                input.tenantId,
            );

        if (!relationship || !relationship.isActive()) {
            return Result.failure(
                "Active Coach athlete relationship is required.",
            );
        }

        const existing =
            await this.membershipRepository.find(
                input.tenantId,
                input.squadId,
                input.athleteId,
            );

        if (existing) {
            return Result.failure(
                "Athlete is already a member of this squad.",
            );
        }

        await this.membershipRepository.add(
            input.tenantId,
            input.squadId,
            input.athleteId,
        );

        return Result.success({
            squadId: input.squadId,
            athleteId: input.athleteId,
        });
    }
}
