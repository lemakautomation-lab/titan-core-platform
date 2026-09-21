import { Result } from "../common/result";
import { CoachSquadRepository } from "../../domain/repositories/coach-squad.repository";
import { CoachSquadAthleteRepository } from "../../domain/repositories/coach-squad-athlete.repository";
import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { PerformanceMetricRepository } from "../../domain/repositories/performance-metric.repository";
import { PerformanceMeasurementRepository } from "../../domain/repositories/performance-measurement/performance-measurement.repository";
import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";
import { PerformanceMetric } from "../../domain/entities/performance-metric.entity";

type ComparisonMetric = {
    slug: string;
    name: string;
    unit: string | null;
    dataType: string;
    athleteA: {
        metricId: string;
        value: number | null;
        recordedAt: string | null;
    };
    athleteB: {
        metricId: string;
        value: number | null;
        recordedAt: string | null;
    };
};

export class GetCoachSquadIndividualComparisonUseCase {
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
        athleteAId: string;
        athleteBId: string;
        limit: number;
    }): Promise<Result<{
        squadId: string;
        squadName: string;
        athleteA: {
            athleteId: string;
            firstName: string;
            lastName: string;
        };
        athleteB: {
            athleteId: string;
            firstName: string;
            lastName: string;
        };
        comparableMetricCount: number;
        metrics: ComparisonMetric[];
    }>> {
        if (
            !Number.isInteger(input.limit) ||
            input.limit < 1 ||
            input.limit > 100
        ) {
            return Result.failure(
                "Comparison limit must be an integer between 1 and 100.",
            );
        }

        if (
            !input.athleteAId ||
            !input.athleteBId ||
            input.athleteAId === input.athleteBId
        ) {
            return Result.failure(
                "Two distinct athlete identifiers are required.",
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

        const [membershipA, membershipB] = await Promise.all([
            this.membershipRepository.find(
                input.tenantId,
                input.squadId,
                input.athleteAId,
            ),
            this.membershipRepository.find(
                input.tenantId,
                input.squadId,
                input.athleteBId,
            ),
        ]);

        if (!membershipA || !membershipB) {
            return Result.failure(
                "Comparison athlete not found in squad.",
            );
        }

        const [athleteA, athleteB] = await Promise.all([
            this.athleteRepository.findById(
                input.athleteAId,
                input.tenantId,
            ),
            this.athleteRepository.findById(
                input.athleteBId,
                input.tenantId,
            ),
        ]);

        if (!athleteA || !athleteB) {
            return Result.failure(
                "Comparison athlete not found in squad.",
            );
        }

        const [relationshipA, relationshipB] = await Promise.all([
            this.relationshipRepository.findByAthleteAndRelatedEntity(
                athleteA.id,
                input.userId,
                AthleteRelationshipType.COACH,
                input.tenantId,
            ),
            this.relationshipRepository.findByAthleteAndRelatedEntity(
                athleteB.id,
                input.userId,
                AthleteRelationshipType.COACH,
                input.tenantId,
            ),
        ]);

        if (
            !relationshipA ||
            !relationshipA.isActive() ||
            !relationshipB ||
            !relationshipB.isActive()
        ) {
            return Result.failure(
                "Active Coach athlete relationships are required.",
            );
        }

        const [metricsA, metricsB] = await Promise.all([
            this.performanceMetricRepository.findAllByAthleteId(
                athleteA.id,
                input.tenantId,
            ),
            this.performanceMetricRepository.findAllByAthleteId(
                athleteB.id,
                input.tenantId,
            ),
        ]);

        const groupedA = this.groupMetrics(metricsA);
        const groupedB = this.groupMetrics(metricsB);

        const compatibleKeys = [...groupedA.keys()]
            .filter(key =>
                groupedA.get(key)?.length === 1 &&
                groupedB.get(key)?.length === 1,
            )
            .sort();

        const metrics: ComparisonMetric[] = [];

        for (const key of compatibleKeys) {
            const metricA = groupedA.get(key)![0];
            const metricB = groupedB.get(key)![0];

            const [measurementsA, measurementsB] = await Promise.all([
                this.performanceMeasurementRepository
                    .listRecentEffectiveForMetric(
                        input.tenantId,
                        athleteA.id,
                        metricA.id,
                        input.limit,
                    ),
                this.performanceMeasurementRepository
                    .listRecentEffectiveForMetric(
                        input.tenantId,
                        athleteB.id,
                        metricB.id,
                        input.limit,
                    ),
            ]);

            const latestA = measurementsA[0] ?? null;
            const latestB = measurementsB[0] ?? null;

            metrics.push({
                slug: metricA.slug,
                name: metricA.name,
                unit: metricA.unit ?? null,
                dataType: metricA.dataType,
                athleteA: {
                    metricId: metricA.id,
                    value: latestA?.value ?? null,
                    recordedAt:
                        latestA?.recordedAt.toISOString() ?? null,
                },
                athleteB: {
                    metricId: metricB.id,
                    value: latestB?.value ?? null,
                    recordedAt:
                        latestB?.recordedAt.toISOString() ?? null,
                },
            });
        }

        return Result.success({
            squadId: squad.id,
            squadName: squad.name,
            athleteA: {
                athleteId: athleteA.id,
                firstName: athleteA.firstName,
                lastName: athleteA.lastName,
            },
            athleteB: {
                athleteId: athleteB.id,
                firstName: athleteB.firstName,
                lastName: athleteB.lastName,
            },
            comparableMetricCount: metrics.length,
            metrics,
        });
    }

    private groupMetrics(
        metrics: PerformanceMetric[],
    ): Map<string, PerformanceMetric[]> {
        const grouped = new Map<string, PerformanceMetric[]>();

        for (const metric of metrics) {
            const key = [
                metric.slug.trim().toLowerCase(),
                (metric.unit ?? "").trim().toLowerCase(),
                metric.dataType,
            ].join("|");

            const existing = grouped.get(key) ?? [];
            existing.push(metric);
            grouped.set(key, existing);
        }

        return grouped;
    }
}
