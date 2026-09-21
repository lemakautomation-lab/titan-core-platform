import { Result } from "../common/result";

import { CoachSquadRepository } from "../../domain/repositories/coach-squad.repository";
import { CoachSquadAthleteRepository } from "../../domain/repositories/coach-squad-athlete.repository";
import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { PerformanceMetricRepository } from "../../domain/repositories/performance-metric.repository";
import { PerformanceMeasurementRepository } from "../../domain/repositories/performance-measurement/performance-measurement.repository";
import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";

export class GetCoachSquadAthleteDevelopmentUseCase {
    constructor(
        private readonly squadRepository: CoachSquadRepository,
        private readonly membershipRepository: CoachSquadAthleteRepository,
        private readonly athleteRepository: AthleteRepository,
        private readonly relationshipRepository: AthleteRelationshipRepository,
        private readonly performanceMetricRepository: PerformanceMetricRepository,
        private readonly performanceMeasurementRepository:
            PerformanceMeasurementRepository,
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
            metricCount: number;
            metrics: Array<{
                metricId: string;
                slug: string;
                name: string;
                unit: string | null;
                dataType: string;
                measurementCount: number;
                measurements: Array<{
                    id: string;
                    value: number;
                    recordedAt: string;
                }>;
            }>;
        }>;
    }>> {
        if (
            !Number.isInteger(input.limit) ||
            input.limit < 1 ||
            input.limit > 100
        ) {
            return Result.failure(
                "Athlete development limit must be an integer between 1 and 100.",
            );
        }

        const squad = await this.squadRepository.findById(
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

        const athletes: Array<{
            athleteId: string;
            firstName: string;
            lastName: string;
            metricCount: number;
            metrics: Array<{
                metricId: string;
                slug: string;
                name: string;
                unit: string | null;
                dataType: string;
                measurementCount: number;
                measurements: Array<{
                    id: string;
                    value: number;
                    recordedAt: string;
                }>;
            }>;
        }> = [];

        for (const membership of memberships) {
            const athlete = await this.athleteRepository.findById(
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

            const performanceMetrics =
                await this.performanceMetricRepository.findAllByAthleteId(
                    athlete.id,
                    input.tenantId,
                );

            const metrics = [];

            for (const metric of performanceMetrics) {
                const measurements =
                    await this.performanceMeasurementRepository
                        .listRecentEffectiveForMetric(
                            input.tenantId,
                            athlete.id,
                            metric.id,
                            input.limit,
                        );

                const history = measurements
                    .map(measurement => ({
                        id: measurement.id,
                        value: measurement.value,
                        recordedAt:
                            measurement.recordedAt.toISOString(),
                    }))
                    .sort((a, b) =>
                        a.recordedAt.localeCompare(b.recordedAt) ||
                        a.id.localeCompare(b.id),
                    );

                metrics.push({
                    metricId: metric.id,
                    slug: metric.slug,
                    name: metric.name,
                    unit: metric.unit ?? null,
                    dataType: metric.dataType,
                    measurementCount: history.length,
                    measurements: history,
                });
            }

            metrics.sort((a, b) =>
                a.slug.localeCompare(b.slug) ||
                (a.unit ?? "").localeCompare(b.unit ?? "") ||
                a.dataType.localeCompare(b.dataType) ||
                a.metricId.localeCompare(b.metricId),
            );

            athletes.push({
                athleteId: athlete.id,
                firstName: athlete.firstName,
                lastName: athlete.lastName,
                metricCount: metrics.length,
                metrics,
            });
        }

        athletes.sort((a, b) =>
            a.lastName.localeCompare(b.lastName) ||
            a.firstName.localeCompare(b.firstName) ||
            a.athleteId.localeCompare(b.athleteId),
        );

        return Result.success({
            squadId: squad.id,
            squadName: squad.name,
            memberCount: athletes.length,
            athletes,
        });
    }
}