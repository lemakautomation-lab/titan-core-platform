import { DatabaseService } from "../../database/database.service";
import { NutritionPlanRepository } from "../../../domain/repositories/nutrition-plan/nutrition-plan.repository";
import { NutritionPlan } from "../../../domain/entities/nutrition-plan/nutrition-plan.entity";
import { NutritionPlanMapper } from "../../mappers/nutrition-plan.mapper";

export class PrismaNutritionPlanRepository
implements NutritionPlanRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(
        id: string,
        tenantId: string,
    ): Promise<NutritionPlan | null> {
        const row =
            await this.database.prisma.nutritionPlan.findFirst({
                where: {
                    id,
                    tenantId,
                },
            });

        return row
            ? NutritionPlanMapper.toDomain(row)
            : null;
    }

    async findByIdempotencyKey(
        tenantId: string,
        idempotencyKey: string,
    ): Promise<NutritionPlan | null> {
        const row =
            await this.database.prisma.nutritionPlan.findFirst({
                where: {
                    tenantId,
                    idempotencyKey,
                },
            });

        return row
            ? NutritionPlanMapper.toDomain(row)
            : null;
    }

    async create(
        plan: NutritionPlan,
    ): Promise<NutritionPlan> {
        const row =
            await this.database.prisma.nutritionPlan.create({
                data: NutritionPlanMapper.toPersistence(plan),
            });

        return NutritionPlanMapper.toDomain(row);
    }
}
