import { GetGeneratedWorkoutProgrammeQuery } from "../../application/queries/workout-programme/get-generated-workout-programme.query";
import { HttpException } from "../../shared/exceptions/http.exception";

export class GetGeneratedWorkoutProgrammeRequestDto {
    static toQuery(
        generationId: unknown,
        tenantId: unknown,
    ): GetGeneratedWorkoutProgrammeQuery {
        try {
            return new GetGeneratedWorkoutProgrammeQuery(
                generationId,
                tenantId,
            );
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : "Validation failed.",
                400,
                "VALIDATION_ERROR",
            );
        }
    }
}
