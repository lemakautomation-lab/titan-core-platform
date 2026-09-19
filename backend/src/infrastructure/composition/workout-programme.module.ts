import { DatabaseService } from "../database/database.service";

import { PrismaAthleteRepository } from "../repositories/athlete.repository";
import { PrismaSportRepository } from "../repositories/sport.repository";
import { PrismaWorkoutProgrammeRepository } from "../repositories/workout-programme.repository";
import { PrismaAthleteRelationshipRepository } from "../repositories/athlete-relationship.repository";
import { PrismaUserRepository } from "../repositories/user.repository";
import { PrismaUserTypeEntitlementRepository } from "../repositories/user-type-entitlement.repository";
import { PrismaPaymentRepository } from "../repositories/payment.repository";
import { PrismaPerformanceMetricRepository } from "../repositories/performance-metric.repository";
import { PrismaPerformanceMeasurementRepository } from "../repositories/performance-measurement/performance-measurement.repository";
import { PrismaRecoveryTrackingRepository } from "../repositories/recovery-tracking/recovery-tracking.repository";
import { PrismaTrainingStressRepository } from "../repositories/training-stress/training-stress.repository";

import { CreateWorkoutProgrammeUseCase } from "../../application/use-cases/create-workout-programme.use-case";
import { CreateTrainerWorkoutProgrammeUseCase } from "../../application/use-cases/create-trainer-workout-programme.use-case";
import { AssignTrainerWorkoutProgrammeUseCase } from "../../application/use-cases/assign-trainer-workout-programme.use-case";
import { GetMyTrainerAccessUseCase } from "../../application/use-cases/get-my-trainer-access.use-case";
import { GetTrainerClientMonitoringUseCase } from "../../application/use-cases/get-trainer-client-monitoring.use-case";
import { GetTrainerClientReportUseCase } from "../../application/use-cases/get-trainer-client-report.use-case";
import { GetTrainerClientAiAssistanceUseCase } from "../../application/use-cases/get-trainer-client-ai-assistance.use-case";
import { UnavailableTrainerAiAssistance } from "../ai/unavailable-trainer-ai-assistance";
import { GetWorkoutProgrammeByIdUseCase } from "../../application/use-cases/get-workout-programme-by-id.use-case";
import { ListWorkoutProgrammesUseCase } from "../../application/use-cases/list-workout-programmes.use-case";
import { ListWorkoutProgrammesByAthleteUseCase } from "../../application/use-cases/list-workout-programmes-by-athlete.use-case";
import { UpdateWorkoutProgrammeUseCase } from "../../application/use-cases/update-workout-programme.use-case";
import { DeleteWorkoutProgrammeUseCase } from "../../application/use-cases/delete-workout-programme.use-case";
import { UpdateWorkoutProgrammeStatusUseCase } from "../../application/use-cases/update-workout-programme-status.use-case";
import { AdaptWorkoutProgrammeFromPerformanceUseCase } from "../../application/use-cases/adapt-workout-programme-from-performance.use-case";
import { PerformanceEvidenceEvaluator } from "../../domain/services/performance-evidence-evaluator.service";
import { PrismaWorkoutProgrammePerformanceAdaptationTransaction } from "../transactions/workout-programme-performance-adaptation.transaction";
import { PrismaExerciseRepository } from "../repositories/exercise.repository";
import { PrismaProgrammeExercisePrescriptionCandidateRepository } from "../repositories/programme-exercise-prescription-candidate.repository";
import { PrismaWorkoutProgrammeGenerationTransaction } from "../transactions/workout-programme-generation.transaction";
import { GenerateWorkoutProgrammeUseCase } from "../../application/use-cases/generate-workout-programme.use-case";
import { GetGeneratedWorkoutProgrammeUseCase } from "../../application/use-cases/get-generated-workout-programme.use-case";
import { PrismaGeneratedWorkoutProgrammeReadRepository } from "../repositories/generated-workout-programme-read.repository";

const databaseService =
    new DatabaseService();

const workoutProgrammeRepository =
    new PrismaWorkoutProgrammeRepository(
        databaseService,
    );

const athleteRelationshipRepository =
    new PrismaAthleteRelationshipRepository(databaseService);

const userRepository =
    new PrismaUserRepository(databaseService);

const userTypeEntitlementRepository =
    new PrismaUserTypeEntitlementRepository(databaseService);

const paymentRepository =
    new PrismaPaymentRepository(databaseService);

const athleteRepository =
    new PrismaAthleteRepository(
        databaseService,
    );

const sportRepository =
    new PrismaSportRepository(
        databaseService,
    );

const performanceMetricRepository =
    new PrismaPerformanceMetricRepository(
        databaseService,
    );

const performanceMeasurementRepository =
    new PrismaPerformanceMeasurementRepository(
        databaseService,
    );

const recoveryTrackingRepository =
    new PrismaRecoveryTrackingRepository(
        databaseService,
    );

const trainingStressRepository =
    new PrismaTrainingStressRepository(
        databaseService,
    );

