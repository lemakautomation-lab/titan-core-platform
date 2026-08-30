import { WorkoutProgramme } from "../../domain/entities/workout-programme.entity";
import { RecordStatus } from "../../domain/enums/record-status.enum";
import { PaginationInput } from "../../application/common/pagination";

import {
    WorkoutProgrammeListResult,
    WorkoutProgrammeRepository,
} from "../../domain/repositories/workout-programme.repository";

import { DatabaseService } from "../database/database.service";
import { WorkoutProgrammeMapper } from "../mappers/workout-programme.mapper";

export class PrismaWorkoutProgrammeRepository
implements WorkoutProgrammeRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(
        id: string,
        tenantId: string,
    ): Promise<WorkoutProgramme | null> {

        const programme =
            await this.database.prisma.workoutProgramme.findFirst({
                where: {
                    id,
                    tenantId,
                    status: "ACTIVE",
                },
            });

        return programme
            ? WorkoutProgrammeMapper.toDomain(programme)
            : null;
    }

    async findAll(
        tenantId: string,
        pagination: PaginationInput,
    ): Promise<WorkoutProgrammeListResult> {

        const skip =
            (pagination.page - 1) *
            pagination.pageSize;

        const where = {
            tenantId,
            status: "ACTIVE" as const,
        };

        const [programmes, total] =
            await this.database.prisma.$transaction([
                this.database.prisma.workoutProgramme.findMany({
                    where,
                    orderBy: [
                        { name: "asc" },
                        { id: "asc" },
                    ],
                    skip,
                    take: pagination.pageSize,
                }),

                this.database.prisma.workoutProgramme.count({
                    where,
                }),
            ]);

        return {
            items: programmes.map(
                WorkoutProgrammeMapper.toDomain,
            ),
            total,
        };
    }

    async findAllByAthleteId(
        athleteId: string,
        tenantId: string,
    ): Promise<WorkoutProgramme[]> {

        const programmes =
            await this.database.prisma.workoutProgramme.findMany({
                where: {
                    athleteId,
                    tenantId,
                    status: "ACTIVE",
                },
                orderBy: [
                    { name: "asc" },
                    { id: "asc" },
                ],
            });

        return programmes.map(
            WorkoutProgrammeMapper.toDomain,
        );
    }

    async create(
        programme: WorkoutProgramme,
    ): Promise<WorkoutProgramme> {

        const created =
            await this.database.prisma.workoutProgramme.create({
                data:
                    WorkoutProgrammeMapper.toPersistence(
                        programme,
                    ),
            });

        return WorkoutProgrammeMapper.toDomain(created);
    }

    async update(
        programme: WorkoutProgramme,
        tenantId: string,
    ): Promise<WorkoutProgramme> {

        const updated =
            await this.database.prisma.workoutProgramme.updateMany({
                where: {
                    id: programme.id,
                    tenantId,
                    status: "ACTIVE",
                },
                data:
                    WorkoutProgrammeMapper.toPersistence(
                        programme,
                    ),
            });

        if (updated.count !== 1) {
            throw new Error("Workout Programme update failed.");
        }

        const result =
            await this.database.prisma.workoutProgramme.findFirst({
                where: {
                    id: programme.id,
                    tenantId,
                    status: "ACTIVE",
                },
            });

        if (!result) {
            throw new Error(
                "Workout Programme not found after update.",
            );
        }

        return WorkoutProgrammeMapper.toDomain(result);
    }

    async updateStatus(
        id: string,
        tenantId: string,
        status: RecordStatus,
    ): Promise<WorkoutProgramme> {

        await this.database.prisma.workoutProgramme.updateMany({
            where: {
                id,
                tenantId,
            },
            data: {
                status,
            },
        });

        const result =
            await this.database.prisma.workoutProgramme.findFirst({
                where: {
                    id,
                    tenantId,
                },
            });

        if (!result) {
            throw new Error("Workout Programme not found.");
        }

        return WorkoutProgrammeMapper.toDomain(result);
    }

    async delete(
        id: string,
        tenantId: string,
    ): Promise<void> {

        await this.database.prisma.workoutProgramme.updateMany({
            where: {
                id,
                tenantId,
                status: "ACTIVE",
            },
            data: {
                status: "DELETED",
            },
        });
    }
}







