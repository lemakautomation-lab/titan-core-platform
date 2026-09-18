import { TrainerProfile } from "../../domain/entities/trainer-profile.entity";
import { TrainerProfileRepository } from "../../domain/repositories/trainer-profile.repository";
import { DatabaseService } from "../database/database.service";
import { TrainerProfileMapper } from "../mappers/trainer-profile.mapper";

export class PrismaTrainerProfileRepository
implements TrainerProfileRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findByUserId(
        userId: string,
        tenantId: string,
    ): Promise<TrainerProfile | null> {

        const record =
            await this.database.prisma.trainerProfile.findFirst({
                where: {
                    userId,
                    tenantId,
                },
            });

        return record
            ? TrainerProfileMapper.toDomain(record)
            : null;
    }

    async create(
        profile: TrainerProfile,
    ): Promise<TrainerProfile> {

        const created =
            await this.database.prisma.trainerProfile.create({
                data:
                    TrainerProfileMapper.toPersistence(
                        profile,
                    ),
            });

        return TrainerProfileMapper.toDomain(
            created,
        );
    }

    async update(
        profile: TrainerProfile,
    ): Promise<TrainerProfile> {

        const result =
            await this.database.prisma.trainerProfile.updateMany({
                where: {
                    userId: profile.userId,
                    tenantId: profile.tenantId,
                },
                data:
                    TrainerProfileMapper.toPersistence(
                        profile,
                    ),
            });

        if (result.count !== 1) {
            throw new Error(
                "Trainer profile was not found in the tenant.",
            );
        }

        const updated =
            await this.findByUserId(
                profile.userId,
                profile.tenantId,
            );

        if (!updated) {
            throw new Error(
                "Trainer profile could not be reloaded.",
            );
        }

        return updated;
    }

}
