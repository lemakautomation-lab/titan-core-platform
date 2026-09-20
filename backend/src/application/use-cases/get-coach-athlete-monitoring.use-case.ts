import { Result } from "../common/result";
import { GetTrainerClientMonitoringQuery } from "../queries/trainer/get-trainer-client-monitoring.query";
import {
    TrainerClientMonitoringDto,
    TrainerClientMonitoringObservationDto,
} from "../dto/trainer/trainer-client-monitoring.dto";
import { PerformanceMetricMapper } from "../mappers/performance-metric.mapper";
import { PerformanceMeasurementMapper } from "../mappers/performance-measurement.mapper";
import { WorkoutProgrammeApplicationMapper } from "../mappers/workout-programme.mapper";

import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { PerformanceMetricRepository } from "../../domain/repositories/performance-metric.repository";
import { PerformanceMeasurementRepository } from "../../domain/repositories/performance-measurement/performance-measurement.repository";
import { RecoveryTrackingRepository } from "../../domain/repositories/recovery-tracking/recovery-tracking.repository";
import { TrainingStressRepository } from "../../domain/repositories/training-stress.repository";
import { WorkoutProgrammeRepository } from "../../domain/repositories/workout-programme.repository";

import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";
import { RecoveryTracking } from "../../domain/entities/recovery-tracking/recovery-tracking.entity";
import { TrainingStress } from "../../domain/entities/training-stress.entity";


export class GetCoachAthleteMonitoringUseCase {
    constructor(
        private readonly athleteRepository: AthleteRepository,
        private readonly relationshipRepository: AthleteRelationshipRepository,
        private readonly performanceMetricRepository: PerformanceMetricRepository,
        private readonly performanceMeasurementRepository: PerformanceMeasurementRepository,
        private readonly recoveryTrackingRepository: RecoveryTrackingRepository,
        private readonly trainingStressRepository: TrainingStressRepository,
        private readonly workoutProgrammeRepository: WorkoutProgrammeRepository,
    ) {}

    async execute(
        query: Readonly<GetTrainerClientMonitoringQuery>,
    ): Promise<Result<TrainerClientMonitoringDto>> {
        if (
            !Number.isInteger(query.limit) ||
            query.limit < 1 ||
            query.limit > 100
        ) {
            return Result.failure(
                "Monitoring limit must be an integer between 1 and 100.",
            );
        }

        const athlete =
            await this.athleteRepository.findById(
                query.athleteId,
                query.tenantId,
            );

        if (!athlete) {
            return Result.failure(
                "Athlete not found.",
            );
        }

        const relationship =
            await this.relationshipRepository.findByAthleteAndRelatedEntity(
                query.athleteId,
                query.userId,
                AthleteRelationshipType.COACH,
                query.tenantId,
            );

        if (!relationship || !relationship.isActive()) {
            return Result.failure(
                "Active Coach athlete relationship is required.",
            );
        }

        const [
            metrics,
            recovery,
            trainingStress,
            workoutProgrammes,
        ] = await Promise.all([
            this.performanceMetricRepository.findAllByAthleteId(
                query.athleteId,
                query.tenantId,
            ),
            this.recoveryTrackingRepository.listRecentForAthlete(
                query.tenantId,
                query.athleteId,
                query.limit,
            ),
            this.trainingStressRepository.listRecentForAthlete(
                query.tenantId,
                query.athleteId,
                query.limit,
            ),
            this.workoutProgrammeRepository.findAllByAthleteId(
                query.athleteId,
                query.tenantId,
            ),
        ]);

        const performance = await Promise.all(
            metrics.map(async metric => {
                const measurements =
                    await this.performanceMeasurementRepository
                        .listRecentEffectiveForMetric(
                            query.tenantId,
                            query.athleteId,
                            metric.id,
                            query.limit,
                        );

                return {
                    metric: PerformanceMetricMapper.toDto(metric),
                    measurements:
                        measurements.map(
                            PerformanceMeasurementMapper.toDto,
                        ),
                };
            }),
        );

        return Result.success({
            athleteId: query.athleteId,
            performance,
            recovery:
                recovery.map(
                    this.mapObservation,
                ),
            trainingStress:
                trainingStress.map(
                    this.mapObservation,
                ),
            workoutProgrammes:
                workoutProgrammes.map(
                    WorkoutProgrammeApplicationMapper.toDto,
                ),
        });
    }

    private readonly mapObservation = (
        observation: RecoveryTracking | TrainingStress,
    ): TrainerClientMonitoringObservationDto => ({
        id: observation.id,
        athleteId: observation.athleteId,
        value: observation.value,
        recordedAt: observation.recordedAt.toISOString(),
        createdAt: observation.createdAt.toISOString(),
        sourceType: observation.sourceType,
        sourceId: observation.sourceId,
        sourceObservationId: observation.sourceObservationId,
    });
}
