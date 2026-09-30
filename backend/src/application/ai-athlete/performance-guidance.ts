import type { AthleteIntelligenceAggregate } from "../intelligence/athlete-aggregation";
import { ProgrammeGoalClassification } from "../../domain/enums/programme-goal-classification.enum";

export interface GuidanceFacts {
    trainingFrequencies: number[];
    goals: ProgrammeGoalClassification[];
}
export interface PerformanceGuidance {
    summary: string;
    actions: string[];
}
export interface PerformanceGuidanceProvider {
    generate(facts: GuidanceFacts): Promise<PerformanceGuidance>;
}
export class GuidanceUnavailableError extends Error {
    constructor() { super("Performance guidance is temporarily unavailable."); }
}

/** Only bounded, governed goals and programme frequencies leave the server in 74.3.
 * Names, IDs, free text and health observations are deliberately excluded. */
export function guidanceFacts(sources: AthleteIntelligenceAggregate): GuidanceFacts {
    const allowed = new Set(Object.values(ProgrammeGoalClassification));
    const goals = sources.goals
        ? [sources.goals.primaryGoal, ...sources.goals.secondaryGoals].filter(
            (goal): goal is ProgrammeGoalClassification => goal !== null && allowed.has(goal))
        : [];
    return {
        trainingFrequencies: (sources.training?.programmes ?? []).slice(0, 5)
            .map(programme => programme.trainingFrequency)
            .filter(value => Number.isInteger(value) && value >= 1 && value <= 14),
        goals: [...new Set(goals)].slice(0, 9),
    };
}

export function validateGuidance(value: unknown): PerformanceGuidance {
    if (!value || typeof value !== "object") throw new GuidanceUnavailableError();
    const record = value as Record<string, unknown>;
    const safeText = (text: unknown, limit: number): text is string => typeof text === "string"
        && text.trim().length > 0 && text.length <= limit && !Array.from(text).some(character => character.charCodeAt(0) < 32 || character === "<" || character === ">");
    if (Object.keys(record).sort().join(",") !== "actions,summary"
        || !safeText(record.summary, 600) || !Array.isArray(record.actions)
        || record.actions.length < 1 || record.actions.length > 3
        || !record.actions.every(action => safeText(action, 300))) throw new GuidanceUnavailableError();
    return { summary: record.summary, actions: record.actions as string[] };
}
