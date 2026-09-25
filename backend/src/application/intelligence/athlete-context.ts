/** Authorised identity boundary for subsequent intelligence data readers. */
export interface AthleteIntelligenceContext {
    athleteId: string;
    organisationId: string | null;
}

export interface AthleteIntelligenceContextReader {
    read(tenantId: string, actorId: string, athleteId: string): Promise<AthleteIntelligenceContext | null>;
}

export class ResolveAthleteIntelligenceContext {
    constructor(private readonly reader: AthleteIntelligenceContextReader) {}

    execute(tenantId: string, actorId: string, athleteId: string) {
        return this.reader.read(tenantId, actorId, athleteId);
    }
}
