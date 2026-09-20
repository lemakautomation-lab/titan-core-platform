import { DatabaseService } from "../database/database.service";
import { PrismaCoachSquadRepository } from "../repositories/coach-squad.repository";
import { PrismaCoachTeamRepository } from "../repositories/coach-team.repository";
import { PrismaAthleteRepository } from "../repositories/athlete.repository";
import { PrismaAthleteRelationshipRepository } from "../repositories/athlete-relationship.repository";
import { PrismaWorkoutProgrammeRepository } from "../repositories/workout-programme.repository";
import { PrismaSportRepository } from "../repositories/sport.repository";

import { CreateCoachSquadUseCase } from "../../application/use-cases/create-coach-squad.use-case";
import { ListCoachSquadsUseCase } from "../../application/use-cases/list-coach-squads.use-case";
import { UpdateCoachSquadUseCase } from "../../application/use-cases/update-coach-squad.use-case";
import { CreateCoachTeamUseCase } from "../../application/use-cases/create-coach-team.use-case";
import { ListCoachTeamsUseCase } from "../../application/use-cases/list-coach-teams.use-case";
import { UpdateCoachTeamUseCase } from "../../application/use-cases/update-coach-team.use-case";
import { AddMyCoachAthleteUseCase } from "../../application/use-cases/add-my-coach-athlete.use-case";
import { ListMyCoachAthletesUseCase } from "../../application/use-cases/list-my-coach-athletes.use-case";
import { RemoveMyCoachAthleteUseCase } from "../../application/use-cases/remove-my-coach-athlete.use-case";
import { CreateWorkoutProgrammeUseCase } from "../../application/use-cases/create-workout-programme.use-case";
import { CreateCoachWorkoutProgrammeUseCase } from "../../application/use-cases/create-coach-workout-programme.use-case";
import { AssignCoachWorkoutProgrammeUseCase } from "../../application/use-cases/assign-coach-workout-programme.use-case";

const databaseService =
    new DatabaseService();

const coachTeamRepository = new PrismaCoachTeamRepository(databaseService);
const athleteRepository = new PrismaAthleteRepository(databaseService);
const athleteRelationshipRepository = new PrismaAthleteRelationshipRepository(databaseService);
const workoutProgrammeRepository =
    new PrismaWorkoutProgrammeRepository(databaseService);

const sportRepository =
    new PrismaSportRepository(databaseService);

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
};