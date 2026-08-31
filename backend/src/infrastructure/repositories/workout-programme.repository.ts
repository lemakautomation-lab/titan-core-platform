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

        return this.database.transaction(
            async (tx) => {

                const rows =
                    await tx.$queryRaw<
                        Array<{
                            id: string;
                        }>
                    >`
                        SELECT "id"
                        FROM "WorkoutProgramme"
                        WHERE "id" = ${programme.id}
                          AND "tenantId" = ${tenantId}
                          AND "status" IN (
                              'ACTIVE',
                              'INACTIVE',
                              'SUSPENDED'
                          )
                        FOR UPDATE
                    `;

                if (rows.length !== 1) {
                    throw new Error(
                        "Workout Programme not found.",
                    );
                }

                const updated =
                    await tx.workoutProgramme.updateMany({
                        where: {
                            id: programme.id,
                            tenantId,
                            status: {
                                in: [
                                    "ACTIVE",
                                    "INACTIVE",
                                    "SUSPENDED",
                                ],
                            },
                        },
                        data:
                            WorkoutProgrammeMapper.toPersistence(
                                programme,
                            ),
                    });

                if (updated.count !== 1) {
                    throw new Error(
                        "Workout Programme update failed.",
                    );
                }

                const result =
                    await tx.workoutProgramme.findFirst({
                        where: {
                            id: programme.id,
                            tenantId,
                        },
                    });

                if (!result) {
                    throw new Error(
                        "Workout Programme not found after update.",
                    );
                }

                return WorkoutProgrammeMapper.toDomain(result);
            },
        );
    }

    async updateStatus(
        id: string,
        tenantId: string,
        status: RecordStatus,
    ): Promise<WorkoutProgramme> {

        return this.database.transaction(
            async (tx) => {

                const rows =
                    await tx.$queryRaw<
                        Array<{
                            id: string;
                        }>
                    >`
                        SELECT "id"
                        FROM "WorkoutProgramme"
                        WHERE "id" = ${id}
                          AND "tenantId" = ${tenantId}
                          AND "status" IN (
                              'ACTIVE',
                              'INACTIVE',
                              'SUSPENDED'
                          )
                        FOR UPDATE
                    `;

                if (rows.length !== 1) {
                    throw new Error(
                        "Workout Programme not found.",
                    );
                }

                const updated =
                    await tx.workoutProgramme.updateMany({
                        where: {
                            id,
                            tenantId,
                            status: {
                                in: [
                                    "ACTIVE",
                                    "INACTIVE",
                                    "SUSPENDED",
                                ],
                            },
                        },
                        data: {
                            status,
                            updatedAt: new Date(),
                        },
                    });

                if (updated.count !== 1) {
                    throw new Error(
                        "Workout Programme status update failed.",
                    );
                }

                const result =
                    await tx.workoutProgramme.findFirst({
                        where: {
                            id,
                            tenantId,
                        },
                    });

                if (!result) {
                    throw new Error(
                        "Workout Programme not found after status update.",
                    );
                }

                return WorkoutProgrammeMapper.toDomain(result);
            },
        );
    }

    async delete(
        id: string,
        tenantId: string,
    ): Promise<void> {

        await this.database.transaction(
            async (tx) => {

                const rows =
                    await tx.$queryRaw<
                        Array<{
                            id: string;
                        }>
                    >`
                        SELECT "id"
                        FROM "WorkoutProgramme"
                        WHERE "id" = ${id}
                          AND "tenantId" = ${tenantId}
                          AND "status" IN (
                              'ACTIVE',
                              'INACTIVE',
                              'SUSPENDED'
                          )
                        FOR UPDATE
                    `;

                if (rows.length !== 1) {
                    return;
                }

                const updated =
                    await tx.workoutProgramme.updateMany({
                        where: {
                            id,
                            tenantId,
                            status: {
                                in: [
                                    "ACTIVE",
                                    "INACTIVE",
                                    "SUSPENDED",
                                ],
                            },
                        },
                        data: {
                            status: "DELETED",
                            updatedAt: new Date(),
                        },
                    });

                if (updated.count !== 1) {
                    throw new Error(
                        "Workout Programme delete failed.",
                    );
                }
            },
        );
    }
}
