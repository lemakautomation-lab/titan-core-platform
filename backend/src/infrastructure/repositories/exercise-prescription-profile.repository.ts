import { ExercisePrescriptionProfile } from "../../domain/entities/exercise-prescription-profile.entity";
import { ProgrammeGoalClassification } from "../../domain/enums/programme-goal-classification.enum";
import { TrainingExperienceLevel } from "../../domain/enums/training-experience-level.enum";
import { ExercisePrescriptionProfileRepository } from "../../domain/repositories/exercise-prescription-profile.repository";
import { DatabaseService } from "../database/database.service";
import { ExercisePrescriptionProfileMapper } from "../mappers/exercise-prescription-profile.mapper";

export class PrismaExercisePrescriptionProfileRepository
implements ExercisePrescriptionProfileRepository {
    constructor(
        private readonly database: DatabaseService,
    ) {}

    async create(
        profile: ExercisePrescriptionProfile,
    ): Promise<ExercisePrescriptionProfile> {
        const created = await this.database.prisma
            .exercisePrescriptionProfile.create({
                data: ExercisePrescriptionProfileMapper.toPersistence(
                    profile,
                ),
            });

        return ExercisePrescriptionProfileMapper.toDomain(created);
    }

    async findById(
        id: string,
        tenantId: string,
    ): Promise<ExercisePrescriptionProfile | null> {
        const profile = await this.database.prisma
            .exercisePrescriptionProfile.findFirst({
                where: { id, tenantId },
            });

        return profile
            ? ExercisePrescriptionProfileMapper.toDomain(profile)
            : null;
    }

    async findActiveExact(
        tenantId: string,
        exerciseId: string,
        goalClassification: ProgrammeGoalClassification,
        trainingExperience: TrainingExperienceLevel,
    ): Promise<ExercisePrescriptionProfile | null> {
        const profile = await this.database.prisma
            .exercisePrescriptionProfile.findFirst({
                where: {
                    tenantId,
                    exerciseId,
                    goalClassification,
                    trainingExperience,
                    status: "ACTIVE",
                },
            });

        return profile
            ? ExercisePrescriptionProfileMapper.toDomain(profile)
            : null;
    }
}
