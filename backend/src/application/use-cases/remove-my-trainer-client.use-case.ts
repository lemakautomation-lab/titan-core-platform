import { Result } from "../common/result";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";
import { GetMyTrainerAccessUseCase } from "./get-my-trainer-access.use-case";
import { RemoveMyTrainerClientCommand } from "../commands/remove-my-trainer-client.command";

export class RemoveMyTrainerClientUseCase {
    constructor(
        private readonly relationshipRepository: AthleteRelationshipRepository,
        private readonly trainerAccess: GetMyTrainerAccessUseCase,
    ) {}

    async execute(
        command: Readonly<RemoveMyTrainerClientCommand>,
    ): Promise<Result<void>> {
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

        const relationship =
            await this.relationshipRepository.findByAthleteAndRelatedEntity(
                command.athleteId,
                command.userId,
                AthleteRelationshipType.TRAINER,
                command.tenantId,
            );

        if (!relationship || !relationship.isActive()) {
            return Result.failure("Trainer client relationship not found.");
        }

        relationship.end();

        await this.relationshipRepository.update(
            relationship,
            command.tenantId,
        );

        return Result.success(undefined);
    }
}
