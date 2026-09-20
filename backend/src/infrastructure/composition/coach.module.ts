import { DatabaseService } from "../database/database.service";
import { PrismaCoachSquadRepository } from "../repositories/coach-squad.repository";

import { CreateCoachSquadUseCase } from "../../application/use-cases/create-coach-squad.use-case";
import { ListCoachSquadsUseCase } from "../../application/use-cases/list-coach-squads.use-case";
import { UpdateCoachSquadUseCase } from "../../application/use-cases/update-coach-squad.use-case";

const databaseService =
    new DatabaseService();

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
};