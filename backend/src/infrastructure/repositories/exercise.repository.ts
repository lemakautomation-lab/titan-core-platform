import { Exercise } from "../../domain/entities/exercise.entity";
import {
    ExerciseListResult,
    ExerciseRepository,
} from "../../domain/repositories/exercise.repository";

import { DatabaseService } from "../database/database.service";
import { ExerciseMapper } from "../mappers/exercise.mapper";

export class PrismaExerciseRepository
implements ExerciseRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(
        id: string,
        tenantId: string,
    ): Promise<Exercise | null> {

        const exercise =
            await this.database.prisma.exercise.findFirst({
                where: {
                    id,
                    tenantId,
                    status: "ACTIVE",
                },
            });

        return exercise
            ? ExerciseMapper.toDomain(exercise)
            : null;
    }

    async findBySlug(
        slug: string,
        tenantId: string,
    ): Promise<Exercise | null> {

        const exercise =
            await this.database.prisma.exercise.findFirst({
                where: {
                    slug,
                    tenantId,
                },
            });

        return exercise
            ? ExerciseMapper.toDomain(exercise)
            : null;
    }

    async findAll(
        tenantId: string,
        pagination: {
            page: number;
            pageSize: number;
        },
    ): Promise<ExerciseListResult> {

        const skip =
            (pagination.page - 1) *
            pagination.pageSize;

        const where = {
            tenantId,
            status: "ACTIVE" as const,
        };

        const [exercises, total] =
            await Promise.all([
                this.database.prisma.exercise.findMany({
                    where,
                    orderBy: [
                        { name: "asc" },
                        { id: "asc" },
                    ],
                    skip,
                    take: pagination.pageSize,
                }),

                this.database.prisma.exercise.count({
                    where,
                }),
            ]);

        return {
            items: exercises.map(
                ExerciseMapper.toDomain,
            ),
            total,
        };
    }

    async create(
        exercise: Exercise,
    ): Promise<Exercise> {

        const created =
            await this.database.prisma.exercise.create({
                data:
                    ExerciseMapper.toPersistence(
                        exercise,
                    ),
            });

        return ExerciseMapper.toDomain(created);
    }

    async update(
        exercise: Exercise,
        tenantId: string,
    ): Promise<Exercise> {

        const updated =
            await this.database.prisma.exercise.updateMany({
                where: {
                    id: exercise.id,
                    tenantId,
                },
                data:
                    ExerciseMapper.toPersistence(
                        exercise,
                    ),
            });

        if (updated.count !== 1) {
            throw new Error("Exercise update failed.");
        }

        const result =
            await this.database.prisma.exercise.findFirst({
                where: {
                    id: exercise.id,
                    tenantId,
                },
            });

        if (!result) {
            throw new Error("Exercise not found after update.");
        }

        return ExerciseMapper.toDomain(result);
    }

    async delete(
        id: string,
        tenantId: string,
    ): Promise<void> {

        await this.database.prisma.exercise.updateMany({
            where: {
                id,
                tenantId,
            },
            data: {
                status: "DELETED",
            },
        });
    }
}
