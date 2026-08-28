import { DatabaseService } from "../database/database.service";

import { PrismaSportRepository } from "../repositories/sport.repository";

import { CreateSportUseCase } from "../../application/use-cases/create-sport.use-case";
import { GetSportByIdUseCase } from "../../application/use-cases/get-sport-by-id.use-case";
import { ListSportsUseCase } from "../../application/use-cases/list-sports.use-case";
import { UpdateSportUseCase } from "../../application/use-cases/update-sport.use-case";
import { DeleteSportUseCase } from "../../application/use-cases/delete-sport.use-case";

const databaseService = new DatabaseService();

const sportRepository =
    new PrismaSportRepository(databaseService);

export const sportModule = {

    createSportUseCase:
        new CreateSportUseCase(
            sportRepository,
        ),

    getSportByIdUseCase:
        new GetSportByIdUseCase(
            sportRepository,
        ),

    listSportsUseCase:
        new ListSportsUseCase(
            sportRepository,
        ),

    updateSportUseCase:
        new UpdateSportUseCase(
            sportRepository,
        ),

    deleteSportUseCase:
        new DeleteSportUseCase(
            sportRepository,
        ),
};
