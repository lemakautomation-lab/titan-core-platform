import { TrainerSessionSchedule } from "../../domain/entities/trainer-session-schedule.entity";
import { TrainerSessionScheduleStatus } from "../../domain/enums/trainer-session-schedule-status.enum";
import { TrainerSessionScheduleRepository } from "../../domain/repositories/trainer-session-schedule.repository";
import { DatabaseService } from "../database/database.service";
import { TrainerSessionScheduleMapper } from "../mappers/trainer-session-schedule.mapper";

export class PrismaTrainerSessionScheduleRepository
implements TrainerSessionScheduleRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(
        id: string,
        tenantId: string,
    ): Promise<TrainerSessionSchedule | null> {

        const record =
            await this.database.prisma.trainerSessionSchedule.findFirst({
                where: {
                    id,
                    tenantId,
                },
            });

        return record
            ? TrainerSessionScheduleMapper.toDomain(record)
            : null;
    }

    async findConflicting(
        tenantId: string,
        trainerUserId: string,
        athleteId: string,
        startsAt: Date,
        endsAt: Date,
        excludeId?: string,
    ): Promise<TrainerSessionSchedule | null> {

        const record =
            await this.database.prisma.trainerSessionSchedule.findFirst({
                where: {
                    tenantId,
                    status: {
                        not: TrainerSessionScheduleStatus.CANCELLED,
                    },
                    startsAt: {
                        lt: endsAt,
                    },
                    endsAt: {
                        gt: startsAt,
                    },
                    ...(excludeId
                        ? { id: { not: excludeId } }
                        : {}),
                    OR: [
                        { trainerUserId },
                        { athleteId },
                    ],
                },
                orderBy: {
                    startsAt: "asc",
                },
            });

        return record
            ? TrainerSessionScheduleMapper.toDomain(record)
            : null;
    }

    async listForTrainer(
        tenantId: string,
        trainerUserId: string,
        startsFrom: Date,
        startsBefore: Date,
        athleteId?: string,
    ): Promise<TrainerSessionSchedule[]> {

        const records =
            await this.database.prisma.trainerSessionSchedule.findMany({
                where: {
                    tenantId,
                    trainerUserId,
                    startsAt: {
                        gte: startsFrom,
                        lt: startsBefore,
                    },
                    ...(athleteId
                        ? { athleteId }
                        : {}),
                },
                orderBy: [
                    { startsAt: "asc" },
                    { id: "asc" },
                ],
            });

        return records.map(
            TrainerSessionScheduleMapper.toDomain,
        );
    }
    async create(
        schedule: TrainerSessionSchedule,
    ): Promise<TrainerSessionSchedule> {

        const created =
            await this.database.prisma.trainerSessionSchedule.create({
                data:
                    TrainerSessionScheduleMapper.toPersistence(
                        schedule,
                    ),
            });

        return TrainerSessionScheduleMapper.toDomain(
            created,
        );
    }

    async update(
        schedule: TrainerSessionSchedule,
    ): Promise<TrainerSessionSchedule> {

        const result =
            await this.database.prisma.trainerSessionSchedule.updateMany({
                where: {
                    id: schedule.id,
                    tenantId: schedule.tenantId,
                },
                data:
                    TrainerSessionScheduleMapper.toPersistence(
                        schedule,
                    ),
            });

        if (result.count !== 1) {
            throw new Error(
                "Trainer session schedule was not found in the tenant.",
            );
        }

        const updated =
            await this.findById(
                schedule.id,
                schedule.tenantId,
            );

        if (!updated) {
            throw new Error(
                "Trainer session schedule could not be reloaded.",
            );
        }

        return updated;
    }

}

