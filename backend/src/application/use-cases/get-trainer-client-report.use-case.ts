import { Result } from "../common/result";
import { TrainerClientReportDto } from "../dto/trainer/trainer-client-report.dto";
import { GetTrainerClientReportQuery } from "../queries/trainer/get-trainer-client-report.query";
import { GetTrainerClientMonitoringUseCase } from "./get-trainer-client-monitoring.use-case";

export class GetTrainerClientReportUseCase {
    constructor(
        private readonly monitoring: GetTrainerClientMonitoringUseCase,
    ) {}

    async execute(
        query: Readonly<GetTrainerClientReportQuery>,
    ): Promise<Result<TrainerClientReportDto>> {
        const result = await this.monitoring.execute(query);

        if (!result.isSuccess || !result.value) {
            return Result.failure(
                result.error ?? "Client monitoring could not be loaded.",
            );
        }

        const monitoring = result.value;

        return Result.success({
            athleteId: monitoring.athleteId,
            generatedAt: new Date().toISOString(),
            summary: {
                metricCount: monitoring.performance.length,
                recoveryObservationCount: monitoring.recovery.length,
                trainingStressObservationCount:
                    monitoring.trainingStress.length,
                workoutProgrammeCount:
                    monitoring.workoutProgrammes.length,
            },
            performance: monitoring.performance.map(item => ({
                metric: item.metric,
                latestMeasurement:
                    item.measurements[0] ?? null,
                previousMeasurement:
                    item.measurements[1] ?? null,
                measurementCount:
                    item.measurements.length,
            })),
            recovery: monitoring.recovery,
            trainingStress: monitoring.trainingStress,
            workoutProgrammes: monitoring.workoutProgrammes,
        });
    }
}
