import { Result } from "../common/result";
import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { AthleteRelationship } from "../../domain/entities/athlete-relationship.entity";
import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";
import { AddMyCoachAthleteCommand } from "../commands/add-my-coach-athlete.command";

export class AddMyCoachAthleteUseCase {
    constructor(
        private readonly relationshipRepository: AthleteRelationshipRepository,
        private readonly athleteRepository: AthleteRepository,
    ) {}

    async execute(
        command: Readonly<AddMyCoachAthleteCommand>,
    ): Promise<Result<string>> {
        const athlete = await this.athleteRepository.findById(
            command.athleteId,
            command.tenantId,
        );

        if (!athlete) {
            return Result.failure("Athlete not found.");
        }

        const existing =
            await this.relationshipRepository.findByAthleteAndRelatedEntity(
                command.athleteId,
                command.userId,
                AthleteRelationshipType.COACH,
                command.tenantId,
            );

        if (existing) {
            if (!existing.isActive()) {
                existing.activate();

                const updated =
                    await this.relationshipRepository.update(
                        existing,
                        command.tenantId,
                    );

                return Result.success(updated.id);
            }

            return Result.failure(
                "Athlete is already managed by this coach.",
            );
        }

        const relationship = AthleteRelationship.create(
            command.tenantId,
            command.athleteId,
            AthleteRelationshipType.COACH,
            command.userId,
            new Date(),
        );

        const created =
            await this.relationshipRepository.create(
                relationship,
            );

        return Result.success(created.id);
    }
}
