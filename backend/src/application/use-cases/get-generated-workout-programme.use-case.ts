import {
    GeneratedWorkoutProgrammeReadModel,
    GeneratedWorkoutProgrammeReadRepository,
} from "../ports/generated-workout-programme-read.repository";
import { GetGeneratedWorkoutProgrammeQuery } from "../queries/workout-programme/get-generated-workout-programme.query";
import { Result } from "../common/result";
import { UseCase } from "../common/use-case.interface";

export class GetGeneratedWorkoutProgrammeUseCase
implements UseCase<
    GetGeneratedWorkoutProgrammeQuery,
    Result<GeneratedWorkoutProgrammeReadModel>
> {
    constructor(
        private readonly repository: GeneratedWorkoutProgrammeReadRepository,
    ) {}

    async execute(
        query: GetGeneratedWorkoutProgrammeQuery,
    ): Promise<Result<GeneratedWorkoutProgrammeReadModel>> {
        const generated = await this.repository.findCompleteByGenerationId(
            query.generationId,
            query.tenantId,
        );
        if (!generated) {
            return Result.failure("Generated Workout Programme not found.");
        }
        return Result.success(generated);
    }
}
