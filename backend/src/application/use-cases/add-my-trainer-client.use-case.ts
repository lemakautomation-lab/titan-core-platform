import { Result } from "../common/result";
import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { AthleteRelationship } from "../../domain/entities/athlete-relationship.entity";
import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";
import { GetMyTrainerAccessUseCase } from "./get-my-trainer-access.use-case";
import { AddMyTrainerClientCommand } from "../commands/add-my-trainer-client.command";

export class AddMyTrainerClientUseCase {
    constructor(
        private readonly relationshipRepository: AthleteRelationshipRepository,
        private readonly athleteRepository: AthleteRepository,
        private readonly trainerAccess: GetMyTrainerAccessUseCase,
    ) {}

    async execute(
        command: Readonly<AddMyTrainerClientCommand>,
    ): Promise<Result<string>> {
        const access = await this.trainerAccess.execute({
            userId: command.userId,
            tenantId: command.tenantId,
        });

        if (!access.isSuccess) {
            return Result.failure(access.error ?? "Trainer access could not be determined.");
        }

        if (
            !access.value ||
            !access.value.accessGranted
        ) {
            return Result.failure(
                "Active Trainer access is required.",
            );
        }

        const athlete =
            await this.athleteRepository.findById(
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
                AthleteRelationshipType.TRAINER,
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

            return Result.failure("Athlete is already a client.");
        }

        const relationship =
            AthleteRelationship.create(
                command.tenantId,
                command.athleteId,
                AthleteRelationshipType.TRAINER,
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
