import { DatabaseService } from "../database/database.service";

import { PrismaAthleteRepository } from "../repositories/athlete.repository";
import { PrismaAthleteRelationshipRepository } from "../repositories/athlete-relationship.repository";
import { PrismaPerformanceMetricRepository } from "../repositories/performance-metric.repository";
import { PrismaPerformanceMeasurementRepository } from "../repositories/performance-measurement/performance-measurement.repository";
import { PrismaRecoveryTrackingRepository } from "../repositories/recovery-tracking/recovery-tracking.repository";
import { PrismaTrainingStressRepository } from "../repositories/training-stress/training-stress.repository";
import { PrismaWorkoutProgrammeRepository } from "../repositories/workout-programme.repository";
import { PrismaNutritionPlanRepository } from "../repositories/nutrition-plan/nutrition-plan.repository";

import { GetPerformanceProfessionalWorkflowUseCase } from "../../application/use-cases/get-performance-professional-workflow.use-case";
import { GetStrengthConditioningWorkflowUseCase } from "../../application/use-cases/get-strength-conditioning-workflow.use-case";
import { GetNutritionProfessionalWorkflowUseCase } from "../../application/use-cases/get-nutrition-professional-workflow.use-case";
import { GetRehabilitationProfessionalWorkflowUseCase } from "../../application/use-cases/get-rehabilitation-professional-workflow.use-case";

const databaseService =
    new DatabaseService();

const athleteRepository =
    new PrismaAthleteRepository(databaseService);

const athleteRelationshipRepository =
    new PrismaAthleteRelationshipRepository(databaseService);

const performanceMetricRepository =
    new PrismaPerformanceMetricRepository(databaseService);

const performanceMeasurementRepository =
    new PrismaPerformanceMeasurementRepository(databaseService);

const recoveryTrackingRepository =
    new PrismaRecoveryTrackingRepository(databaseService);

const trainingStressRepository =
    new PrismaTrainingStressRepository(databaseService);

const workoutProgrammeRepository =
    new PrismaWorkoutProgrammeRepository(databaseService);

const nutritionPlanRepository =
    new PrismaNutritionPlanRepository(databaseService);

export const performanceProfessionalModule = {
    getWorkflowUseCase:
        new GetPerformanceProfessionalWorkflowUseCase(
            athleteRepository,
            athleteRelationshipRepository,
            performanceMetricRepository,
            performanceMeasurementRepository,
            recoveryTrackingRepository,
            trainingStressRepository,
            workoutProgrammeRepository,
        ),

    getStrengthConditioningWorkflowUseCase:
        new GetStrengthConditioningWorkflowUseCase(
            athleteRepository,
            athleteRelationshipRepository,
            trainingStressRepository,
            workoutProgrammeRepository,
        ),

    getNutritionProfessionalWorkflowUseCase:
        new GetNutritionProfessionalWorkflowUseCase(
            athleteRepository,
            athleteRelationshipRepository,
            nutritionPlanRepository,
        ),

    getRehabilitationProfessionalWorkflowUseCase:
        new GetRehabilitationProfessionalWorkflowUseCase(
            athleteRepository,
            athleteRelationshipRepository,
            recoveryTrackingRepository,
        ),
};