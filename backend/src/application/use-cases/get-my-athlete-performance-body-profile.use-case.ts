import { Result } from "../common/result";
import { AthletePerformanceBodyProfileDto } from "../dto/athlete/athlete-performance-body-profile.dto";
import { AthletePerformanceBodyProfileQuery } from "../ports/athlete-performance-body-profile.query";

export interface GetMyAthletePerformanceBodyProfileQuery {
    userId: string;
    tenantId: string;
}

export class GetMyAthletePerformanceBodyProfileUseCase {
    constructor(
        private readonly query:
            AthletePerformanceBodyProfileQuery,
    ) {}

    async execute(
        input:
            Readonly<GetMyAthletePerformanceBodyProfileQuery>,
    ): Promise<Result<AthletePerformanceBodyProfileDto>> {
        try {
            return Result.success(
                await this.query.execute(
                    Object.freeze({
                        userId: input.userId,
                        tenantId: input.tenantId,
                    }),
                ),
            );
        }
        catch (error) {
            return Result.failure(
                error instanceof Error
                    ? error.message
                    : "Performance body profile could not be loaded.",
            );
        }
    }
}