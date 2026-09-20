import { CreateWorkoutProgrammeCommand } from "../commands/create-workout-programme.command";
import { WorkoutProgrammeDto } from "../dto/workout-programme/workout-programme.dto";
import { Result } from "../common/result";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";
import { CreateWorkoutProgrammeUseCase } from "./create-workout-programme.use-case";

export class CreateCoachWorkoutProgrammeUseCase {
    constructor(
        private readonly relationshipRepository:
            AthleteRelationshipRepository,
        private readonly createWorkoutProgramme:
            CreateWorkoutProgrammeUseCase,
    ) {}

    async execute(
        command: CreateWorkoutProgrammeCommand,
    ): Promise<Result<WorkoutProgrammeDto>> {
        const relationship =
            await this.relationshipRepository.findByAthleteAndRelatedEntity(
                command.athleteId,
                command.userId,
                AthleteRelationshipType.COACH,
                command.tenantId,
            );

        if (!relationship || !relationship.isActive()) {
            return Result.failure(
                "Active Coach athlete relationship is required.",
            );
        }

        return this.createWorkoutProgramme.execute(command);
    }
}