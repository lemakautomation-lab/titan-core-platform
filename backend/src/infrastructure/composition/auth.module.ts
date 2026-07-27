import { DatabaseService } from "../database/database.service";

import { PrismaUserRepository } from "../repositories/user.repository";
import { PrismaSessionRepository } from "../repositories/session.repository";

import { LoginUseCase } from "../../application/use-cases/auth/login.use-case";
import { RefreshTokenUseCase } from "../../application/use-cases/auth/refresh-token.use-case";
import { LogoutUseCase } from "../../application/use-cases/auth/logout.use-case";


const databaseService =
    new DatabaseService();


const userRepository =
    new PrismaUserRepository(
        databaseService,
    );


const sessionRepository =
    new PrismaSessionRepository(
        databaseService,
    );


export const authModule = {

    loginUseCase:

        new LoginUseCase(
            userRepository,
            sessionRepository,
        ),


    refreshTokenUseCase:

        new RefreshTokenUseCase(
            sessionRepository,
        ),


    logoutUseCase:

        new LogoutUseCase(
            sessionRepository,
        ),

};