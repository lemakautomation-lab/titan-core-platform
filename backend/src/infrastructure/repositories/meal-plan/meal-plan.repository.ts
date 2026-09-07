import { Prisma } from "../../../generated/prisma/client";
import { DatabaseService } from "../../database/database.service";
import { MealPlan } from "../../../domain/entities/meal-plan/meal-plan.entity";
import { MealPlanRepository } from "../../../domain/repositories/meal-plan/meal-plan.repository";
import { MealPlanMapper } from "../../mappers/meal-plan.mapper";

export class PrismaMealPlanRepository implements MealPlanRepository {
    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(
        id: string,
        tenantId: string,
    ): Promise<MealPlan | null> {
        const row = await this.database.prisma.mealPlan.findFirst({
            where: { id, tenantId },
        });

        return row ? MealPlanMapper.toDomain(row) : null;
    }

    async findByAthlete(
        athleteId: string,
        tenantId: string,
    ): Promise<MealPlan[]> {
        const rows = await this.database.prisma.mealPlan.findMany({
            where: { athleteId, tenantId },
            orderBy: [{ version: "desc" }, { createdAt: "desc" }],
        });

        return rows.map(MealPlanMapper.toDomain);
    }

    async create(
        mealPlan: MealPlan,
    ): Promise<MealPlan> {
        const row = await this.database.prisma.mealPlan.create({
            data: MealPlanMapper.toPersistence(mealPlan) as Prisma.MealPlanUncheckedCreateInput,
        });

        return MealPlanMapper.toDomain(row);
    }
}


