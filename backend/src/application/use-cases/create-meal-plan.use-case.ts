import { AthleteRepository } from "../../domain/repositories/athlete.repository";
import { MealPlan } from "../../domain/entities/meal-plan/meal-plan.entity";
import { MealPlanRepository } from "../../domain/repositories/meal-plan/meal-plan.repository";
import { CreateMealPlanCommand } from "../commands/create-meal-plan.command";
import {
    MealPlanApplicationMapper,
    MealPlanDto,
} from "../dto/meal-plan/meal-plan.dto";

export class CreateMealPlanUseCase {
    constructor(
        private readonly mealPlanRepository: MealPlanRepository,
        private readonly athleteRepository: AthleteRepository,
    ) {}

    async execute(command: CreateMealPlanCommand): Promise<MealPlanDto> {
        if (!(command instanceof CreateMealPlanCommand)) {
            throw new Error("Meal plan creation command is required.");
        }

        const athlete = await this.athleteRepository.findById(
            command.athleteId,
            command.tenantId,
        );

        if (!athlete) {
            throw new Error("Athlete not found.");
        }

        const mealPlan = MealPlan.create(
            command.tenantId,
            command.athleteId,
            command.name,
            command.description,
            {
                planType: "MEAL_PLAN",
                meals: command.meals,
            },
        );

        const created = await this.mealPlanRepository.create(mealPlan);

        return MealPlanApplicationMapper.toDto(created);
    }
}
