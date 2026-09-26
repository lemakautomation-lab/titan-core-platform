import { createHmac, randomUUID } from "node:crypto";
import { WearableProvider, WearableStore } from "../../application/intelligence/athlete-wearables";
import { DatabaseService } from "../database/database.service";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const values: Record<string, { unit: string; max: number }> = {
    HEART_RATE: { unit: "bpm", max: 300 },
    STEPS: { unit: "count", max: 1000000 },
    SLEEP_DURATION: { unit: "minutes", max: 1440 },
};
const validProvider = (provider: string): provider is WearableProvider =>
    ["GARMIN", "APPLE_HEALTH", "SAMSUNG_HEALTH"].includes(provider);

/** Persistence boundary; the caller must supply a genuinely verified connector. */
export class PrismaAthleteWearableStore implements WearableStore {
    constructor(private readonly database: DatabaseService, private readonly identityKey: string) {
        if (identityKey.length < 32) throw new Error("Wearable identity key is required.");
    }

    private digest(provider: WearableProvider, subject: string) {
        return createHmac("sha256", this.identityKey).update(provider).update("\0")
            .update(subject).digest("hex");
    }

    async consent(tenantId: string, athleteId: string, actorId: string,
        provider: WearableProvider, subject: string) {
        if (![tenantId, athleteId, actorId].every((id) => uuid.test(id)) ||
            !validProvider(provider) || !subject || subject.length > 256) {
            throw new Error("Invalid verified wearable identity.");
        }
        return this.database.transaction(async (tx) => {
            const athlete = await tx.athlete.findFirst({ where: {
                id: athleteId, tenantId, userId: actorId, status: "ACTIVE",
                user: { status: "ACTIVE" },
            }, select: { id: true } });
            if (!athlete) throw new Error("Athlete consent requires the active owner.");
            const row = await tx.wearableConnection.create({ data: {
                id: randomUUID(), tenantId, athleteId, consentedById: actorId,
                provider, providerSubjectDigest: this.digest(provider, subject),
            }, select: { id: true } });
            await tx.auditLog.create({ data: {
                tenantId, userId: actorId, action: "WEARABLE_CONSENT_GRANT",
                resource: "WEARABLE_CONNECTION", resourceId: row.id,
                metadata: { athleteId, provider },
            } });
            return row;
        });
    }

    async revoke(tenantId: string, athleteId: string, actorId: string, connectionId: string) {
        if (![tenantId, athleteId, actorId, connectionId].every((id) => uuid.test(id))) return false;
        return this.database.transaction(async (tx) => {
            await tx.$queryRaw`SELECT "id" FROM "WearableConnection" WHERE "id" = ${connectionId} AND "tenantId" = ${tenantId} AND "athleteId" = ${athleteId} FOR UPDATE`;
            const athlete = await tx.athlete.findFirst({ where: {
                id: athleteId, tenantId, userId: actorId, status: "ACTIVE",
                user: { status: "ACTIVE" },
            }, select: { id: true } });
            if (!athlete) return false;
            const result = await tx.wearableConnection.updateMany({
                where: { id: connectionId, tenantId, athleteId, revokedAt: null },
                data: { revokedAt: new Date() },
            });
            if (result.count !== 1) return false;
            await tx.auditLog.create({ data: {
                tenantId, userId: actorId, action: "WEARABLE_CONSENT_REVOKE",
                resource: "WEARABLE_CONNECTION", resourceId: connectionId,
                metadata: { athleteId },
            } });
            return true;
        });
    }

    async ingest(verified: Parameters<WearableStore["ingest"]>[0]) {
        const rule = values[verified.metricCode];
        const numeric = Number(verified.value);
        if (!validProvider(verified.provider) || !verified.subject || verified.subject.length > 256 ||
            !verified.recordId || verified.recordId.length > 256 ||
            !rule || verified.unit !== rule.unit ||
            !/^(?:0|[1-9]\d{0,12})(?:\.\d{1,6})?$/.test(verified.value) ||
            numeric > rule.max || !Number.isFinite(numeric) ||
            !(verified.observedAt instanceof Date) || Number.isNaN(verified.observedAt.getTime()) ||
            verified.observedAt.getTime() > Date.now() + 5 * 60_000) {
            throw new Error("Invalid verified wearable observation.");
        }
        return this.database.transaction(async (tx) => {
            const connection = await tx.wearableConnection.findFirst({ where: {
                provider: verified.provider,
                providerSubjectDigest: this.digest(verified.provider, verified.subject), revokedAt: null,
                athlete: { status: "ACTIVE" },
            }, select: { id: true, tenantId: true, athleteId: true } });
            if (!connection) return null;
            await tx.$queryRaw`SELECT "id" FROM "WearableConnection" WHERE "id" = ${connection.id} FOR UPDATE`;
            const stillActive = await tx.wearableConnection.findFirst({ where: {
                id: connection.id, revokedAt: null, athlete: { status: "ACTIVE" },
            }, select: { id: true } });
            if (!stillActive) return null;
            const previous = await tx.wearableObservation.findUnique({ where: {
                connectionId_providerRecordId: {
                    connectionId: connection.id, providerRecordId: verified.recordId,
                },
            }, select: { id: true, metricCode: true, value: true, unit: true, observedAt: true } });
            if (previous) {
                if (previous.metricCode !== verified.metricCode || previous.value.toString() !== numeric.toString() ||
                    previous.unit !== verified.unit || previous.observedAt.getTime() !== verified.observedAt.getTime()) {
                    throw new Error("Provider record conflicts with existing observation.");
                }
                return { id: previous.id };
            }
            const row = await tx.wearableObservation.create({ data: {
                id: randomUUID(), tenantId: connection.tenantId, athleteId: connection.athleteId,
                connectionId: connection.id, providerRecordId: verified.recordId,
                metricCode: verified.metricCode, value: verified.value,
                unit: verified.unit, observedAt: verified.observedAt,
            }, select: { id: true } });
            await tx.auditLog.create({ data: {
                tenantId: connection.tenantId, action: "WEARABLE_OBSERVATION_INGEST",
                resource: "WEARABLE_OBSERVATION", resourceId: row.id,
                metadata: { athleteId: connection.athleteId, connectionId: connection.id,
                    provider: verified.provider, metricCode: verified.metricCode },
            } });
            return row;
        });
    }
}
