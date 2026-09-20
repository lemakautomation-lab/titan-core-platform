import { DatabaseService } from "../database/database.service";
import { PrismaCoachSquadRepository } from "../repositories/coach-squad.repository";
import { PrismaCoachSquadAthleteRepository } from "../repositories/coach-squad-athlete.repository";
import { PrismaCoachTeamRepository } from "../repositories/coach-team.repository";
import { PrismaAthleteRepository } from "../repositories/athlete.repository";
import { PrismaAthleteRelationshipRepository } from "../repositories/athlete-relationship.repository";
import { PrismaWorkoutProgrammeRepository } from "../repositories/workout-programme.repository";
import { PrismaSportRepository } from "../repositories/sport.repository";
import { PrismaPerformanceMetricRepository } from "../repositories/performance-metric.repository";
import { PrismaPerformanceMeasurementRepository } from "../repositories/performance-measurement/performance-measurement.repository";
import { PrismaRecoveryTrackingRepository } from "../repositories/recovery-tracking/recovery-tracking.repository";
import { PrismaTrainingStressRepository } from "../repositories/training-stress/training-stress.repository";

import { CreateCoachSquadUseCase } from "../../application/use-cases/create-coach-squad.use-case";
import { ListCoachSquadsUseCase } from "../../application/use-cases/list-coach-squads.use-case";
import { UpdateCoachSquadUseCase } from "../../application/use-cases/update-coach-squad.use-case";
import { AddCoachSquadAthleteUseCase } from "../../application/use-cases/add-coach-squad-athlete.use-case";
import { ListCoachSquadAthletesUseCase } from "../../application/use-cases/list-coach-squad-athletes.use-case";
import { RemoveCoachSquadAthleteUseCase } from "../../application/use-cases/remove-coach-squad-athlete.use-case";
import { GetCoachSquadPerformanceDashboardUseCase } from "../../application/use-cases/get-coach-squad-performance-dashboard.use-case";
import { CreateCoachTeamUseCase } from "../../application/use-cases/create-coach-team.use-case";
import { ListCoachTeamsUseCase } from "../../application/use-cases/list-coach-teams.use-case";
import { UpdateCoachTeamUseCase } from "../../application/use-cases/update-coach-team.use-case";
import { AddMyCoachAthleteUseCase } from "../../application/use-cases/add-my-coach-athlete.use-case";
import { ListMyCoachAthletesUseCase } from "../../application/use-cases/list-my-coach-athletes.use-case";
import { RemoveMyCoachAthleteUseCase } from "../../application/use-cases/remove-my-coach-athlete.use-case";
import { CreateWorkoutProgrammeUseCase } from "../../application/use-cases/create-workout-programme.use-case";
import { CreateCoachWorkoutProgrammeUseCase } from "../../application/use-cases/create-coach-workout-programme.use-case";
import { AssignCoachWorkoutProgrammeUseCase } from "../../application/use-cases/assign-coach-workout-programme.use-case";
import { GetCoachAthleteMonitoringUseCase } from "../../application/use-cases/get-coach-athlete-monitoring.use-case";

const databaseService =
    new DatabaseService();

const coachTeamRepository = new PrismaCoachTeamRepository(databaseService);
const athleteRepository = new PrismaAthleteRepository(databaseService);
const athleteRelationshipRepository = new PrismaAthleteRelationshipRepository(databaseService);
const workoutProgrammeRepository =
    new PrismaWorkoutProgrammeRepository(databaseService);

const sportRepository =
    new PrismaSportRepository(databaseService);
const performanceMetricRepository =
    new PrismaPerformanceMetricRepository(databaseService);

const performanceMeasurementRepository =
    new PrismaPerformanceMeasurementRepository(databaseService);

const recoveryTrackingRepository =
    new PrismaRecoveryTrackingRepository(databaseService);

const trainingStressRepository =
    new PrismaTrainingStressRepository(databaseService);

const createWorkoutProgrammeUseCase =
    new CreateWorkoutProgrammeUseCase(
        workoutProgrammeRepository,
        athleteRepository,
        sportRepository,
    );

const coachSquadRepository =
    new PrismaCoachSquadRepository(
        databaseService,
    );

const coachSquadAthleteRepository =
    new PrismaCoachSquadAthleteRepository(
        databaseService,
    );

export const coachModule = {
    createCoachSquadUseCase:
        new CreateCoachSquadUseCase(
            coachSquadRepository,
        ),

    listCoachSquadsUseCase:
        new ListCoachSquadsUseCase(
            coachSquadRepository,
        ),

    updateCoachSquadUseCase:
        new UpdateCoachSquadUseCase(
            coachSquadRepository,
        ),
    addCoachSquadAthleteUseCase:
        new AddCoachSquadAthleteUseCase(
            coachSquadRepository,
            coachSquadAthleteRepository,
            athleteRepository,
            athleteRelationshipRepository,
        ),

    listCoachSquadAthletesUseCase:
        new ListCoachSquadAthletesUseCase(
            coachSquadRepository,
            coachSquadAthleteRepository,
            athleteRepository,
        ),

    removeCoachSquadAthleteUseCase:
        new RemoveCoachSquadAthleteUseCase(
            coachSquadRepository,
            coachSquadAthleteRepository,
        ),
    getCoachSquadPerformanceDashboardUseCase:
        new GetCoachSquadPerformanceDashboardUseCase(
            coachSquadRepository,
            coachSquadAthleteRepository,
            athleteRepository,
            athleteRelationshipRepository,
            performanceMetricRepository,
            performanceMeasurementRepository,
            recoveryTrackingRepository,
            trainingStressRepository,
            workoutProgrammeRepository,
        ),
    createCoachTeamUseCase:
        new CreateCoachTeamUseCase(
            coachTeamRepository,
        ),

    listCoachTeamsUseCase:
        new ListCoachTeamsUseCase(
            coachTeamRepository,
        ),

    updateCoachTeamUseCase:
        new UpdateCoachTeamUseCase(
            coachTeamRepository,
        ),
    addMyCoachAthleteUseCase:
        new AddMyCoachAthleteUseCase(
            athleteRelationshipRepository,
            athleteRepository,
        ),

    listMyCoachAthletesUseCase:
        new ListMyCoachAthletesUseCase(
            athleteRelationshipRepository,
            athleteRepository,
        ),

    removeMyCoachAthleteUseCase:
        new RemoveMyCoachAthleteUseCase(
            athleteRelationshipRepository,
        ),
    createCoachWorkoutProgrammeUseCase:
        new CreateCoachWorkoutProgrammeUseCase(
            athleteRelationshipRepository,
            createWorkoutProgrammeUseCase,
        ),

    assignCoachWorkoutProgrammeUseCase:
        new AssignCoachWorkoutProgrammeUseCase(
            workoutProgrammeRepository,
            athleteRepository,
            athleteRelationshipRepository,
        ),
    getCoachAthleteMonitoringUseCase:
        new GetCoachAthleteMonitoringUseCase(
            athleteRepository,
            athleteRelationshipRepository,
            performanceMetricRepository,
            performanceMeasurementRepository,
            recoveryTrackingRepository,
            trainingStressRepository,
            workoutProgrammeRepository,
        ),
};