const performanceAdaptationTransaction =
    new PrismaWorkoutProgrammePerformanceAdaptationTransaction(
        databaseService,
    );

const exerciseRepository = new PrismaExerciseRepository(databaseService);
const generationCandidateRepository =
    new PrismaProgrammeExercisePrescriptionCandidateRepository(
        exerciseRepository,
        databaseService,
    );
const generationTransaction =
    new PrismaWorkoutProgrammeGenerationTransaction(databaseService);
const generatedWorkoutProgrammeReadRepository =
    new PrismaGeneratedWorkoutProgrammeReadRepository(databaseService);

const createWorkoutProgrammeUseCase =
    new CreateWorkoutProgrammeUseCase(
        workoutProgrammeRepository,
        athleteRepository,
        sportRepository,
    );

export const workoutProgrammeModule = {

    createWorkoutProgrammeUseCase,

    createTrainerWorkoutProgrammeUseCase:
        new CreateTrainerWorkoutProgrammeUseCase(
            athleteRelationshipRepository,
            new GetMyTrainerAccessUseCase(
                userRepository,
                userTypeEntitlementRepository,
                paymentRepository,
            ),
            createWorkoutProgrammeUseCase,
        ),
    assignTrainerWorkoutProgrammeUseCase:
        new AssignTrainerWorkoutProgrammeUseCase(
            workoutProgrammeRepository,
            athleteRepository,
            athleteRelationshipRepository,
            new GetMyTrainerAccessUseCase(
                userRepository,
                userTypeEntitlementRepository,
                paymentRepository,
            ),
        ),

    getTrainerClientMonitoringUseCase:
        new GetTrainerClientMonitoringUseCase(
            athleteRepository,
            athleteRelationshipRepository,
            performanceMetricRepository,
            performanceMeasurementRepository,
            recoveryTrackingRepository,
            trainingStressRepository,
            workoutProgrammeRepository,
            new GetMyTrainerAccessUseCase(
                userRepository,
                userTypeEntitlementRepository,
                paymentRepository,
            ),
        ),

    getTrainerClientAiAssistanceUseCase:
        new GetTrainerClientAiAssistanceUseCase(
            new GetTrainerClientReportUseCase(
                new GetTrainerClientMonitoringUseCase(
                    athleteRepository,
                    athleteRelationshipRepository,
                    performanceMetricRepository,
                    performanceMeasurementRepository,
                    recoveryTrackingRepository,
                    trainingStressRepository,
                    workoutProgrammeRepository,
                    new GetMyTrainerAccessUseCase(
                        userRepository,
                        userTypeEntitlementRepository,
                        paymentRepository,
                    ),
                ),
            ),
            new UnavailableTrainerAiAssistance(),
        ),
    getTrainerClientReportUseCase:
        new GetTrainerClientReportUseCase(
            new GetTrainerClientMonitoringUseCase(
                athleteRepository,
                athleteRelationshipRepository,
                performanceMetricRepository,
                performanceMeasurementRepository,
                recoveryTrackingRepository,
                trainingStressRepository,
                workoutProgrammeRepository,
                new GetMyTrainerAccessUseCase(
                    userRepository,
                    userTypeEntitlementRepository,
                    paymentRepository,
                ),
            ),
        ),
    getWorkoutProgrammeByIdUseCase:
        new GetWorkoutProgrammeByIdUseCase(
            workoutProgrammeRepository,
        ),

    listWorkoutProgrammesUseCase:
        new ListWorkoutProgrammesUseCase(
            workoutProgrammeRepository,
        ),

    listWorkoutProgrammesByAthleteUseCase:
        new ListWorkoutProgrammesByAthleteUseCase(
            workoutProgrammeRepository,
            athleteRepository,
        ),

    updateWorkoutProgrammeUseCase:
        new UpdateWorkoutProgrammeUseCase(
            workoutProgrammeRepository,
            athleteRepository,
            sportRepository,
        ),

    deleteWorkoutProgrammeUseCase:
        new DeleteWorkoutProgrammeUseCase(
            workoutProgrammeRepository,
        ),

    updateWorkoutProgrammeStatusUseCase:
        new UpdateWorkoutProgrammeStatusUseCase(
            workoutProgrammeRepository,
        ),

    adaptWorkoutProgrammeFromPerformanceUseCase:
        new AdaptWorkoutProgrammeFromPerformanceUseCase(
            workoutProgrammeRepository,
            athleteRepository,
            performanceMetricRepository,
            performanceMeasurementRepository,
            performanceAdaptationTransaction,
            new PerformanceEvidenceEvaluator(),
        ),

    generateWorkoutProgrammeUseCase:
        new GenerateWorkoutProgrammeUseCase(
            athleteRepository,
            sportRepository,
            generationCandidateRepository,
            generationTransaction,
        ),

    getGeneratedWorkoutProgrammeUseCase:
        new GetGeneratedWorkoutProgrammeUseCase(
            generatedWorkoutProgrammeReadRepository,
        ),

};
