import { Result } from "../common/result";
import { CoachSquadRepository } from "../../domain/repositories/coach-squad.repository";
import { CoachSquadAthleteRepository } from "../../domain/repositories/coach-squad-athlete.repository";
import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { AthleteRelationshipRepository } from "../../domain/repositories/athlete-relationship.repository";
import { PerformanceMetricRepository } from "../../domain/repositories/performance-metric.repository";
import { PerformanceMeasurementRepository } from "../../domain/repositories/performance-measurement/performance-measurement.repository";
import { AthleteRelationshipType } from "../../domain/enums/athlete-relationship-type.enum";

type TeamTrendPoint = {
    athleteId: string;
    firstName: string;
    lastName: string;
    metricId: string;
    value: number;
    recordedAt: string;
};

type TeamTrendMetric = {
    slug: string;
    name: string;
    unit: string | null;
    dataType: string;
    athleteCount: number;
    pointCount: number;
    points: TeamTrendPoint[];
};

export class GetCoachSquadTeamTrendsUseCase {
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
        trendMetricCount: number;
        metrics: TeamTrendMetric[];
    }>> {
        if (
            !Number.isInteger(input.limit) ||
            input.limit < 1 ||
            input.limit > 100
        ) {
            return Result.failure(
                "Team trends limit must be an integer between 1 and 100.",
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

        const trendGroups = new Map<
            string,
            {
                slug: string;
                name: string;
                unit: string | null;
                dataType: string;
                athleteIds: Set<string>;
                points: TeamTrendPoint[];
            }
        >();

        let memberCount = 0;

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

            memberCount += 1;

            const metrics =
                await this.performanceMetricRepository.findAllByAthleteId(
                    athlete.id,
                    input.tenantId,
                );

            for (const metric of metrics) {
                const key = [
                    metric.slug.trim().toLowerCase(),
                    (metric.unit ?? "").trim().toLowerCase(),
                    metric.dataType,
                ].join("|");

                const measurements =
                    await this.performanceMeasurementRepository
                        .listRecentEffectiveForMetric(
                            input.tenantId,
                            athlete.id,
                            metric.id,
                            input.limit,
                        );

                if (measurements.length === 0) {
                    continue;
                }

                let group = trendGroups.get(key);

                if (!group) {
                    group = {
                        slug: metric.slug,
                        name: metric.name,
                        unit: metric.unit ?? null,
                        dataType: metric.dataType,
                        athleteIds: new Set<string>(),
                        points: [],
                    };

                    trendGroups.set(key, group);
                }

                group.athleteIds.add(athlete.id);

                for (const measurement of measurements) {
                    group.points.push({
                        athleteId: athlete.id,
                        firstName: athlete.firstName,
                        lastName: athlete.lastName,
                        metricId: metric.id,
                        value: measurement.value,
                        recordedAt:
                            measurement.recordedAt.toISOString(),
                    });
                }
            }
        }

        const metrics = [...trendGroups.values()]
            .map(group => {
                const points = [...group.points].sort((a, b) => {
                    const timeDifference =
                        new Date(a.recordedAt).getTime() -
                        new Date(b.recordedAt).getTime();

                    if (timeDifference !== 0) {
                        return timeDifference;
                    }

                    const athleteDifference =
                        a.athleteId.localeCompare(b.athleteId);

                    if (athleteDifference !== 0) {
                        return athleteDifference;
                    }

                    return a.metricId.localeCompare(b.metricId);
                });

                return {
                    slug: group.slug,
                    name: group.name,
                    unit: group.unit,
                    dataType: group.dataType,
                    athleteCount: group.athleteIds.size,
                    pointCount: points.length,
                    points,
                };
            })
            .sort((a, b) => {
                const slugDifference =
                    a.slug.localeCompare(b.slug);

                if (slugDifference !== 0) {
                    return slugDifference;
                }

                const unitDifference =
                    (a.unit ?? "").localeCompare(b.unit ?? "");

                if (unitDifference !== 0) {
                    return unitDifference;
                }

                return a.dataType.localeCompare(b.dataType);
            });

        return Result.success({
            squadId: squad.id,
            squadName: squad.name,
            memberCount,
            trendMetricCount: metrics.length,
            metrics,
        });
    }
}
