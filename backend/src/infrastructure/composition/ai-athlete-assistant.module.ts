import { DatabaseService } from "../database/database.service";
import { PrismaAthleteRepository } from "../repositories/athlete.repository";
import { PrismaAthleteIntelligenceContextReader } from "../queries/athlete-intelligence-context.query";
import { GetMyAiAthleteContextUseCase } from "../../application/use-cases/get-my-ai-athlete-context.use-case";

const database = new DatabaseService();
export const aiAthleteAssistantModule = {
    context: new GetMyAiAthleteContextUseCase(
        new PrismaAthleteRepository(database),
        new PrismaAthleteIntelligenceContextReader(database),
    ),
};
