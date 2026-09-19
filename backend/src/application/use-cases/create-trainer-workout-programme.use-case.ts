import { CreateWorkoutProgrammeCommand } from "../commands/create-workout-programme.command";
import { WorkoutProgrammeDto } from "../dto/workout-programme/workout-programme.dto";
import { Result } from "../common/result";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";
import { GetMyTrainerAccessUseCase } from "./get-my-trainer-access.use-case";
import { CreateWorkoutProgrammeUseCase } from "./create-workout-programme.use-case";

export class CreateTrainerWorkoutProgrammeUseCase {
    constructor(
        private readonly relationshipRepository:
            AthleteRelationshipRepository,
        private readonly trainerAccess:
            GetMyTrainerAccessUseCase,
        private readonly createWorkoutProgramme:
            CreateWorkoutProgrammeUseCase,
    ) {}

    async execute(
        command: CreateWorkoutProgrammeCommand,
    ): Promise<Result<WorkoutProgrammeDto>> {
        const access = await this.trainerAccess.execute({
            userId: command.userId,
            tenantId: command.tenantId,
        });

        if (!access.isSuccess || !access.value?.accessGranted) {
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
            return Result.failure(
                "Active Trainer client relationship is required.",
            );
        }

        return this.createWorkoutProgramme.execute(command);
    }
}
