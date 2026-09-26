import { AthleteIntelligenceContextReader } from "./athlete-context";

export type WearableProvider = "GARMIN" | "APPLE_HEALTH" | "SAMSUNG_HEALTH";
export type WearableMetric = "HEART_RATE" | "STEPS" | "SLEEP_DURATION";

/** Only a trusted connector may implement this port. No client-provided source flag qualifies. */
export interface VerifiedWearableConnector {
    verifyAccount(proof: unknown): Promise<{ provider: WearableProvider; subject: string }>;
    verifyObservation(payload: unknown): Promise<{
        provider: WearableProvider;
        subject: string;
        recordId: string;
        metricCode: WearableMetric;
        value: string;
        unit: string;
        observedAt: Date;
    }>;
}

export interface WearableStore {
    consent(tenantId: string, athleteId: string, actorId: string,
        provider: WearableProvider, subject: string): Promise<{ id: string }>;
    revoke(tenantId: string, athleteId: string, actorId: string, connectionId: string): Promise<boolean>;
    ingest(verified: Awaited<ReturnType<VerifiedWearableConnector["verifyObservation"]>>): Promise<{ id: string } | null>;
}

/** Athlete consent is self-service; an assigned professional cannot grant it. */
export class ManageAthleteWearableConsent {
    constructor(
        private readonly context: AthleteIntelligenceContextReader,
        private readonly connector: VerifiedWearableConnector,
        private readonly store: WearableStore,
    ) {}

    async grant(tenantId: string, actorId: string, athleteId: string, proof: unknown) {
        const scope = await this.context.read(tenantId, actorId, athleteId);
        if (!scope) return null;
        return this.store.consent(tenantId, scope.athleteId, actorId,
            ...(await this.verifiedIdentity(proof)));
    }

    async revoke(tenantId: string, actorId: string, athleteId: string, connectionId: string) {
        const scope = await this.context.read(tenantId, actorId, athleteId);
        if (!scope) return false;
        return this.store.revoke(tenantId, scope.athleteId, actorId, connectionId);
    }

    private async verifiedIdentity(proof: unknown): Promise<[WearableProvider, string]> {
        const { provider, subject } = await this.connector.verifyAccount(proof);
        return [provider, subject];
    }
}

/** The verifier returns a provider identity, never a tenant or Athlete identity. */
export class IngestVerifiedWearableObservation {
    constructor(private readonly connector: VerifiedWearableConnector,
        private readonly store: WearableStore) {}

    async execute(payload: unknown) {
        return this.store.ingest(await this.connector.verifyObservation(payload));
    }
}

export interface WearablePermissionChecker {
    hasPermission(actorId: string, tenantId: string, code: string): Promise<boolean>;
}

export interface AthleteWearableSnapshot {
    athleteId: string;
    observations: Array<{
        id: string; provider: WearableProvider; metricCode: WearableMetric;
        value: string; unit: string; observedAt: Date;
    }>;
}

export interface WearableReader {
    read(tenantId: string, athleteId: string): Promise<AthleteWearableSnapshot>;
}

export class ReadAthleteIntelligenceWearables {
    constructor(
        private readonly context: AthleteIntelligenceContextReader,
        private readonly permissions: WearablePermissionChecker,
        private readonly reader: WearableReader,
    ) {}

    async execute(tenantId: string, actorId: string, athleteId: string) {
        const scope = await this.context.read(tenantId, actorId, athleteId);
        if (!scope) return null;
        if (!(await this.permissions.hasPermission(actorId, tenantId, "wearable-observations.read"))) return null;
        return this.reader.read(tenantId, scope.athleteId);
    }
}
