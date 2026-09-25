import { randomUUID } from "node:crypto";
import { PerformanceTestWriter, TestProtocolInput, TestResultInput } from "../../application/intelligence/manage-athlete-performance-tests";
import { DatabaseService } from "../database/database.service";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const valuePattern = /^(?:0|[1-9]\d{0,13})(?:\.\d{1,6})?$/;

export class PrismaAthletePerformanceTestWriter implements PerformanceTestWriter {
    constructor(private readonly database: DatabaseService) {}

    async registerProtocol(input: TestProtocolInput) {
        if (![input.tenantId, input.actorId, input.sportId].every((id) => uuid.test(id)) ||
            !/^[A-Z][A-Z0-9_]{1,63}$/.test(input.code) ||
            input.name.trim() !== input.name || input.name.length < 1 || input.name.length > 120 ||
            input.unit.trim() !== input.unit || input.unit.length < 1 || input.unit.length > 24) {
            throw new Error("Invalid test protocol.");
        }
        const actor = await this.database.prisma.user.findFirst({
            where: { id: input.actorId, tenantId: input.tenantId, status: "ACTIVE" }, select: { id: true },
        });
        if (!actor) throw new Error("Actor not available in tenant.");
        return this.database.transaction(async (tx) => {
            const sport = await tx.sport.findFirst({
                where: { id: input.sportId, tenantId: input.tenantId, status: "ACTIVE" }, select: { id: true },
            });
            if (!sport) throw new Error("Sport not available in tenant.");
            const scope = { tenantId: input.tenantId, sportId: input.sportId, code: input.code };
            const latest = await tx.performanceTestProtocol.findFirst({
                where: scope, orderBy: { version: "desc" }, select: { version: true },
            });
            await tx.performanceTestProtocol.updateMany({
                where: { ...scope, status: "ACTIVE" }, data: { status: "INACTIVE" },
            });
            const row = await tx.performanceTestProtocol.create({ data: {
                id: randomUUID(), ...scope, name: input.name, unit: input.unit,
                version: (latest?.version ?? 0) + 1,
            }, select: { id: true, version: true } });
            await tx.auditLog.create({ data: { tenantId: input.tenantId, userId: input.actorId,
                action: "PERFORMANCE_TEST_PROTOCOL_REGISTER", resource: "PERFORMANCE_TEST_PROTOCOL",
                resourceId: row.id, metadata: { sportId: input.sportId, code: input.code, version: row.version },
            } });
            return row;
        });
    }

    async recordResult(input: TestResultInput) {
        if (![input.tenantId, input.actorId, input.athleteId, input.protocolId].every((id) => uuid.test(id)) ||
            (input.correctsResultId !== undefined && !uuid.test(input.correctsResultId)) ||
            !valuePattern.test(input.value) || !(input.recordedAt instanceof Date) ||
            !Number.isFinite(input.recordedAt.getTime()) || input.recordedAt.getTime() > Date.now()) {
            throw new Error("Invalid performance test result.");
        }
        return this.database.transaction(async (tx) => {
            const protocol = await tx.performanceTestProtocol.findFirst({ where: {
                id: input.protocolId, tenantId: input.tenantId,
                ...(input.correctsResultId ? {} : { status: "ACTIVE" as const }),
            }, select: { id: true } });
            if (!protocol) throw new Error("Test protocol not available in tenant.");
            if (input.correctsResultId) {
                const original = await tx.athletePerformanceTestResult.findFirst({ where: {
                    id: input.correctsResultId, tenantId: input.tenantId,
                    athleteId: input.athleteId, protocolId: input.protocolId,
                    correctedBy: { none: {} },
                }, select: { id: true, recordedAt: true } });
                if (!original || original.recordedAt.getTime() !== input.recordedAt.getTime()) {
                    throw new Error("Effective test result to correct not found.");
                }
            }
            const row = await tx.athletePerformanceTestResult.create({ data: {
                id: randomUUID(), tenantId: input.tenantId, athleteId: input.athleteId,
                protocolId: input.protocolId, value: input.value, recordedAt: input.recordedAt,
                correctsResultId: input.correctsResultId ?? null,
            }, select: { id: true } });
            await tx.auditLog.create({ data: { tenantId: input.tenantId, userId: input.actorId,
                action: input.correctsResultId ? "PERFORMANCE_TEST_RESULT_CORRECT" : "PERFORMANCE_TEST_RESULT_RECORD",
                resource: "PERFORMANCE_TEST_RESULT", resourceId: row.id,
                metadata: { athleteId: input.athleteId, protocolId: input.protocolId,
                    correctsResultId: input.correctsResultId ?? null },
            } });
            return row;
        });
    }
}
