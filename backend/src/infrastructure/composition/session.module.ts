import { DatabaseService } from "../database/database.service";

import { PrismaSessionRepository } from "../repositories/session.repository";

import { GetSessionByIdUseCase } from "../../application/use-cases/get-session-by-id.use-case";

const databaseService = new DatabaseService();

const sessionRepository =
    new PrismaSessionRepository(
        databaseService,
    );

export const sessionModule = {

    getSessionByIdUseCase:

        new GetSessionByIdUseCase(
            sessionRepository,
        ),

};
