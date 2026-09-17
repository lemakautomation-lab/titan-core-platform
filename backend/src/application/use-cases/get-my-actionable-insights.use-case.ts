import { Result } from "../common/result";
import {
    ActionableInsightsDto,
    ActionableInsightDto,
} from "../dto/athlete/actionable-insights.dto";
import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { PerformanceMetricRepository } from "../../domain/repositories/performance-metric.repository";
import { PerformanceMeasurementRepository } from "../../domain/repositories/performance-measurement/performance-measurement.repository";

export interface GetMyActionableInsightsQuery {
    userId: string;
    tenantId: string;
}

export class GetMyActionableInsightsUseCase {
    constructor(
        private readonly athleteRepository: AthleteRepository,
        private readonly metricRepository: PerformanceMetricRepository,
        private readonly measurementRepository: PerformanceMeasurementRepository,
    ) {}

    async execute(
        input: Readonly<GetMyActionableInsightsQuery>,
    ): Promise<Result<ActionableInsightsDto>> {
        try {
            const athlete =
                await this.athleteRepository.findByUserId(
                    input.userId,
                    input.tenantId,
                );

            if (!athlete) {
                return Result.failure("Athlete not found.");
            }

            const metrics =
                await this.metricRepository.findAllByAthleteId(
                    athlete.id,
                    input.tenantId,
                );

            const insights: ActionableInsightDto[] = [];

            for (const metric of metrics) {
                const measurements =
                    await this.measurementRepository
                        .listRecentEffectiveForMetric(
                            input.tenantId,
                            athlete.id,
                            metric.id,
                            2,
                        );

                if (measurements.length === 0) {
                    insights.push({
                        type: "RECORD_MEASUREMENT",
                        metricId: metric.id,
                        metricName: metric.name,
                        message:
                            "Record a performance measurement.",
                    });
                    continue;
                }

                if (measurements.length < 2) {
                    insights.push({
                        type: "ESTABLISH_COMPARISON",
                        metricId: metric.id,
                        metricName: metric.name,
                        message:
                            "Record another performance measurement to establish a comparison.",
                    });
                    continue;
                }

                insights.push({
                    type: "REVIEW_SIGNAL",
                    metricId: metric.id,
                    metricName: metric.name,
                    message:
                        "Recent performance measurements are available for review.",
                });
            }
            return Result.success({ insights });
        } catch (error) {
            return Result.failure(
                error instanceof Error
                    ? error.message
                    : "Actionable insights could not be loaded.",
            );
        }
    }
}
