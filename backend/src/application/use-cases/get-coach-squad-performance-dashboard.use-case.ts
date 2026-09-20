import { Result } from "../common/result";
import { CoachSquadRepository } from "../../domain/repositories/coach-squad.repository";
import { CoachSquadAthleteRepository } from "../../domain/repositories/coach-squad-athlete.repository";
import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { PerformanceMetricRepository } from "../../domain/repositories/performance-metric.repository";
import { PerformanceMeasurementRepository } from "../../domain/repositories/performance-measurement/performance-measurement.repository";
import { RecoveryTrackingRepository } from "../../domain/repositories/recovery-tracking/recovery-tracking.repository";
import { TrainingStressRepository } from "../../domain/repositories/training-stress.repository";
import { WorkoutProgrammeRepository } from "../../domain/repositories/workout-programme.repository";
import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";

export class GetCoachSquadPerformanceDashboardUseCase {
    constructor(
        private readonly squadRepository: CoachSquadRepository,
        private readonly membershipRepository: CoachSquadAthleteRepository,
        private readonly athleteRepository: AthleteRepository,
        private readonly relationshipRepository: AthleteRelationshipRepository,
        private readonly performanceMetricRepository: PerformanceMetricRepository,
        private readonly performanceMeasurementRepository: PerformanceMeasurementRepository,
        private readonly recoveryTrackingRepository: RecoveryTrackingRepository,
        private readonly trainingStressRepository: TrainingStressRepository,
        private readonly workoutProgrammeRepository: WorkoutProgrammeRepository,
    ) {}

    async execute(input: {
        tenantId: string;
        userId: string;
        squadId: string;
        limit: number;
    }): Promise<Result<{
        squadId: string;
        squadName: string;
        memberCount: number;
        athletes: Array<{
            athleteId: string;
            firstName: string;
            lastName: string;
            performanceMetricCount: number;
            performanceMeasurementCount: number;
            latestRecovery: {
                value: number;
                recordedAt: string;
            } | null;
            latestTrainingStress: {
                value: number;
                recordedAt: string;
            } | null;
            workoutProgrammeCount: number;
        }>;
    }>> {
        if (
            !Number.isInteger(input.limit) ||
            input.limit < 1 ||
            input.limit > 100
        ) {
            return Result.failure(
                "Dashboard limit must be an integer between 1 and 100.",
            );
        }

        const squad =
            await this.squadRepository.findById(
                input.squadId,
                input.tenantId,
                input.userId,
            );

        if (!squad) {
            return Result.failure("Coach squad not found.");
        }

        const memberships =
            await this.membershipRepository.listForSquad(
                input.tenantId,
                input.squadId,
            );

        const athletes = [];

        for (const membership of memberships) {
            const athlete =
                await this.athleteRepository.findById(
                    membership.athleteId,
                    input.tenantId,
                );

            if (!athlete) {
                continue;
            }

            const relationship =
                await this.relationshipRepository
                    .findByAthleteAndRelatedEntity(
                        athlete.id,
                        input.userId,
                        AthleteRelationshipType.COACH,
                        input.tenantId,
                    );

            if (!relationship || !relationship.isActive()) {
                continue;
            }

            const [
                metrics,
                recovery,
                trainingStress,
                programmes,
            ] = await Promise.all([
                this.performanceMetricRepository.findAllByAthleteId(
                    athlete.id,
                    input.tenantId,
                ),
                this.recoveryTrackingRepository.listRecentForAthlete(
                    input.tenantId,
                    athlete.id,
                    input.limit,
                ),
                this.trainingStressRepository.listRecentForAthlete(
                    input.tenantId,
                    athlete.id,
                    input.limit,
                ),
                this.workoutProgrammeRepository.findAllByAthleteId(
                    athlete.id,
                    input.tenantId,
                ),
            ]);

            const measurementGroups =
                await Promise.all(
                    metrics.map(metric =>
                        this.performanceMeasurementRepository
                            .listRecentEffectiveForMetric(
                                input.tenantId,
                                athlete.id,
                                metric.id,
                                input.limit,
                            ),
                    ),
                );

            const performanceMeasurementCount =
                measurementGroups.reduce(
                    (total, measurements) =>
                        total + measurements.length,
                    0,
                );

            const latestRecovery =
                recovery.length > 0
                    ? {
                        value: recovery[0].value,
                        recordedAt:
                            recovery[0].recordedAt.toISOString(),
                    }
                    : null;

            const latestTrainingStress =
                trainingStress.length > 0
                    ? {
                        value: trainingStress[0].value,
                        recordedAt:
                            trainingStress[0].recordedAt.toISOString(),
                    }
                    : null;

            athletes.push({
                athleteId: athlete.id,
                firstName: athlete.firstName,
                lastName: athlete.lastName,
                performanceMetricCount: metrics.length,
                performanceMeasurementCount,
                latestRecovery,
                latestTrainingStress,
                workoutProgrammeCount: programmes.length,
            });
        }

        return Result.success({
            squadId: squad.id,
            squadName: squad.name,
            memberCount: athletes.length,
            athletes,
        });
    }
}
