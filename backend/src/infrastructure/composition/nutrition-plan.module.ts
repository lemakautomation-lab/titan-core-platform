import { DatabaseService } from "../database/database.service";
import { PrismaNutritionPlanRepository } from "../repositories/nutrition-plan/nutrition-plan.repository";
import { PrismaNutritionPlanGenerationTransaction } from "../transactions/nutrition-plan-generation.transaction";

import { GenerateNutritionPlanUseCase } from "../../application/use-cases/generate-nutrition-plan.use-case";
import { DeterministicNutritionPlanGenerator } from "../../application/services/deterministic-nutrition-plan-generator.service";

const databaseService = new DatabaseService();

const nutritionPlanRepository =
    new PrismaNutritionPlanRepository(
        databaseService,
    );

const generationTransaction =
    new PrismaNutritionPlanGenerationTransaction(
        databaseService,
    );

export const nutritionPlanModule = {
    nutritionPlanRepository,

    generateNutritionPlanUseCase:
        new GenerateNutritionPlanUseCase(
            new DeterministicNutritionPlanGenerator(),
            generationTransaction,
        ),
};
