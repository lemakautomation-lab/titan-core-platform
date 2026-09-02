import { AuditLog, AuditLogStatus } from "../../domain/entities/audit-log.entity";
import { AuditAction } from "../../domain/security/audit-action";
import { AuditResource } from "../../domain/security/audit-resource";
import { PerformanceMeasurementCorrectionInput, PerformanceMeasurementCorrectionTransaction } from "../../application/ports/performance-measurement-correction.transaction";
import { DatabaseService } from "../database/database.service";
import { AuditLogMapper } from "../mappers/audit-log.mapper";
import { PrismaPerformanceMeasurementRepository } from "../repositories/performance-measurement/performance-measurement.repository";

export class PrismaPerformanceMeasurementCorrectionTransaction
implements PerformanceMeasurementCorrectionTransaction {
    private readonly measurementRepository: PrismaPerformanceMeasurementRepository;

    constructor(private readonly database: DatabaseService) {
        this.measurementRepository = new PrismaPerformanceMeasurementRepository(database);
    }

    async execute(input: PerformanceMeasurementCorrectionInput) {
        return this.database.transaction(async tx => {
            const outcome = await this.measurementRepository.createIdempotentlyWith(tx, input.measurement);
            if (outcome.kind !== "created") return outcome;

            const audit = AuditLog.create(
                input.measurement.tenantId,
                input.actorUserId,
                AuditAction.PERFORMANCE_MEASUREMENT_CORRECTION,
                AuditResource.PERFORMANCE_MEASUREMENT,
                outcome.measurement.id,
                AuditLogStatus.SUCCESS,
                {
                    originalMeasurementId: input.measurement.correctsMeasurementId,
                    athleteId: input.measurement.athleteId,
                    metricId: input.measurement.metricId,
                    sourceObservationId: input.measurement.sourceObservationId,
                    recordedAt: input.measurement.recordedAt.toISOString(),
                },
            );
            await tx.auditLog.create({ data: AuditLogMapper.toPersistence(audit) });
            return outcome;
        });
    }
}
