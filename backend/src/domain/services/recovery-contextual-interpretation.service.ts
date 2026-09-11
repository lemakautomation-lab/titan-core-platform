import { RecoveryTrendPoint } from "./recovery-trend.service";
import { SleepTracking } from "../entities/sleep-tracking.entity";
import { RestTracking } from "../entities/rest-tracking.entity";
import { TrainingStress } from "../entities/training-stress.entity";

export type RecoveryContextSource =
    | "SLEEP"
    | "REST"
    | "TRAINING_STRESS";

export interface RecoveryContextualInterpretation {
    direction: RecoveryTrendPoint["direction"];
    contextSources: RecoveryContextSource[];
    contextAvailable: boolean;
    summary: string;
}

export interface RecoveryContext {
    tenantId: string;
    athleteId: string;
    sleep?: SleepTracking;
    rest?: RestTracking;
    trainingStress?: TrainingStress;
}

export class RecoveryContextualInterpretationService {
    static interpret(
        trend: RecoveryTrendPoint,
        context: RecoveryContext,
    ): RecoveryContextualInterpretation {
        if (!context.tenantId?.trim()) {
            throw new Error("Tenant ID is required.");
        }

        if (!context.athleteId?.trim()) {
            throw new Error("Athlete ID is required.");
        }

        const observations = [
            context.sleep,
            context.rest,
            context.trainingStress,
        ].filter(Boolean);

        for (const observation of observations) {
            if (
                observation!.tenantId !== context.tenantId ||
                observation!.athleteId !== context.athleteId
            ) {
                throw new Error(
                    "Recovery context ownership does not match.",
                );
            }
        }

        const contextSources: RecoveryContextSource[] = [];

        if (context.sleep) contextSources.push("SLEEP");
        if (context.rest) contextSources.push("REST");
        if (context.trainingStress) contextSources.push("TRAINING_STRESS");

        const contextAvailable = contextSources.length > 0;
        const sourceText = contextAvailable
            ? contextSources.join(", ")
            : "none";

        return {
            direction: trend.direction,
            contextSources,
            contextAvailable,
            summary: `Recovery trend is ${trend.direction}; contextual signals available: ${sourceText}.`,
        };
    }
}
