import { AthleteIntelligenceContextReader } from "./athlete-context";

export interface AthleteTrainingSnapshot {
    athleteId: string;
    programmes: Array<{
        id: string;
        name: string;
        status: "ACTIVE";
        trainingFrequency: number;
        updatedAt: Date;
    }>;
}

export interface AthleteTrainingReader {
    read(tenantId: string, athleteId: string): Promise<AthleteTrainingSnapshot>;
}

export interface TrainingPermissionChecker {
    hasPermission(userId: string, tenantId: string, code: string): Promise<boolean>;
}

/** A denied or missing Athlete has the same null outcome. */
export class ReadAthleteIntelligenceTraining {
    constructor(
        private readonly context: AthleteIntelligenceContextReader,
        private readonly permissions: TrainingPermissionChecker,
        private readonly training: AthleteTrainingReader,
    ) {}

    async execute(tenantId: string, actorId: string, athleteId: string): Promise<AthleteTrainingSnapshot | null> {
        const scope = await this.context.read(tenantId, actorId, athleteId);
        if (!scope) return null;
        if (!(await this.permissions.hasPermission(actorId, tenantId, "workout-programmes.read"))) return null;
        return this.training.read(tenantId, scope.athleteId);
    }
}
