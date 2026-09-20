import { Result } from "../common/result";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";
import { RemoveMyCoachAthleteCommand } from "../commands/remove-my-coach-athlete.command";

export class RemoveMyCoachAthleteUseCase {
    constructor(
        private readonly relationshipRepository: AthleteRelationshipRepository,
    ) {}

    async execute(
        command: Readonly<RemoveMyCoachAthleteCommand>,
    ): Promise<Result<void>> {
        const relationship =
            await this.relationshipRepository.findByAthleteAndRelatedEntity(
                command.athleteId,
                command.userId,
                AthleteRelationshipType.COACH,
                command.tenantId,
            );

        if (!relationship || !relationship.isActive()) {
            return Result.failure(
                "Coach athlete relationship not found.",
            );
        }

        relationship.end();

        await this.relationshipRepository.update(
            relationship,
            command.tenantId,
        );

        return Result.success(undefined);
    }
}
