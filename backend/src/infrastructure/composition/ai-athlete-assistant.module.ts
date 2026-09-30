import { DatabaseService } from "../database/database.service";
import { PrismaAthleteRepository } from "../repositories/athlete.repository";
import { PrismaAthleteIntelligenceContextReader } from "../queries/athlete-intelligence-context.query";
import { GetMyAiAthleteContextUseCase } from "../../application/use-cases/get-my-ai-athlete-context.use-case";

import { authorizationModule } from "./authorization.module";
import { ReadAthleteIntelligenceAggregate } from "../../application/intelligence/athlete-aggregation";
import { GetMyAiAthleteDataUseCase } from "../../application/use-cases/get-my-ai-athlete-data.use-case";
import { ReadAthleteIntelligenceTraining } from "../../application/intelligence/athlete-training";
import { PrismaAthleteTrainingReader } from "../queries/athlete-intelligence-training.query";
import { ReadAthleteIntelligenceNutrition } from "../../application/intelligence/athlete-nutrition";
import { PrismaAthleteNutritionReader } from "../queries/athlete-intelligence-nutrition.query";
import { ReadAthleteIntelligenceRecovery } from "../../application/intelligence/athlete-recovery";
import { PrismaAthleteRecoveryReader } from "../queries/athlete-intelligence-recovery.query";
import { ReadAthleteIntelligenceWearables } from "../../application/intelligence/athlete-wearables";
import { PrismaAthleteWearableReader } from "../queries/athlete-intelligence-wearables.query";
import { ReadAthleteIntelligencePerformanceTests } from "../../application/intelligence/athlete-performance-tests";
import { PrismaAthletePerformanceTestsReader } from "../queries/athlete-intelligence-performance-tests.query";
import { ReadAthleteIntelligenceGoals } from "../../application/intelligence/athlete-goals";
import { PrismaAthleteGoalsReader } from "../queries/athlete-intelligence-goals.query";
import { ReadAthleteIntelligenceSportRequirements } from "../../application/intelligence/athlete-sport-requirements";
import { PrismaAthleteSportRequirementsReader } from "../queries/athlete-intelligence-sport-requirements.query";

const database = new DatabaseService();
const identity = new PrismaAthleteIntelligenceContextReader(database);
const context = new GetMyAiAthleteContextUseCase(new PrismaAthleteRepository(database), identity);
const permissions = authorizationModule.authorizationService;
const aggregate = new ReadAthleteIntelligenceAggregate(
    identity,
    new ReadAthleteIntelligenceTraining(identity, permissions, new PrismaAthleteTrainingReader(database)),
    new ReadAthleteIntelligenceNutrition(identity, permissions, new PrismaAthleteNutritionReader(database)),
    new ReadAthleteIntelligenceRecovery(identity, permissions, new PrismaAthleteRecoveryReader(database)),
    new ReadAthleteIntelligenceWearables(identity, permissions, new PrismaAthleteWearableReader(database)),
    new ReadAthleteIntelligencePerformanceTests(identity, permissions, new PrismaAthletePerformanceTestsReader(database)),
    new ReadAthleteIntelligenceGoals(identity, permissions, new PrismaAthleteGoalsReader(database)),
    new ReadAthleteIntelligenceSportRequirements(identity, permissions, new PrismaAthleteSportRequirementsReader(database)),
);
export const aiAthleteAssistantModule = { context, data: new GetMyAiAthleteDataUseCase(context, aggregate) };
