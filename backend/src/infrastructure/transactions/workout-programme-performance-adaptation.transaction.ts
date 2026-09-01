import { AuditLog, AuditLogStatus } from "../../domain/entities/audit-log.entity";
import { AuditAction } from "../../domain/security/audit-action";
import { AuditResource } from "../../domain/security/audit-resource";
import {
    WorkoutProgrammePerformanceAdaptationInput,
    WorkoutProgrammePerformanceAdaptationTransaction,
} from "../../application/ports/workout-programme-performance-adaptation.transaction";

import { DatabaseService } from "../database/database.service";
import { AuditLogMapper } from "../mappers/audit-log.mapper";
import { WorkoutProgrammeMapper } from "../mappers/workout-programme.mapper";

export class PrismaWorkoutProgrammePerformanceAdaptationTransaction
implements WorkoutProgrammePerformanceAdaptationTransaction {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async execute(
        input: WorkoutProgrammePerformanceAdaptationInput,
    ) {
        return this.database.transaction(async tx => {
            const lockedRows = await tx.$queryRaw<Array<{ id: string }>>`
                SELECT "id"
                FROM "WorkoutProgramme"
                WHERE "id" = ${input.programmeId}
                  AND "tenantId" = ${input.tenantId}
                  AND "athleteId" = ${input.athleteId}
                  AND "status" = 'ACTIVE'
                FOR UPDATE
            `;

            if (lockedRows.length !== 1) {
                throw new Error("Workout Programme not found.");
            }

            const currentRow = await tx.workoutProgramme.findFirst({
                where: {
                    id: input.programmeId,
                    tenantId: input.tenantId,
                    athleteId: input.athleteId,
                    status: "ACTIVE",
                },
            });

            if (!currentRow) {
                throw new Error("Workout Programme not found.");
            }

            const evidence = await tx.performanceMeasurement.findFirst({
                where: {
                    id: input.measurementId,
                    tenantId: input.tenantId,
                    athleteId: input.athleteId,
                    metricId: input.metricId,
                },
            });

            if (!evidence) {
                throw new Error(
                    "Performance measurement evidence is invalid.",
                );
            }

            const programme = WorkoutProgrammeMapper.toDomain(currentRow);
            const previousTrainingFrequency =
                programme.trainingFrequency;
            const previousSessionDurationMinutes =
                programme.sessionDurationMinutes;

            programme.adaptFromPerformance(
                input.trainingFrequencyDelta,
                input.sessionDurationMinutesDelta,
            );

            const updated = await tx.workoutProgramme.updateMany({
                where: {
                    id: input.programmeId,
                    tenantId: input.tenantId,
                    athleteId: input.athleteId,
                    status: "ACTIVE",
                },
                data: WorkoutProgrammeMapper.toPersistence(programme),
            });

            if (updated.count !== 1) {
                throw new Error("Workout Programme update failed.");
            }

            const auditLog = AuditLog.create(
                input.tenantId,
                input.actorUserId,
                AuditAction.WORKOUT_PROGRAMME_PERFORMANCE_ADAPTATION,
                AuditResource.WORKOUT_PROGRAMME,
                input.programmeId,
                AuditLogStatus.SUCCESS,
                {
                    athleteId: input.athleteId,
                    metricId: input.metricId,
                    measurementId: evidence.id,
                    measurementRecordedAt:
                        evidence.recordedAt.toISOString(),
                    rationale: input.rationale,
                    previousTrainingFrequency,
                    trainingFrequency: programme.trainingFrequency,
                    previousSessionDurationMinutes,
                    sessionDurationMinutes:
                        programme.sessionDurationMinutes,
                },
            );

            await tx.auditLog.create({
                data: AuditLogMapper.toPersistence(auditLog),
            });

            const result = await tx.workoutProgramme.findFirst({
                where: {
                    id: input.programmeId,
                    tenantId: input.tenantId,
                    athleteId: input.athleteId,
                    status: "ACTIVE",
                },
            });

            if (!result) {
                throw new Error(
                    "Workout Programme not found after adaptation.",
                );
            }

            return WorkoutProgrammeMapper.toDomain(result);
        });
    }
}
